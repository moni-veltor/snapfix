import "server-only";
import { prisma } from "@/lib/prisma";
import { currentDDay, isDue } from "@/lib/dday";

/**
 * Lazy reconciliation pass — for an IN_PROGRESS exercise, create EventRelease /
 * InjectRelease rows for any scheduled event/inject whose D-Day time has been
 * reached but which hasn't been formally released yet. This makes the feed,
 * read-receipt grid and regulator-clock triggers reflect reality without
 * requiring a background worker.
 *
 * Idempotent and cheap — only runs the DB writes for what's actually new.
 * Called from heartbeatAction and from facilitator/live page loads.
 */
export async function autoReleaseExpired(exerciseId: string): Promise<{
  releasedEvents: number;
  releasedInjects: number;
}> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      scenario: {
        include: {
          events: { where: { isScheduled: true }, select: { id: true, scheduledTime: true } },
          injects: { where: { isScheduled: true }, select: { id: true, scheduledTime: true } },
        },
      },
      eventReleases: { select: { eventId: true } },
      injectReleases: { select: { injectId: true } },
    },
  });
  if (!exercise || exercise.status !== "IN_PROGRESS") {
    return { releasedEvents: 0, releasedInjects: 0 };
  }

  const clock = currentDDay(exercise.dDayAnchor, exercise.speedMultiplier);
  const releasedEventIds = new Set(exercise.eventReleases.map((r) => r.eventId));
  const releasedInjectIds = new Set(exercise.injectReleases.map((r) => r.injectId));

  let releasedEvents = 0;
  let releasedInjects = 0;

  for (const e of exercise.scenario.events) {
    if (releasedEventIds.has(e.id)) continue;
    if (!isDue(e.scheduledTime, clock)) continue;
    await prisma.eventRelease.upsert({
      where: { exerciseId_eventId: { exerciseId: exercise.id, eventId: e.id } },
      create: { exerciseId: exercise.id, eventId: e.id, triggeredBy: null },
      update: {},
    });
    releasedEvents++;
  }

  for (const j of exercise.scenario.injects) {
    if (releasedInjectIds.has(j.id)) continue;
    if (!isDue(j.scheduledTime, clock)) continue;
    await prisma.injectRelease.upsert({
      where: { exerciseId_injectId: { exerciseId: exercise.id, injectId: j.id } },
      create: { exerciseId: exercise.id, injectId: j.id, triggeredBy: null },
      update: {},
    });
    releasedInjects++;
  }

  return { releasedEvents, releasedInjects };
}
