"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";

/** Get the caller's ExerciseParticipant for a given exercise, or null. */
async function findMyParticipant(exerciseId: string) {
  const me = await requireOrgUser();
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, orgId: me.orgId },
    select: { id: true },
  });
  if (!exercise) return null;
  return prisma.exerciseParticipant.findFirst({
    where: { exerciseId, userId: me.id },
  });
}

export async function markEventReadAction(formData: FormData) {
  const exerciseId = String(formData.get("exerciseId"));
  const eventId = String(formData.get("eventId"));
  const me = await findMyParticipant(exerciseId);
  if (!me) return;
  await prisma.eventReceipt.upsert({
    where: { eventId_participantId: { eventId, participantId: me.id } },
    create: { eventId, participantId: me.id },
    update: {},
  });
  revalidatePath(`/exercises/${exerciseId}/inbox`);
}

export async function markInjectReadAction(formData: FormData) {
  const exerciseId = String(formData.get("exerciseId"));
  const injectId = String(formData.get("injectId"));
  const me = await findMyParticipant(exerciseId);
  if (!me) return;
  await prisma.injectReceipt.upsert({
    where: { injectId_participantId: { injectId, participantId: me.id } },
    create: { injectId, participantId: me.id },
    update: {},
  });
  revalidatePath(`/exercises/${exerciseId}/inbox`);
}
