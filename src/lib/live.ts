import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * A single chronological row in the live war-room feed. Different kinds carry
 * different metadata in the discriminated union, but every row has a timestamp
 * the UI uses to interleave them.
 */
export type LiveFeedItem =
  | {
      kind: "EVENT_RELEASED";
      id: string;
      at: Date;
      title: string;
      eventNo: number;
      scheduledTime: string;
      senderRoleTitle: string | null;
      toRoleTitles: string[];
    }
  | {
      kind: "INJECT_RELEASED";
      id: string;
      at: Date;
      title: string;
      injectNo: number;
      scheduledTime: string;
      senderRoleTitle: string | null;
      toRoleTitles: string[];
    }
  | {
      kind: "LOG";
      id: string;
      at: Date;
      author: string;
      logKind: string;
      dDayTime: string;
      body: string;
    }
  | {
      kind: "RESPONSE";
      id: string;
      at: Date;
      author: string;
      injectId: string;
      injectSummary: string;
      assessment: string;
    }
  | {
      kind: "COMMS";
      id: string;
      at: Date;
      author: string;
      audience: string;
      subject: string;
    }
  | {
      kind: "STATUS";
      id: string;
      at: Date;
      status: string;
    };

export type PresenceMember = {
  participantId: string;
  userId: string;
  name: string | null;
  email: string;
  roleTitle: string;
  exerciseRole: string;
  teamName: string | null;
  lastSeenAt: Date | null;
  online: boolean;
};

const ONLINE_WINDOW_MS = 30_000; // last 30s counts as "live in the room"

export async function loadPresence(exerciseId: string): Promise<PresenceMember[]> {
  const rows = await prisma.exerciseParticipant.findMany({
    where: { exerciseId },
    include: {
      user: { select: { name: true, email: true } },
      team: { select: { name: true } },
    },
    orderBy: [{ exerciseRole: "asc" }, { roleTitle: "asc" }],
  });
  const now = Date.now();
  return rows.map((r) => ({
    participantId: r.id,
    userId: r.userId,
    name: r.user.name,
    email: r.user.email,
    roleTitle: r.roleTitle,
    exerciseRole: r.exerciseRole,
    teamName: r.team?.name ?? null,
    lastSeenAt: r.lastSeenAt,
    online: !!r.lastSeenAt && now - r.lastSeenAt.getTime() < ONLINE_WINDOW_MS,
  }));
}

export async function loadLiveFeed(exerciseId: string, limit = 80): Promise<LiveFeedItem[]> {
  const [exercise, eventReleases, injectReleases, log, responses, comms] = await Promise.all([
    prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: {
        status: true,
        startedAt: true,
        pausedAt: true,
        completedAt: true,
      },
    }),
    prisma.eventRelease.findMany({
      where: { exerciseId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventNo: true,
            scheduledTime: true,
            senderRoleTitle: true,
            toRoleTitles: true,
          },
        },
      },
    }),
    prisma.injectRelease.findMany({
      where: { exerciseId },
      include: {
        inject: {
          select: {
            id: true,
            summary: true,
            injectNo: true,
            scheduledTime: true,
            senderRoleTitle: true,
            toRoleTitles: true,
          },
        },
      },
    }),
    prisma.incidentLogEntry.findMany({
      where: { exerciseId },
      include: { author: { select: { name: true, email: true } } },
    }),
    prisma.participantResponse.findMany({
      where: { exerciseId },
      include: {
        author: { select: { name: true, email: true } },
        inject: { select: { id: true, summary: true } },
      },
    }),
    prisma.communicationDraft.findMany({
      where: { exerciseId },
      include: { author: { select: { name: true, email: true } } },
    }),
  ]);

  const items: LiveFeedItem[] = [];

  for (const r of eventReleases) {
    items.push({
      kind: "EVENT_RELEASED",
      id: `event-release:${r.id}`,
      at: r.releasedAt,
      title: r.event.title,
      eventNo: r.event.eventNo,
      scheduledTime: r.event.scheduledTime,
      senderRoleTitle: r.event.senderRoleTitle,
      toRoleTitles: r.event.toRoleTitles,
    });
  }
  for (const r of injectReleases) {
    items.push({
      kind: "INJECT_RELEASED",
      id: `inject-release:${r.id}`,
      at: r.releasedAt,
      title: r.inject.summary,
      injectNo: r.inject.injectNo,
      scheduledTime: r.inject.scheduledTime,
      senderRoleTitle: r.inject.senderRoleTitle,
      toRoleTitles: r.inject.toRoleTitles,
    });
  }
  for (const l of log) {
    items.push({
      kind: "LOG",
      id: `log:${l.id}`,
      at: l.createdAt,
      author: l.author?.name ?? l.author?.email ?? "—",
      logKind: l.kind,
      dDayTime: l.dDayTime,
      body: l.body,
    });
  }
  for (const r of responses) {
    items.push({
      kind: "RESPONSE",
      id: `response:${r.id}`,
      at: r.updatedAt,
      author: r.author?.name ?? r.author?.email ?? "—",
      injectId: r.inject.id,
      injectSummary: r.inject.summary,
      assessment: r.assessment,
    });
  }
  for (const c of comms) {
    items.push({
      kind: "COMMS",
      id: `comms:${c.id}`,
      at: c.createdAt,
      author: c.author?.name ?? c.author?.email ?? "—",
      audience: c.audience,
      subject: c.subject,
    });
  }
  if (exercise?.startedAt) {
    items.push({
      kind: "STATUS",
      id: `status:started`,
      at: exercise.startedAt,
      status: "Exercise started",
    });
  }
  if (exercise?.pausedAt) {
    items.push({ kind: "STATUS", id: `status:paused`, at: exercise.pausedAt, status: "Exercise paused" });
  }
  if (exercise?.completedAt) {
    items.push({
      kind: "STATUS",
      id: `status:completed`,
      at: exercise.completedAt,
      status: "Exercise completed",
    });
  }

  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  return items.slice(0, limit);
}
