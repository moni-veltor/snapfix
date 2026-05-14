"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";
import { autoReleaseExpired } from "@/lib/auto-release";

/**
 * Update the calling participant's `lastSeenAt` so the presence bar can show
 * who's currently in the live workspace, and reconcile any scheduled events
 * /injects whose D-Day time has passed but which haven't been formally
 * released yet. Called every few seconds by the live page.
 */
export async function heartbeatAction(exerciseId: string): Promise<void> {
  const me = await requireOrgUser();
  // Verify the exercise is in the user's org, then both: heartbeat the
  // participant + auto-release any scheduled items whose D-Day time has come.
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, orgId: me.orgId },
    select: { id: true },
  });
  if (!exercise) return;
  await prisma.exerciseParticipant.updateMany({
    where: { exerciseId: exercise.id, userId: me.id },
    data: { lastSeenAt: new Date() },
  });
  // Fire-and-forget — the auto-release is idempotent and any error here
  // shouldn't break the heartbeat.
  autoReleaseExpired(exercise.id).catch((err) =>
    console.error("[auto-release] failed:", err),
  );
}
