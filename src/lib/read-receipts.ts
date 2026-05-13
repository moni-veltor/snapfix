import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Build a participants × messages matrix of read receipts for the facilitator
 * console. Rows = participants, columns = released events/injects (in
 * chronological release order). Cells say whether the participant has read.
 */
export type ReceiptCell = {
  participantId: string;
  messageKind: "EVENT" | "INJECT";
  messageId: string;
  /** "READ" if a receipt exists, "ADDRESSED" if addressed and unread, "OUT" if not addressed. */
  state: "READ" | "ADDRESSED" | "OUT";
  readAt: Date | null;
};

export type ReceiptMessage = {
  kind: "EVENT" | "INJECT";
  id: string;
  no: number;
  scheduledTime: string;
  title: string;
  toRoleTitles: string[];
  ccRoleTitles: string[];
  releasedAt: Date | null;
};

export type ReceiptParticipant = {
  id: string;
  name: string;
  roleTitle: string;
};

export async function loadReadReceipts(exerciseId: string) {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      participants: {
        include: { user: { select: { name: true, email: true } } },
      },
      scenario: {
        include: {
          events: true,
          injects: true,
        },
      },
      eventReleases: true,
      injectReleases: true,
    },
  });
  if (!exercise) return null;

  const releasedEventIds = new Set(exercise.eventReleases.map((r) => r.eventId));
  const releasedInjectIds = new Set(exercise.injectReleases.map((r) => r.injectId));

  const releaseTimeByEvent = new Map(exercise.eventReleases.map((r) => [r.eventId, r.releasedAt]));
  const releaseTimeByInject = new Map(exercise.injectReleases.map((r) => [r.injectId, r.releasedAt]));

  const messages: ReceiptMessage[] = [
    ...exercise.scenario.events
      .filter((e) => releasedEventIds.has(e.id))
      .map((e) => ({
        kind: "EVENT" as const,
        id: e.id,
        no: e.eventNo,
        scheduledTime: e.scheduledTime,
        title: e.title,
        toRoleTitles: e.toRoleTitles,
        ccRoleTitles: e.ccRoleTitles,
        releasedAt: releaseTimeByEvent.get(e.id) ?? null,
      })),
    ...exercise.scenario.injects
      .filter((j) => releasedInjectIds.has(j.id))
      .map((j) => ({
        kind: "INJECT" as const,
        id: j.id,
        no: j.injectNo,
        scheduledTime: j.scheduledTime,
        title: j.summary,
        toRoleTitles: j.toRoleTitles,
        ccRoleTitles: j.ccRoleTitles,
        releasedAt: releaseTimeByInject.get(j.id) ?? null,
      })),
  ].sort((a, b) => (a.releasedAt?.getTime() ?? 0) - (b.releasedAt?.getTime() ?? 0));

  const participants: ReceiptParticipant[] = exercise.participants.map((p) => ({
    id: p.id,
    name: p.user.name ?? p.user.email,
    roleTitle: p.roleTitle,
  }));

  // Receipts: only matters for released messages, look up actual receipt rows
  const [eventReceipts, injectReceipts] = await Promise.all([
    prisma.eventReceipt.findMany({
      where: { event: { scenarioId: exercise.scenarioId }, participant: { exerciseId } },
    }),
    prisma.injectReceipt.findMany({
      where: { inject: { scenarioId: exercise.scenarioId }, participant: { exerciseId } },
    }),
  ]);
  const eventReadKey = (eId: string, pId: string) => `${eId}:${pId}`;
  const readEventSet = new Map(eventReceipts.map((r) => [eventReadKey(r.eventId, r.participantId), r.readAt]));
  const readInjectSet = new Map(injectReceipts.map((r) => [eventReadKey(r.injectId, r.participantId), r.readAt]));

  const cells: ReceiptCell[] = [];
  for (const m of messages) {
    const toLower = new Set(m.toRoleTitles.map((r) => r.toLowerCase()));
    const ccLower = new Set(m.ccRoleTitles.map((r) => r.toLowerCase()));
    for (const p of participants) {
      const r = p.roleTitle.toLowerCase();
      const addressed = toLower.has(r) || ccLower.has(r);
      if (!addressed) {
        cells.push({
          participantId: p.id,
          messageKind: m.kind,
          messageId: m.id,
          state: "OUT",
          readAt: null,
        });
        continue;
      }
      const readMap = m.kind === "EVENT" ? readEventSet : readInjectSet;
      const readAt = readMap.get(eventReadKey(m.id, p.id)) ?? null;
      cells.push({
        participantId: p.id,
        messageKind: m.kind,
        messageId: m.id,
        state: readAt ? "READ" : "ADDRESSED",
        readAt,
      });
    }
  }

  return { messages, participants, cells };
}
