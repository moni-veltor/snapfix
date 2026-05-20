/**
 * 50 People achievements arranged across the 5 maturity levels.
 *
 * Mix of scopes:
 *   - 30 org-wide rules tracking team-level habits (sitreps, decisions,
 *     IMT meetings, comms, deputies, pre-read acks, mobilisation).
 *   - 20 personal rules tracking individual contribution (sitreps filed,
 *     decisions logged, comms drafted, exercises facilitated, etc.). These
 *     unlock per-user and persist as scope = "user:{userId}" rows.
 *
 * Personal rules require a user context (page passes userId + personal
 * state). Without it the engine leaves them locked.
 */

import type {
  AchievementOrgState,
  AchievementPersonalState,
} from "./state";
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

function flag(
  predicate: boolean,
  detail: string,
  hint: string,
): AchievementEvalResult {
  return predicate
    ? { status: "unlocked", progress: 1, valueLabel: detail }
    : { status: "inProgress", progress: 0, valueLabel: detail, nextLabel: hint };
}

type OrgSeed = Omit<AchievementRule, "topic" | "evaluate" | "scope"> & {
  evaluate: (s: AchievementOrgState) => AchievementEvalResult;
};
type PersonalSeed = Omit<AchievementRule, "topic" | "evaluate" | "scope"> & {
  evaluate: (s: AchievementPersonalState) => AchievementEvalResult;
};

// ─── Org-scope rules (30) ────────────────────────────────────────────────

const ORG_L1: ReadonlyArray<OrgSeed> = [
  {
    id: "people-l1-first-role",
    level: 1,
    title: "First role on the seat map",
    description: "An OrganizationRole exists — start of the IMT roster.",
    icon: "Users",
    sticky: true,
    deepLink: "/org",
    evaluate: (s) => countAtLeast(s.people.rolesTotal, 1, "role"),
  },
  {
    id: "people-l1-5-roles",
    level: 1,
    title: "Five-role roster",
    description: "Five named roles — the core IMT shape is in.",
    icon: "Users",
    sticky: true,
    deepLink: "/org",
    evaluate: (s) => countAtLeast(s.people.rolesTotal, 5, "roles"),
  },
  {
    id: "people-l1-first-deputy",
    level: 1,
    title: "First deputy named",
    description: "A role has a named deputy — single-points-of-failure beginning to shrink.",
    icon: "Users",
    sticky: true,
    deepLink: "/org",
    evaluate: (s) => countAtLeast(s.people.rolesWithDeputy, 1, "with deputy"),
  },
  {
    id: "people-l1-first-smf",
    level: 1,
    title: "First SMF role flagged",
    description: "A Senior Manager Function role identified — accountability captured.",
    icon: "ShieldCheck",
    sticky: true,
    deepLink: "/org",
    evaluate: (s) => countAtLeast(s.people.rolesSmf, 1, "SMF roles"),
  },
  {
    id: "people-l1-first-sitrep",
    level: 1,
    title: "First sitrep filed",
    description: "A sitrep exists for an incident in window.",
    icon: "FileCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.sitrepsInWindow, 1, "sitreps"),
  },
  {
    id: "people-l1-first-decision",
    level: 1,
    title: "First decision logged",
    description: "A structured DecisionRecord is on file.",
    icon: "BadgeCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.decisionsInWindow, 1, "decisions"),
  },
  {
    id: "people-l1-first-meeting",
    level: 1,
    title: "First IMT meeting",
    description: "An IMT meeting is logged — standing-agenda discipline starting.",
    icon: "Briefcase",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.imtMeetingsInWindow, 1, "IMT meetings"),
  },
];

const ORG_L2: ReadonlyArray<OrgSeed> = [
  {
    id: "people-l2-25pct-deputies",
    level: 2,
    title: "Deputies on 25% of roles",
    description: "A quarter of IMT seats have a named deputy.",
    icon: "Users",
    sticky: true,
    deepLink: "/org",
    evaluate: (s) => pctAtLeast(s.people.rolesWithDeputy, s.people.rolesTotal, 25, "roles"),
  },
  {
    id: "people-l2-3-smf",
    level: 2,
    title: "Three SMF roles",
    description: "Three or more SMF roles flagged — accountability tracked.",
    icon: "ShieldCheck",
    sticky: true,
    deepLink: "/org",
    evaluate: (s) => countAtLeast(s.people.rolesSmf, 3, "SMF roles"),
  },
  {
    id: "people-l2-5-decisions-window",
    level: 2,
    title: "Five decisions in window",
    description: "Five DecisionRecords inside the 12-month window.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.decisionsInWindow, 5, "decisions in 12mo"),
  },
  {
    id: "people-l2-rationale-coverage",
    level: 2,
    title: "Rationale on every decision",
    description: "Every decision in window has a non-trivial rationale captured.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(
        s.people.decisionsWithRationaleInWindow,
        s.people.decisionsInWindow,
        100,
        "decisions",
      ),
  },
  {
    id: "people-l2-5-sitreps",
    level: 2,
    title: "Five sitreps in window",
    description: "Five sitreps in the last 12 months — the sitrep habit is forming.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.sitrepsInWindow, 5, "sitreps in 12mo"),
  },
  {
    id: "people-l2-3-meetings",
    level: 2,
    title: "Three IMT meetings",
    description: "Three IMT meetings logged in the last 12 months.",
    icon: "Briefcase",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.imtMeetingsInWindow, 3, "meetings"),
  },
  {
    id: "people-l2-3-stakeholders",
    level: 2,
    title: "Three distinct comms stakeholders",
    description: "Comms drafted to three distinct stakeholders in window.",
    icon: "Network",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.people.distinctStakeholdersInWindow, 3, "stakeholders"),
  },
];

const ORG_L3: ReadonlyArray<OrgSeed> = [
  {
    id: "people-l3-50pct-deputies",
    level: 3,
    title: "Deputies on 50% of roles",
    description: "Half of IMT seats have a deputy on file.",
    icon: "Users",
    sticky: false,
    deepLink: "/org",
    evaluate: (s) => pctAtLeast(s.people.rolesWithDeputy, s.people.rolesTotal, 50, "roles"),
  },
  {
    id: "people-l3-20-decisions",
    level: 3,
    title: "Twenty decisions in window",
    description: "Twenty DecisionRecords in the last 12 months — captured authority.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.decisionsInWindow, 20, "decisions"),
  },
  {
    id: "people-l3-10-sitreps",
    level: 3,
    title: "Ten sitreps in window",
    description: "Ten sitreps logged in the last 12 months.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.sitrepsInWindow, 10, "sitreps"),
  },
  {
    id: "people-l3-meetings-10",
    level: 3,
    title: "Ten IMT meetings",
    description: "Ten IMT meetings logged — the rhythm is real.",
    icon: "Briefcase",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.imtMeetingsInWindow, 10, "meetings"),
  },
  {
    id: "people-l3-3-chairs",
    level: 3,
    title: "Three distinct IMT chairs",
    description: "Three different people have chaired an IMT meeting in window.",
    icon: "Users",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.distinctImtChairsInWindow, 3, "distinct chairs"),
  },
  {
    id: "people-l3-mobilisation-80",
    level: 3,
    title: "80% mobilisation",
    description: "80%+ of non-observer participants mobilised across the window.",
    icon: "Activity",
    sticky: false,
    deepLink: "/analytics?audience=executive",
    evaluate: (s) =>
      pctAtLeast(
        s.people.mobilisedParticipantsInWindow,
        s.people.eligibleParticipantsInWindow,
        80,
        "participants",
      ),
  },
  {
    id: "people-l3-comms-5",
    level: 3,
    title: "Five comms drafted",
    description: "Five comms drafts in window — the cascade is being practised.",
    icon: "Briefcase",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.commsInWindow, 5, "comms drafts"),
  },
];

const ORG_L4: ReadonlyArray<OrgSeed> = [
  {
    id: "people-l4-deputies-75",
    level: 4,
    title: "Deputies on 75% of roles",
    description: "75% of IMT seats have a deputy — bench is deep.",
    icon: "Users",
    sticky: false,
    deepLink: "/org",
    evaluate: (s) => pctAtLeast(s.people.rolesWithDeputy, s.people.rolesTotal, 75, "roles"),
  },
  {
    id: "people-l4-pre-read-50",
    level: 4,
    title: "Pre-read ack rate ≥ 50%",
    description: "Half of participants in exercises with ≥3 seats acked the pre-read.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      flag(
        s.people.preReadAckRateInWindow >= 50,
        `${s.people.preReadAckRateInWindow}% pre-read ack`,
        "target ≥ 50%",
      ),
  },
  {
    id: "people-l4-meetings-25",
    level: 4,
    title: "Twenty-five IMT meetings",
    description: "Twenty-five IMT meetings logged in the last 12 months.",
    icon: "Briefcase",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.imtMeetingsInWindow, 25, "meetings"),
  },
  {
    id: "people-l4-decisions-approved-80",
    level: 4,
    title: "Decisions approved ≥ 80%",
    description: "80%+ of decisions in window have an approver recorded.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      pctAtLeast(
        s.people.decisionsApprovedInWindow,
        s.people.decisionsInWindow,
        80,
        "decisions",
      ),
  },
  {
    id: "people-l4-low-comms-reject",
    level: 4,
    title: "Cascade rejection ≤ 10%",
    description: "Fewer than 10% of comms drafts hit REJECTED — cascade discipline.",
    icon: "Network",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => {
      if (s.people.commsInWindow === 0) {
        return {
          status: "inProgress",
          progress: 0,
          valueLabel: "no comms yet",
          nextLabel: "draft comms first",
        };
      }
      const pct = (s.people.commsRejectedInWindow / s.people.commsInWindow) * 100;
      return flag(
        pct <= 10,
        `${Math.round(pct)}% rejected`,
        "drop below 10%",
      );
    },
  },
  {
    id: "people-l4-active-participants-10",
    level: 4,
    title: "Ten distinct participants",
    description: "Ten different people have participated in an exercise in window.",
    icon: "Users",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.people.activeParticipantsInWindow, 10, "distinct participants"),
  },
  {
    id: "people-l4-stakeholders-5",
    level: 4,
    title: "Five distinct stakeholders",
    description: "Comms in window covered five distinct stakeholder groups.",
    icon: "Network",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.people.distinctStakeholdersInWindow, 5, "stakeholders"),
  },
];

const ORG_L5: ReadonlyArray<OrgSeed> = [
  {
    id: "people-l5-deputies-100",
    level: 5,
    title: "Every role has a deputy",
    description: "Every named role has a deputy on file — no single-points-of-failure.",
    icon: "Crown",
    sticky: false,
    deepLink: "/org",
    evaluate: (s) => pctAtLeast(s.people.rolesWithDeputy, s.people.rolesTotal, 100, "roles"),
  },
  {
    id: "people-l5-pre-read-80",
    level: 5,
    title: "Pre-read ack rate ≥ 80%",
    description: "80% pre-read ack rate — the team takes prep seriously.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      flag(
        s.people.preReadAckRateInWindow >= 80,
        `${s.people.preReadAckRateInWindow}% pre-read ack`,
        "target ≥ 80%",
      ),
  },
  {
    id: "people-l5-zero-cascade-reject",
    level: 5,
    title: "Zero cascade rejections",
    description: "No comms drafts hit REJECTED in window — cascade is muscle memory.",
    icon: "Network",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      flag(
        s.people.commsInWindow > 0 && s.people.commsRejectedInWindow === 0,
        s.people.commsInWindow === 0
          ? "no comms in window"
          : `${s.people.commsRejectedInWindow} rejected of ${s.people.commsInWindow}`,
        "keep rejections at zero",
      ),
  },
  {
    id: "people-l5-meetings-60",
    level: 5,
    title: "Sixty IMT meetings",
    description: "Sixty IMT meetings logged in window — heavy operational tempo.",
    icon: "Briefcase",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.imtMeetingsInWindow, 60, "meetings"),
  },
  {
    id: "people-l5-mobilisation-100",
    level: 5,
    title: "100% mobilisation",
    description: "Every non-observer participant mobilised in window.",
    icon: "Activity",
    sticky: false,
    deepLink: "/analytics?audience=executive",
    evaluate: (s) =>
      pctAtLeast(
        s.people.mobilisedParticipantsInWindow,
        s.people.eligibleParticipantsInWindow,
        100,
        "participants",
      ),
  },
  {
    id: "people-l5-active-participants-25",
    level: 5,
    title: "Twenty-five distinct participants",
    description: "Twenty-five different people have participated in window — broad bench.",
    icon: "Users",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.people.activeParticipantsInWindow, 25, "distinct participants"),
  },
  {
    id: "people-l5-7-chairs",
    level: 5,
    title: "Seven IMT chairs",
    description: "Seven different people have chaired an IMT meeting in window.",
    icon: "Users",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.people.distinctImtChairsInWindow, 7, "distinct chairs"),
  },
];

// ─── Personal-scope rules (20) ───────────────────────────────────────────

const PERSONAL_L1: ReadonlyArray<PersonalSeed> = [
  {
    id: "people-personal-l1-first-exercise",
    level: 1,
    title: "First exercise participated",
    description: "You've participated in an exercise — welcome to the IMT.",
    icon: "Flame",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercisesParticipatedLifetime, 1, "participated"),
  },
  {
    id: "people-personal-l1-first-sitrep",
    level: 1,
    title: "First sitrep filed by you",
    description: "Your first sitrep is on the record.",
    icon: "FileCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.sitrepsFiledInWindow, 1, "sitreps filed"),
  },
  {
    id: "people-personal-l1-first-decision",
    level: 1,
    title: "First decision logged by you",
    description: "You captured your first structured decision.",
    icon: "BadgeCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.decisionsLoggedInWindow, 1, "decisions"),
  },
  {
    id: "people-personal-l1-first-comms",
    level: 1,
    title: "First comms drafted",
    description: "You drafted a communication during an exercise.",
    icon: "Briefcase",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.commsDraftedInWindow, 1, "comms drafted"),
  },
];

const PERSONAL_L2: ReadonlyArray<PersonalSeed> = [
  {
    id: "people-personal-l2-3-sitreps",
    level: 2,
    title: "Three sitreps filed",
    description: "Three sitreps under your name in the last 12 months.",
    icon: "FileCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.sitrepsFiledInWindow, 3, "sitreps"),
  },
  {
    id: "people-personal-l2-3-decisions",
    level: 2,
    title: "Three decisions logged",
    description: "Three decisions captured under your name in window.",
    icon: "BadgeCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.decisionsLoggedInWindow, 3, "decisions"),
  },
  {
    id: "people-personal-l2-first-meeting",
    level: 2,
    title: "First IMT meeting chaired",
    description: "You chaired an IMT meeting.",
    icon: "Briefcase",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.imtMeetingsChairedInWindow, 1, "meetings chaired"),
  },
  {
    id: "people-personal-l2-first-facilitator",
    level: 2,
    title: "First exercise facilitated",
    description: "You facilitated (or co-facilitated) an exercise.",
    icon: "Users",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercisesFacilitatedInWindow, 1, "facilitated"),
  },
  {
    id: "people-personal-l2-pre-read-3",
    level: 2,
    title: "Three pre-reads acked",
    description: "You acked the pre-read for three exercises.",
    icon: "FileCheck",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.preReadAcksInWindow, 3, "pre-reads"),
  },
];

const PERSONAL_L3: ReadonlyArray<PersonalSeed> = [
  {
    id: "people-personal-l3-5-exercises",
    level: 3,
    title: "Five exercises participated",
    description: "Five exercise participations in window.",
    icon: "Flame",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercisesParticipatedInWindow, 5, "in 12mo"),
  },
  {
    id: "people-personal-l3-10-sitreps",
    level: 3,
    title: "Ten sitreps filed",
    description: "Ten sitreps captured under your name in the last 12 months.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.sitrepsFiledInWindow, 10, "sitreps"),
  },
  {
    id: "people-personal-l3-10-decisions",
    level: 3,
    title: "Ten decisions logged",
    description: "Ten decisions logged in window.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.decisionsLoggedInWindow, 10, "decisions"),
  },
  {
    id: "people-personal-l3-3-meetings",
    level: 3,
    title: "Three IMT meetings chaired",
    description: "Three IMT meetings chaired in window — comfortable in the chair.",
    icon: "Briefcase",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.imtMeetingsChairedInWindow, 3, "chaired"),
  },
];

const PERSONAL_L4: ReadonlyArray<PersonalSeed> = [
  {
    id: "people-personal-l4-distinct-roles-2",
    level: 4,
    title: "Two distinct roles played",
    description: "You've played two distinct roles across exercises — cross-functional.",
    icon: "Users",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.distinctRolesPlayed, 2, "distinct roles"),
  },
  {
    id: "people-personal-l4-decisions-approved-3",
    level: 4,
    title: "Three decisions approved",
    description: "Three of your decisions have been approved by an approver.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.decisionsApprovedInWindow, 3, "decisions approved"),
  },
  {
    id: "people-personal-l4-comms-approved-3",
    level: 4,
    title: "Three comms approved by you",
    description: "Three comms drafts have been approved by you as the approver.",
    icon: "Briefcase",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) =>
      countAtLeast(s.commsApprovedAsApproverInWindow, 3, "comms approved"),
  },
  {
    id: "people-personal-l4-pre-read-10",
    level: 4,
    title: "Ten pre-reads acked",
    description: "Ten pre-reads acked in window — diligent prep.",
    icon: "FileCheck",
    sticky: false,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.preReadAcksInWindow, 10, "pre-reads"),
  },
];

const PERSONAL_L5: ReadonlyArray<PersonalSeed> = [
  {
    id: "people-personal-l5-20-exercises",
    level: 5,
    title: "Twenty exercises lifetime",
    description: "Twenty exercise participations — a veteran.",
    icon: "Crown",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.exercisesParticipatedLifetime, 20, "lifetime"),
  },
  {
    id: "people-personal-l5-distinct-roles-3",
    level: 5,
    title: "Three distinct roles played",
    description: "You've played three distinct IMT roles — deeply cross-functional.",
    icon: "Users",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => countAtLeast(s.distinctRolesPlayed, 3, "distinct roles"),
  },
];

function asOrgPeopleRule(r: OrgSeed): AchievementRule {
  return { ...r, topic: "people", scope: "org" } as AchievementRule;
}
function asPersonalPeopleRule(r: PersonalSeed): AchievementRule {
  return { ...r, topic: "people", scope: "user" } as AchievementRule;
}

export const PEOPLE_RULES: ReadonlyArray<AchievementRule> = [
  ...ORG_L1.map(asOrgPeopleRule),
  ...ORG_L2.map(asOrgPeopleRule),
  ...ORG_L3.map(asOrgPeopleRule),
  ...ORG_L4.map(asOrgPeopleRule),
  ...ORG_L5.map(asOrgPeopleRule),
  ...PERSONAL_L1.map(asPersonalPeopleRule),
  ...PERSONAL_L2.map(asPersonalPeopleRule),
  ...PERSONAL_L3.map(asPersonalPeopleRule),
  ...PERSONAL_L4.map(asPersonalPeopleRule),
  ...PERSONAL_L5.map(asPersonalPeopleRule),
];
