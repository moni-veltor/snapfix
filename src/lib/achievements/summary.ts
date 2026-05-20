import "server-only";
import { prisma } from "@/lib/prisma";
import { loadAchievementOrgState } from "./state";
import {
  TOPIC_LABEL,
  type AchievementLevel,
  type AchievementRule,
  type AchievementsSummary,
  type AchievementTopic,
  type EvaluatedAchievement,
  type TopicMaturity,
  xpForLevel,
} from "./types";
import { COVERAGE_RULES } from "./rules-coverage";
import { CADENCE_RULES } from "./rules-cadence";
import { PEOPLE_RULES } from "./rules-people";
import { GOVERNANCE_RULES } from "./rules-governance";
import { RESILIENCE_RULES } from "./rules-resilience";

/**
 * Lightweight, read-only summary loader for analytics surfaces. Mirrors the
 * engine's evaluation logic but:
 *   - skips persistence (no AchievementUnlock writes)
 *   - only evaluates org-scope rules (analytics is cross-user)
 *
 * Used by the Programme / Executive analytics tabs and the Board pack
 * maturity-statement view. Keeps the achievements page authoritative for
 * actual unlock events while letting other surfaces show the current
 * maturity picture without side effects.
 */

const ALL_ORG_RULES: ReadonlyArray<AchievementRule> = [
  ...COVERAGE_RULES,
  ...CADENCE_RULES,
  ...PEOPLE_RULES.filter((r) => r.scope !== "user"),
  ...GOVERNANCE_RULES,
  ...RESILIENCE_RULES,
];

const ALL_TOPICS: ReadonlyArray<AchievementTopic> = [
  "coverage",
  "cadence",
  "people",
  "governance",
  "resilience",
];
const ALL_LEVELS: ReadonlyArray<AchievementLevel> = [1, 2, 3, 4, 5];

export async function loadMaturitySummary(orgId: string): Promise<AchievementsSummary> {
  const state = await loadAchievementOrgState(orgId);
  const existingUnlocks = await prisma.achievementUnlock.findMany({
    where: { orgId, scope: "org" },
    select: { achievementId: true, unlockedAt: true, xpAwarded: true },
  });
  const unlockMap = new Map(existingUnlocks.map((u) => [u.achievementId, u]));

  const evaluated: EvaluatedAchievement[] = ALL_ORG_RULES.map((rule) => {
    // Only org-scope rules in this loader, so we can safely call evaluate(state).
    // Cast clarifies for the union type.
    const result = (rule as Extract<AchievementRule, { scope?: "org" }>).evaluate(state);
    const existing = unlockMap.get(rule.id);
    const xp = rule.xp ?? xpForLevel(rule.level);
    const stickyDefault = rule.sticky ?? rule.level <= 3;
    let unlocked = result.status === "unlocked";
    let xpAwarded = 0;
    if (unlocked && !existing) xpAwarded = xp;
    else if (existing) {
      if (stickyDefault || result.status === "unlocked") {
        unlocked = true;
        xpAwarded = existing.xpAwarded;
      }
    }
    return { rule, result, unlocked, unlockedAt: existing?.unlockedAt ?? null, xpAwarded };
  });

  const byTopic = {
    coverage: [] as EvaluatedAchievement[],
    cadence: [] as EvaluatedAchievement[],
    people: [] as EvaluatedAchievement[],
    governance: [] as EvaluatedAchievement[],
    resilience: [] as EvaluatedAchievement[],
  };
  for (const e of evaluated) byTopic[e.rule.topic].push(e);

  const maturity: TopicMaturity[] = ALL_TOPICS.map((topic) => {
    const items = byTopic[topic];
    const unlockedByLevel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
      AchievementLevel,
      number
    >;
    const totalByLevel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
      AchievementLevel,
      number
    >;
    let xp = 0;
    for (const it of items) {
      totalByLevel[it.rule.level] += 1;
      if (it.unlocked) unlockedByLevel[it.rule.level] += 1;
      xp += it.xpAwarded;
    }
    let level: 0 | AchievementLevel = 0;
    for (const l of ALL_LEVELS) {
      if (totalByLevel[l] > 0 && unlockedByLevel[l] === totalByLevel[l]) level = l;
      else break;
    }
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
  });

  return {
    achievements: evaluated,
    byTopic,
    maturity,
    totalXp: evaluated.reduce((n, e) => n + e.xpAwarded, 0),
    totalUnlocked: evaluated.filter((e) => e.unlocked).length,
    totalRules: evaluated.length,
  };
}
