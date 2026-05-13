"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";
import { currentDDay } from "@/lib/dday";

const ActivateSchema = z.object({
  exerciseId: z.string(),
  incidentId: z.string(),
  ceoUserId: z.string(),
  croUserId: z.string(),
  rationale: z.string().optional(),
});

/**
 * Activate the Business Continuity Plan. Joint CEO + CRO decision per
 * Afin BCP §6.4.2.2 / IMP §6.2.3. Records both approvers as separate user
 * references and writes a DECISION log entry of type ACTIVATE_BCP.
 *
 * The platform doesn't verify whether the CEO/CRO users are actually CEO/CRO —
 * that's the exercise's coaching point (assigning roles correctly).
 */
export async function activateBCPAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = ActivateSchema.parse(Object.fromEntries(formData));

  const exercise = await prisma.exercise.findFirst({
    where: { id: data.exerciseId, orgId: me.orgId },
    select: { id: true, dDayAnchor: true, speedMultiplier: true },
  });
  if (!exercise) return;

  const incident = await prisma.incident.findFirst({
    where: { id: data.incidentId, exerciseId: exercise.id },
  });
  if (!incident) return;

  // Idempotent — don't double-activate.
  const existing = await prisma.bCPActivation.findFirst({
    where: { incidentId: incident.id, deactivatedAt: null },
  });
  if (existing) return;

  await prisma.bCPActivation.create({
    data: {
      incidentId: incident.id,
      activatedAt: new Date(),
      activatedByCEOId: data.ceoUserId,
      activatedByCROId: data.croUserId,
      rationale: data.rationale ?? null,
    },
  });

  const clock = currentDDay(exercise.dDayAnchor, exercise.speedMultiplier);
  const logEntry = await prisma.incidentLogEntry.create({
    data: {
      exerciseId: exercise.id,
      incidentId: incident.id,
      authorId: me.id,
      dDayTime: clock.hhmm,
      kind: "DECISION",
      body: `Activated BCP (joint CEO + CRO).${data.rationale ? ` ${data.rationale}` : ""}`,
    },
  });
  await prisma.decisionRecord.create({
    data: {
      incidentId: incident.id,
      logEntryId: logEntry.id,
      decisionType: "ACTIVATE_BCP",
      title: "Activate BCP",
      rationale: data.rationale ?? null,
      authorUserId: me.id,
      approverRolesRequired: ["CEO", "CRO"],
      dDayTime: clock.hhmm,
      approvedAt: new Date(),
    },
  });

  revalidatePath(`/exercises/${data.exerciseId}/live`);
  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
}

const DeactivateSchema = z.object({
  exerciseId: z.string(),
  activationId: z.string(),
  notes: z.string().optional(),
});

export async function deactivateBCPAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = DeactivateSchema.parse(Object.fromEntries(formData));

  const activation = await prisma.bCPActivation.findFirst({
    where: { id: data.activationId, incident: { exercise: { id: data.exerciseId, orgId: me.orgId } } },
  });
  if (!activation || activation.deactivatedAt) return;

  await prisma.bCPActivation.update({
    where: { id: activation.id },
    data: { deactivatedAt: new Date(), deactivationNotes: data.notes ?? null },
  });

  revalidatePath(`/exercises/${data.exerciseId}/live`);
  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
}
