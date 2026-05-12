import "server-only";
import { prisma } from "@/lib/prisma";
import { currentDDay, isDue } from "@/lib/dday";

export async function loadExerciseWithScenario(id: string, orgId: string) {
  return prisma.exercise.findFirst({
    where: { id, orgId },
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

export type ExerciseWithScenario = NonNullable<Awaited<ReturnType<typeof loadExerciseWithScenario>>>;

/**
 * Compute, for the current D-Day clock, which events/injects are released to participants.
 * Released = (manually released by facilitator) OR (scheduled and the D-Day time has been reached).
 */
export function computeVisibility(exercise: ExerciseWithScenario) {
  const clock = currentDDay(exercise.dDayAnchor, exercise.speedMultiplier);
  const releasedEventIds = new Set(exercise.eventReleases.map((r) => r.eventId));
  const releasedInjectIds = new Set(exercise.injectReleases.map((r) => r.injectId));

  const events = exercise.scenario.events.map((e) => {
    const released =
      releasedEventIds.has(e.id) ||
      (exercise.status === "IN_PROGRESS" && e.isScheduled && isDue(e.scheduledTime, clock));
    return { ...e, released };
  });

  const injects = exercise.scenario.injects.map((j) => {
    const released =
      releasedInjectIds.has(j.id) ||
      (exercise.status === "IN_PROGRESS" && j.isScheduled && isDue(j.scheduledTime, clock));
    return { ...j, released };
  });

  return { clock, events, injects };
}
