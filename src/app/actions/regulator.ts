"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";
import { createICONotification } from "@/lib/regulator";
import { RegulatorNotificationStatus } from "@/generated/prisma/enums";

const TransitionSchema = z.object({
  exerciseId: z.string(),
  notificationId: z.string(),
  status: z.enum(["PENDING", "IN_DRAFT", "AWAITING_APPROVAL", "SENT", "WAIVED"]),
  waiverRationale: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Move a regulator notification through its lifecycle (PENDING → IN_DRAFT →
 * AWAITING_APPROVAL → SENT, or WAIVED with a written rationale). When dueAt
 * passes without SENT/WAIVED, the loadRegulatorClocks helper flags it as
 * BREACHED via a derived status — we don't persist BREACHED separately.
 */
export async function transitionRegulatorNotificationAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = TransitionSchema.parse(Object.fromEntries(formData));

  const exercise = await prisma.exercise.findFirst({
    where: { id: data.exerciseId, orgId: me.orgId },
    select: { id: true },
  });
  if (!exercise) return;

  const notification = await prisma.regulatorNotification.findFirst({
    where: { id: data.notificationId, incident: { exerciseId: exercise.id } },
  });
  if (!notification) return;

  await prisma.regulatorNotification.update({
    where: { id: notification.id },
    data: {
      status: data.status as RegulatorNotificationStatus,
      sentAt: data.status === "SENT" ? new Date() : notification.sentAt,
      waiverRationale: data.status === "WAIVED" ? data.waiverRationale ?? "no rationale given" : notification.waiverRationale,
      notes: data.notes ?? notification.notes,
      ownerUserId: notification.ownerUserId ?? me.id,
    },
  });

  revalidatePath(`/exercises/${data.exerciseId}/live`);
  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
}

const CreateICOSchema = z.object({
  exerciseId: z.string(),
  incidentId: z.string(),
});

/**
 * Spawn the 72h ICO clock for a personal data breach. Owned by Head of
 * Compliance, approved by CRO (best practice
 */
export async function flagDataBreachAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = CreateICOSchema.parse(Object.fromEntries(formData));

  const incident = await prisma.incident.findFirst({
    where: { id: data.incidentId, exercise: { id: data.exerciseId, orgId: me.orgId } },
  });
  if (!incident) return;

  await createICONotification(incident.id, new Date());
  revalidatePath(`/exercises/${data.exerciseId}/live`);
  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
}
