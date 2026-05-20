"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { currentDDay } from "@/lib/dday";
import {
  manualActivateRunbook,
  recomputeStepGates,
  type FrozenRunbook,
  type FrozenRunbookStep,
} from "@/lib/runbook-activation";
import {
  mapAudienceFromStakeholder,
  mapStakeholder,
  renderRunbookTemplate,
  RUNBOOK_DECISION_APPROVER_ROLES,
  type RunbookTemplateContext,
} from "@/lib/runbook-templates";
import {
  DecisionType,
  Regulator,
} from "@/generated/prisma/enums";

function optStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s;
}

const HOUR = 60 * 60 * 1000;

/**
 * Loads the step execution + its enclosing execution + the underlying
 * incident's exercise + org, authorising the caller in the same org.
 * Also returns the FROZEN step from runbookJson — the live step row may
 * have been edited since activation, but the version that matters here
 * is the one that ran.
 */
async function loadStepExecutionContext(stepExecutionId: string) {
  const me = await requireOrgUser();
  const stepExec = await prisma.runbookStepExecution.findUnique({
    where: { id: stepExecutionId },
    include: {
      execution: {
        include: {
          incident: {
            select: {
              id: true,
              shortCode: true,
              title: true,
              severity: true,
              invokedAt: true,
              exerciseId: true,
              exercise: {
                select: {
                  id: true,
                  orgId: true,
                  dDayAnchor: true,
                  speedMultiplier: true,
                  org: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!stepExec) return null;
  if (stepExec.execution.incident.exercise.orgId !== me.orgId) return null;

  const frozen = stepExec.execution.runbookJson as unknown as FrozenRunbook;
  const frozenStep = frozen.steps.find((s) => s.orderIdx === stepExec.stepOrderIdx);
  if (!frozenStep) return null;

  return { me, stepExec, frozen, frozenStep };
}

async function myParticipantId(exerciseId: string, userId: string): Promise<string | null> {
  const p = await prisma.exerciseParticipant.findFirst({
    where: { exerciseId, userId },
    select: { id: true },
  });
  return p?.id ?? null;
}

function templateContextFor(
  step: FrozenRunbookStep,
  incident: {
    title: string;
    shortCode: string;
    severity: string | null;
    invokedAt: Date | null;
  },
  org: { name: string },
  dDayHHMM: string,
  extras?: Record<string, string | null | undefined>,
): RunbookTemplateContext {
  return {
    incident,
    org,
    ownerRoleTitle: step.ownerRoleTitle,
    nextSitrepDDay: null,
    dDayHHMM,
    extras,
  };
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

/**
 * Mark a step IN_PROGRESS. For kind=NOTIFICATION, also creates the
 * RegulatorNotification row at start-time so the SLA clock begins
 * ticking immediately (best practice — the regulator dueAt clock
 * starts when the trigger fires, not when the notification is sent).
 * For kind=COMMS, drafts a CommunicationDraft pre-populated from the
 * template so the participant can edit and send through the normal flow.
 */
export async function startRunbookStepAction(formData: FormData) {
  const stepExecutionId = optStr(formData.get("stepExecutionId"));
  if (!stepExecutionId) return;
  const ctx = await loadStepExecutionContext(stepExecutionId);
  if (!ctx) return;
  const { me, stepExec, frozenStep } = ctx;
  if (stepExec.status !== "PENDING") return;

  const updates: {
    status: "IN_PROGRESS";
    startedAt: Date;
    linkedNotificationId?: string;
    linkedCommsId?: string;
  } = {
    status: "IN_PROGRESS",
    startedAt: new Date(),
  };

  if (frozenStep.kind === "NOTIFICATION" && !stepExec.linkedNotificationId && frozenStep.regulatorTrigger) {
    const incident = stepExec.execution.incident;
    const clockSource =
      frozenStep.regulatorTrigger.trigger === "POST_AWARENESS"
        ? new Date()
        : incident.invokedAt ?? new Date();
    const dueAt = new Date(clockSource.getTime() + frozenStep.regulatorTrigger.slaHours * HOUR);
    const notif = await prisma.regulatorNotification.create({
      data: {
        incidentId: incident.id,
        regulator: frozenStep.regulatorTrigger.regulator as Regulator,
        trigger: frozenStep.title,
        slaHours: frozenStep.regulatorTrigger.slaHours,
        dueAt,
        ownerRoleTitle: frozenStep.ownerRoleTitle,
      },
    });
    updates.linkedNotificationId = notif.id;
  }

  if (frozenStep.kind === "COMMS" && !stepExec.linkedCommsId && frozenStep.commsTemplate) {
    const incident = stepExec.execution.incident;
    const clock = currentDDay(incident.exercise.dDayAnchor, incident.exercise.speedMultiplier);
    const tplCtx = templateContextFor(
      frozenStep,
      {
        title: incident.title,
        shortCode: incident.shortCode,
        severity: incident.severity,
        invokedAt: incident.invokedAt,
      },
      { name: incident.exercise.org.name },
      clock.hhmm,
    );
    const rendered = renderRunbookTemplate(frozenStep.commsTemplate.bodyTemplate, tplCtx);
    const stakeholder = mapStakeholder(frozenStep.commsTemplate.stakeholder);
    const audience = mapAudienceFromStakeholder(stakeholder);
    const draft = await prisma.communicationDraft.create({
      data: {
        exerciseId: incident.exerciseId,
        incidentId: incident.id,
        authorId: me.id,
        audience,
        stakeholder,
        subject: frozenStep.commsTemplate.subject,
        body: rendered,
      },
    });
    updates.linkedCommsId = draft.id;
  }

  await prisma.runbookStepExecution.update({
    where: { id: stepExec.id },
    data: updates,
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.execution.step.started",
    targetType: "RunbookStepExecution",
    targetId: stepExec.id,
    summary: `Started step #${stepExec.stepOrderIdx + 1}`,
    metadata: {
      kind: frozenStep.kind,
      linkedNotificationId: updates.linkedNotificationId ?? null,
      linkedCommsId: updates.linkedCommsId ?? null,
    },
  });

  revalidatePath(`/exercises/${stepExec.execution.incident.exerciseId}/live`);
}

/**
 * Mark a step COMPLETE. For DECISION steps, writes the IncidentLogEntry +
 * DecisionRecord (linking back via linkedDecisionId). For NOTIFICATION
 * steps, marks the linked RegulatorNotification as SENT. For COMMS steps,
 * leaves the linked draft for the normal approval flow (the draft is
 * already created at start-time).
 */
export async function completeRunbookStepAction(formData: FormData) {
  const stepExecutionId = optStr(formData.get("stepExecutionId"));
  if (!stepExecutionId) return;
  const ctx = await loadStepExecutionContext(stepExecutionId);
  if (!ctx) return;
  const { me, stepExec, frozenStep } = ctx;
  if (stepExec.status === "COMPLETE" || stepExec.status === "SKIPPED") return;

  const notes = optStr(formData.get("notes"));
  const decisionRationaleOverride = optStr(formData.get("decisionRationale"));
  const incident = stepExec.execution.incident;
  const participantId = await myParticipantId(incident.exerciseId, me.id);

  const updates: {
    status: "COMPLETE";
    completedAt: Date;
    completedByParticipantId: string | null;
    notes: string | null;
    linkedDecisionId?: string;
  } = {
    status: "COMPLETE",
    completedAt: new Date(),
    completedByParticipantId: participantId,
    notes,
  };

  // ── DECISION → write IncidentLogEntry + DecisionRecord ───────────────
  if (frozenStep.kind === "DECISION" && !stepExec.linkedDecisionId) {
    const clock = currentDDay(incident.exercise.dDayAnchor, incident.exercise.speedMultiplier);
    const decisionCode =
      (frozenStep.decisionTypeCode as keyof typeof DecisionType | null) ?? "OTHER";
    const decisionType = (Object.values(DecisionType) as string[]).includes(decisionCode)
      ? (decisionCode as DecisionType)
      : DecisionType.OTHER;
    const approvers =
      RUNBOOK_DECISION_APPROVER_ROLES[decisionCode] ?? [];
    const rationale =
      decisionRationaleOverride ??
      notes ??
      `Driven by runbook step "${frozenStep.title}"`;

    const logEntry = await prisma.incidentLogEntry.create({
      data: {
        exerciseId: incident.exerciseId,
        incidentId: incident.id,
        authorId: me.id,
        dDayTime: clock.hhmm,
        kind: "DECISION",
        body: `${frozenStep.title}${rationale ? ` — ${rationale}` : ""}`,
      },
    });
    const decisionRecord = await prisma.decisionRecord.create({
      data: {
        incidentId: incident.id,
        logEntryId: logEntry.id,
        decisionType,
        title: frozenStep.title,
        rationale,
        authorParticipantId: participantId,
        authorUserId: me.id,
        approverRolesRequired: approvers,
        dDayTime: clock.hhmm,
      },
    });
    updates.linkedDecisionId = decisionRecord.id;
  }

  // ── NOTIFICATION → flip linked clock to SENT ────────────────────────
  if (frozenStep.kind === "NOTIFICATION" && stepExec.linkedNotificationId) {
    await prisma.regulatorNotification.update({
      where: { id: stepExec.linkedNotificationId },
      data: { status: "SENT", sentAt: new Date() },
    });
  }

  // ── COMMS → mark APPROVED (the existing comms flow handles SENT) ────
  if (frozenStep.kind === "COMMS" && stepExec.linkedCommsId) {
    await prisma.communicationDraft.update({
      where: { id: stepExec.linkedCommsId },
      data: {
        status: "APPROVED",
        approverId: me.id,
        approvedAt: new Date(),
      },
    });
  }

  await prisma.runbookStepExecution.update({
    where: { id: stepExec.id },
    data: updates,
  });

  await recomputeStepGates(stepExec.executionId);

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.execution.step.completed",
    targetType: "RunbookStepExecution",
    targetId: stepExec.id,
    summary: `Completed step #${stepExec.stepOrderIdx + 1}`,
    metadata: {
      kind: frozenStep.kind,
      linkedDecisionId: updates.linkedDecisionId ?? stepExec.linkedDecisionId,
      linkedNotificationId: stepExec.linkedNotificationId,
      linkedCommsId: stepExec.linkedCommsId,
    },
  });

  revalidatePath(`/exercises/${incident.exerciseId}/live`);
}

/**
 * Skip a step with a documented reason. For NOTIFICATION steps with a
 * linked notification, flips the notification to WAIVED + records the
 * rationale (best practice — every notification clock must resolve
 * SENT, WAIVED, or BREACHED). For COMMS drafts, marks the draft REJECTED
 * with the same rationale so it's clear the cascade step was skipped.
 */
export async function skipRunbookStepAction(formData: FormData) {
  const stepExecutionId = optStr(formData.get("stepExecutionId"));
  if (!stepExecutionId) return;
  const ctx = await loadStepExecutionContext(stepExecutionId);
  if (!ctx) return;
  const { me, stepExec, frozenStep } = ctx;
  if (stepExec.status === "COMPLETE" || stepExec.status === "SKIPPED") return;

  const notes = optStr(formData.get("notes"));
  if (!notes) return; // skip requires a reason
  const participantId = await myParticipantId(stepExec.execution.incident.exerciseId, me.id);

  if (frozenStep.kind === "NOTIFICATION" && stepExec.linkedNotificationId) {
    await prisma.regulatorNotification.update({
      where: { id: stepExec.linkedNotificationId },
      data: { status: "WAIVED", waiverRationale: notes },
    });
  }
  if (frozenStep.kind === "COMMS" && stepExec.linkedCommsId) {
    await prisma.communicationDraft.update({
      where: { id: stepExec.linkedCommsId },
      data: { status: "REJECTED", rejectionReason: notes },
    });
  }

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
    metadata: { kind: frozenStep.kind, reason: notes },
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
