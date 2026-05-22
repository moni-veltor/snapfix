"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { currentDDay, parseHHMM } from "@/lib/dday";

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
    select: { id: true, scenarioId: true, dDayAnchor: true, speedMultiplier: true },
  });
  if (!exercise) return;

  const upToMin = parseHHMM(data.upToHHMM);
  const kinds = (data.kinds ?? "EVENTS,INJECTS").split(",");

  let eventCount = 0;
  let injectCount = 0;
  if (kinds.includes("EVENTS")) {
    const candidates = await prisma.event.findMany({
      where: { scenarioId: exercise.scenarioId },
      select: { id: true, scheduledTime: true },
    });
    for (const e of candidates) {
      if (parseHHMM(e.scheduledTime) > upToMin) continue;
      const res = await prisma.eventRelease.upsert({
        where: { exerciseId_eventId: { exerciseId: exercise.id, eventId: e.id } },
        create: { exerciseId: exercise.id, eventId: e.id, triggeredBy: me.id },
        update: {},
      });
      if (res) eventCount++;
    }
  }
  if (kinds.includes("INJECTS")) {
    const candidates = await prisma.inject.findMany({
      where: { scenarioId: exercise.scenarioId },
      select: { id: true, scheduledTime: true },
    });
    for (const j of candidates) {
      if (parseHHMM(j.scheduledTime) > upToMin) continue;
      const res = await prisma.injectRelease.upsert({
        where: { exerciseId_injectId: { exerciseId: exercise.id, injectId: j.id } },
        create: { exerciseId: exercise.id, injectId: j.id, triggeredBy: me.id },
        update: {},
      });
      if (res) injectCount++;
    }
  }

  if (eventCount + injectCount > 0) {
    const clock = currentDDay(exercise.dDayAnchor, exercise.speedMultiplier);
    const parts: string[] = [];
    if (eventCount > 0) parts.push(`${eventCount} event${eventCount === 1 ? "" : "s"}`);
    if (injectCount > 0) parts.push(`${injectCount} inject${injectCount === 1 ? "" : "s"}`);
    await prisma.facilitatorAnnouncement.create({
      data: {
        exerciseId: exercise.id,
        authorId: me.id,
        kind: "BULK_RELEASE",
        message: `Facilitator bulk-released ${parts.join(" + ")} up to D-Day ${data.upToHHMM}`,
        metadata: { upToHHMM: data.upToHHMM, eventCount, injectCount },
        dDayTime: clock.hhmm,
      },
    });
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
    select: { id: true, dDayAnchor: true, speedMultiplier: true },
  });
  if (!exercise) return;

  let summary: string;
  if (data.kind === "EVENT") {
    const ev = await prisma.event.findUnique({
      where: { id: data.id },
      select: { title: true, scheduledTime: true },
    });
    summary = ev ? `event "${ev.title}" (scheduled ${ev.scheduledTime})` : "an event";
    await prisma.eventRelease.deleteMany({
      where: { exerciseId: exercise.id, eventId: data.id },
    });
    await prisma.eventReceipt.deleteMany({
      where: { eventId: data.id, participant: { exerciseId: exercise.id } },
    });
  } else {
    const ij = await prisma.inject.findUnique({
      where: { id: data.id },
      select: { summary: true, scheduledTime: true, injectNo: true },
    });
    summary = ij
      ? `inject #${ij.injectNo} "${ij.summary}" (scheduled ${ij.scheduledTime})`
      : "an inject";
    await prisma.injectRelease.deleteMany({
      where: { exerciseId: exercise.id, injectId: data.id },
    });
    await prisma.injectReceipt.deleteMany({
      where: { injectId: data.id, participant: { exerciseId: exercise.id } },
    });
  }

  const clock = currentDDay(exercise.dDayAnchor, exercise.speedMultiplier);
  await prisma.facilitatorAnnouncement.create({
    data: {
      exerciseId: exercise.id,
      authorId: me.id,
      kind: "RECALL",
      message: `Facilitator recalled ${summary}`,
      metadata: { kind: data.kind, summary },
      dDayTime: clock.hhmm,
    },
  });

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

  const realMs = (delta * 60 * 1000) / Math.max(1, exercise.speedMultiplier);
  const newAnchor = new Date(exercise.dDayAnchor.getTime() - realMs);
  await prisma.exercise.update({
    where: { id: exercise.id },
    data: { dDayAnchor: newAnchor },
  });

  const direction = delta >= 0 ? "FORWARD" : "BACKWARD";
  const absDelta = Math.abs(delta);
  const clock = currentDDay(newAnchor, exercise.speedMultiplier);
  await prisma.facilitatorAnnouncement.create({
    data: {
      exerciseId: exercise.id,
      authorId: me.id,
      kind: "SCRUB",
      message: `Facilitator skipped the clock ${direction === "FORWARD" ? "forward" : "back"} ${absDelta} min — D-Day is now ${clock.hhmm}`,
      metadata: { deltaMinutes: delta, direction },
      dDayTime: clock.hhmm,
    },
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
    select: { id: true, dDayAnchor: true, speedMultiplier: true },
  });
  if (!exercise) return;

  const clock = currentDDay(exercise.dDayAnchor, exercise.speedMultiplier);

  await prisma.incidentLogEntry.create({
    data: {
      exerciseId: exercise.id,
      authorId: me.id,
      dDayTime: "FACILITATOR",
      kind: "NOTE",
      body: `📢 FACILITATOR BROADCAST: ${data.message}`,
    },
  });

  // Pinned BROADCASTs stick at the top of /live until each participant
  // dismisses them locally — facilitator's coordination cue is too
  // important to hide in the feed.
  await prisma.facilitatorAnnouncement.create({
    data: {
      exerciseId: exercise.id,
      authorId: me.id,
      kind: "BROADCAST",
      message: data.message,
      pinned: true,
      dDayTime: clock.hhmm,
    },
  });

  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}
