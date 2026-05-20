import "server-only";
import { prisma } from "@/lib/prisma";
import { COVERAGE_RULES } from "./rules-coverage";
import {
  TOPIC_LABEL,
  xpForLevel,
  type AchievementLevel,
  type AchievementRule,
  type AchievementsSummary,
  type AchievementTopic,
  type EvaluatedAchievement,
  type TopicMaturity,
} from "./types";
import type { AchievementOrgState } from "./state";

/**
 * All rules across all topics live in one immutable registry. Adding a new
 * topic = drop a new rules-{topic}.ts file and spread its exports here.
 */
const ALL_RULES: ReadonlyArray<AchievementRule> = [
  ...COVERAGE_RULES,
];

const ALL_TOPICS: ReadonlyArray<AchievementTopic> = [
  "coverage",
  "cadence",
  "people",
  "governance",
  "resilience",
];

const ALL_LEVELS: ReadonlyArray<AchievementLevel> = [1, 2, 3, 4, 5];

/**
 * Evaluate every rule against the org state, persist newly-unlocked rows,
 * and return the full summary for the page.
 *
 * Sticky behaviour:
 *  - L1-L3 rules write to AchievementUnlock on first unlock and stay earned
 *    even if state regresses.
 *  - L4-L5 rules also write on first unlock (for the "first reached"
 *    timestamp + recently-unlocked feed) but the current `unlocked` flag
 *    re-evaluates live state on every read. Regression de-levels them.
 *
 * A rule can override the default sticky behaviour via `rule.sticky`.
 */
export async function evaluateAchievements({
  orgId,
  state,
}: {
  orgId: string;
  state: AchievementOrgState;
}): Promise<AchievementsSummary> {
  const existingUnlocks = await prisma.achievementUnlock.findMany({
    where: { orgId, scope: "org" },
    select: { achievementId: true, unlockedAt: true, xpAwarded: true },
  });
  const unlockMap = new Map(existingUnlocks.map((u) => [u.achievementId, u]));

  const newUnlocks: { ruleId: string; level: AchievementLevel; xp: number }[] = [];
  const evaluated: EvaluatedAchievement[] = ALL_RULES.map((rule) => {
    const result = rule.evaluate(state);
    const existing = unlockMap.get(rule.id);
    const xp = rule.xp ?? xpForLevel(rule.level);
    const stickyDefault = rule.sticky ?? rule.level <= 3;

    let unlocked = result.status === "unlocked";
    let unlockedAt: Date | null = existing?.unlockedAt ?? null;
    let xpAwarded = 0;

    if (unlocked && !existing) {
      // First time reaching the bar — schedule for persistence.
      newUnlocks.push({ ruleId: rule.id, level: rule.level, xp });
      unlockedAt = new Date();
      xpAwarded = xp;
    } else if (existing) {
      // Sticky retention: keep unlocked even if state regressed for L1-L3
      // (or any rule with sticky=true). For non-sticky L4-L5, current state
      // is what counts — but the unlockedAt timestamp stays for the feed.
      if (stickyDefault || result.status === "unlocked") {
        unlocked = true;
        xpAwarded = existing.xpAwarded;
      }
    }

    return { rule, result, unlocked, unlockedAt, xpAwarded };
  });

  if (newUnlocks.length > 0) {
    await prisma.achievementUnlock.createMany({
      data: newUnlocks.map((u) => ({
        orgId,
        scope: "org",
        achievementId: u.ruleId,
        level: u.level,
        xpAwarded: u.xp,
      })),
      skipDuplicates: true,
    });
  }

  return buildSummary(evaluated);
}

function buildSummary(evaluated: EvaluatedAchievement[]): AchievementsSummary {
  const byTopic = {
    coverage: [] as EvaluatedAchievement[],
    cadence: [] as EvaluatedAchievement[],
    people: [] as EvaluatedAchievement[],
    governance: [] as EvaluatedAchievement[],
    resilience: [] as EvaluatedAchievement[],
  };
  for (const e of evaluated) byTopic[e.rule.topic].push(e);

  const maturity: TopicMaturity[] = ALL_TOPICS.map((topic) => buildTopicMaturity(topic, byTopic[topic]));

  const totalXp = evaluated.reduce((sum, e) => sum + e.xpAwarded, 0);
  const totalUnlocked = evaluated.filter((e) => e.unlocked).length;

  return {
    achievements: evaluated,
    byTopic,
    maturity,
    totalXp,
    totalUnlocked,
    totalRules: evaluated.length,
  };
}

function buildTopicMaturity(
  topic: AchievementTopic,
  items: EvaluatedAchievement[],
): TopicMaturity {
  const unlockedByLevel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<AchievementLevel, number>;
  const totalByLevel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<AchievementLevel, number>;
  let xp = 0;
  for (const it of items) {
    totalByLevel[it.rule.level] += 1;
    if (it.unlocked) unlockedByLevel[it.rule.level] += 1;
    xp += it.xpAwarded;
  }

  // Topic level = highest level where every rule in *that level* is unlocked.
  // Until L1 is complete, we render level 0 (Awakening).
  let level: TopicMaturity["level"] = 0;
  for (const l of ALL_LEVELS) {
    if (totalByLevel[l] > 0 && unlockedByLevel[l] === totalByLevel[l]) {
      level = l;
    } else {
      break;
    }
  }

  // Progress in next level — % of that level's rules unlocked.
  const nextLevel = (level + 1) as AchievementLevel;
  let progressInLevel = 0;
  if (nextLevel <= 5 && totalByLevel[nextLevel] > 0) {
    progressInLevel = unlockedByLevel[nextLevel] / totalByLevel[nextLevel];
  } else if (level === 5) {
    progressInLevel = 1;
  }

  return {
    topic,
    topicLabel: TOPIC_LABEL[topic],
    unlockedByLevel,
    totalByLevel,
    level,
    progressInLevel,
    xp,
  };
}

/**
 * Pick the N achievements closest to unlocking — used by the
 * "What to do next" panel on the page. Excludes already-unlocked rows.
 */
export function pickClosestToUnlock(
  achievements: EvaluatedAchievement[],
  n: number,
): EvaluatedAchievement[] {
  return achievements
    .filter((a) => !a.unlocked)
    .sort((a, b) => {
      // Higher progress first; tie-break on lower level (easier wins first).
      const ap = a.result.status === "inProgress" ? a.result.progress : 0;
      const bp = b.result.status === "inProgress" ? b.result.progress : 0;
      if (ap !== bp) return bp - ap;
      return a.rule.level - b.rule.level;
    })
    .slice(0, n);
}

export async function loadRecentlyUnlocked(
  orgId: string,
  n: number,
): Promise<
  Array<{
    achievementId: string;
    level: AchievementLevel;
    unlockedAt: Date;
    xpAwarded: number;
  }>
> {
  const rows = await prisma.achievementUnlock.findMany({
    where: { orgId, scope: "org" },
    orderBy: { unlockedAt: "desc" },
    take: n,
    select: {
      achievementId: true,
      level: true,
      unlockedAt: true,
      xpAwarded: true,
    },
  });
  return rows.map((r) => ({
    achievementId: r.achievementId,
    level: r.level as AchievementLevel,
    unlockedAt: r.unlockedAt,
    xpAwarded: r.xpAwarded,
  }));
}

export function findRuleById(id: string): AchievementRule | undefined {
  return ALL_RULES.find((r) => r.id === id);
}

export { ALL_RULES };
