"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  manualActivateRunbook,
  recomputeStepGates,
} from "@/lib/runbook-activation";

function optStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s;
}

/**
 * Helper: load a step execution + its execution + the orgId of the
 * underlying exercise, while authorising the caller is in that org.
 */
async function loadStepExecutionContext(stepExecutionId: string) {
  const me = await requireOrgUser();
  const stepExec = await prisma.runbookStepExecution.findUnique({
    where: { id: stepExecutionId },
    include: {
      execution: {
        include: {
          incident: {
            select: { id: true, exerciseId: true, exercise: { select: { orgId: true } } },
          },
        },
      },
    },
  });
  if (!stepExec) return null;
  if (stepExec.execution.incident.exercise.orgId !== me.orgId) return null;
  return { me, stepExec };
}

async function myParticipantId(exerciseId: string, userId: string): Promise<string | null> {
  const p = await prisma.exerciseParticipant.findFirst({
    where: { exerciseId, userId },
    select: { id: true },
  });
  return p?.id ?? null;
}

export async function manualActivateRunbookAction(formData: FormData) {
  const me = await requireOrgUser();
  const incidentId = optStr(formData.get("incidentId"));
  const runbookId = optStr(formData.get("runbookId"));
  if (!incidentId || !runbookId) return;

  const incident = await prisma.incident.findFirst({
    where: { id: incidentId, exercise: { orgId: me.orgId } },
    select: { exerciseId: true },
  });
  if (!incident) return;

  const result = await manualActivateRunbook({
    incidentId,
    runbookId,
    userId: me.id,
    orgId: me.orgId,
  });
  if (!result) return;

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.execution.activated",
    targetType: "RunbookExecution",
    targetId: result.executionId,
    summary: "Manually activated runbook for incident",
    metadata: { incidentId, runbookId },
  });

  revalidatePath(`/exercises/${incident.exerciseId}/live`);
  revalidatePath(`/exercises/${incident.exerciseId}/facilitator`);
}

export async function startRunbookStepAction(formData: FormData) {
  const stepExecutionId = optStr(formData.get("stepExecutionId"));
  if (!stepExecutionId) return;
  const ctx = await loadStepExecutionContext(stepExecutionId);
  if (!ctx) return;
  const { me, stepExec } = ctx;
  if (stepExec.status !== "PENDING") return;

  await prisma.runbookStepExecution.update({
    where: { id: stepExec.id },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.execution.step.started",
    targetType: "RunbookStepExecution",
    targetId: stepExec.id,
    summary: `Started step #${stepExec.stepOrderIdx + 1}`,
  });

  revalidatePath(`/exercises/${stepExec.execution.incident.exerciseId}/live`);
}

export async function completeRunbookStepAction(formData: FormData) {
  const stepExecutionId = optStr(formData.get("stepExecutionId"));
  if (!stepExecutionId) return;
  const ctx = await loadStepExecutionContext(stepExecutionId);
  if (!ctx) return;
  const { me, stepExec } = ctx;
  if (stepExec.status === "COMPLETE" || stepExec.status === "SKIPPED") return;

  const notes = optStr(formData.get("notes"));
  const participantId = await myParticipantId(stepExec.execution.incident.exerciseId, me.id);

  await prisma.runbookStepExecution.update({
    where: { id: stepExec.id },
    data: {
      status: "COMPLETE",
      completedAt: new Date(),
      completedByParticipantId: participantId,
      notes,
    },
  });

  await recomputeStepGates(stepExec.executionId);

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.execution.step.completed",
    targetType: "RunbookStepExecution",
    targetId: stepExec.id,
    summary: `Completed step #${stepExec.stepOrderIdx + 1}`,
  });

  revalidatePath(`/exercises/${stepExec.execution.incident.exerciseId}/live`);
}

export async function skipRunbookStepAction(formData: FormData) {
  const stepExecutionId = optStr(formData.get("stepExecutionId"));
  if (!stepExecutionId) return;
  const ctx = await loadStepExecutionContext(stepExecutionId);
  if (!ctx) return;
  const { me, stepExec } = ctx;
  if (stepExec.status === "COMPLETE" || stepExec.status === "SKIPPED") return;

  const notes = optStr(formData.get("notes"));
  // Skip requires a reason — best-practice: undocumented skips are findings.
  if (!notes) return;
  const participantId = await myParticipantId(stepExec.execution.incident.exerciseId, me.id);

  await prisma.runbookStepExecution.update({
    where: { id: stepExec.id },
    data: {
      status: "SKIPPED",
      completedAt: new Date(),
      completedByParticipantId: participantId,
      notes,
    },
  });

  await recomputeStepGates(stepExec.executionId);

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.execution.step.skipped",
    targetType: "RunbookStepExecution",
    targetId: stepExec.id,
    summary: `Skipped step #${stepExec.stepOrderIdx + 1}`,
    metadata: { reason: notes },
  });

  revalidatePath(`/exercises/${stepExec.execution.incident.exerciseId}/live`);
}

export async function abandonRunbookExecutionAction(formData: FormData) {
  const me = await requireOrgUser();
  const executionId = optStr(formData.get("executionId"));
  const reason = optStr(formData.get("reason"));
  if (!executionId || !reason) return;

  const execution = await prisma.runbookExecution.findUnique({
    where: { id: executionId },
    include: {
      incident: { select: { exerciseId: true, exercise: { select: { orgId: true } } } },
    },
  });
  if (!execution || execution.incident.exercise.orgId !== me.orgId) return;
  if (execution.status !== "ACTIVE") return;

  await prisma.runbookExecution.update({
    where: { id: executionId },
    data: { status: "ABANDONED", completedAt: new Date(), abandonedReason: reason },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.execution.abandoned",
    targetType: "RunbookExecution",
    targetId: executionId,
    summary: "Abandoned runbook execution",
    metadata: { reason },
  });

  revalidatePath(`/exercises/${execution.incident.exerciseId}/live`);
}
