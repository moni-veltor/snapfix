import "server-only";
import { prisma } from "@/lib/prisma";
import { currentDDay, isDue } from "@/lib/dday";

export async function loadRunWithScenario(id: string) {
  return prisma.exerciseRun.findUnique({
    where: { id },
    include: {
      scenario: {
        include: {
          ibsList: { orderBy: { code: "asc" } },
          events: { orderBy: { eventNo: "asc" } },
          injects: { orderBy: { injectNo: "asc" } },
          debriefQuestions: { orderBy: { orderIdx: "asc" } },
          facilitatorQuestions: { orderBy: { orderIdx: "asc" } },
        },
      },
      eventReleases: true,
      injectReleases: true,
      incidentLog: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, email: true } } } },
      responses: { include: { author: { select: { name: true, email: true } }, inject: true } },
      comms: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true, email: true } } } },
      debriefAnswers: { include: { question: true, author: { select: { name: true, email: true } } } },
      aar: true,
    },
  });
}

export type RunWithScenario = NonNullable<Awaited<ReturnType<typeof loadRunWithScenario>>>;

/**
 * Compute, for the current D-Day clock, which events/injects are released to participants.
 * Released = (manually released by facilitator) OR (scheduled and the D-Day time has been reached).
 */
export function computeVisibility(run: RunWithScenario) {
  const clock = currentDDay(run.dDayAnchor, run.speedMultiplier);
  const releasedEventIds = new Set(run.eventReleases.map((r) => r.eventId));
  const releasedInjectIds = new Set(run.injectReleases.map((r) => r.injectId));

  const events = run.scenario.events.map((e) => {
    const released =
      releasedEventIds.has(e.id) ||
      (run.status === "IN_PROGRESS" && e.isScheduled && isDue(e.scheduledTime, clock));
    return { ...e, released };
  });

  const injects = run.scenario.injects.map((j) => {
    const released =
      releasedInjectIds.has(j.id) ||
      (run.status === "IN_PROGRESS" && j.isScheduled && isDue(j.scheduledTime, clock));
    return { ...j, released };
  });

  return { clock, events, injects };
}
