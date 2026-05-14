"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";
import { currentDDay } from "@/lib/dday";
import { ReactionTarget } from "@/generated/prisma/enums";

const PostSchema = z.object({
  exerciseId: z.string(),
  body: z.string().min(1).max(2000),
});

/** Post a team-chat message. The author's current role is denormalised. */
export async function postChatMessageAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = PostSchema.parse(Object.fromEntries(formData));

  const exercise = await prisma.exercise.findFirst({
    where: { id: data.exerciseId, orgId: me.orgId },
    select: { id: true, dDayAnchor: true, speedMultiplier: true },
  });
  if (!exercise) return;

  // Resolve the author's currently-held seat (if any) for display labelling.
  const seat = await prisma.exerciseSeat.findFirst({
    where: { exerciseId: exercise.id, holderUserId: me.id },
    include: { role: { select: { abbreviation: true } } },
  });

  const clock = currentDDay(exercise.dDayAnchor, exercise.speedMultiplier);

  await prisma.chatMessage.create({
    data: {
      exerciseId: exercise.id,
      authorId: me.id,
      authorRoleAbbreviation: seat?.role.abbreviation ?? null,
      body: data.body,
      dDayTime: clock.hhmm,
    },
  });

  revalidatePath(`/exercises/${exercise.id}/live`);
  revalidatePath(`/exercises/${exercise.id}/facilitator`);
}

const ToggleReactionSchema = z.object({
  exerciseId: z.string(),
  targetType: z.enum(["CHAT", "LOG_ENTRY", "DECISION", "SITREP"]),
  targetId: z.string(),
  emoji: z.string().min(1).max(8),
});

/** Toggle a reaction by the current user. If they've already reacted with
 *  this emoji on this target, removes the reaction. Otherwise creates it. */
export async function toggleReactionAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = ToggleReactionSchema.parse(Object.fromEntries(formData));

  const exercise = await prisma.exercise.findFirst({
    where: { id: data.exerciseId, orgId: me.orgId },
    select: { id: true },
  });
  if (!exercise) return;

  const existing = await prisma.reaction.findFirst({
    where: {
      targetType: data.targetType as ReactionTarget,
      targetId: data.targetId,
      userId: me.id,
      emoji: data.emoji,
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: {
        targetType: data.targetType as ReactionTarget,
        targetId: data.targetId,
        userId: me.id,
        emoji: data.emoji,
        chatMessageId: data.targetType === "CHAT" ? data.targetId : null,
      },
    });
  }

  revalidatePath(`/exercises/${data.exerciseId}/live`);
  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
}

const SetOnCallSchema = z.object({
  exerciseId: z.string(),
  status: z.string().max(120).optional(),
});

/**
 * Broadcast (or clear) an "on a call" status. Empty `status` clears it.
 */
export async function setOnCallStatusAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = SetOnCallSchema.parse(Object.fromEntries(formData));
  await prisma.exerciseParticipant.updateMany({
    where: { exerciseId: data.exerciseId, userId: me.id, exercise: { orgId: me.orgId } },
    data: {
      onCallStatus: data.status?.trim() || null,
      onCallSince: data.status?.trim() ? new Date() : null,
    },
  });
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}
