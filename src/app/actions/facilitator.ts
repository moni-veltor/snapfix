"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { parseHHMM } from "@/lib/dday";

const BulkReleaseSchema = z.object({
  exerciseId: z.string(),
  /** Release everything with scheduledTime ≤ this HH:MM. */
  upToHHMM: z.string().regex(/^\d{2}:\d{2}$/),
  kinds: z.string().optional(), // "EVENTS,INJECTS" — defaults to both
});

/** Release every event/inject scheduled at or before a given D-Day time. */
export async function bulkReleaseAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const data = BulkReleaseSchema.parse(Object.fromEntries(formData));
  const exercise = await prisma.exercise.findFirst({
    where: { id: data.exerciseId, orgId: me.orgId },
    select: { id: true, scenarioId: true },
  });
  if (!exercise) return;

  const upToMin = parseHHMM(data.upToHHMM);
  const kinds = (data.kinds ?? "EVENTS,INJECTS").split(",");

  if (kinds.includes("EVENTS")) {
    const candidates = await prisma.event.findMany({
      where: { scenarioId: exercise.scenarioId },
      select: { id: true, scheduledTime: true },
    });
    for (const e of candidates) {
      if (parseHHMM(e.scheduledTime) > upToMin) continue;
      await prisma.eventRelease.upsert({
        where: { exerciseId_eventId: { exerciseId: exercise.id, eventId: e.id } },
        create: { exerciseId: exercise.id, eventId: e.id, triggeredBy: me.id },
        update: {},
      });
    }
  }
  if (kinds.includes("INJECTS")) {
    const candidates = await prisma.inject.findMany({
      where: { scenarioId: exercise.scenarioId },
      select: { id: true, scheduledTime: true },
    });
    for (const j of candidates) {
      if (parseHHMM(j.scheduledTime) > upToMin) continue;
      await prisma.injectRelease.upsert({
        where: { exerciseId_injectId: { exerciseId: exercise.id, injectId: j.id } },
        create: { exerciseId: exercise.id, injectId: j.id, triggeredBy: me.id },
        update: {},
      });
    }
  }

  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}

const RecallSchema = z.object({
  exerciseId: z.string(),
  kind: z.enum(["EVENT", "INJECT"]),
  id: z.string(),
});

/** Un-release a previously released event/inject (e.g. fired prematurely). */
export async function recallReleaseAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const data = RecallSchema.parse(Object.fromEntries(formData));
  const exercise = await prisma.exercise.findFirst({
    where: { id: data.exerciseId, orgId: me.orgId },
    select: { id: true },
  });
  if (!exercise) return;

  if (data.kind === "EVENT") {
    await prisma.eventRelease.deleteMany({
      where: { exerciseId: exercise.id, eventId: data.id },
    });
    await prisma.eventReceipt.deleteMany({
      where: { eventId: data.id, participant: { exerciseId: exercise.id } },
    });
  } else {
    await prisma.injectRelease.deleteMany({
      where: { exerciseId: exercise.id, injectId: data.id },
    });
    await prisma.injectReceipt.deleteMany({
      where: { injectId: data.id, participant: { exerciseId: exercise.id } },
    });
  }

  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}

const ScrubSchema = z.object({
  exerciseId: z.string(),
  deltaMinutes: z.string(), // signed integer as string
});

/**
 * Scrub the D-Day clock forward (or backward) by N minutes. Only allowed when
 * exercise is PAUSED — used to skip dead time in a tabletop without changing
 * the speed multiplier.
 */
export async function scrubDDayAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const data = ScrubSchema.parse(Object.fromEntries(formData));
  const delta = parseInt(data.deltaMinutes, 10);
  if (Number.isNaN(delta)) return;

  const exercise = await prisma.exercise.findFirst({
    where: { id: data.exerciseId, orgId: me.orgId },
    select: { id: true, status: true, dDayAnchor: true, speedMultiplier: true },
  });
  if (!exercise || exercise.status !== "PAUSED" || !exercise.dDayAnchor) return;

  // Shift the anchor by `delta` D-Day minutes (accounting for the speed multiplier).
  const realMs = (delta * 60 * 1000) / Math.max(1, exercise.speedMultiplier);
  const newAnchor = new Date(exercise.dDayAnchor.getTime() - realMs);
  await prisma.exercise.update({
    where: { id: exercise.id },
    data: { dDayAnchor: newAnchor },
  });

  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}

const BroadcastSchema = z.object({
  exerciseId: z.string(),
  message: z.string().min(1),
});

/**
 * Facilitator broadcast — out-of-band message to all participants ("Lunch.
 * Exercise paused 45m"). Recorded as a log entry of kind ACTION with the
 * special author = facilitator.
 */
export async function broadcastAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const data = BroadcastSchema.parse(Object.fromEntries(formData));
  const exercise = await prisma.exercise.findFirst({
    where: { id: data.exerciseId, orgId: me.orgId },
    select: { id: true },
  });
  if (!exercise) return;

  await prisma.incidentLogEntry.create({
    data: {
      exerciseId: exercise.id,
      authorId: me.id,
      dDayTime: "FACILITATOR",
      kind: "NOTE",
      body: `📢 FACILITATOR BROADCAST: ${data.message}`,
    },
  });

  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}
