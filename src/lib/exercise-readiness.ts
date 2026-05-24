import "server-only";
import { prisma } from "@/lib/prisma";
import { loadAggregatedInjects, findCoverageGaps } from "@/lib/exercise-injects";

export type ReadinessStage = "BASICS" | "SCENARIOS" | "TEAM" | "INJECTS" | "PREFLIGHT";

export type ReadinessCheck = {
  id: string;
  label: string;
  /** Plain-English explanation of what passes the check. */
  why: string;
  ok: boolean;
  /** When true, this check must pass even outside regulator mode. */
  required: boolean;
  /** Wizard stage this check belongs to. */
  stage: ReadinessStage;
  /** Optional remediation link (relative path). */
  fixHref?: string;
};

export type ReadinessReport = {
  checks: ReadinessCheck[];
  /** True if every `required` check passes. */
  canGoReady: boolean;
  /** True when running in regulator mode — every check is treated as required. */
  strict: boolean;
};

/**
 * Single source of truth for "is this exercise ready to go live?".
 * In normal mode: required-only checks gate the transition.
 * In regulator mode: every check is treated as required.
 */
export async function evaluateReadiness(exerciseId: string): Promise<ReadinessReport | null> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: {
      id: true,
      title: true,
      status: true,
      plannedDate: true,
      durationMin: true,
      objectives: true,
      facilitatorId: true,
      coFacilitatorId: true,
      regulatorMode: true,
      regulatorAudience: true,
      briefingSentAt: true,
      briefingSkippedReason: true,
      ibsLinks: { select: { ibsId: true } },
      // The primary scenario + any chained scenarios. Each scenario's ibsList
      // must have every row linked to an approved OrganizationIBS — otherwise
      // the exercise would test design-time placeholders rather than the
      // firm's real services.
      scenario: {
        select: {
          id: true,
          title: true,
          ibsList: {
            select: { id: true, code: true, organizationIBSId: true },
          },
        },
      },
      chainedScenarios: {
        select: {
          scenario: {
            select: {
              id: true,
              title: true,
              _count: { select: { ibsList: true } },
              ibsList: {
                select: { id: true, code: true, organizationIBSId: true },
              },
            },
          },
        },
      },
      participants: {
        select: {
          id: true,
          roleTitle: true,
          exerciseRole: true,
          preReadAckedAt: true,
        },
      },
      approvals: { select: { status: true } },
    },
  });
  if (!exercise) return null;

  const strict = exercise.regulatorMode;

  const facilitators = exercise.participants.filter((p) => p.exerciseRole === "FACILITATOR");
  const participantCount = exercise.participants.length;
  const ackedCount = exercise.participants.filter((p) => p.preReadAckedAt !== null).length;

  // Coverage gaps from Step 4
  const injects = await loadAggregatedInjects(exerciseId);
  const rosterRoleTitles = new Set(exercise.participants.map((p) => p.roleTitle));
  const coverageGaps = findCoverageGaps(injects, rosterRoleTitles);

  const approvedCount = exercise.approvals.filter((a) => a.status === "APPROVED").length;
  const pendingCount = exercise.approvals.filter((a) => a.status === "PENDING").length;
  const rejectedCount = exercise.approvals.filter((a) => a.status === "REJECTED").length;

  const briefingDealtWith = !!exercise.briefingSentAt || !!exercise.briefingSkippedReason;

  // Every scenario IBS attached to this exercise (primary + chain) must point
  // at an approved OrganizationIBS. Unlinked rows are template placeholders
  // and the exercise can't be Ready while they exist.
  const allScenarioIBSes = [
    ...(exercise.scenario?.ibsList ?? []),
    ...exercise.chainedScenarios.flatMap((c) => c.scenario.ibsList),
  ];
  const unlinkedScenarioIBSes = allScenarioIBSes.filter(
    (i) => !i.organizationIBSId,
  );

  const checks: ReadinessCheck[] = [
    {
      id: "planned-date",
      label: "Planned date set",
      why: "Calendar invites, regulator clocks, and the briefing email all need a real D-Day timestamp.",
      ok: !!exercise.plannedDate,
      required: true,
      stage: "BASICS",
      fixHref: `/exercises/new?step=1&id=${exerciseId}`,
    },
    {
      id: "duration",
      label: "Duration set",
      why: "Cost estimate, briefing email, and the .ics calendar block all need a planned duration.",
      ok: !!exercise.durationMin,
      required: true,
      stage: "BASICS",
      fixHref: `/exercises/new?step=1&id=${exerciseId}`,
    },
    {
      id: "regulator-audience",
      label: "Regulator audience named (regulator mode only)",
      why: "We need to know which regulator's format to shape the evidence pack into (PRA / FCA / DORA / BoE).",
      ok: !strict || !!exercise.regulatorAudience,
      required: strict,
      stage: "BASICS",
      fixHref: `/exercises/new?step=1&id=${exerciseId}`,
    },
    {
      id: "ibs",
      label: "At least one IBS linked",
      why: "The exercise has to stress-test at least one Important Business Service to be useful for evidence. Counted from org-register links or aggregated from the scenarios in the chain.",
      ok:
        exercise.ibsLinks.length > 0 ||
        (exercise.scenario?.ibsList.length ?? 0) > 0 ||
        exercise.chainedScenarios.some((c) => c.scenario._count.ibsList > 0),
      required: true,
      stage: "SCENARIOS",
      fixHref: `/exercises/new?step=2&id=${exerciseId}`,
    },
    {
      id: "scenario-ibs-linked",
      label: "Every scenario IBS is linked to your approved register",
      why:
        unlinkedScenarioIBSes.length === 0
          ? "All scenario IBSs trace back to an approved register entry — exercises will stress-test the firm's real services rather than design-time placeholders."
          : `${unlinkedScenarioIBSes.length} scenario IBS${unlinkedScenarioIBSes.length === 1 ? "" : "s"} still reference template placeholders (e.g. ${unlinkedScenarioIBSes.slice(0, 2).map((i) => i.code).join(", ")}${unlinkedScenarioIBSes.length > 2 ? "…" : ""}). Open the scenario's IBS tab and bind each one to an approved entry.`,
      ok: unlinkedScenarioIBSes.length === 0,
      required: true,
      stage: "SCENARIOS",
      fixHref: exercise.scenario
        ? `/scenarios/${exercise.scenario.id}?tab=ibs`
        : undefined,
    },
    {
      id: "objective",
      label: "At least one objective declared",
      why: "Objectives are what the debrief scores against. No objective means nothing concrete to learn from.",
      ok: exercise.objectives.length > 0,
      required: true,
      stage: "SCENARIOS",
      fixHref: `/exercises/new?step=2&id=${exerciseId}`,
    },
    {
      id: "facilitator",
      label: "At least one facilitator",
      why: "Someone has to run the room.",
      ok: facilitators.length >= 1,
      required: true,
      stage: "TEAM",
    },
    {
      id: "co-facilitator",
      label: "Backup facilitator named",
      why: "Single-facilitator design is anti-resilience. A co-facilitator can take over if the primary becomes unavailable.",
      ok: !!exercise.coFacilitatorId,
      required: false,
      stage: "TEAM",
      fixHref: `/exercises/new?step=3&id=${exerciseId}`,
    },
    {
      id: "roster",
      label: "At least 2 participants on the roster",
      why: "A war-room with one person isn't a war-room.",
      ok: participantCount >= 2,
      required: true,
      stage: "TEAM",
      fixHref: `/exercises/new?step=3&id=${exerciseId}`,
    },
    {
      id: "coverage",
      label: "All injects address an on-roster role (no coverage gaps)",
      why: "An inject addressed to nobody is a silent failure — the team won't see it and the exercise won't test what you intended.",
      ok: coverageGaps.length === 0,
      required: true,
      stage: "INJECTS",
      fixHref: `/exercises/new?step=4&id=${exerciseId}`,
    },
    {
      id: "preread",
      label: "All participants acknowledged the pre-read",
      why: "If anyone hasn't acked the pre-read, they're more likely to misfire on D-Day.",
      ok: participantCount === 0 ? false : ackedCount === participantCount,
      required: false,
      stage: "INJECTS",
      fixHref: `/exercises/new?step=4&id=${exerciseId}`,
    },
    {
      id: "briefing",
      label: "Pre-exercise briefing sent or explicitly skipped",
      why: "Participants need to know what's expected before D-Day. If you're briefing in person, mark it skipped with a reason.",
      ok: briefingDealtWith,
      required: false,
      stage: "PREFLIGHT",
    },
    {
      id: "approvals",
      label: "Sign-off captured (none rejected)",
      why: "When the exercise needs CRO / Board approval (high cost or regulator mode), the approval chain must be APPROVED, not PENDING or REJECTED.",
      ok: rejectedCount === 0 && (strict ? approvedCount > 0 : pendingCount === 0),
      required: strict,
      stage: "PREFLIGHT",
    },
  ];

  const canGoReady = checks.every((c) => {
    if (strict) return c.ok;
    return !c.required || c.ok;
  });

  return { checks, canGoReady, strict };
}
