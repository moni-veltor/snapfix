import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const metadata = { title: "Get started — SnapFix" };

export default async function OnboardingWizardPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/sign-in");
  const orgId = session.user.orgId;

  const [
    org,
    rolesCount,
    ibsCount,
    memberCount,
    exerciseCount,
    presetApplied,
  ] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { name: true },
    }),
    prisma.organizationRole.count({ where: { orgId } }),
    prisma.organizationIBS.count({ where: { orgId } }),
    prisma.user.count({ where: { orgId } }),
    prisma.exercise.count({ where: { orgId } }),
    // We treat "preset applied" as a heuristic: org has >=5 default-named
    // canonical roles. Replace with an explicit flag if needed.
    prisma.organizationRole
      .count({
        where: {
          orgId,
          abbreviation: { in: ["CEO", "CRO", "CTO", "COO"] },
        },
      })
      .then((n) => n >= 3),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <OnboardingWizard
        orgName={org.name}
        myName={session.user.name ?? session.user.email}
        status={{
          hasPreset: presetApplied,
          hasRoles: rolesCount >= 5,
          hasIBS: ibsCount >= 1,
          hasTeammates: memberCount >= 2,
          hasExercise: exerciseCount >= 1,
        }}
      />
    </div>
  );
}
