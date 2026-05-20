/**
 * 50 Resilience achievements across the 5 maturity levels:
 *   L1 Awareness  — first DR test, first runbook published, first BCP, first
 *                   recovery plan, first impact-breach captured (10)
 *   L2 Documented — DR tests on multiple systems, runbooks structured,
 *                   recovery plans tied to exercises (10)
 *   L3 Tested     — DR-test coverage %, runbook step completion in window,
 *                   recovery plans on every recent exercise (10)
 *   L4 Measured   — healthy DR-test rate, runbook completion %, low tolerance
 *                   breaches, clean closures (10)
 *   L5 Optimised  — zero abandoned runbooks, zero tolerance breaches, full
 *                   runbook + DR coverage, clean closures every time (10)
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
      nextLabel: `${pct}%`,
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

function flag(predicate: boolean, detail: string, hint: string): AchievementEvalResult {
  return predicate
    ? { status: "unlocked", progress: 1, valueLabel: detail }
    : { status: "inProgress", progress: 0, valueLabel: detail, nextLabel: hint };
}

type Seed = Omit<AchievementRule, "topic" | "evaluate" | "scope"> & {
  evaluate: (s: AchievementOrgState) => AchievementEvalResult;
};

const L1: ReadonlyArray<Seed> = [
  {
    id: "resilience-l1-first-dr-test",
    level: 1,
    title: "First DR test logged",
    description: "A DR test is on file — recovery is being practised.",
    icon: "Zap",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) => countAtLeast(s.systems.drTestCount, 1, "DR tests"),
  },
  {
    id: "resilience-l1-first-runbook",
    level: 1,
    title: "First runbook published",
    description: "A runbook has been published — the IMT has a playbook.",
    icon: "BookOpen",
    sticky: true,
    deepLink: "/runbooks",
    evaluate: (s) => countAtLeast(s.resilience.runbooksPublished, 1, "published"),
  },
  {
    id: "resilience-l1-first-runbook-activation",
    level: 1,
    title: "First runbook activation",
    description: "A runbook has been activated against an incident.",
    icon: "Flame",
    sticky: true,
    deepLink: "/runbooks",
    evaluate: (s) => countAtLeast(s.resilience.runbookExecutionsTotal, 1, "activations"),
  },
  {
    id: "resilience-l1-first-recovery-plan",
    level: 1,
    title: "First recovery plan filled",
    description: "An exercise has its recovery plan captured.",
    icon: "FileCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.resilience.recoveryPlansInWindow, 1, "recovery plans"),
  },
  {
    id: "resilience-l1-first-bcp",
    level: 1,
    title: "First BCP activation",
    description: "BCP activated against an incident — the muscle has been used.",
    icon: "Shield",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.resilience.bcpActivationsInWindow, 1, "BCP activations"),
  },
  {
    id: "resilience-l1-first-system-with-rto",
    level: 1,
    title: "First system with RTO + RPO",
    description: "A system has both recovery time and recovery point objectives set.",
    icon: "Target",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) => countAtLeast(s.systems.withRtoAndRpo, 1, "system"),
  },
  {
    id: "resilience-l1-first-failover",
    level: 1,
    title: "First failover topology declared",
    description: "A system carries a non-NONE failover topology.",
    icon: "Network",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) => countAtLeast(s.systems.withFailoverConfigured, 1, "system"),
  },
  {
    id: "resilience-l1-first-failover-region",
    level: 1,
    title: "First failover region named",
    description: "A system has a declared failover region.",
    icon: "Network",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) => countAtLeast(s.systems.withFailoverRegion, 1, "system"),
  },
  {
    id: "resilience-l1-first-backup",
    level: 1,
    title: "First backup posture captured",
    description: "A system has a declared backup frequency.",
    icon: "Database",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) => countAtLeast(s.systems.backupConfigured, 1, "system"),
  },
  {
    id: "resilience-l1-first-clean-closure",
    level: 1,
    title: "First clean closure",
    description: "An incident closed with all five closure criteria met.",
    icon: "BadgeCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.resilience.cleanClosuresInWindow, 1, "clean closures"),
  },
];

const L2: ReadonlyArray<Seed> = [
  {
    id: "resilience-l2-3-dr-tests",
    level: 2,
    title: "Three DR tests",
    description: "Three DR tests on file — recovery isn't a one-off.",
    icon: "Zap",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) => countAtLeast(s.systems.drTestCount, 3, "DR tests"),
  },
  {
    id: "resilience-l2-3-systems-dr",
    level: 2,
    title: "Three systems DR-tested",
    description: "Three different systems have at least one DR test on file.",
    icon: "Zap",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) => countAtLeast(s.systems.withDrTestAny, 3, "systems"),
  },
  {
    id: "resilience-l2-3-runbooks",
    level: 2,
    title: "Three runbooks published",
    description: "Three runbooks are live — coverage across categories starting.",
    icon: "BookOpen",
    sticky: true,
    deepLink: "/runbooks",
    evaluate: (s) => countAtLeast(s.resilience.runbooksPublished, 3, "published"),
  },
  {
    id: "resilience-l2-3-recovery-plans",
    level: 2,
    title: "Three recovery plans",
    description: "Three exercises in window carry recovery plans.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.resilience.recoveryPlansInWindow, 3, "recovery plans"),
  },
  {
    id: "resilience-l2-5-rto-rpo",
    level: 2,
    title: "Five systems with RTO + RPO",
    description: "Five systems carry both RTO and RPO targets.",
    icon: "Target",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) => countAtLeast(s.systems.withRtoAndRpo, 5, "systems"),
  },
  {
    id: "resilience-l2-3-failover",
    level: 2,
    title: "Three systems with failover",
    description: "Three systems carry a non-NONE failover topology.",
    icon: "Network",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) => countAtLeast(s.systems.withFailoverConfigured, 3, "systems"),
  },
  {
    id: "resilience-l2-3-bcp",
    level: 2,
    title: "Three BCP activations",
    description: "Three BCP activations in window — the muscle is exercised.",
    icon: "Shield",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.resilience.bcpActivationsInWindow, 3, "BCP activations"),
  },
  {
    id: "resilience-l2-5-runbook-execs",
    level: 2,
    title: "Five runbook activations",
    description: "Five runbook executions recorded — playbooks in regular use.",
    icon: "Flame",
    sticky: false,
    deepLink: "/runbooks",
    evaluate: (s) => countAtLeast(s.resilience.runbookExecutionsTotal, 5, "activations"),
  },
  {
    id: "resilience-l2-30-steps-completed",
    level: 2,
    title: "Thirty runbook steps completed",
    description: "Thirty runbook step executions in COMPLETE state in window.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/runbooks",
    evaluate: (s) =>
      countAtLeast(s.resilience.runbookStepsCompletedInWindow, 30, "steps complete"),
  },
  {
    id: "resilience-l2-3-clean-closures",
    level: 2,
    title: "Three clean closures",
    description: "Three incidents closed with every closure criterion met.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.resilience.cleanClosuresInWindow, 3, "clean closures"),
  },
];

const L3: ReadonlyArray<Seed> = [
  {
    id: "resilience-l3-dr-coverage-25",
    level: 3,
    title: "25% systems DR-tested",
    description: "Quarter of the system register has a DR test on file.",
    icon: "Zap",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) => pctAtLeast(s.systems.withDrTestAny, s.systems.total, 25, "systems"),
  },
  {
    id: "resilience-l3-dr-coverage-50",
    level: 3,
    title: "50% systems DR-tested",
    description: "Half the system register has a DR test on file.",
    icon: "Zap",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) => pctAtLeast(s.systems.withDrTestAny, s.systems.total, 50, "systems"),
  },
  {
    id: "resilience-l3-10-systems-dr",
    level: 3,
    title: "Ten systems DR-tested",
    description: "Ten systems have at least one DR test recorded.",
    icon: "Zap",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) => countAtLeast(s.systems.withDrTestAny, 10, "systems"),
  },
  {
    id: "resilience-l3-rto-rpo-50",
    level: 3,
    title: "50% RTO + RPO coverage",
    description: "Half the system register has both RTO and RPO set.",
    icon: "Target",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) => pctAtLeast(s.systems.withRtoAndRpo, s.systems.total, 50, "systems"),
  },
  {
    id: "resilience-l3-failover-50",
    level: 3,
    title: "50% systems with failover",
    description: "Half the system register has a failover topology declared.",
    icon: "Network",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) =>
      pctAtLeast(s.systems.withFailoverConfigured, s.systems.total, 50, "systems"),
  },
  {
    id: "resilience-l3-runbook-completion-rate-50",
    level: 3,
    title: "50% runbook completion",
    description: "Half of runbook step executions in window reached COMPLETE.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/runbooks",
    evaluate: (s) => {
      const total =
        s.resilience.runbookStepsCompletedInWindow +
        s.resilience.runbookStepsSkippedInWindow;
      return pctAtLeast(s.resilience.runbookStepsCompletedInWindow, total, 50, "steps");
    },
  },
  {
    id: "resilience-l3-runbook-exec-complete",
    level: 3,
    title: "Five runbooks closed clean",
    description: "Five runbook executions completed (not abandoned).",
    icon: "Trophy",
    sticky: false,
    deepLink: "/runbooks",
    evaluate: (s) => countAtLeast(s.resilience.runbookExecutionsComplete, 5, "completed"),
  },
  {
    id: "resilience-l3-recovery-50",
    level: 3,
    title: "50% exercises with recovery plan",
    description: "Half the completed exercises in window have a recovery plan.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(s.resilience.recoveryPlansInWindow, s.exercises.completedInWindow, 50, "exercises"),
  },
  {
    id: "resilience-l3-distinct-runbooks-3",
    level: 3,
    title: "Three distinct runbooks activated",
    description: "Three different runbooks activated in window — diverse playbook use.",
    icon: "Library",
    sticky: true,
    deepLink: "/runbooks",
    evaluate: (s) =>
      countAtLeast(s.resilience.distinctRunbooksActivatedInWindow, 3, "distinct runbooks"),
  },
  {
    id: "resilience-l3-clean-closure-50",
    level: 3,
    title: "50% clean closures",
    description: "Half the closed incidents in window met every closure criterion.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(
        s.resilience.cleanClosuresInWindow,
        s.resilience.closuresInWindow,
        50,
        "closures",
      ),
  },
];

const L4: ReadonlyArray<Seed> = [
  {
    id: "resilience-l4-dr-coverage-80",
    level: 4,
    title: "80% systems DR-tested",
    description: "80%+ of the system register has at least one DR test on file.",
    icon: "Zap",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) => pctAtLeast(s.systems.withDrTestAny, s.systems.total, 80, "systems"),
  },
  {
    id: "resilience-l4-healthy-dr-50",
    level: 4,
    title: "50% systems with healthy DR",
    description: "Half the systems have a DR test with outcome PASSED.",
    icon: "Zap",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) => {
      const total = s.systems.total;
      const healthy = s.systems.healthyDrTestCount > 0 ? s.systems.withDrTestAny : 0;
      return pctAtLeast(healthy, total, 50, "systems");
    },
  },
  {
    id: "resilience-l4-rto-rpo-80",
    level: 4,
    title: "80% RTO + RPO coverage",
    description: "80%+ of systems have both RTO and RPO set.",
    icon: "Target",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) => pctAtLeast(s.systems.withRtoAndRpo, s.systems.total, 80, "systems"),
  },
  {
    id: "resilience-l4-failover-80",
    level: 4,
    title: "80% systems with failover",
    description: "80%+ of systems carry a non-NONE failover topology.",
    icon: "Network",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) =>
      pctAtLeast(s.systems.withFailoverConfigured, s.systems.total, 80, "systems"),
  },
  {
    id: "resilience-l4-runbook-completion-rate-80",
    level: 4,
    title: "80% runbook completion",
    description: "80%+ of runbook step executions in window reached COMPLETE.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/runbooks",
    evaluate: (s) => {
      const total =
        s.resilience.runbookStepsCompletedInWindow +
        s.resilience.runbookStepsSkippedInWindow;
      return pctAtLeast(s.resilience.runbookStepsCompletedInWindow, total, 80, "steps");
    },
  },
  {
    id: "resilience-l4-no-abandoned",
    level: 4,
    title: "No abandoned runbooks",
    description: "Zero runbook executions ended ABANDONED.",
    icon: "Shield",
    sticky: false,
    deepLink: "/runbooks",
    evaluate: (s) =>
      flag(
        s.resilience.runbookExecutionsAbandoned === 0 &&
          s.resilience.runbookExecutionsTotal > 0,
        `${s.resilience.runbookExecutionsAbandoned} abandoned of ${s.resilience.runbookExecutionsTotal}`,
        "drive abandons to zero",
      ),
  },
  {
    id: "resilience-l4-low-breaches",
    level: 4,
    title: "Tolerance breaches ≤ 3",
    description: "Three or fewer ImpactBreach rows in window.",
    icon: "Shield",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      flag(
        s.resilience.toleranceBreachesInWindow <= 3,
        `${s.resilience.toleranceBreachesInWindow} breaches`,
        "drop to ≤ 3",
      ),
  },
  {
    id: "resilience-l4-clean-closure-80",
    level: 4,
    title: "80% clean closures",
    description: "80%+ of closed incidents in window met every closure criterion.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(
        s.resilience.cleanClosuresInWindow,
        s.resilience.closuresInWindow,
        80,
        "closures",
      ),
  },
  {
    id: "resilience-l4-recovery-80",
    level: 4,
    title: "80% recovery plans",
    description: "80%+ of completed exercises in window have a recovery plan.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(s.resilience.recoveryPlansInWindow, s.exercises.completedInWindow, 80, "exercises"),
  },
  {
    id: "resilience-l4-50-steps",
    level: 4,
    title: "Fifty runbook steps completed",
    description: "Fifty runbook step executions in COMPLETE state in window.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/runbooks",
    evaluate: (s) =>
      countAtLeast(s.resilience.runbookStepsCompletedInWindow, 50, "steps complete"),
  },
];

const L5: ReadonlyArray<Seed> = [
  {
    id: "resilience-l5-dr-coverage-100",
    level: 5,
    title: "Every system DR-tested",
    description: "Every registered system has at least one DR test.",
    icon: "Crown",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) => pctAtLeast(s.systems.withDrTestAny, s.systems.total, 100, "systems"),
  },
  {
    id: "resilience-l5-rto-rpo-100",
    level: 5,
    title: "Every system with RTO + RPO",
    description: "Every system carries both RTO and RPO targets.",
    icon: "Target",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) => pctAtLeast(s.systems.withRtoAndRpo, s.systems.total, 100, "systems"),
  },
  {
    id: "resilience-l5-failover-100",
    level: 5,
    title: "Every system with failover",
    description: "Every system declares a non-NONE failover topology.",
    icon: "Network",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) =>
      pctAtLeast(s.systems.withFailoverConfigured, s.systems.total, 100, "systems"),
  },
  {
    id: "resilience-l5-zero-tolerance-breaches",
    level: 5,
    title: "Zero tolerance breaches",
    description: "Zero ImpactBreach rows in window.",
    icon: "Shield",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      flag(
        s.resilience.toleranceBreachesInWindow === 0,
        `${s.resilience.toleranceBreachesInWindow} breaches`,
        "drive to zero",
      ),
  },
  {
    id: "resilience-l5-clean-closure-100",
    level: 5,
    title: "Every closure clean",
    description: "Every closed incident in window met every closure criterion.",
    icon: "Crown",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(
        s.resilience.cleanClosuresInWindow,
        s.resilience.closuresInWindow,
        100,
        "closures",
      ),
  },
  {
    id: "resilience-l5-runbooks-published-7",
    level: 5,
    title: "Seven runbooks published",
    description: "Seven runbooks published — broad playbook coverage.",
    icon: "Library",
    sticky: true,
    deepLink: "/runbooks",
    evaluate: (s) => countAtLeast(s.resilience.runbooksPublished, 7, "published"),
  },
  {
    id: "resilience-l5-runbook-completion-rate-95",
    level: 5,
    title: "95% runbook completion",
    description: "95%+ of runbook step executions reached COMPLETE (skips are rare).",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/runbooks",
    evaluate: (s) => {
      const total =
        s.resilience.runbookStepsCompletedInWindow +
        s.resilience.runbookStepsSkippedInWindow;
      return pctAtLeast(s.resilience.runbookStepsCompletedInWindow, total, 95, "steps");
    },
  },
  {
    id: "resilience-l5-200-steps",
    level: 5,
    title: "Two hundred runbook steps",
    description: "Two hundred runbook step executions in COMPLETE in window.",
    icon: "Crown",
    sticky: false,
    deepLink: "/runbooks",
    evaluate: (s) =>
      countAtLeast(s.resilience.runbookStepsCompletedInWindow, 200, "steps complete"),
  },
  {
    id: "resilience-l5-zero-abandoned-runbooks",
    level: 5,
    title: "Zero abandoned runbooks",
    description: "Across all activations in window, zero ended ABANDONED.",
    icon: "Shield",
    sticky: false,
    deepLink: "/runbooks",
    evaluate: (s) =>
      flag(
        s.resilience.runbookExecutionsTotal > 0 &&
          s.resilience.runbookExecutionsAbandoned === 0,
        `${s.resilience.runbookExecutionsAbandoned} abandoned`,
        "drive to zero",
      ),
  },
  {
    id: "resilience-l5-recovery-100",
    level: 5,
    title: "Every exercise with recovery plan",
    description: "Every completed exercise in window has a recovery plan.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(s.resilience.recoveryPlansInWindow, s.exercises.completedInWindow, 100, "exercises"),
  },
];

export const RESILIENCE_RULES: ReadonlyArray<AchievementRule> = [
  ...L1,
  ...L2,
  ...L3,
  ...L4,
  ...L5,
].map(
  (r) => ({ ...r, topic: "resilience", scope: "org" }) as AchievementRule,
);
