import { redirect } from "next/navigation";
import { Crown, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ACHIEVEMENT_ICONS,
  TIER_TONE,
  computeAchievements,
  computeLevel,
  type Achievement,
} from "@/lib/achievements";
import Hoot from "@/components/fun/Hoot";
import { ProgressRing } from "@/components/ui/charts";

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/sign-in");
  const orgId = session.user.orgId;

  const now = new Date();
  const ago90 = new Date(now.getTime() - 90 * 86_400_000);
  const ago1y = new Date(now.getTime() - 365 * 86_400_000);

  const [
    ibsTotal,
    untestedIBSCount,
    exercisesCompleted,
    exercisesLast90,
    exercisesLast12mo,
    drTestCount,
    systemsCount,
    systemsTestedCount,
    coverage,
    rolesTotal,
    rolesWithDeputy,
    vendorsCritical,
    scenariosClonedCount,
    exerciseStartedAts,
  ] = await Promise.all([
    prisma.organizationIBS.count({ where: { orgId } }),
    prisma.organizationIBS.count({
      where: { orgId, exerciseLinks: { none: {} } },
    }),
    prisma.exercise.count({ where: { orgId, status: "COMPLETED" } }),
    prisma.exercise.count({ where: { orgId, startedAt: { gte: ago90 } } }),
    prisma.exercise.count({ where: { orgId, startedAt: { gte: ago1y } } }),
    prisma.dRTest.count({ where: { system: { orgId } } }),
    prisma.techSystem.count({ where: { orgId } }),
    prisma.techSystem.count({ where: { orgId, drTests: { some: {} } } }),
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
    prisma.scenario.count({
      where: { orgId, templateOriginId: { not: null } },
    }),
    prisma.exercise.findMany({
      where: { orgId, startedAt: { not: null, gte: ago1y } },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
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

  // Monthly-exercise streak ending in the current month
  const monthsSet = new Set<string>();
  for (const e of exerciseStartedAts) {
    if (!e.startedAt) continue;
    monthsSet.add(monthKey(e.startedAt));
  }
  let monthsWithExerciseStreak = 0;
  let cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  while (monthsSet.has(monthKey(cursor))) {
    monthsWithExerciseStreak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    if (monthsWithExerciseStreak > 36) break;
  }

  const achievements = computeAchievements({
    ibsCount: ibsTotal,
    ibsTestedCount: ibsTotal - untestedIBSCount,
    ibsTotal,
    exercisesCompletedCount: exercisesCompleted,
    exercisesLast90Days: exercisesLast90,
    exercisesLast12Months: exercisesLast12mo,
    monthsWithExerciseStreak,
    drTestCount,
    systemsCount,
    systemsTestedCount,
    harmTypesCovered,
    rolesWithDeputy,
    rolesTotal,
    vendorsWithExitPlan,
    vendorsCriticalTotal: vendorsCritical.length,
    scenariosClonedCount,
  });

  const level = computeLevel(achievements);
  const platinums = achievements.filter((a) => a.tier === "platinum").length;
  const byCategory = group(achievements, (a) => a.category);

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border-2 border-indigo-400 bg-gradient-brand p-6 text-white shadow-[var(--shadow-card-glow)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Hoot mood={platinums > 0 ? "happy" : "thinking"} size={88} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">
                Resilience programme
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                {level.rank}
              </h1>
              <p className="mt-1 text-sm text-white/90">
                Level {level.level} ·{" "}
                <span className="font-semibold">{level.xp.toLocaleString()} XP</span>
              </p>
            </div>
          </div>
          <ProgressRing
            value={Math.round(level.progressPct * 100)}
            label={`${Math.round(level.progressPct * 100)}%`}
            sublabel={`to lvl ${level.level + 1}`}
            size={120}
            thickness={10}
            gradient={false}
            color="#ffffff"
          />
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <Stat icon={Sparkles} label="Bronze" count={achievements.filter((a) => a.tier === "bronze").length} />
          <Stat icon={Sparkles} label="Silver" count={achievements.filter((a) => a.tier === "silver").length} />
          <Stat icon={Sparkles} label="Gold" count={achievements.filter((a) => a.tier === "gold").length} />
          <Stat icon={Crown} label="Platinum" count={platinums} />
        </div>
      </header>

      {Object.entries(byCategory).map(([cat, items]) => (
        <section key={cat} className="space-y-3">
          <header className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-soft">
              {cat}
            </h2>
            <span className="text-[11px] text-soft">
              {items.filter((i) => i.tier).length} / {items.length} unlocked
            </span>
          </header>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <li key={a.id}>
                <BadgeCard achievement={a} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
      <Icon size={12} className="text-white/70" />
      <span className="text-[10px] uppercase tracking-wider text-white/70">{label}</span>
      <span className="ml-auto text-base font-semibold text-white">{count}</span>
    </div>
  );
}

function BadgeCard({ achievement: a }: { achievement: Achievement }) {
  const Icon = ACHIEVEMENT_ICONS[a.iconName];
  const unlocked = a.tier !== null;
  const toneRef = a.tier ? TIER_TONE[a.tier] : null;
  return (
    <article
      className={`relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-line p-4 transition-all ${
        unlocked
          ? `bg-surface-1 ring-2 ${toneRef!.ring}`
          : "bg-surface-1 opacity-60 grayscale"
      }`}
    >
      {unlocked && toneRef && (
        <div
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneRef.ribbon}`}
        />
      )}
      <div className="flex items-start justify-between">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            unlocked && toneRef ? `${toneRef.bg} ${toneRef.text}` : "bg-surface-2 text-soft"
          }`}
        >
          <Icon size={20} />
        </span>
        {unlocked && toneRef ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${toneRef.bg} ${toneRef.text}`}
          >
            {toneRef.label}
          </span>
        ) : (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-soft">
            Locked
          </span>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-ink">{a.label}</h3>
        <p className="mt-1 text-xs text-muted">{a.description}</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-soft">
          {a.progressLabel && <span>{a.progressLabel}</span>}
          {a.nextThresholdLabel && (
            <span className="text-soft">next: {a.nextThresholdLabel}</span>
          )}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full ${
              unlocked && toneRef
                ? `bg-gradient-to-r ${toneRef.ribbon}`
                : "bg-line-strong"
            }`}
            style={{ width: `${Math.round(a.progressInTier * 100)}%` }}
          />
        </div>
      </div>

      {unlocked && a.xpAwarded > 0 && (
        <footer className="mt-auto border-t border-line pt-2 text-[10px] text-soft">
          <span className="font-semibold text-ink">+{a.xpAwarded.toLocaleString()} XP</span>{" "}
          earned
        </footer>
      )}
    </article>
  );
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function group<T, K extends string>(items: T[], key: (t: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const k = key(item);
    if (!out[k]) out[k] = [];
    out[k].push(item);
  }
  return out;
}
