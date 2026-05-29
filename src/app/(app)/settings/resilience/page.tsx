import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ResilienceSettingsForm from "./ResilienceSettingsForm";

export const metadata = { title: "Resilience attestation — Settings — SnapFix" };

export default async function ResilienceSettingsPage() {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const [org, users] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: me.orgId },
      select: {
        smfAccountableForResilienceUserId: true,
        boardCommitteeForResilienceName: true,
        attestationCycleStartMonth: true,
      },
    }),
    prisma.user.findMany({
      where: { orgId: me.orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <ResilienceSettingsForm
      smfUserId={org.smfAccountableForResilienceUserId}
      boardCommittee={org.boardCommitteeForResilienceName}
      cycleStartMonth={org.attestationCycleStartMonth}
      users={users}
    />
  );
}
