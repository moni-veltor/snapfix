"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";

const SaveSchema = z.object({
  exerciseId: z.string(),
  body: z.string().max(50000),
});

/**
 * Save the shared exercise scratchpad. Idempotent — one scratchpad per
 * exercise, overwritten each save. Captures the last editor so the UI can
 * say "edited by X · 12s ago".
 */
export async function saveScratchpadAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = SaveSchema.parse(Object.fromEntries(formData));

  const exercise = await prisma.exercise.findFirst({
    where: { id: data.exerciseId, orgId: me.orgId },
    select: { id: true },
  });
  if (!exercise) return;

  await prisma.exerciseScratchpad.upsert({
    where: { exerciseId: exercise.id },
    create: {
      exerciseId: exercise.id,
      body: data.body,
      lastEditedById: me.id,
      lastEditedAt: new Date(),
    },
    update: {
      body: data.body,
      lastEditedById: me.id,
      lastEditedAt: new Date(),
    },
  });

  revalidatePath(`/exercises/${exercise.id}/live`);
}
