"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole, requireOrgUser } from "@/lib/auth";
import { TeamKind, MobilisationStatus } from "@/generated/prisma/enums";

const ClassifySchema = z.object({
  exerciseId: z.string(),
  teamId: z.string(),
  kind: z.enum([
    "IMT",
    "IRT_TECH",
    "IRT_CUSTOMER",
    "COMMS",
    "BRT_FINANCE",
    "BRT_BUILDINGS",
    "BRT_TECH",
    "BRT_COMMS",
    "EXECUTIVE_OBSERVERS",
    "ACTION_COMMITTEE",
    "OTHER",
  ]),
});

/** Stamp a team with its policy-aligned TeamKind. */
export async function classifyTeamAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const data = ClassifySchema.parse(Object.fromEntries(formData));
  await prisma.exerciseTeam.updateMany({
    where: { id: data.teamId, exercise: { id: data.exerciseId, orgId: me.orgId } },
    data: { kind: data.kind as TeamKind },
  });
  revalidatePath(`/exercises/${data.exerciseId}`);
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}

const DeputySchema = z.object({
  exerciseId: z.string(),
  participantId: z.string(),
  deputyParticipantId: z.string().optional(),
});

/** Set or clear the deputy for a participant (best practice deputy chain). */
export async function setDeputyAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const data = DeputySchema.parse(Object.fromEntries(formData));
  await prisma.exerciseParticipant.updateMany({
    where: { id: data.participantId, exercise: { id: data.exerciseId, orgId: me.orgId } },
    data: { deputyParticipantId: data.deputyParticipantId || null },
  });
  revalidatePath(`/exercises/${data.exerciseId}`);
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}

const MobiliseSchema = z.object({
  exerciseId: z.string(),
  participantId: z.string(),
  status: z.enum(["MOBILISED", "UNREACHABLE", "DEPUTY_STEPPED_UP", "STOOD_DOWN", "UNCALLED"]),
});

/**
 * Update mobilisation status for a participant. When marking UNREACHABLE and
 * a deputy is registered, the deputy is auto-promoted to DEPUTY_STEPPED_UP.
 */
export async function mobiliseParticipantAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = MobiliseSchema.parse(Object.fromEntries(formData));

  const exercise = await prisma.exercise.findFirst({
    where: { id: data.exerciseId, orgId: me.orgId },
    select: { id: true },
  });
  if (!exercise) return;

  const participant = await prisma.exerciseParticipant.findFirst({
    where: { id: data.participantId, exerciseId: exercise.id },
  });
  if (!participant) return;

  await prisma.exerciseParticipant.update({
    where: { id: participant.id },
    data: {
      mobilisationStatus: data.status as MobilisationStatus,
      mobilisedAt: data.status === "MOBILISED" ? new Date() : participant.mobilisedAt,
    },
  });

  if (data.status === "UNREACHABLE" && participant.deputyParticipantId) {
    await prisma.exerciseParticipant.update({
      where: { id: participant.deputyParticipantId },
      data: { mobilisationStatus: MobilisationStatus.DEPUTY_STEPPED_UP, mobilisedAt: new Date() },
    });
  }

  revalidatePath(`/exercises/${data.exerciseId}`);
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}
