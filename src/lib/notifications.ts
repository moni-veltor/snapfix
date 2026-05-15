import { prisma } from "@/lib/prisma";

/**
 * Build a per-user notification feed from existing data. No new tables;
 * we derive items from action items, exercises, decisions and PIRs that
 * the signed-in user touches.
 *
 * Returns up to 20 most-recent items, newest first.
 */

export type NotificationKind =
  | "action-item-overdue"
  | "action-item-due-soon"
  | "exercise-live"
  | "exercise-completed"
  | "pir-overdue"
  | "audit-event";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  at: Date;
  /** Optional weight to bias unread counts. 1 = normal, 2 = elevated. */
  weight?: number;
};

export type LoadOptions = {
  /** Cap on returned items. */
  limit?: number;
};

export async function loadNotifications(
  userId: string,
  orgId: string,
  opts: LoadOptions = {},
): Promise<Notification[]> {
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 86_400_000);

  const [overdueItems, dueSoonItems, liveExercises, recentCompleted, overduePIRs] =
    await Promise.all([
      prisma.exerciseActionItem.findMany({
        where: {
          orgId,
          ownerUserId: userId,
          status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
          dueAt: { lt: now },
        },
        orderBy: { dueAt: "asc" },
        take: 10,
        include: { exercise: { select: { id: true, title: true } } },
      }),
      prisma.exerciseActionItem.findMany({
        where: {
          orgId,
          ownerUserId: userId,
          status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
          dueAt: { gte: now, lte: in7d },
        },
        orderBy: { dueAt: "asc" },
        take: 10,
        include: { exercise: { select: { id: true, title: true } } },
      }),
      prisma.exercise.findMany({
        where: { orgId, status: { in: ["IN_PROGRESS", "PAUSED"] } },
        select: { id: true, title: true, status: true, startedAt: true },
      }),
      prisma.exercise.findMany({
        where: { orgId, status: "COMPLETED" },
        orderBy: { updatedAt: "desc" },
        take: 4,
        select: { id: true, title: true, updatedAt: true },
      }),
      prisma.postIncidentReport
        .findMany({
          where: {
            incident: { exercise: { orgId } },
            submittedAt: null,
            dueAt: { lt: now },
          },
          orderBy: { dueAt: "asc" },
          take: 4,
          include: { incident: { select: { exerciseId: true, title: true } } },
        })
        .catch(() => []),
    ]);

  const items: Notification[] = [];

  for (const ai of overdueItems) {
    items.push({
      id: `aio-${ai.id}`,
      kind: "action-item-overdue",
      title: ai.title,
      body: `Overdue · ${ai.exercise.title}`,
      href: "/action-items?status=overdue",
      at: ai.dueAt ?? ai.updatedAt,
      weight: 2,
    });
  }
  for (const ai of dueSoonItems) {
    items.push({
      id: `aid-${ai.id}`,
      kind: "action-item-due-soon",
      title: ai.title,
      body: `Due ${shortDate(ai.dueAt!)} · ${ai.exercise.title}`,
      href: "/action-items",
      at: ai.dueAt ?? ai.updatedAt,
    });
  }
  for (const e of liveExercises) {
    items.push({
      id: `live-${e.id}`,
      kind: "exercise-live",
      title: e.title,
      body: `Live · ${e.status === "PAUSED" ? "paused" : "in progress"}`,
      href: `/exercises/${e.id}/live`,
      at: e.startedAt ?? new Date(),
      weight: 2,
    });
  }
  for (const e of recentCompleted) {
    items.push({
      id: `done-${e.id}`,
      kind: "exercise-completed",
      title: e.title,
      body: "Completed · review the debrief",
      href: `/exercises/${e.id}/debrief`,
      at: e.updatedAt,
    });
  }
  for (const p of overduePIRs) {
    items.push({
      id: `pir-${p.id}`,
      kind: "pir-overdue",
      title: p.incident.title,
      body: `PIR overdue · due ${shortDate(p.dueAt)}`,
      href: `/exercises/${p.incident.exerciseId}`,
      at: p.dueAt,
      weight: 2,
    });
  }

  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  return items.slice(0, opts.limit ?? 20);
}

function shortDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
