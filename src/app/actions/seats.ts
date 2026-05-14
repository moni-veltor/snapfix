"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser, requireOrgRole } from "@/lib/auth";
import { SeatStatus } from "@/generated/prisma/enums";

/**
 * Ensure an exercise has a seat row for every role in the org. Idempotent.
 * Called on exercise create + on transition-to-ready, so seats are guaranteed
 * present by the time anyone tries to claim one.
 */
export async function ensureSeatsForExerciseAction(formData: FormData): Promise<void> {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const exerciseId = String(formData.get("exerciseId"));
  await ensureSeatsForExercise(exerciseId, me.orgId);
  revalidatePath(`/exercises/${exerciseId}/live`);
  revalidatePath(`/exercises/${exerciseId}/team`);
}

/** Library helper — usable from other server actions (e.g. on startExercise). */
export async function ensureSeatsForExercise(exerciseId: string, orgId: string): Promise<void> {
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, orgId },
    select: { id: true },
  });
  if (!exercise) return;
  const roles = await prisma.organizationRole.findMany({
    where: { orgId },
    select: { id: true },
  });
  for (const r of roles) {
    await prisma.exerciseSeat.upsert({
      where: { exerciseId_roleId: { exerciseId, roleId: r.id } },
      create: { exerciseId, roleId: r.id, status: "EMPTY" },
      update: {},
    });
  }
}

const ClaimSchema = z.object({
  exerciseId: z.string(),
  seatId: z.string(),
  /** Whether the caller is stepping up as deputy (i.e. covering for a seat
      whose primary role is different from theirs). */
  asDeputy: z.string().optional(),
});

/**
 * Claim a seat in an exercise. If the caller already holds another seat, that
 * one is automatically vacated — one person, one primary seat at a time.
 * (A facilitator can hold the Facilitator role independently.)
 */
export async function claimSeatAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = ClaimSchema.parse(Object.fromEntries(formData));

  const seat = await prisma.exerciseSeat.findFirst({
    where: { id: data.seatId, exercise: { orgId: me.orgId } },
    include: { exercise: { select: { id: true } } },
  });
  if (!seat) return;

  // Vacate any other seat the user currently holds in this exercise
  await prisma.exerciseSeat.updateMany({
    where: {
      exerciseId: seat.exerciseId,
      holderUserId: me.id,
      id: { not: seat.id },
    },
    data: {
      status: SeatStatus.STOOD_DOWN,
      holderUserId: null,
      vacatedAt: new Date(),
    },
  });

  await prisma.exerciseSeat.update({
    where: { id: seat.id },
    data: {
      status: data.asDeputy === "on" ? SeatStatus.DEPUTY_FILLED : SeatStatus.CLAIMED,
      holderUserId: me.id,
      claimedAt: new Date(),
      vacatedAt: null,
      isDeputy: data.asDeputy === "on",
    },
  });

  // Also keep ExerciseParticipant in sync so existing inbox / mobilisation
  // queries still work (the participant exists, with their seat's role title
  // copied into the roleTitle field for back-compat).
  const role = await prisma.organizationRole.findUnique({
    where: { id: seat.roleId },
    select: { abbreviation: true },
  });
  if (role) {
    await prisma.exerciseParticipant.upsert({
      where: { exerciseId_userId: { exerciseId: seat.exerciseId, userId: me.id } },
      create: {
        exerciseId: seat.exerciseId,
        userId: me.id,
        roleTitle: role.abbreviation,
        exerciseRole: "PARTICIPANT",
        mobilisationStatus: "MOBILISED",
        mobilisedAt: new Date(),
      },
      update: {
        roleTitle: role.abbreviation,
        mobilisationStatus: "MOBILISED",
        mobilisedAt: new Date(),
      },
    });
  }

  revalidatePath(`/exercises/${seat.exerciseId}/live`);
  revalidatePath(`/exercises/${seat.exerciseId}/team`);
  revalidatePath(`/exercises/${seat.exerciseId}/facilitator`);
}

const VacateSchema = z.object({
  exerciseId: z.string(),
  seatId: z.string(),
});

export async function vacateSeatAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = VacateSchema.parse(Object.fromEntries(formData));
  const seat = await prisma.exerciseSeat.findFirst({
    where: {
      id: data.seatId,
      exercise: { orgId: me.orgId },
      holderUserId: me.id,
    },
  });
  if (!seat) return;
  await prisma.exerciseSeat.update({
    where: { id: seat.id },
    data: {
      status: SeatStatus.EMPTY,
      holderUserId: null,
      vacatedAt: new Date(),
      isDeputy: false,
    },
  });
  revalidatePath(`/exercises/${seat.exerciseId}/live`);
}

const MarkUnreachableSchema = z.object({
  exerciseId: z.string(),
  seatId: z.string(),
});

/** Mark a seat as unreachable (signals deputies should step up). */
export async function markSeatUnreachableAction(formData: FormData) {
  await requireOrgUser();
  const data = MarkUnreachableSchema.parse(Object.fromEntries(formData));
  await prisma.exerciseSeat.update({
    where: { id: data.seatId },
    data: {
      status: SeatStatus.UNREACHABLE,
      vacatedAt: new Date(),
    },
  });
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}
