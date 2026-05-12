"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";

/**
 * Update the calling participant's `lastSeenAt` so the presence bar can show
 * who's currently in the live workspace. Idempotent and cheap — called every
 * few seconds by the live page.
 */
export async function heartbeatAction(exerciseId: string): Promise<void> {
  const me = await requireOrgUser();
  await prisma.exerciseParticipant.updateMany({
    where: {
      exerciseId,
      userId: me.id,
      exercise: { orgId: me.orgId },
    },
    data: { lastSeenAt: new Date() },
  });
}
