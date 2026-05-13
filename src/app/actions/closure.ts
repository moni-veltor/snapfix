"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";
import { IncidentStatus } from "@/generated/prisma/enums";
import { currentDDay } from "@/lib/dday";
import { createClosureNotifications } from "@/lib/regulator";

const ClosureChecksSchema = z.object({
  exerciseId: z.string(),
  incidentId: z.string(),
  closureImpactCeased: z.string().optional(),
  closureRegsNotified: z.string().optional(),
  closureLogComplete: z.string().optional(),
  closurePreliminaryRCA: z.string().optional(),
  closureCRO_SignOff: z.string().optional(),
});

/** Toggle individual closure checkboxes — does NOT close the incident. */
export async function updateClosureChecksAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = ClosureChecksSchema.parse(Object.fromEntries(formData));
  await prisma.incident.updateMany({
    where: { id: data.incidentId, exercise: { id: data.exerciseId, orgId: me.orgId } },
    data: {
      closureImpactCeased: data.closureImpactCeased === "on",
      closureRegsNotified: data.closureRegsNotified === "on",
      closureLogComplete: data.closureLogComplete === "on",
      closurePreliminaryRCA: data.closurePreliminaryRCA === "on",
      closureCRO_SignOff: data.closureCRO_SignOff === "on",
    },
  });
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}

const CloseSchema = z.object({
  exerciseId: z.string(),
  incidentId: z.string(),
});

/**
 * Close the incident. Enforces the five mandatory closure criteria from
 * Afin IMP §6.4.1 — all must be ✓ before closure succeeds. Also schedules:
 *   - FCA/PRA closure notifications (2 business days) for High-severity incidents
 *   - The Post-Incident Report (10 business days from closure, IMP §6.5.3)
 *   - The Retrospective (5 business days, BCPlans §6.6.1 R-5)
 */
export async function closeIncidentAction(formData: FormData): Promise<{ error?: string } | void> {
  const me = await requireOrgUser();
  const data = CloseSchema.parse(Object.fromEntries(formData));

  const incident = await prisma.incident.findFirst({
    where: { id: data.incidentId, exercise: { id: data.exerciseId, orgId: me.orgId } },
    include: { exercise: { select: { id: true } } },
  });
  if (!incident) return;

  const missing: string[] = [];
  if (!incident.closureImpactCeased) missing.push("customer impact ceased");
  if (!incident.closureRegsNotified) missing.push("regulator notifications complete");
  if (!incident.closureLogComplete) missing.push("incident log complete");
  if (!incident.closurePreliminaryRCA) missing.push("preliminary RCA");
  if (!incident.closureCRO_SignOff) missing.push("CRO sign-off");
  if (missing.length > 0) {
    return { error: `Cannot close — outstanding closure criteria: ${missing.join(", ")}.` };
  }

  const now = new Date();
  await prisma.incident.update({
    where: { id: incident.id },
    data: {
      status: IncidentStatus.CLOSED,
      closedAt: now,
      closedById: me.id,
    },
  });

  // Spawn closure-side regulator notifications for High severity.
  if (incident.severity === "HIGH") {
    await createClosureNotifications(incident.id, now);
  }

  // Spawn PIR — 10 business days ≈ 14 calendar days (simplified).
  const pirDue = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  await prisma.postIncidentReport.upsert({
    where: { incidentId: incident.id },
    create: {
      incidentId: incident.id,
      dueAt: pirDue,
      authorUserId: me.id,
    },
    update: { dueAt: pirDue },
  });

  // Spawn Retrospective — 5 business days ≈ 7 calendar days.
  const retroDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await prisma.retrospective.upsert({
    where: { exerciseId: incident.exercise.id },
    create: { exerciseId: incident.exercise.id, dueAt: retroDue },
    update: { dueAt: retroDue },
  });

  const clock = currentDDay(undefined);
  await prisma.incidentLogEntry.create({
    data: {
      exerciseId: incident.exercise.id,
      incidentId: incident.id,
      authorId: me.id,
      dDayTime: clock.hhmm,
      kind: "DECISION",
      body: `Incident closed by ${me.email}. PIR due ${pirDue.toISOString().slice(0, 10)}, retro due ${retroDue.toISOString().slice(0, 10)}.`,
    },
  });

  revalidatePath(`/exercises/${data.exerciseId}/live`);
  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
  revalidatePath(`/exercises/${data.exerciseId}/debrief`);
}

const PIRSchema = z.object({
  exerciseId: z.string(),
  incidentId: z.string(),
  incidentSummary: z.string().optional(),
  timeline: z.string().optional(),
  rootCause: z.string().optional(),
  customerImpact: z.string().optional(),
  regulatoryImpact: z.string().optional(),
  controlFailures: z.string().optional(),
  whatWorkedWell: z.string().optional(),
  remediationCommitments: z.string().optional(),
  submit: z.string().optional(),
});

export async function savePIRAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = PIRSchema.parse(Object.fromEntries(formData));

  const pir = await prisma.postIncidentReport.findFirst({
    where: {
      incidentId: data.incidentId,
      incident: { exercise: { id: data.exerciseId, orgId: me.orgId } },
    },
  });
  if (!pir) return;

  await prisma.postIncidentReport.update({
    where: { id: pir.id },
    data: {
      incidentSummary: data.incidentSummary ?? null,
      timeline: data.timeline ?? null,
      rootCause: data.rootCause ?? null,
      customerImpact: data.customerImpact ?? null,
      regulatoryImpact: data.regulatoryImpact ?? null,
      controlFailures: data.controlFailures ?? null,
      whatWorkedWell: data.whatWorkedWell ?? null,
      remediationCommitments: data.remediationCommitments ?? null,
      submittedAt: data.submit === "on" ? new Date() : pir.submittedAt,
      authorUserId: me.id,
    },
  });

  revalidatePath(`/exercises/${data.exerciseId}/debrief`);
}

const RetroSchema = z.object({
  exerciseId: z.string(),
  wentWell: z.string().optional(),
  didntGoWell: z.string().optional(),
  improvements: z.string().optional(),
  held: z.string().optional(),
});

export async function saveRetrospectiveAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = RetroSchema.parse(Object.fromEntries(formData));
  const retro = await prisma.retrospective.findFirst({
    where: { exerciseId: data.exerciseId, exercise: { orgId: me.orgId } },
  });
  if (!retro) return;
  await prisma.retrospective.update({
    where: { id: retro.id },
    data: {
      wentWell: data.wentWell ?? null,
      didntGoWell: data.didntGoWell ?? null,
      improvements: data.improvements ?? null,
      heldAt: data.held === "on" ? new Date() : retro.heldAt,
    },
  });
  revalidatePath(`/exercises/${data.exerciseId}/debrief`);
}
