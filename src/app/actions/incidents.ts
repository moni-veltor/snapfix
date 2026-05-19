"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";
import { currentDDay } from "@/lib/dday";
import { SeverityLevel, IncidentStatus } from "@/generated/prisma/enums";
import { deriveOverallSeverity, autoPromoteSeverityForCyber } from "@/lib/severity";
import { autoCreateRegulatorNotificationsOnInvocation } from "@/lib/regulator";
import { autoActivateRunbooksForIncident } from "@/lib/runbook-activation";

/**
 * Resolve the calling participant for an exercise. Returns null if the caller
 * isn't on the roster — invocation is restricted to participants on the
 * exercise (not just any org member).
 */
async function findMyParticipant(exerciseId: string) {
  const me = await requireOrgUser();
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, orgId: me.orgId },
    select: { id: true, dDayAnchor: true, speedMultiplier: true },
  });
  if (!exercise) return null;
  const participant = await prisma.exerciseParticipant.findFirst({
    where: { exerciseId, userId: me.id },
  });
  return participant ? { me, exercise, participant } : null;
}

/**
 * Stand up the IMT. Creates an Incident in INVOKED state and writes a
 * DECISION log entry of type INVOKE_IMT. The "better to stand it up than
 * fail to stand it up" reflex is what this action drills. Any participant
 * can invoke; the coaching surfaces who did it and when.
 */
export async function invokeIncidentAction(formData: FormData) {
  const ctx = await findMyParticipant(String(formData.get("exerciseId")));
  if (!ctx) return;
  const title = String(formData.get("title") || "Incident").slice(0, 200);
  const summary = String(formData.get("summary") || "").slice(0, 2000) || null;
  const rationale = String(formData.get("rationale") || "").slice(0, 1000) || null;

  const now = new Date();
  const clock = currentDDay(ctx.exercise.dDayAnchor, ctx.exercise.speedMultiplier, now);

  // Short code: INC-{YYYY-MM-DD}-{n}
  const today = now.toISOString().slice(0, 10);
  const existingToday = await prisma.incident.count({
    where: {
      exerciseId: ctx.exercise.id,
      shortCode: { startsWith: `INC-${today}-` },
    },
  });
  const shortCode = `INC-${today}-${String.fromCharCode(65 + existingToday)}`;

  const incident = await prisma.incident.create({
    data: {
      exerciseId: ctx.exercise.id,
      shortCode,
      title,
      summary,
      status: IncidentStatus.INVOKED,
      invokedAt: now,
      invokedById: ctx.me.id,
      invocationRationale: rationale,
    },
  });

  // Companion log entry (kind DECISION) + DecisionRecord
  const logEntry = await prisma.incidentLogEntry.create({
    data: {
      exerciseId: ctx.exercise.id,
      incidentId: incident.id,
      authorId: ctx.me.id,
      dDayTime: clock.hhmm,
      kind: "DECISION",
      body: `Invoked IMT — ${title}${rationale ? ` — ${rationale}` : ""}`,
    },
  });
  await prisma.decisionRecord.create({
    data: {
      incidentId: incident.id,
      logEntryId: logEntry.id,
      decisionType: "INVOKE_IMT",
      title: `Invoke IMT — ${title}`,
      rationale,
      authorParticipantId: ctx.participant.id,
      authorUserId: ctx.me.id,
      approverRolesRequired: ["CEO"],
      dDayTime: clock.hhmm,
    },
  });

  revalidatePath(`/exercises/${ctx.exercise.id}/live`);
  revalidatePath(`/exercises/${ctx.exercise.id}/facilitator`);
  revalidatePath(`/exercises/${ctx.exercise.id}`);
}

/**
 * Stand the IMT down — the "back down" half of "stand it up and back down".
 * Records a STAND_DOWN_IMT decision and transitions the incident to STOOD_DOWN.
 */
export async function standDownIncidentAction(formData: FormData) {
  const ctx = await findMyParticipant(String(formData.get("exerciseId")));
  if (!ctx) return;
  const incidentId = String(formData.get("incidentId"));
  const reason = String(formData.get("reason") || "").slice(0, 1000) || null;

  const incident = await prisma.incident.findFirst({
    where: { id: incidentId, exerciseId: ctx.exercise.id },
  });
  if (!incident) return;
  if (incident.status !== "INVOKED") return;

  const clock = currentDDay(ctx.exercise.dDayAnchor, ctx.exercise.speedMultiplier);

  await prisma.incident.update({
    where: { id: incidentId },
    data: { status: IncidentStatus.STOOD_DOWN, stoodDownAt: new Date(), stoodDownReason: reason },
  });

  const logEntry = await prisma.incidentLogEntry.create({
    data: {
      exerciseId: ctx.exercise.id,
      incidentId,
      authorId: ctx.me.id,
      dDayTime: clock.hhmm,
      kind: "DECISION",
      body: `Stood down IMT — ${reason ?? "no rationale given"}`,
    },
  });
  await prisma.decisionRecord.create({
    data: {
      incidentId,
      logEntryId: logEntry.id,
      decisionType: "STAND_DOWN_IMT",
      title: "Stand down IMT",
      rationale: reason,
      authorParticipantId: ctx.participant.id,
      authorUserId: ctx.me.id,
      approverRolesRequired: ["CEO"],
      dDayTime: clock.hhmm,
    },
  });

  revalidatePath(`/exercises/${ctx.exercise.id}/live`);
  revalidatePath(`/exercises/${ctx.exercise.id}/facilitator`);
}

const SeverityEnum = z.enum(["HIGH", "MEDIUM", "LOW"]);
const SeverityOpt = SeverityEnum.optional();

const SeverityInput = z.object({
  exerciseId: z.string(),
  incidentId: z.string(),
  severityFinancial: SeverityOpt,
  severityCustomer: SeverityOpt,
  severityData: SeverityOpt,
  severitySystems: SeverityOpt,
  severityReputational: SeverityOpt,
  consumerDutyTrigger: z.string().optional(),
  cyberDefaultHigh: z.string().optional(),
});

/**
 * Record the IMT's severity classification across the five policy dimensions.
 * Consumer Duty + cyber-default-High overrides promote the derived overall
 * severity . On High severity, auto-instantiate
 * the FCA/PRA notification clocks (Epic D).
 */
export async function assessSeverityAction(formData: FormData) {
  const ctx = await findMyParticipant(String(formData.get("exerciseId")));
  if (!ctx) return;
  const data = SeverityInput.parse(Object.fromEntries(formData));

  const consumerDutyTrigger = data.consumerDutyTrigger === "on";
  const cyberDefaultHigh = data.cyberDefaultHigh === "on";

  let derived = deriveOverallSeverity({
    financial: data.severityFinancial,
    customer: data.severityCustomer,
    dataImpact: data.severityData,
    systems: data.severitySystems,
    reputational: data.severityReputational,
    consumerDutyTrigger,
  });
  derived = autoPromoteSeverityForCyber(derived, cyberDefaultHigh);

  const incident = await prisma.incident.findFirst({
    where: { id: data.incidentId, exerciseId: ctx.exercise.id },
  });
  if (!incident) return;

  await prisma.incident.update({
    where: { id: incident.id },
    data: {
      severity: derived as SeverityLevel | null,
      severityFinancial: (data.severityFinancial as SeverityLevel) ?? null,
      severityCustomer: (data.severityCustomer as SeverityLevel) ?? null,
      severityData: (data.severityData as SeverityLevel) ?? null,
      severitySystems: (data.severitySystems as SeverityLevel) ?? null,
      severityReputational: (data.severityReputational as SeverityLevel) ?? null,
      consumerDutyTrigger,
      cyberDefaultHigh,
      severityAssessedAt: new Date(),
    },
  });

  const clock = currentDDay(ctx.exercise.dDayAnchor, ctx.exercise.speedMultiplier);
  const logEntry = await prisma.incidentLogEntry.create({
    data: {
      exerciseId: ctx.exercise.id,
      incidentId: incident.id,
      authorId: ctx.me.id,
      dDayTime: clock.hhmm,
      kind: "DECISION",
      body: `Classified severity as ${derived ?? "—"}${consumerDutyTrigger ? " (Consumer Duty trigger)" : ""}${cyberDefaultHigh ? " (cyber → High default)" : ""}`,
    },
  });
  await prisma.decisionRecord.create({
    data: {
      incidentId: incident.id,
      logEntryId: logEntry.id,
      decisionType: "CLASSIFY_SEVERITY",
      title: `Classify severity — ${derived ?? "unset"}`,
      rationale: `5-dim assessment: Fin=${data.severityFinancial ?? "—"}, Cust=${data.severityCustomer ?? "—"}, Data=${data.severityData ?? "—"}, Sys=${data.severitySystems ?? "—"}, Rep=${data.severityReputational ?? "—"}`,
      authorParticipantId: ctx.participant.id,
      authorUserId: ctx.me.id,
      approverRolesRequired: ["CRO"],
      dDayTime: clock.hhmm,
    },
  });

  // Side effect — regulator clocks for High severity (Epic D).
  if (derived === "HIGH" && incident.invokedAt) {
    await autoCreateRegulatorNotificationsOnInvocation(incident.id, incident.invokedAt);
  }

  // Side effect — auto-activate matching runbooks based on the new severity.
  // Idempotent and capped, so re-classifying severity later doesn't pile on
  // runbook activations.
  await autoActivateRunbooksForIncident(incident.id);

  revalidatePath(`/exercises/${ctx.exercise.id}/live`);
  revalidatePath(`/exercises/${ctx.exercise.id}/facilitator`);
}
