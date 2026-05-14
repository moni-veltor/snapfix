import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeAchievements,
  ACHIEVEMENT_ICONS,
  type Achievement,
} from "@/lib/achievements";
import Hoot from "@/components/fun/Hoot";

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/sign-in");
  const orgId = session.user.orgId;

  const now = new Date();
  const ago90 = new Date(now.getTime() - 90 * 86_400_000);

  const [
    ibsCount,
    exercisesCompleted,
    exercisesLast90,
    drTestCount,
    coverage,
    rolesTotal,
    rolesWithDeputy,
    vendorsCritical,
  ] = await Promise.all([
    prisma.organizationIBS.count({ where: { orgId } }),
    prisma.exercise.count({ where: { orgId, status: "COMPLETED" } }),
    prisma.exercise.count({ where: { orgId, startedAt: { gte: ago90 } } }),
    prisma.dRTest.count({ where: { system: { orgId } } }),
    prisma.exercise.findMany({
      where: { orgId, status: { in: ["IN_PROGRESS", "PAUSED", "COMPLETED"] } },
      include: {
        scenario: {
          select: {
            coversPeople: true,
            coversProperty: true,
            coversTechnology: true,
            coversDataAvailability: true,
            coversDataIntegrity: true,
            coversThirdParty: true,
          },
        },
      },
    }),
    prisma.organizationRole.count({ where: { orgId } }),
    prisma.organizationRole.count({
      where: { orgId, deputyOfRoleId: { not: null } },
    }),
    prisma.vendor.findMany({
      where: { orgId, OR: [{ tier: "TIER_1" }, { isDoraCritical: true }] },
      select: { exitPlanNotes: true, exitPlanReviewedAt: true },
    }),
  ]);

  const harmTypesCovered = [
    coverage.some((e) => e.scenario.coversPeople),
    coverage.some((e) => e.scenario.coversProperty),
    coverage.some((e) => e.scenario.coversTechnology),
    coverage.some((e) => e.scenario.coversDataAvailability),
    coverage.some((e) => e.scenario.coversDataIntegrity),
    coverage.some((e) => e.scenario.coversThirdParty),
  ].filter(Boolean).length;

  const vendorsWithExitPlan = vendorsCritical.filter(
    (v) =>
      v.exitPlanNotes && v.exitPlanNotes.trim().length > 40 && v.exitPlanReviewedAt,
  ).length;

  const achievements = computeAchievements({
    ibsCount,
    exercisesCompletedCount: exercisesCompleted,
    exercisesLast90Days: exercisesLast90,
    drTestCount,
    harmTypesCovered,
    rolesWithDeputy,
    rolesTotal,
    vendorsWithExitPlan,
    vendorsCriticalTotal: vendorsCritical.length,
  });

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Hoot mood={unlocked === total ? "happy" : "thinking"} size={72} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-soft">
              Culture
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
              Achievements
            </h1>
            <p className="mt-1 text-sm text-muted">
              Resilience-positive habits, tracked.
            </p>
          </div>
        </div>
        <div className="rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card-glow)]">
          {unlocked} / {total} unlocked
        </div>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => (
          <li key={a.id}>
            <BadgeCard a={a} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BadgeCard({ a }: { a: Achievement }) {
  const Icon = ACHIEVEMENT_ICONS[a.iconName];
  return (
    <article
      className={`flex h-full flex-col gap-2 rounded-xl border p-4 transition-all ${
        a.unlocked
          ? "border-indigo-300 bg-gradient-brand-soft shadow-[var(--shadow-card-glow)]"
          : "border-line bg-surface-1 opacity-70 grayscale"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            a.unlocked
              ? "bg-gradient-brand text-white"
              : "bg-surface-2 text-soft"
          }`}
        >
          <Icon size={18} />
        </span>
        {a.unlocked ? (
          <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
            Unlocked
          </span>
        ) : (
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-soft">
            Locked
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-ink">{a.label}</h3>
      <p className="text-xs text-muted">{a.description}</p>
      {a.progress && (
        <p className="mt-auto text-[10px] font-mono text-soft">{a.progress}</p>
      )}
    </article>
  );
}
