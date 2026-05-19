import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Live runbook activation.
 *
 * Called from severity-classification (auto) and from the manual-activate
 * server action. Evaluates published runbooks' trigger conditions against
 * the incident's current state, picks the top matches (capped to avoid
 * overwhelming the IMT), and creates RunbookExecution + PENDING step rows.
 *
 * The full runbook + steps are frozen into `runbookJson` so the execution
 * record stays reproducible even if the runbook is later edited.
 */

/** Cap auto-activations per severity bump so the room doesn't drown. */
const AUTO_ACTIVATION_CAP = 2;

const SEVERITY_RANK: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export type FrozenRunbookStep = {
  id: string;
  orderIdx: number;
  title: string;
  description: string | null;
  kind: string;
  ownerRoleTitle: string | null;
  estimatedMin: number | null;
  successCriteria: string | null;
  blocksOrders: number[];
  decisionTypeCode: string | null;
  orgDecisionTypeId: string | null;
  regulatorTrigger: { regulator: string; slaHours: number; trigger: string } | null;
  commsTemplate: { stakeholder: string; subject: string; bodyTemplate: string } | null;
};

export type FrozenRunbook = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  ownerRoleTitle: string | null;
  version: number;
  steps: FrozenRunbookStep[];
};

/**
 * Auto-activate matching runbooks for the incident's *current* severity +
 * scenario category. Idempotent — runbooks already activated for this
 * incident are skipped. Returns the list of activated executions.
 */
export async function autoActivateRunbooksForIncident(incidentId: string): Promise<{
  activatedCount: number;
}> {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    select: {
      id: true,
      severity: true,
      exercise: {
        select: {
          orgId: true,
          scenario: { select: { category: true } },
        },
      },
    },
  });
  if (!incident) return { activatedCount: 0 };
  if (!incident.severity) return { activatedCount: 0 };

  const severityRank = SEVERITY_RANK[incident.severity] ?? 0;
  if (severityRank === 0) return { activatedCount: 0 };

  // Pull all PUBLISHED runbooks for the org that have a trigger condition.
  const candidates = await prisma.runbook.findMany({
    where: {
      orgId: incident.exercise.orgId,
      status: "PUBLISHED",
      trigger: { isNot: null },
    },
    include: { trigger: true, steps: { orderBy: { orderIdx: "asc" } } },
  });

  // Skip any that are already activated for this incident.
  const existing = await prisma.runbookExecution.findMany({
    where: { incidentId },
    select: { runbookId: true },
  });
  const existingIds = new Set(existing.map((e) => e.runbookId));

  const scenarioCategory = incident.exercise.scenario.category;
  const matched = candidates.filter((r) => {
    if (existingIds.has(r.id)) return false;
    if (!r.trigger) return false;
    if (r.trigger.severityAtLeast) {
      const minRank = SEVERITY_RANK[r.trigger.severityAtLeast] ?? 0;
      if (severityRank < minRank) return false;
    }
    if (r.trigger.scenarioCategoryEquals) {
      if (!scenarioCategory) return false;
      if (scenarioCategory !== r.trigger.scenarioCategoryEquals) return false;
    }
    return true;
  });

  // Rank: more-specific triggers first (category + severity beats severity-only),
  // then higher severity threshold, then runbooks with more steps.
  matched.sort((a, b) => {
    const aSpec = (a.trigger!.scenarioCategoryEquals ? 2 : 0) + (a.trigger!.severityAtLeast ? 1 : 0);
    const bSpec = (b.trigger!.scenarioCategoryEquals ? 2 : 0) + (b.trigger!.severityAtLeast ? 1 : 0);
    if (aSpec !== bSpec) return bSpec - aSpec;
    const aSev = SEVERITY_RANK[a.trigger!.severityAtLeast ?? "LOW"] ?? 0;
    const bSev = SEVERITY_RANK[b.trigger!.severityAtLeast ?? "LOW"] ?? 0;
    if (aSev !== bSev) return bSev - aSev;
    return b.steps.length - a.steps.length;
  });

  const winners = matched.slice(0, AUTO_ACTIVATION_CAP);

  for (const runbook of winners) {
    await createRunbookExecution({
      incidentId,
      runbook,
      activatedBy: "AUTO",
      activatedByUserId: null,
      activationReason: buildActivationReason(runbook.trigger!, incident.severity, scenarioCategory),
    });
  }

  return { activatedCount: winners.length };
}

/**
 * Manually activate a runbook against an incident — used when an admin
 * decides a runbook is relevant outside the auto-trigger rules.
 */
export async function manualActivateRunbook({
  incidentId,
  runbookId,
  userId,
  orgId,
}: {
  incidentId: string;
  runbookId: string;
  userId: string;
  orgId: string;
}): Promise<{ executionId: string } | null> {
  const [incident, runbook, existing] = await Promise.all([
    prisma.incident.findFirst({
      where: { id: incidentId, exercise: { orgId } },
      select: { id: true },
    }),
    prisma.runbook.findFirst({
      where: { id: runbookId, orgId },
      include: { steps: { orderBy: { orderIdx: "asc" } } },
    }),
    prisma.runbookExecution.findUnique({
      where: { incidentId_runbookId: { incidentId, runbookId } },
      select: { id: true },
    }),
  ]);
  if (!incident || !runbook) return null;
  if (existing) return { executionId: existing.id };

  const execution = await createRunbookExecution({
    incidentId,
    runbook,
    activatedBy: "MANUAL",
    activatedByUserId: userId,
    activationReason: "Manually activated",
  });
  return { executionId: execution.id };
}

type RunbookWithSteps = Awaited<ReturnType<typeof prisma.runbook.findFirst>> & {
  steps: Awaited<ReturnType<typeof prisma.runbookStep.findMany>>;
};

async function createRunbookExecution({
  incidentId,
  runbook,
  activatedBy,
  activatedByUserId,
  activationReason,
}: {
  incidentId: string;
  runbook: NonNullable<RunbookWithSteps>;
  activatedBy: "AUTO" | "MANUAL";
  activatedByUserId: string | null;
  activationReason: string;
}) {
  const frozen: FrozenRunbook = {
    id: runbook.id,
    title: runbook.title,
    description: runbook.description,
    category: runbook.category,
    ownerRoleTitle: runbook.ownerRoleTitle,
    version: runbook.version,
    steps: runbook.steps.map((s) => ({
      id: s.id,
      orderIdx: s.orderIdx,
      title: s.title,
      description: s.description,
      kind: s.kind,
      ownerRoleTitle: s.ownerRoleTitle,
      estimatedMin: s.estimatedMin,
      successCriteria: s.successCriteria,
      blocksOrders: s.blocksOrders,
      decisionTypeCode: s.decisionTypeCode,
      orgDecisionTypeId: s.orgDecisionTypeId,
      regulatorTrigger: normaliseTrigger(s.regulatorTrigger),
      commsTemplate: normaliseComms(s.commsTemplate),
    })),
  };

  return prisma.runbookExecution.create({
    data: {
      incidentId,
      runbookId: runbook.id,
      runbookJson: frozen as unknown as object,
      activatedBy,
      activatedByUserId,
      activationReason,
      stepExecutions: {
        create: frozen.steps.map((s) => ({
          stepOrderIdx: s.orderIdx,
          status: "PENDING",
        })),
      },
    },
  });
}

function normaliseTrigger(v: unknown): FrozenRunbookStep["regulatorTrigger"] {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.regulator !== "string" || typeof o.slaHours !== "number") return null;
  return {
    regulator: o.regulator,
    slaHours: o.slaHours,
    trigger: typeof o.trigger === "string" ? o.trigger : "POST_INVOCATION",
  };
}

function normaliseComms(v: unknown): FrozenRunbookStep["commsTemplate"] {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (
    typeof o.stakeholder !== "string" ||
    typeof o.subject !== "string" ||
    typeof o.bodyTemplate !== "string"
  )
    return null;
  return { stakeholder: o.stakeholder, subject: o.subject, bodyTemplate: o.bodyTemplate };
}

function buildActivationReason(
  trigger: { severityAtLeast: string | null; scenarioCategoryEquals: string | null },
  severity: string,
  scenarioCategory: string | null,
): string {
  const parts: string[] = [`severity=${severity}`];
  if (trigger.severityAtLeast) parts.push(`threshold≥${trigger.severityAtLeast}`);
  if (trigger.scenarioCategoryEquals && scenarioCategory) {
    parts.push(`category=${scenarioCategory}`);
  }
  return parts.join(" · ");
}

/**
 * Re-evaluate step status across an execution. A PENDING step is BLOCKED
 * when any of its blocksOrders dependencies isn't COMPLETE or SKIPPED.
 * Called after every step transition.
 */
export async function recomputeStepGates(executionId: string): Promise<void> {
  const execution = await prisma.runbookExecution.findUnique({
    where: { id: executionId },
    include: { stepExecutions: true },
  });
  if (!execution) return;

  const runbook = execution.runbookJson as unknown as FrozenRunbook;
  const byOrder = new Map<number, (typeof execution.stepExecutions)[number]>();
  for (const se of execution.stepExecutions) byOrder.set(se.stepOrderIdx, se);

  for (const step of runbook.steps) {
    const exec = byOrder.get(step.orderIdx);
    if (!exec) continue;
    if (exec.status === "COMPLETE" || exec.status === "SKIPPED" || exec.status === "IN_PROGRESS")
      continue;
    const blockers = step.blocksOrders ?? [];
    const ready = blockers.every((o) => {
      const dep = byOrder.get(o);
      if (!dep) return true;
      return dep.status === "COMPLETE" || dep.status === "SKIPPED";
    });
    const nextStatus = ready ? "PENDING" : "BLOCKED";
    if (exec.status !== nextStatus) {
      await prisma.runbookStepExecution.update({
        where: { id: exec.id },
        data: { status: nextStatus },
      });
    }
  }

  // Mark execution COMPLETE when every step is COMPLETE or SKIPPED.
  const fresh = await prisma.runbookStepExecution.findMany({
    where: { executionId },
    select: { status: true },
  });
  const allDone = fresh.every((s) => s.status === "COMPLETE" || s.status === "SKIPPED");
  if (allDone && execution.status === "ACTIVE") {
    await prisma.runbookExecution.update({
      where: { id: executionId },
      data: { status: "COMPLETE", completedAt: new Date() },
    });
  }
}
