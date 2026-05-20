/**
 * 50 Cadence achievements arranged across the 5 maturity levels:
 *   L1 Awareness  — first exercises run, scenarios cloned, the act of practising (10)
 *   L2 Documented — exercises planned, hot-washes captured, programme structured (10)
 *   L3 Tested     — exercises in window, monthly cadence holds, dry runs used (10)
 *   L4 Measured   — pacing, programme adherence, regulator-evidence mode (10)
 *   L5 Optimised  — sustained streaks, diversity, advanced difficulty (10)
 */

import type { AchievementOrgState } from "./state";
import type { AchievementEvalResult, AchievementRule } from "./types";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function countAtLeast(
  value: number,
  target: number,
  units: string,
): AchievementEvalResult {
  if (value >= target) {
    return { status: "unlocked", progress: 1, valueLabel: `${value} ${units}` };
  }
  return {
    status: "inProgress",
    progress: target === 0 ? 0 : clamp01(value / target),
    valueLabel: `${value} ${units}`,
    nextLabel: `${target} ${units}`,
  };
}

function pctAtLeast(
  value: number,
  total: number,
  pct: number,
  units: string,
): AchievementEvalResult {
  if (total === 0) {
    return {
      status: "inProgress",
      progress: 0,
      valueLabel: `0 ${units}`,
      nextLabel: `${pct}% (run more exercises)`,
    };
  }
  const actual = (value / total) * 100;
  if (actual >= pct) {
    return {
      status: "unlocked",
      progress: 1,
      valueLabel: `${value} / ${total} · ${Math.round(actual)}%`,
    };
  }
  return {
    status: "inProgress",
    progress: clamp01(actual / pct),
    valueLabel: `${value} / ${total} · ${Math.round(actual)}%`,
    nextLabel: `${pct}%`,
  };
}

function flag(
  predicate: boolean,
  detail: string,
  hint: string,
): AchievementEvalResult {
  return predicate
    ? { status: "unlocked", progress: 1, valueLabel: detail }
    : { status: "inProgress", progress: 0, valueLabel: detail, nextLabel: hint };
}

type Seed = Omit<AchievementRule, "topic" | "evaluate"> & {
  evaluate: (s: AchievementOrgState) => AchievementEvalResult;
};

const L1: ReadonlyArray<Seed> = [
  {
    id: "cadence-l1-first-exercise",
    level: 1,
    title: "First exercise completed",
    description: "Run your first exercise to completion — any scenario counts.",
    icon: "Flame",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercises.completedTotal, 1, "completed"),
  },
  {
    id: "cadence-l1-3-exercises",
    level: 1,
    title: "Three exercises in the books",
    description: "Three completed exercises — the practice is taking hold.",
    icon: "Flame",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercises.completedTotal, 3, "completed"),
  },
  {
    id: "cadence-l1-5-exercises",
    level: 1,
    title: "Five completed exercises",
    description: "Five completed — a season of practice under your belt.",
    icon: "Flame",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercises.completedTotal, 5, "completed"),
  },
  {
    id: "cadence-l1-first-scenario-cloned",
    level: 1,
    title: "First scenario cloned from library",
    description: "Library scenarios are pre-calibrated — cloning one is a fast start.",
    icon: "Library",
    sticky: true,
    deepLink: "/scenarios",
    evaluate: (s) => countAtLeast(s.exercises.scenariosClonedFromLibrary, 1, "cloned"),
  },
  {
    id: "cadence-l1-3-scenarios-cloned",
    level: 1,
    title: "Library trio",
    description: "Three library scenarios cloned — your firm has a healthy starting catalogue.",
    icon: "Library",
    sticky: true,
    deepLink: "/scenarios",
    evaluate: (s) => countAtLeast(s.exercises.scenariosClonedFromLibrary, 3, "cloned"),
  },
  {
    id: "cadence-l1-first-facilitator",
    level: 1,
    title: "First named facilitator",
    description: "At least one exercise has been run with a named facilitator.",
    icon: "Users",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.distinctFacilitators, 1, "facilitator"),
  },
  {
    id: "cadence-l1-first-dry-run",
    level: 1,
    title: "First dry run",
    description: "A dry run helps a fresh IMT settle before the real thing.",
    icon: "Sparkles",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.dryRunsTotal, 1, "dry run"),
  },
  {
    id: "cadence-l1-first-hot-wash",
    level: 1,
    title: "First hot-wash captured",
    description: "Immediate post-exercise hot-wash is where the freshest lessons live.",
    icon: "Flame",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.withHotWash, 1, "with hot-wash"),
  },
  {
    id: "cadence-l1-first-distinct-title",
    level: 1,
    title: "Distinct exercise titles",
    description: "Two or more exercise titles — variety beats running the same drill twice.",
    icon: "Sparkles",
    sticky: true,
    deepLink: "/scenarios",
    evaluate: (s) => countAtLeast(s.cadence.distinctTitles, 2, "distinct titles"),
  },
  {
    id: "cadence-l1-first-regulator-evidence",
    level: 1,
    title: "First regulator-evidence exercise",
    description: "An exercise has been run in regulator-evidence mode (tamper-evident log + sign-offs).",
    icon: "ShieldCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.cadence.regulatorEvidenceTotal, 1, "regulator-evidence runs"),
  },
];

const L2: ReadonlyArray<Seed> = [
  {
    id: "cadence-l2-10-exercises",
    level: 2,
    title: "Ten exercises completed",
    description: "Ten completed — the team can comfortably plan another one.",
    icon: "Flame",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercises.completedTotal, 10, "completed"),
  },
  {
    id: "cadence-l2-3-facilitators",
    level: 2,
    title: "Three distinct facilitators",
    description: "Single-facilitator design is fragile — three or more reduces key-person risk.",
    icon: "Users",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.distinctFacilitators, 3, "facilitators"),
  },
  {
    id: "cadence-l2-3-dry-runs",
    level: 2,
    title: "Three dry runs",
    description: "Dry runs let teams iterate without the cost of the real thing.",
    icon: "Sparkles",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.dryRunsTotal, 3, "dry runs"),
  },
  {
    id: "cadence-l2-3-hot-washes",
    level: 2,
    title: "Three hot-washes",
    description: "Hot-wash for three different exercises captured — habit forming.",
    icon: "Flame",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.withHotWash, 3, "with hot-wash"),
  },
  {
    id: "cadence-l2-quartery-cadence",
    level: 2,
    title: "Quarterly cadence",
    description: "At least one exercise in each of the last 2 quarters.",
    icon: "CalendarCheck",
    sticky: true,
    deepLink: "/analytics?audience=executive",
    evaluate: (s) => countAtLeast(s.cadence.quartersInLast4WithExercise, 2, "of 4 quarters"),
  },
  {
    id: "cadence-l2-90day-cadence",
    level: 2,
    title: "Active in the last 90 days",
    description: "At least one exercise completed in the last 90 days.",
    icon: "CalendarCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.completedLast90Days, 1, "in 90 days"),
  },
  {
    id: "cadence-l2-5-distinct-titles",
    level: 2,
    title: "Five distinct titles",
    description: "Five distinct exercise titles — the IMT has practised a range of muscles.",
    icon: "Sparkles",
    sticky: true,
    deepLink: "/scenarios",
    evaluate: (s) => countAtLeast(s.cadence.distinctTitles, 5, "distinct titles"),
  },
  {
    id: "cadence-l2-3-regulator-evidence",
    level: 2,
    title: "Three regulator-evidence runs",
    description: "Three exercises with regulator-evidence mode — the audit pack is filling out.",
    icon: "ShieldCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.cadence.regulatorEvidenceTotal, 3, "regulator-evidence runs"),
  },
  {
    id: "cadence-l2-low-abandon",
    level: 2,
    title: "Low abandon rate",
    description: "Fewer than 20% of started exercises ended in ABANDONED.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => {
      const started =
        s.cadence.completedLast12Months + s.cadence.abandonedTotal;
      if (started === 0) {
        return {
          status: "inProgress",
          progress: 0,
          valueLabel: "no exercises yet",
          nextLabel: "run more",
        };
      }
      const pct = (s.cadence.abandonedTotal / started) * 100;
      return flag(
        pct < 20,
        `${Math.round(pct)}% abandoned`,
        "fewer abandons next quarter",
      );
    },
  },
  {
    id: "cadence-l2-month-streak-2",
    level: 2,
    title: "Two-month streak",
    description: "Two consecutive months with at least one exercise started.",
    icon: "Activity",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercises.monthsStreak, 2, "month streak"),
  },
];

const L3: ReadonlyArray<Seed> = [
  {
    id: "cadence-l3-1-in-90days",
    level: 3,
    title: "One in the last 90 days",
    description: "A live exercise inside the last 90 days — programme momentum.",
    icon: "CalendarCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.completedLast90Days, 1, "in 90d"),
  },
  {
    id: "cadence-l3-3-in-90days",
    level: 3,
    title: "Three in 90 days",
    description: "Three completed exercises in the last 90 days — sector-leading tempo.",
    icon: "Activity",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.completedLast90Days, 3, "in 90d"),
  },
  {
    id: "cadence-l3-6-in-window",
    level: 3,
    title: "Six in the year",
    description: "Six completed exercises in the last 12 months.",
    icon: "Activity",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.completedLast12Months, 6, "in 12mo"),
  },
  {
    id: "cadence-l3-recent-week",
    level: 3,
    title: "Exercise this week",
    description: "An exercise completed in the last 7 days — fresh-in-mind cadence.",
    icon: "Flame",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.completedLast7Days, 1, "this week"),
  },
  {
    id: "cadence-l3-streak-3",
    level: 3,
    title: "Three-month streak",
    description: "Three consecutive months with at least one exercise.",
    icon: "Activity",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercises.monthsStreak, 3, "month streak"),
  },
  {
    id: "cadence-l3-streak-6",
    level: 3,
    title: "Six-month streak",
    description: "Half a year of unbroken monthly practice.",
    icon: "Activity",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercises.monthsStreak, 6, "month streak"),
  },
  {
    id: "cadence-l3-dry-runs-in-window",
    level: 3,
    title: "Dry run within 90 days",
    description: "A dry run in the last 90 days — rehearsal discipline.",
    icon: "Sparkles",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.dryRunsLast90Days, 1, "dry runs in 90d"),
  },
  {
    id: "cadence-l3-rolling-cadence",
    level: 3,
    title: "Rolling 60-day cadence",
    description: "Two or more exercises in the last 60 days.",
    icon: "CalendarCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.completedLast60Days, 2, "in 60d"),
  },
  {
    id: "cadence-l3-no-cold-period",
    level: 3,
    title: "No cold period",
    description: "The programme hasn't gone more than 60 days without an exercise.",
    icon: "Activity",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      flag(
        s.cadence.daysSinceLastExerciseStart !== null &&
          s.cadence.daysSinceLastExerciseStart <= 60,
        s.cadence.daysSinceLastExerciseStart === null
          ? "no exercises yet"
          : `last started ${s.cadence.daysSinceLastExerciseStart}d ago`,
        "schedule one within 60d",
      ),
  },
  {
    id: "cadence-l3-10-distinct-titles",
    level: 3,
    title: "Ten distinct titles",
    description: "Ten distinct exercise titles run — broad practice across scenarios.",
    icon: "Sparkles",
    sticky: true,
    deepLink: "/scenarios",
    evaluate: (s) => countAtLeast(s.cadence.distinctTitles, 10, "distinct titles"),
  },
];

const L4: ReadonlyArray<Seed> = [
  {
    id: "cadence-l4-quarterly-coverage",
    level: 4,
    title: "Every quarter covered",
    description: "Each of the last 4 quarters had at least one completed exercise.",
    icon: "CalendarCheck",
    sticky: false,
    deepLink: "/analytics?audience=executive",
    evaluate: (s) => countAtLeast(s.cadence.quartersInLast4WithExercise, 4, "of 4 quarters"),
  },
  {
    id: "cadence-l4-12mo-12-exercises",
    level: 4,
    title: "Twelve exercises in 12 months",
    description: "Roughly monthly cadence — a regulator-pleasing rhythm.",
    icon: "Flame",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.completedLast12Months, 12, "in 12mo"),
  },
  {
    id: "cadence-l4-programme-adherence-60",
    level: 4,
    title: "Programme adherence ≥ 60%",
    description: "At least 60% of slotted programme quarters have been exercised.",
    icon: "CalendarCheck",
    sticky: false,
    deepLink: "/scenarios/programme",
    evaluate: (s) =>
      pctAtLeast(
        s.programme.quartersExercisedThisYear,
        s.programme.quartersSlottedThisYear,
        60,
        "quarters",
      ),
  },
  {
    id: "cadence-l4-low-abandon-window",
    level: 4,
    title: "Sustained low abandon",
    description: "Fewer than 10% of started exercises have ended ABANDONED.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => {
      const started = s.cadence.completedLast12Months + s.cadence.abandonedTotal;
      if (started === 0) {
        return {
          status: "inProgress",
          progress: 0,
          valueLabel: "no exercises yet",
          nextLabel: "run more",
        };
      }
      const pct = (s.cadence.abandonedTotal / started) * 100;
      return flag(pct < 10, `${Math.round(pct)}% abandoned`, "drop below 10%");
    },
  },
  {
    id: "cadence-l4-streak-9",
    level: 4,
    title: "Nine-month streak",
    description: "Nine consecutive months with at least one exercise.",
    icon: "Activity",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercises.monthsStreak, 9, "month streak"),
  },
  {
    id: "cadence-l4-difficulty-3-plus",
    level: 4,
    title: "Difficulty average ≥ 3",
    description: "Average exercise difficulty in window ≥ 3/5 — not just easy wins.",
    icon: "Target",
    sticky: false,
    deepLink: "/scenarios",
    evaluate: (s) => {
      const avg = s.cadence.avgDifficultyInWindow;
      if (avg === null) {
        return {
          status: "inProgress",
          progress: 0,
          valueLabel: "no difficulty data",
          nextLabel: "rate scenarios first",
        };
      }
      return flag(avg >= 3, `${avg.toFixed(1)} / 5`, "target ≥ 3");
    },
  },
  {
    id: "cadence-l4-hot-wash-rate-60",
    level: 4,
    title: "Hot-wash on 60%+ of exercises",
    description: "Most exercises have a hot-wash captured immediately.",
    icon: "Flame",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(s.cadence.withHotWash, s.exercises.completedTotal, 60, "exercises"),
  },
  {
    id: "cadence-l4-5-facilitators",
    level: 4,
    title: "Five distinct facilitators",
    description: "Five distinct facilitators — wide bench, low single-point-of-failure.",
    icon: "Users",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.distinctFacilitators, 5, "facilitators"),
  },
  {
    id: "cadence-l4-10-regulator-evidence",
    level: 4,
    title: "Ten regulator-evidence runs",
    description: "Ten exercises in regulator-evidence mode — the audit pack speaks for itself.",
    icon: "ShieldCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.cadence.regulatorEvidenceTotal, 10, "regulator-evidence runs"),
  },
  {
    id: "cadence-l4-dry-run-then-real",
    level: 4,
    title: "Dry-run-to-real ratio",
    description: "Roughly 1 dry run per 3 production exercises in window.",
    icon: "Sparkles",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => {
      const prod = s.cadence.completedLast90Days;
      const dry = s.cadence.dryRunsLast90Days;
      if (prod === 0 && dry === 0) {
        return {
          status: "inProgress",
          progress: 0,
          valueLabel: "no exercises in 90d",
          nextLabel: "run one of each",
        };
      }
      const ratio = prod === 0 ? Infinity : dry / prod;
      return flag(
        ratio >= 0.33,
        `${dry} dry / ${prod} prod`,
        "1 dry per 3 prod runs",
      );
    },
  },
];

const L5: ReadonlyArray<Seed> = [
  {
    id: "cadence-l5-streak-12",
    level: 5,
    title: "Annual streak",
    description: "Twelve consecutive months with at least one exercise.",
    icon: "Crown",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercises.monthsStreak, 12, "month streak"),
  },
  {
    id: "cadence-l5-personal-best-streak",
    level: 5,
    title: "All-time best streak",
    description: "Your best-ever month-streak is 12 or more.",
    icon: "Crown",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.bestMonthStreak, 12, "best month streak"),
  },
  {
    id: "cadence-l5-programme-adherence-90",
    level: 5,
    title: "Programme adherence ≥ 90%",
    description: "Almost every slotted programme quarter has been exercised.",
    icon: "CalendarCheck",
    sticky: false,
    deepLink: "/scenarios/programme",
    evaluate: (s) =>
      pctAtLeast(
        s.programme.quartersExercisedThisYear,
        s.programme.quartersSlottedThisYear,
        90,
        "quarters",
      ),
  },
  {
    id: "cadence-l5-20-distinct-titles",
    level: 5,
    title: "Twenty distinct titles",
    description: "Twenty distinct exercise titles run — broad repertoire.",
    icon: "Sparkles",
    sticky: true,
    deepLink: "/scenarios",
    evaluate: (s) => countAtLeast(s.cadence.distinctTitles, 20, "distinct titles"),
  },
  {
    id: "cadence-l5-7-facilitators",
    level: 5,
    title: "Seven distinct facilitators",
    description: "Seven distinct facilitators — deep bench, low single-point-of-failure.",
    icon: "Users",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.distinctFacilitators, 7, "facilitators"),
  },
  {
    id: "cadence-l5-monthly-cadence",
    level: 5,
    title: "Monthly cadence in 90d",
    description: "At least one exercise per month over the last 90 days (3 in 90).",
    icon: "CalendarCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.completedLast90Days, 3, "in 90d"),
  },
  {
    id: "cadence-l5-difficulty-4",
    level: 5,
    title: "Difficulty average ≥ 4",
    description: "Average exercise difficulty ≥ 4/5 — the team practises the hard ones.",
    icon: "Target",
    sticky: false,
    deepLink: "/scenarios",
    evaluate: (s) => {
      const avg = s.cadence.avgDifficultyInWindow;
      if (avg === null) {
        return {
          status: "inProgress",
          progress: 0,
          valueLabel: "no difficulty data",
          nextLabel: "rate scenarios first",
        };
      }
      return flag(avg >= 4, `${avg.toFixed(1)} / 5`, "target ≥ 4");
    },
  },
  {
    id: "cadence-l5-hot-wash-rate-90",
    level: 5,
    title: "Hot-wash on 90%+ of exercises",
    description: "Nine in ten exercises have an immediate hot-wash on file.",
    icon: "Flame",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(s.cadence.withHotWash, s.exercises.completedTotal, 90, "exercises"),
  },
  {
    id: "cadence-l5-15-dry-runs",
    level: 5,
    title: "Fifteen dry runs lifetime",
    description: "Fifteen dry runs — rehearsal-first culture is established.",
    icon: "Sparkles",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.cadence.dryRunsTotal, 15, "dry runs"),
  },
  {
    id: "cadence-l5-50-completed-lifetime",
    level: 5,
    title: "Fifty exercises lifetime",
    description: "Fifty completed exercises — programme is mature and ongoing.",
    icon: "Trophy",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercises.completedTotal, 50, "completed"),
  },
];

export const CADENCE_RULES: ReadonlyArray<AchievementRule> = [
  ...L1,
  ...L2,
  ...L3,
  ...L4,
  ...L5,
].map(
  (r) =>
    ({ ...r, topic: "cadence", scope: "org" }) as AchievementRule,
);
