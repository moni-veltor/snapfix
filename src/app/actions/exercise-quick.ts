"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";

async function loadDraft(exerciseId: string) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, orgId: user.orgId },
    select: { id: true, status: true, regulatorMode: true },
  });
  if (!exercise) return null;
  // Once past PLANNING, regulator-mode locks edits.
  if (exercise.regulatorMode && exercise.status !== "PLANNING") return null;
  return { user, exercise };
}

const Schedule = z.object({
  exerciseId: z.string(),
  plannedDate: z.string().optional(),
  durationMin: z.preprocess(
    (v) => (typeof v === "string" && v !== "" ? parseInt(v, 10) : undefined),
    z.number().int().positive().optional(),
  ),
  timeZone: z.string().optional(),
  speedMultiplier: z.preprocess(
    (v) => (typeof v === "string" && v !== "" ? parseFloat(v) : undefined),
    z.number().positive().optional(),
  ),
  location: z.string().max(200).optional(),
});

export async function setExerciseScheduleAction(formData: FormData) {
  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") raw[k] = v;
  const data = Schedule.parse(raw);
  const ctx = await loadDraft(data.exerciseId);
  if (!ctx) return;
  await prisma.exercise.update({
    where: { id: data.exerciseId },
    data: {
      plannedDate: data.plannedDate ? new Date(data.plannedDate) : null,
      durationMin: data.durationMin ?? null,
      timeZone: data.timeZone || null,
      speedMultiplier: data.speedMultiplier ?? 1,
      location: data.location ?? null,
    },
  });
  revalidatePath(`/exercises/${data.exerciseId}`);
}

const Objectives = z.object({
  exerciseId: z.string(),
  objectivesText: z.string().max(2000).optional(),
});

export async function setExerciseObjectivesAction(formData: FormData) {
  const data = Objectives.parse(Object.fromEntries(formData));
  const ctx = await loadDraft(data.exerciseId);
  if (!ctx) return;
  const objectives = (data.objectivesText ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
  await prisma.exercise.update({
    where: { id: data.exerciseId },
    data: { objectives },
  });
  revalidatePath(`/exercises/${data.exerciseId}`);
}

const IbsLinks = z.object({
  exerciseId: z.string(),
  ibsIdsCsv: z.string().max(2000).optional(),
});

export async function setExerciseIbsLinksAction(formData: FormData) {
  const data = IbsLinks.parse(Object.fromEntries(formData));
  const ctx = await loadDraft(data.exerciseId);
  if (!ctx) return;
  const wantIds = (data.ibsIdsCsv ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // Restrict to ibs owned by this org
  const valid = await prisma.organizationIBS.findMany({
    where: { id: { in: wantIds }, orgId: ctx.user.orgId },
    select: { id: true },
  });
  const validIds = valid.map((v) => v.id);

  // Replace the link set
  await prisma.exerciseIBSLink.deleteMany({ where: { exerciseId: data.exerciseId } });
  if (validIds.length > 0) {
    await prisma.exerciseIBSLink.createMany({
      data: validIds.map((ibsId) => ({ exerciseId: data.exerciseId, ibsId })),
    });
  }
  revalidatePath(`/exercises/${data.exerciseId}`);
}

const RegAudience = z.object({
  exerciseId: z.string(),
  regulatorAudience: z.string().max(120).optional(),
});

export async function setRegulatorAudienceAction(formData: FormData) {
  const data = RegAudience.parse(Object.fromEntries(formData));
  const ctx = await loadDraft(data.exerciseId);
  if (!ctx) return;
  await prisma.exercise.update({
    where: { id: data.exerciseId },
    data: { regulatorAudience: data.regulatorAudience?.trim() || null },
  });
  revalidatePath(`/exercises/${data.exerciseId}`);
}
