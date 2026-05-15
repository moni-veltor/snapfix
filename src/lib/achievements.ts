/**
 * Achievements v2 — derived badges that reward healthy resilience habits.
 * Computed from existing data; no extra storage.
 *
 * What v2 adds over v1:
 *  - Tiered badges (bronze / silver / gold / platinum) with named thresholds
 *  - Streak detection (exercises-per-month chain)
 *  - Resilience XP + level (org-wide progress with rank names)
 *  - Categories so the page can group cards
 */

import {
  Sparkles,
  Trophy,
  Shield,
  Flame,
  CalendarCheck,
  Server,
  Crown,
  Users,
  Layers,
  Award,
  Zap,
  Activity,
  type LucideIcon,
} from "lucide-react";

export type Tier = "bronze" | "silver" | "gold" | "platinum";

export type AchievementId =
  | "first-ibs"
  | "ibs-coverage"
  | "first-exercise"
  | "exercise-cadence"
  | "first-dr-test"
  | "dr-coverage"
  | "all-harms"
  | "deputy-chain"
  | "dora-clean"
  | "streak-monthly"
  | "scenario-library-explorer"
  | "full-house";

export type AchievementIconName =
  | "Sparkles"
  | "Trophy"
  | "Shield"
  | "Flame"
  | "CalendarCheck"
  | "Server"
  | "Crown"
  | "Users"
  | "Layers"
  | "Award"
  | "Zap"
  | "Activity";

export type Achievement = {
  id: AchievementId;
  category: "Coverage" | "Cadence" | "People" | "Governance" | "Resilience";
  label: string;
  description: string;
  iconName: AchievementIconName;
  tier: Tier | null; // null = locked
  /** Numeric progress 0..1 within the current tier (0.4 = 40% of way to next). */
  progressInTier: number;
  /** Display string: "5 / 10", "3 months", etc. */
  progressLabel?: string;
  /** Tier the user has reached. Same as tier when unlocked. */
  reached: Tier | null;
  /** Threshold for the next tier — null when already platinum. */
  nextThresholdLabel: string | null;
  xpAwarded: number; // for the org's overall XP / level
};

export type AchievementInput = {
  ibsCount: number;
  ibsTestedCount: number;
  ibsTotal: number;
  exercisesCompletedCount: number;
  exercisesLast90Days: number;
  exercisesLast12Months: number;
  monthsWithExerciseStreak: number; // consecutive months with >=1 exercise
  drTestCount: number;
  systemsCount: number;
  systemsTestedCount: number;
  harmTypesCovered: number;
  rolesWithDeputy: number;
  rolesTotal: number;
  vendorsWithExitPlan: number;
  vendorsCriticalTotal: number;
  scenariosClonedCount: number;
};

// XP weights per tier — earned the moment the badge enters that tier
const TIER_XP: Record<Tier, number> = {
  bronze: 50,
  silver: 100,
  gold: 200,
  platinum: 400,
};

const ORDER: Tier[] = ["bronze", "silver", "gold", "platinum"];

function tieredByCount(
  value: number,
  thresholds: { bronze: number; silver: number; gold: number; platinum: number },
): { tier: Tier | null; progressInTier: number; nextLabel: string | null } {
  if (value >= thresholds.platinum)
    return { tier: "platinum", progressInTier: 1, nextLabel: null };
  if (value >= thresholds.gold) {
    const span = thresholds.platinum - thresholds.gold;
    return {
      tier: "gold",
      progressInTier: (value - thresholds.gold) / span,
      nextLabel: `${thresholds.platinum} for platinum`,
    };
  }
  if (value >= thresholds.silver) {
    const span = thresholds.gold - thresholds.silver;
    return {
      tier: "silver",
      progressInTier: (value - thresholds.silver) / span,
      nextLabel: `${thresholds.gold} for gold`,
    };
  }
  if (value >= thresholds.bronze) {
    const span = thresholds.silver - thresholds.bronze;
    return {
      tier: "bronze",
      progressInTier: (value - thresholds.bronze) / span,
      nextLabel: `${thresholds.silver} for silver`,
    };
  }
  return {
    tier: null,
    progressInTier: thresholds.bronze === 0 ? 0 : value / thresholds.bronze,
    nextLabel: `${thresholds.bronze} for bronze`,
  };
}

function tieredByPct(
  value: number,
  total: number,
  thresholds: { bronze: number; silver: number; gold: number; platinum: number },
) {
  const pct = total === 0 ? 0 : (value / total) * 100;
  return tieredByCount(pct, thresholds);
}

export function computeAchievements(input: AchievementInput): Achievement[] {
  const out: Achievement[] = [];

  // ─── Coverage ──────────────────────────────────────────────────────
  out.push(
    makeCount({
      id: "first-ibs",
      category: "Coverage",
      label: "Capturing the spine",
      description: "Build out the IBS register that backs your programme.",
      iconName: "Sparkles",
      value: input.ibsCount,
      thresholds: { bronze: 1, silver: 5, gold: 10, platinum: 20 },
      progressUnit: "IBSs",
    }),
  );

  out.push(
    makePct({
      id: "ibs-coverage",
      category: "Coverage",
      label: "Stress-tested register",
      description: "% of registered IBSs that have appeared in at least one exercise.",
      iconName: "Shield",
      value: input.ibsTestedCount,
      total: input.ibsTotal,
      thresholds: { bronze: 25, silver: 50, gold: 75, platinum: 100 },
    }),
  );

  out.push(
    makeCount({
      id: "all-harms",
      category: "Coverage",
      label: "All-harm exerciser",
      description: "Tested every standard harm dimension at least once.",
      iconName: "Layers",
      value: input.harmTypesCovered,
      thresholds: { bronze: 2, silver: 3, gold: 5, platinum: 6 },
      progressUnit: "of 6 harms",
    }),
  );

  // ─── Cadence ───────────────────────────────────────────────────────
  out.push(
    makeCount({
      id: "first-exercise",
      category: "Cadence",
      label: "Drill complete",
      description: "Exercises run to completion.",
      iconName: "Flame",
      value: input.exercisesCompletedCount,
      thresholds: { bronze: 1, silver: 5, gold: 12, platinum: 30 },
      progressUnit: "completed",
    }),
  );

  out.push(
    makeCount({
      id: "exercise-cadence",
      category: "Cadence",
      label: "On the cadence",
      description: "Exercises in the last 90 days.",
      iconName: "CalendarCheck",
      value: input.exercisesLast90Days,
      thresholds: { bronze: 1, silver: 3, gold: 6, platinum: 10 },
      progressUnit: "in 90 days",
    }),
  );

  out.push(
    makeCount({
      id: "streak-monthly",
      category: "Cadence",
      label: "Monthly streak",
      description: "Consecutive months with at least one exercise.",
      iconName: "Activity",
      value: input.monthsWithExerciseStreak,
      thresholds: { bronze: 2, silver: 4, gold: 8, platinum: 12 },
      progressUnit: "month streak",
    }),
  );

  // ─── Resilience (tech recovery) ────────────────────────────────────
  out.push(
    makeCount({
      id: "first-dr-test",
      category: "Resilience",
      label: "DR ledger started",
      description: "DR tests logged across your systems.",
      iconName: "Server",
      value: input.drTestCount,
      thresholds: { bronze: 1, silver: 5, gold: 15, platinum: 30 },
      progressUnit: "DR tests",
    }),
  );

  out.push(
    makePct({
      id: "dr-coverage",
      category: "Resilience",
      label: "DR-tested systems",
      description: "% of registered systems with at least one DR test.",
      iconName: "Zap",
      value: input.systemsTestedCount,
      total: input.systemsCount,
      thresholds: { bronze: 25, silver: 50, gold: 75, platinum: 100 },
    }),
  );

  // ─── People ────────────────────────────────────────────────────────
  out.push(
    makePct({
      id: "deputy-chain",
      category: "People",
      label: "Deputy chain wired",
      description: "% of roles with a named deputy.",
      iconName: "Users",
      value: input.rolesWithDeputy,
      total: input.rolesTotal,
      thresholds: { bronze: 25, silver: 50, gold: 75, platinum: 100 },
    }),
  );

  // ─── Governance ────────────────────────────────────────────────────
  out.push(
    makePct({
      id: "dora-clean",
      category: "Governance",
      label: "DORA exit-ready",
      description: "% of critical vendors with a fresh exit plan on file.",
      iconName: "Crown",
      value: input.vendorsWithExitPlan,
      total: input.vendorsCriticalTotal,
      thresholds: { bronze: 25, silver: 50, gold: 75, platinum: 100 },
    }),
  );

  out.push(
    makeCount({
      id: "scenario-library-explorer",
      category: "Governance",
      label: "Library explorer",
      description: "Scenarios cloned from the library.",
      iconName: "Trophy",
      value: input.scenariosClonedCount,
      thresholds: { bronze: 1, silver: 3, gold: 6, platinum: 12 },
      progressUnit: "cloned",
    }),
  );

  // ─── Full-house meta-badge ─────────────────────────────────────────
  const platinumCount = out.filter((a) => a.tier === "platinum").length;
  const allPlatinum = out.length > 0 && platinumCount === out.length;
  out.push({
    id: "full-house",
    category: "Resilience",
    label: "Full house",
    description: "Every badge at platinum — give the team a coffee.",
    iconName: "Award",
    tier: allPlatinum ? "platinum" : null,
    reached: allPlatinum ? "platinum" : null,
    progressInTier: out.length === 0 ? 0 : platinumCount / out.length,
    progressLabel: `${platinumCount} / ${out.length} platinum`,
    nextThresholdLabel: allPlatinum ? null : "every badge at platinum",
    xpAwarded: allPlatinum ? 1000 : 0,
  });

  return out;
}

function makeCount({
  id,
  category,
  label,
  description,
  iconName,
  value,
  thresholds,
  progressUnit,
}: {
  id: AchievementId;
  category: Achievement["category"];
  label: string;
  description: string;
  iconName: AchievementIconName;
  value: number;
  thresholds: { bronze: number; silver: number; gold: number; platinum: number };
  progressUnit: string;
}): Achievement {
  const t = tieredByCount(value, thresholds);
  return {
    id,
    category,
    label,
    description,
    iconName,
    tier: t.tier,
    reached: t.tier,
    progressInTier: clamp01(t.progressInTier),
    progressLabel: `${value} ${progressUnit}`,
    nextThresholdLabel: t.nextLabel,
    xpAwarded: xpForTier(t.tier),
  };
}

function makePct({
  id,
  category,
  label,
  description,
  iconName,
  value,
  total,
  thresholds,
}: {
  id: AchievementId;
  category: Achievement["category"];
  label: string;
  description: string;
  iconName: AchievementIconName;
  value: number;
  total: number;
  thresholds: { bronze: number; silver: number; gold: number; platinum: number };
}): Achievement {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  const t = tieredByPct(value, total, thresholds);
  return {
    id,
    category,
    label,
    description,
    iconName,
    tier: t.tier,
    reached: t.tier,
    progressInTier: clamp01(t.progressInTier),
    progressLabel: `${value} of ${total} · ${pct}%`,
    nextThresholdLabel: t.nextLabel ? `${t.nextLabel} (%)` : null,
    xpAwarded: xpForTier(t.tier),
  };
}

function xpForTier(tier: Tier | null): number {
  if (!tier) return 0;
  let xp = 0;
  for (const t of ORDER) {
    xp += TIER_XP[t];
    if (t === tier) break;
  }
  return xp;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

// ─── Resilience XP + Level ───────────────────────────────────────────

export type ResilienceLevel = {
  level: number;
  xp: number;
  nextLevelXp: number;
  rank: string;
  progressPct: number; // 0..1 toward next level
};

const RANKS = [
  "Recruit", // 1
  "Apprentice", // 2
  "Practitioner", // 3
  "Specialist", // 4
  "Expert", // 5
  "Master", // 6
  "Mentor", // 7
  "Architect", // 8
  "Grandmaster", // 9
  "Resilience Legend", // 10+
];

export function computeLevel(achievements: Achievement[]): ResilienceLevel {
  const xp = achievements.reduce((acc, a) => acc + a.xpAwarded, 0);
  // Each level needs ~500 XP. Curve flattens slightly so it's not endless.
  let level = 1;
  let need = 500;
  let remaining = xp;
  while (remaining >= need && level < 12) {
    remaining -= need;
    level += 1;
    need = Math.round(need * 1.15);
  }
  const rank = RANKS[Math.min(level - 1, RANKS.length - 1)];
  return {
    level,
    xp,
    nextLevelXp: xp + (need - remaining),
    rank,
    progressPct: clamp01(remaining / need),
  };
}

// Icon registry for the page renderer
import {
  Sparkles as _Sparkles,
  Trophy as _Trophy,
  Shield as _Shield,
  Flame as _Flame,
  CalendarCheck as _CalendarCheck,
  Server as _Server,
  Crown as _Crown,
  Users as _Users,
  Layers as _Layers,
  Award as _Award,
  Zap as _Zap,
  Activity as _Activity,
} from "lucide-react";

export const ACHIEVEMENT_ICONS: Record<AchievementIconName, LucideIcon> = {
  Sparkles: _Sparkles,
  Trophy: _Trophy,
  Shield: _Shield,
  Flame: _Flame,
  CalendarCheck: _CalendarCheck,
  Server: _Server,
  Crown: _Crown,
  Users: _Users,
  Layers: _Layers,
  Award: _Award,
  Zap: _Zap,
  Activity: _Activity,
};

// Tier visual tokens used by the page
export const TIER_TONE: Record<
  Tier,
  { label: string; bg: string; ring: string; text: string; ribbon: string }
> = {
  bronze: {
    label: "Bronze",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    ring: "ring-amber-300 dark:ring-amber-700/60",
    text: "text-amber-800 dark:text-amber-200",
    ribbon: "from-amber-500 to-amber-300",
  },
  silver: {
    label: "Silver",
    bg: "bg-slate-200 dark:bg-slate-800/60",
    ring: "ring-slate-400 dark:ring-slate-600",
    text: "text-slate-800 dark:text-slate-100",
    ribbon: "from-slate-400 to-slate-300",
  },
  gold: {
    label: "Gold",
    bg: "bg-yellow-100 dark:bg-yellow-950/40",
    ring: "ring-yellow-400 dark:ring-yellow-600",
    text: "text-yellow-800 dark:text-yellow-200",
    ribbon: "from-yellow-500 to-yellow-300",
  },
  platinum: {
    label: "Platinum",
    bg: "bg-gradient-to-br from-indigo-100 via-cyan-100 to-emerald-100 dark:from-indigo-950/40 dark:via-cyan-950/40 dark:to-emerald-950/40",
    ring: "ring-indigo-400 dark:ring-indigo-500",
    text: "text-indigo-800 dark:text-indigo-200",
    ribbon: "from-indigo-500 via-cyan-500 to-emerald-500",
  },
};

// Re-export the imports so eslint doesn't strip them
void _Sparkles;
void _Trophy;
void _Shield;
void _Flame;
void _CalendarCheck;
void _Server;
void _Crown;
void _Users;
void _Layers;
void _Award;
void _Zap;
void _Activity;
// And the orig (unused) imports used only as type seeds
void Sparkles;
void Trophy;
void Shield;
void Flame;
void CalendarCheck;
void Server;
void Crown;
void Users;
void Layers;
void Award;
void Zap;
void Activity;
