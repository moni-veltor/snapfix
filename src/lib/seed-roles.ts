import type { PrismaClient } from "@/generated/prisma/client";
import { DEFAULT_ROLES, type DefaultRole } from "./default-roles";

/**
 * Idempotently seed the default IMT/IRT/Comms role catalogue for an org.
 * Run on org creation; safe to re-run (upserts on `(orgId, abbreviation)`).
 * Builds the deputy chain in a second pass after all roles exist.
 */
export async function seedDefaultRolesForOrg(prisma: PrismaClient, orgId: string): Promise<void> {
  // Pass 1 — upsert every role without deputies wired up
  for (const role of DEFAULT_ROLES) {
    await prisma.organizationRole.upsert({
      where: { orgId_abbreviation: { orgId, abbreviation: role.abbreviation } },
      create: {
        orgId,
        abbreviation: role.abbreviation,
        title: role.title,
        responsibility: role.responsibility,
        isSMF: role.isSMF,
        isExecutive: role.isExecutive,
        orderIdx: role.orderIdx,
      },
      update: {
        title: role.title,
        responsibility: role.responsibility,
        isSMF: role.isSMF,
        isExecutive: role.isExecutive,
        orderIdx: role.orderIdx,
      },
    });
  }

  // Pass 2 — wire deputy chain
  const orgRoles = await prisma.organizationRole.findMany({
    where: { orgId },
    select: { id: true, abbreviation: true },
  });
  const byAbbr = new Map(orgRoles.map((r) => [r.abbreviation, r.id]));
  for (const role of DEFAULT_ROLES) {
    if (!role.deputyOf) continue;
    const myId = byAbbr.get(role.abbreviation);
    const deputyOfId = byAbbr.get(role.deputyOf);
    if (!myId || !deputyOfId) continue;
    await prisma.organizationRole.update({
      where: { id: myId },
      data: { deputyOfRoleId: deputyOfId },
    });
  }
}

/**
 * Assign a default-holder user to a named role (by abbreviation) for an org.
 * Useful in seed scripts. No-op if the role doesn't exist yet.
 */
export async function assignDefaultHolder(
  prisma: PrismaClient,
  orgId: string,
  abbreviation: string,
  userId: string,
): Promise<void> {
  await prisma.organizationRole.updateMany({
    where: { orgId, abbreviation },
    data: { defaultHolderId: userId },
  });
}
