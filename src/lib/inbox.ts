import "server-only";
import { prisma } from "@/lib/prisma";
import { currentDDay, isDue } from "@/lib/dday";

type Roles = {
  /** The participant's own role title (e.g. "CTO", "Sn.TPM"). Case-insensitive match. */
  roleTitle: string;
  /** ExerciseParticipant id (for receipt lookups). */
  participantId: string;
};

/**
 * Returns whether an event/inject is addressed to the participant by role-title match.
 * Treats a missing toRoleTitles list as "addressed to nobody" — facilitators see
 * everything via a separate code path, not through the inbox.
 */
function addressedTo(roleTitle: string, to: string[], cc: string[]): "TO" | "CC" | null {
  const r = roleTitle.toLowerCase();
  if (to.some((t) => t.toLowerCase() === r)) return "TO";
  if (cc.some((t) => t.toLowerCase() === r)) return "CC";
  return null;
}

export type InboxItem = {
  kind: "EVENT" | "INJECT";
  id: string;
  scheduledTime: string;
  released: boolean;
  releasedAt: Date | null;
  title: string;
  summary: string;
  from: string | null;
  to: string[];
  cc: string[];
  addressing: "TO" | "CC";
  unread: boolean;
};

export async function loadInbox(exerciseId: string, me: Roles): Promise<InboxItem[]> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      scenario: {
        include: {
          events: { orderBy: { scheduledTime: "asc" } },
          injects: { orderBy: { scheduledTime: "asc" } },
        },
      },
      eventReleases: true,
      injectReleases: true,
    },
  });
  if (!exercise) return [];

  const clock = currentDDay(exercise.dDayAnchor, exercise.speedMultiplier);

  const eventReleaseMap = new Map(exercise.eventReleases.map((r) => [r.eventId, r.releasedAt]));
  const injectReleaseMap = new Map(exercise.injectReleases.map((r) => [r.injectId, r.releasedAt]));

  const receipts = await Promise.all([
    prisma.eventReceipt.findMany({
      where: { participantId: me.participantId, event: { scenarioId: exercise.scenarioId } },
      select: { eventId: true },
    }),
    prisma.injectReceipt.findMany({
      where: { participantId: me.participantId, inject: { scenarioId: exercise.scenarioId } },
      select: { injectId: true },
    }),
  ]);
  const readEventIds = new Set(receipts[0].map((r) => r.eventId));
  const readInjectIds = new Set(receipts[1].map((r) => r.injectId));

  const items: InboxItem[] = [];

  for (const e of exercise.scenario.events) {
    const addressing = addressedTo(me.roleTitle, e.toRoleTitles, e.ccRoleTitles);
    if (!addressing) continue;
    const released =
      eventReleaseMap.has(e.id) ||
      (exercise.status === "IN_PROGRESS" && e.isScheduled && isDue(e.scheduledTime, clock));
    if (!released) continue;
    items.push({
      kind: "EVENT",
      id: e.id,
      scheduledTime: e.scheduledTime,
      released: true,
      releasedAt: eventReleaseMap.get(e.id) ?? null,
      title: e.title,
      summary: e.description.slice(0, 240),
      from: e.senderRoleTitle,
      to: e.toRoleTitles,
      cc: e.ccRoleTitles,
      addressing,
      unread: !readEventIds.has(e.id),
    });
  }

  for (const j of exercise.scenario.injects) {
    const addressing = addressedTo(me.roleTitle, j.toRoleTitles, j.ccRoleTitles);
    if (!addressing) continue;
    const released =
      injectReleaseMap.has(j.id) ||
      (exercise.status === "IN_PROGRESS" && j.isScheduled && isDue(j.scheduledTime, clock));
    if (!released) continue;
    items.push({
      kind: "INJECT",
      id: j.id,
      scheduledTime: j.scheduledTime,
      released: true,
      releasedAt: injectReleaseMap.get(j.id) ?? null,
      title: j.summary,
      summary: j.description.slice(0, 240),
      from: j.senderRoleTitle,
      to: j.toRoleTitles,
      cc: j.ccRoleTitles,
      addressing,
      unread: !readInjectIds.has(j.id),
    });
  }

  items.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  return items;
}

export { currentDDay };
