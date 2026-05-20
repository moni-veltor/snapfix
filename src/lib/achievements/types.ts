/**
 * v2 achievements — declarative rule system with a 5-level maturity ladder
 * per topic. Each topic ships ~50 achievements arranged across the five
 * levels:
 *
 *   L1 Awareness  — inventory exists (you know the things you have)
 *   L2 Documented — records carry governance metadata (you've written it down)
 *   L3 Tested     — exercised / DR-tested at least once (you've proved it works)
 *   L4 Measured   — coverage % + breach rates tracked (regulator-ready rigour)
 *   L5 Optimised  — sustained excellence + automation (programme runs itself)
 *
 * L1-L3 unlocks are sticky (kept once earned via AchievementUnlock rows).
 * L4-L5 re-check live state on every read — regress in posture and the
 * badge regresses too. Mirrors how regulators think about maturity.
 */

import type { AchievementOrgState, AchievementPersonalState } from "./state";

export type AchievementTopic = "coverage" | "cadence" | "people" | "governance" | "resilience";
export type AchievementLevel = 1 | 2 | 3 | 4 | 5;

export type AchievementIconName =
  | "Activity"
  | "Award"
  | "BadgeCheck"
  | "Boxes"
  | "Building2"
  | "BookOpen"
  | "Briefcase"
  | "CalendarCheck"
  | "Crown"
  | "Database"
  | "Flame"
  | "FileCheck"
  | "FileSpreadsheet"
  | "Layers"
  | "Library"
  | "Network"
  | "Package"
  | "Server"
  | "Shield"
  | "ShieldCheck"
  | "Sparkles"
  | "Target"
  | "Trophy"
  | "Users"
  | "Zap";

/** Per-rule result returned by evaluate(). */
export type AchievementEvalResult =
  | {
      status: "unlocked";
      /** 0-1; always 1 when unlocked. */
      progress: 1;
      /** Display string like "12 of 12 · 100%". */
      valueLabel?: string;
    }
  | {
      status: "inProgress";
      progress: number;
      valueLabel?: string;
      nextLabel?: string;
    };

type AchievementRuleBase = {
  id: string;
  topic: AchievementTopic;
  level: AchievementLevel;
  title: string;
  description: string;
  icon: AchievementIconName;
  /**
   * When true, the unlock is persisted to AchievementUnlock and the badge
   * stays earned even if state regresses. Default true for L1-L3, false for
   * L4-L5 (live-checked) but configurable per rule.
   */
  sticky: boolean;
  /** Optional deep-link to the page where the user would take action. */
  deepLink?: string;
  /** XP awarded on first unlock. Defaults to xpForLevel(level). */
  xp?: number;
};

export type OrgAchievementRule = AchievementRuleBase & {
  /** Org-wide scope — every member of the org sees the same unlock state. */
  scope?: "org";
  evaluate: (state: AchievementOrgState) => AchievementEvalResult;
};

export type PersonalAchievementRule = AchievementRuleBase & {
  /** Per-user scope — each user has their own unlock state. */
  scope: "user";
  evaluate: (state: AchievementPersonalState) => AchievementEvalResult;
};

export type AchievementRule = OrgAchievementRule | PersonalAchievementRule;

/** Rule scope used by the persistence layer + UI toggle. */
export type AchievementScope = "org" | "user";

export function ruleScope(rule: AchievementRule): AchievementScope {
  return rule.scope === "user" ? "user" : "org";
}

/** A rule + its evaluation outcome, ready for rendering. */
export type EvaluatedAchievement = {
  rule: AchievementRule;
  result: AchievementEvalResult;
  /** True when the achievement is currently earned (live or via sticky row). */
  unlocked: boolean;
  /** UTC timestamp of the first unlock if known. */
  unlockedAt: Date | null;
  /** XP awarded by this achievement at its current state. */
  xpAwarded: number;
};

/** Aggregate maturity score per topic — used by the dashboard. */
export type TopicMaturity = {
  topic: AchievementTopic;
  topicLabel: string;
  /** Achievements unlocked per level. */
  unlockedByLevel: Record<AchievementLevel, number>;
  totalByLevel: Record<AchievementLevel, number>;
  /** Highest fully-unlocked level (defaults to 0). */
  level: 0 | AchievementLevel;
  /** Progress 0-1 within the next level. */
  progressInLevel: number;
  /** Sum of XP from this topic. */
  xp: number;
};

export type AchievementsSummary = {
  achievements: EvaluatedAchievement[];
  byTopic: Record<AchievementTopic, EvaluatedAchievement[]>;
  maturity: TopicMaturity[];
  totalXp: number;
  totalUnlocked: number;
  totalRules: number;
};

export const TOPIC_LABEL: Record<AchievementTopic, string> = {
  coverage: "Coverage",
  cadence: "Cadence",
  people: "People",
  governance: "Governance",
  resilience: "Resilience",
};

export const LEVEL_LABEL: Record<AchievementLevel, string> = {
  1: "Awareness",
  2: "Documented",
  3: "Tested",
  4: "Measured",
  5: "Optimised",
};

export const LEVEL_DESCRIPTION: Record<AchievementLevel, string> = {
  1: "Inventory exists — you know the things you have.",
  2: "Records carry governance metadata — you've written it down.",
  3: "Exercised at least once — you've proved it works.",
  4: "Coverage %, breach rates and pacing tracked — regulator-ready rigour.",
  5: "Sustained excellence + automation — the programme runs itself.",
};

export const LEVEL_TONE: Record<AchievementLevel, string> = {
  1: "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200",
  2: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  3: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  4: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  5: "bg-gradient-to-br from-indigo-100 via-cyan-100 to-emerald-100 text-indigo-800 dark:from-indigo-950/40 dark:via-cyan-950/40 dark:to-emerald-950/40 dark:text-indigo-200",
};

export function xpForLevel(level: AchievementLevel): number {
  // Geometric so L5 unlocks feel meaningful but don't dominate.
  switch (level) {
    case 1:
      return 25;
    case 2:
      return 50;
    case 3:
      return 100;
    case 4:
      return 200;
    case 5:
      return 400;
  }
}
