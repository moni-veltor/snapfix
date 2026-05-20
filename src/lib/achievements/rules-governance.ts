/**
 * 50 Governance achievements across the 5 maturity levels:
 *   L1 Awareness  — first vendor governance fields, first audit entry, first
 *                   regulator notification, first PIR (10)
 *   L2 Documented — exit plans logged, SMF sign-offs, second-line reviewers,
 *                   action items being closed (10)
 *   L3 Tested     — regulator clocks resolved cleanly, retros held, PIRs
 *                   submitted on time, audit log breathes (10)
 *   L4 Measured   — exit plans current, MTP register-ready %, breach rate
 *                   tracked, governance committees signing off (10)
 *   L5 Optimised  — zero regulator breaches, every MTP smfSignedOff +
 *                   governance approved, every PIR on time (10)
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
    id: "governance-l1-first-audit-entry",
    level: 1,
    title: "Audit log breathing",
    description: "At least one audit log entry exists — the system has a pulse.",
    icon: "FileCheck",
    sticky: true,
    deepLink: "/audit",
    evaluate: (s) => countAtLeast(s.governance.auditEntriesLifetime, 1, "entries"),
  },
  {
    id: "governance-l1-first-exit-plan-note",
    level: 1,
    title: "First exit-plan note",
    description: "A vendor has its exit-plan note captured.",
    icon: "BookOpen",
    sticky: true,
    deepLink: "/vendors",
    evaluate: (s) => countAtLeast(s.vendors.withAnyExitPlan, 1, "exit plans"),
  },
  {
    id: "governance-l1-first-regulator-clock",
    level: 1,
    title: "First regulator clock",
    description: "A RegulatorNotification has been created against an incident.",
    icon: "Shield",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.governance.regulatorNotificationsInWindow, 1, "regulator clocks"),
  },
  {
    id: "governance-l1-first-pir",
    level: 1,
    title: "First PIR opened",
    description: "A PostIncidentReport row exists — the closure habit is starting.",
    icon: "FileCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.governance.pirsDueInWindow, 1, "PIRs"),
  },
  {
    id: "governance-l1-first-retro",
    level: 1,
    title: "First retrospective held",
    description: "A Retrospective with heldAt set — lessons captured immediately.",
    icon: "Briefcase",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.governance.retrospectivesHeldInWindow, 1, "retrospectives"),
  },
  {
    id: "governance-l1-first-smf-mtp",
    level: 1,
    title: "First SMF sign-off on MTP",
    description: "A Material Third Party has its SMF accountable sign-off captured.",
    icon: "ShieldCheck",
    sticky: true,
    deepLink: "/vendors",
    evaluate: (s) => countAtLeast(s.governance.mtpSmfSignedOff, 1, "MTP signed off"),
  },
  {
    id: "governance-l1-first-governance-date",
    level: 1,
    title: "First governance approval date",
    description: "An MTP vendor carries its governance approval date.",
    icon: "CalendarCheck",
    sticky: true,
    deepLink: "/vendors",
    evaluate: (s) =>
      countAtLeast(s.governance.mtpGovernanceApproved, 1, "MTP governance approved"),
  },
  {
    id: "governance-l1-second-line",
    level: 1,
    title: "Second-line reviewer named",
    description: "An IBS has its 2LoD reviewer captured — accountability shape forming.",
    icon: "Users",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) => countAtLeast(s.governance.ibsSecondLineReviewer, 1, "IBSs"),
  },
  {
    id: "governance-l1-first-action-item",
    level: 1,
    title: "First action item created",
    description: "An exercise action item is on the tracker.",
    icon: "BadgeCheck",
    sticky: true,
    deepLink: "/action-items",
    evaluate: (s) => countAtLeast(s.governance.actionItemsTotalInWindow, 1, "action items"),
  },
  {
    id: "governance-l1-first-action-closed",
    level: 1,
    title: "First action item closed",
    description: "An action item has been moved to DONE or WONT_FIX.",
    icon: "BadgeCheck",
    sticky: true,
    deepLink: "/action-items",
    evaluate: (s) => countAtLeast(s.governance.actionItemsClosedInWindow, 1, "closed"),
  },
];

const L2: ReadonlyArray<Seed> = [
  {
    id: "governance-l2-3-exit-plans",
    level: 2,
    title: "Three exit-plan notes",
    description: "Three vendors have substantive exit-plan notes captured.",
    icon: "BookOpen",
    sticky: true,
    deepLink: "/vendors",
    evaluate: (s) => countAtLeast(s.vendors.withAnyExitPlan, 3, "exit plans"),
  },
  {
    id: "governance-l2-5-pirs",
    level: 2,
    title: "Five PIRs opened",
    description: "Five PostIncidentReport rows in window — closure cadence taking shape.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.governance.pirsDueInWindow, 5, "PIRs"),
  },
  {
    id: "governance-l2-3-retros",
    level: 2,
    title: "Three retrospectives held",
    description: "Three retrospectives held — the team reflects.",
    icon: "Briefcase",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.governance.retrospectivesHeldInWindow, 3, "retros held"),
  },
  {
    id: "governance-l2-3-smf-mtp",
    level: 2,
    title: "Three MTPs with SMF sign-off",
    description: "Three Material Third Parties have SMF sign-off recorded.",
    icon: "ShieldCheck",
    sticky: true,
    deepLink: "/vendors",
    evaluate: (s) => countAtLeast(s.governance.mtpSmfSignedOff, 3, "MTPs"),
  },
  {
    id: "governance-l2-3-governance-dates",
    level: 2,
    title: "Three MTPs with governance date",
    description: "Three MTPs carry governance approval dates.",
    icon: "CalendarCheck",
    sticky: true,
    deepLink: "/vendors",
    evaluate: (s) => countAtLeast(s.governance.mtpGovernanceApproved, 3, "MTPs"),
  },
  {
    id: "governance-l2-5-second-line",
    level: 2,
    title: "Five IBSs with 2LoD reviewer",
    description: "Five IBSs have a named second-line reviewer.",
    icon: "Users",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) => countAtLeast(s.governance.ibsSecondLineReviewer, 5, "IBSs"),
  },
  {
    id: "governance-l2-action-closure-50",
    level: 2,
    title: "50% of action items closed",
    description: "Half of exercise action items in window are closed.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/action-items",
    evaluate: (s) =>
      pctAtLeast(
        s.governance.actionItemsClosedInWindow,
        s.governance.actionItemsTotalInWindow,
        50,
        "action items",
      ),
  },
  {
    id: "governance-l2-vendor-contract-3",
    level: 2,
    title: "Three vendors with contract dates",
    description: "Three vendors have both contract start + end dates on file.",
    icon: "FileCheck",
    sticky: true,
    deepLink: "/vendors",
    evaluate: (s) => countAtLeast(s.vendors.withContractDates, 3, "vendors"),
  },
  {
    id: "governance-l2-audit-50",
    level: 2,
    title: "Audit log substantive",
    description: "Fifty audit entries in window — the system records change.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/audit",
    evaluate: (s) => countAtLeast(s.governance.auditEntriesInWindow, 50, "entries in 12mo"),
  },
  {
    id: "governance-l2-3-fresh-exit-plans",
    level: 2,
    title: "Three fresh exit plans",
    description: "Three vendors have an exit plan reviewed in the last 12 months.",
    icon: "BookOpen",
    sticky: false,
    deepLink: "/vendors",
    evaluate: (s) => countAtLeast(s.vendors.withFreshExitPlan, 3, "fresh exit plans"),
  },
];

const L3: ReadonlyArray<Seed> = [
  {
    id: "governance-l3-10-regulator-clocks",
    level: 3,
    title: "Ten regulator clocks practised",
    description: "Ten regulator notifications fired in window — the muscle is built.",
    icon: "Shield",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.governance.regulatorNotificationsInWindow, 10, "regulator clocks"),
  },
  {
    id: "governance-l3-clean-clock-rate-80",
    level: 3,
    title: "80% clean regulator clocks",
    description: "80%+ of fired regulator notifications resolved SENT or WAIVED.",
    icon: "Shield",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(
        s.governance.regulatorNotificationsResolvedInWindow,
        s.governance.regulatorNotificationsInWindow,
        80,
        "clocks",
      ),
  },
  {
    id: "governance-l3-pirs-submitted-50",
    level: 3,
    title: "50% PIR submission",
    description: "Half of PIRs due in window have been submitted.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(s.governance.pirsSubmittedInWindow, s.governance.pirsDueInWindow, 50, "PIRs"),
  },
  {
    id: "governance-l3-retros-rate-50",
    level: 3,
    title: "50% retros held",
    description: "Half of completed exercises in window have a retrospective held.",
    icon: "Briefcase",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(
        s.governance.retrospectivesHeldInWindow,
        s.exercises.completedInWindow,
        50,
        "retros",
      ),
  },
  {
    id: "governance-l3-audit-200",
    level: 3,
    title: "Audit log active",
    description: "Two hundred audit entries in window — the programme has rhythm.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/audit",
    evaluate: (s) =>
      countAtLeast(s.governance.auditEntriesInWindow, 200, "entries in 12mo"),
  },
  {
    id: "governance-l3-10-fresh-exit-plans",
    level: 3,
    title: "Ten fresh exit plans",
    description: "Ten vendors have exit plans reviewed in the last 12 months.",
    icon: "BookOpen",
    sticky: false,
    deepLink: "/vendors",
    evaluate: (s) => countAtLeast(s.vendors.withFreshExitPlan, 10, "fresh exit plans"),
  },
  {
    id: "governance-l3-mtp-register-ready-50",
    level: 3,
    title: "50% MTPs register-ready",
    description: "Half of MTP vendors pass the full register-readiness check.",
    icon: "ShieldCheck",
    sticky: false,
    deepLink: "/analytics?audience=vendors",
    evaluate: (s) => pctAtLeast(s.vendors.mtpRegisterReady, s.vendors.mtpTotal, 50, "MTPs"),
  },
  {
    id: "governance-l3-decision-types-5",
    level: 3,
    title: "Five distinct decision types",
    description: "Five distinct DecisionType values logged in window — broad vocabulary.",
    icon: "BadgeCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.governance.distinctDecisionTypesInWindow, 5, "decision types"),
  },
  {
    id: "governance-l3-action-closure-75",
    level: 3,
    title: "75% action items closed",
    description: "Three quarters of exercise action items in window are closed.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/action-items",
    evaluate: (s) =>
      pctAtLeast(
        s.governance.actionItemsClosedInWindow,
        s.governance.actionItemsTotalInWindow,
        75,
        "action items",
      ),
  },
  {
    id: "governance-l3-no-recent-breaches-30",
    level: 3,
    title: "Breach-free in 30 days",
    description: "Light proxy: under 1 regulator breach in window keeps the badge alive.",
    icon: "Shield",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      flag(
        s.governance.regulatorNotificationsBreachedInWindow <= 1,
        `${s.governance.regulatorNotificationsBreachedInWindow} breached`,
        "drive to zero",
      ),
  },
];

const L4: ReadonlyArray<Seed> = [
  {
    id: "governance-l4-clean-clock-rate-95",
    level: 4,
    title: "95% clean regulator clocks",
    description: "95%+ of fired clocks resolved SENT or WAIVED — the regulator's clock is in hand.",
    icon: "Shield",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(
        s.governance.regulatorNotificationsResolvedInWindow,
        s.governance.regulatorNotificationsInWindow,
        95,
        "clocks",
      ),
  },
  {
    id: "governance-l4-pirs-on-time-80",
    level: 4,
    title: "80% PIRs on time",
    description: "Eighty percent of PIRs were submitted before their due date.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(s.governance.pirsOnTimeInWindow, s.governance.pirsDueInWindow, 80, "PIRs"),
  },
  {
    id: "governance-l4-retros-rate-80",
    level: 4,
    title: "80% retros held",
    description: "80%+ of completed exercises had their retrospective held.",
    icon: "Briefcase",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(
        s.governance.retrospectivesHeldInWindow,
        s.exercises.completedInWindow,
        80,
        "retros",
      ),
  },
  {
    id: "governance-l4-mtp-smf-100",
    level: 4,
    title: "Every MTP with SMF sign-off",
    description: "Every Material Third Party carries an SMF sign-off.",
    icon: "ShieldCheck",
    sticky: false,
    deepLink: "/vendors",
    evaluate: (s) =>
      pctAtLeast(s.governance.mtpSmfSignedOff, s.vendors.mtpTotal, 100, "MTPs"),
  },
  {
    id: "governance-l4-mtp-governance-100",
    level: 4,
    title: "Every MTP with governance date",
    description: "Every MTP carries a governance approval date.",
    icon: "CalendarCheck",
    sticky: false,
    deepLink: "/vendors",
    evaluate: (s) =>
      pctAtLeast(s.governance.mtpGovernanceApproved, s.vendors.mtpTotal, 100, "MTPs"),
  },
  {
    id: "governance-l4-fresh-exit-plans-75",
    level: 4,
    title: "75% fresh exit plans",
    description: "75% of vendors have an exit plan reviewed in the last 12 months.",
    icon: "BookOpen",
    sticky: false,
    deepLink: "/vendors",
    evaluate: (s) => pctAtLeast(s.vendors.withFreshExitPlan, s.vendors.total, 75, "vendors"),
  },
  {
    id: "governance-l4-second-line-50",
    level: 4,
    title: "50% IBSs with 2LoD reviewer",
    description: "Half the IBS register carries a second-line reviewer.",
    icon: "Users",
    sticky: false,
    deepLink: "/ibs",
    evaluate: (s) => pctAtLeast(s.governance.ibsSecondLineReviewer, s.ibs.total, 50, "IBSs"),
  },
  {
    id: "governance-l4-decision-types-8",
    level: 4,
    title: "Eight distinct decision types",
    description: "Eight distinct DecisionType values logged in window — wide repertoire.",
    icon: "BadgeCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.governance.distinctDecisionTypesInWindow, 8, "decision types"),
  },
  {
    id: "governance-l4-decisions-approved-80",
    level: 4,
    title: "80% decisions approved",
    description: "80%+ of decisions in window have a recorded approver.",
    icon: "ShieldCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(s.people.decisionsApprovedInWindow, s.people.decisionsInWindow, 80, "decisions"),
  },
  {
    id: "governance-l4-action-closure-90",
    level: 4,
    title: "90% action items closed",
    description: "Nine in ten exercise action items in window are closed.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/action-items",
    evaluate: (s) =>
      pctAtLeast(
        s.governance.actionItemsClosedInWindow,
        s.governance.actionItemsTotalInWindow,
        90,
        "action items",
      ),
  },
];

const L5: ReadonlyArray<Seed> = [
  {
    id: "governance-l5-zero-breaches",
    level: 5,
    title: "Zero regulator breaches",
    description: "No regulator clocks ran past their dueAt in window.",
    icon: "Crown",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      flag(
        s.governance.regulatorNotificationsBreachedInWindow === 0,
        `${s.governance.regulatorNotificationsBreachedInWindow} breached`,
        "drive to zero",
      ),
  },
  {
    id: "governance-l5-pirs-on-time-100",
    level: 5,
    title: "100% PIRs on time",
    description: "Every PIR submitted before its due date in window.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(s.governance.pirsOnTimeInWindow, s.governance.pirsDueInWindow, 100, "PIRs"),
  },
  {
    id: "governance-l5-retros-100",
    level: 5,
    title: "Every retro held",
    description: "Every completed exercise had its retrospective held.",
    icon: "Briefcase",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(
        s.governance.retrospectivesHeldInWindow,
        s.exercises.completedInWindow,
        100,
        "retros",
      ),
  },
  {
    id: "governance-l5-fresh-exit-plans-100",
    level: 5,
    title: "Every vendor with fresh exit plan",
    description: "Every vendor has a fresh exit plan reviewed in window.",
    icon: "BookOpen",
    sticky: false,
    deepLink: "/vendors",
    evaluate: (s) => pctAtLeast(s.vendors.withFreshExitPlan, s.vendors.total, 100, "vendors"),
  },
  {
    id: "governance-l5-second-line-100",
    level: 5,
    title: "Every IBS with 2LoD reviewer",
    description: "Every IBS in the register carries a named 2LoD reviewer.",
    icon: "Users",
    sticky: false,
    deepLink: "/ibs",
    evaluate: (s) =>
      pctAtLeast(s.governance.ibsSecondLineReviewer, s.ibs.total, 100, "IBSs"),
  },
  {
    id: "governance-l5-decision-types-12",
    level: 5,
    title: "Twelve distinct decision types",
    description: "Twelve distinct DecisionType values logged — full vocabulary in play.",
    icon: "Trophy",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.governance.distinctDecisionTypesInWindow, 12, "decision types"),
  },
  {
    id: "governance-l5-mtp-register-ready-100",
    level: 5,
    title: "Every MTP register-ready",
    description: "Every MTP passes the full FCA/PRA readiness check.",
    icon: "ShieldCheck",
    sticky: false,
    deepLink: "/analytics?audience=vendors",
    evaluate: (s) =>
      pctAtLeast(s.vendors.mtpRegisterReady, s.vendors.mtpTotal, 100, "MTPs"),
  },
  {
    id: "governance-l5-audit-1000",
    level: 5,
    title: "Audit log at scale",
    description: "A thousand audit entries in window — every change is recorded.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/audit",
    evaluate: (s) =>
      countAtLeast(s.governance.auditEntriesInWindow, 1000, "entries in 12mo"),
  },
  {
    id: "governance-l5-action-closure-100",
    level: 5,
    title: "Every action item closed",
    description: "Every exercise action item in window is closed.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/action-items",
    evaluate: (s) =>
      pctAtLeast(
        s.governance.actionItemsClosedInWindow,
        s.governance.actionItemsTotalInWindow,
        100,
        "action items",
      ),
  },
  {
    id: "governance-l5-decisions-approved-100",
    level: 5,
    title: "Every decision approved",
    description: "Every decision in window carries an approver.",
    icon: "Crown",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(
        s.people.decisionsApprovedInWindow,
        s.people.decisionsInWindow,
        100,
        "decisions",
      ),
  },
];

export const GOVERNANCE_RULES: ReadonlyArray<AchievementRule> = [
  ...L1,
  ...L2,
  ...L3,
  ...L4,
  ...L5,
].map(
  (r) => ({ ...r, topic: "governance", scope: "org" }) as AchievementRule,
);
