import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  ListChecks,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePulse, pickHeadline } from "@/lib/dashboard";
import { ProgressRing, Sparkline, Bar, Donut, MiniHeatmap } from "@/components/ui/charts";
import FeaturedCard from "@/components/ui/FeaturedCard";
import Card from "@/components/ui/Card";

export default async function Home() {
  const session = await auth();

  if (session?.user && !session.user.orgId) {
    redirect("/onboarding");
  }

  if (!session?.user?.orgId) {
    return <LandingPage />;
  }

  const canManage = session.user.orgRole === "OWNER" || session.user.orgRole === "ADMIN";
  return (
    <Dashboard
      userName={session.user.name ?? session.user.email}
      orgId={session.user.orgId}
      canManage={canManage}
    />
  );
}

async function Dashboard({
  userName,
  orgId,
  canManage,
}: {
  userName: string;
  orgId: string;
  canManage: boolean;
}) {
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const ago90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const ago12Weeks = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000);

  const [
    upcoming,
    inProgress,
    pendingInvites,
    openActionItems,
    overdueActionItems,
    ibsCount,
    untestedIBS,
    recentAudit,
    coverage,
    scenarioCount,
    exerciseCount,
    memberCount,
    rolesCount,
    seatedRoles,
    exercisesLast90Days,
    lastExercise,
    weeklyExercises,
    vendorCount,
    ibsList,
  ] = await Promise.all([
    prisma.exercise.findMany({
      where: {
        orgId,
        status: { in: ["PLANNING", "READY"] },
        plannedDate: { gte: now, lte: in90Days },
      },
      orderBy: { plannedDate: "asc" },
      take: 5,
      include: { scenario: { select: { title: true } } },
    }),
    prisma.exercise.findMany({
      where: { orgId, status: { in: ["IN_PROGRESS", "PAUSED"] } },
      orderBy: { startedAt: "desc" },
      include: { scenario: { select: { title: true } } },
    }),
    canManage
      ? prisma.invitation.count({
          where: { orgId, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
        })
      : Promise.resolve(0),
    prisma.exerciseActionItem.count({
      where: { orgId, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } },
    }),
    prisma.exerciseActionItem.count({
      where: {
        orgId,
        status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
        dueAt: { lt: now },
      },
    }),
    prisma.organizationIBS.count({ where: { orgId } }),
    prisma.organizationIBS.count({
      where: { orgId, exerciseLinks: { none: {} } },
    }),
    canManage
      ? prisma.auditLogEntry.findMany({
          where: { orgId },
          orderBy: { createdAt: "desc" },
          take: 6,
          include: { actor: { select: { name: true, email: true } } },
        })
      : Promise.resolve(
          [] as {
            id: string;
            createdAt: Date;
            summary: string;
            actor: { name: string | null; email: string } | null;
          }[],
        ),
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
    prisma.scenario.count({ where: { orgId, isTemplate: false } }),
    prisma.exercise.count({ where: { orgId } }),
    prisma.user.count({ where: { orgId } }),
    prisma.organizationRole.count({ where: { orgId } }),
    prisma.organizationRole.count({
      where: { orgId, defaultHolderId: { not: null } },
    }),
    prisma.exercise.count({
      where: { orgId, startedAt: { gte: ago90Days } },
    }),
    prisma.exercise.findFirst({
      where: { orgId, startedAt: { not: null } },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    }),
    prisma.exercise.findMany({
      where: { orgId, startedAt: { gte: ago12Weeks } },
      select: { startedAt: true },
    }),
    prisma.vendor.count({ where: { orgId } }).catch(() => 0),
    prisma.organizationIBS.findMany({
      where: { orgId },
      take: 8,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        exerciseLinks: {
          select: {
            exercise: {
              select: {
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
            },
          },
        },
      },
    }),
  ]);

  // Fresh-org guard
  const isFreshOrg =
    canManage && scenarioCount === 0 && exerciseCount === 0 && memberCount <= 1 && ibsCount === 0;

  if (isFreshOrg) {
    return <FreshOrgWelcome userName={userName} />;
  }

  // Harm-type coverage (across all exercises)
  const tested = {
    people: coverage.filter((e) => e.scenario.coversPeople).length,
    property: coverage.filter((e) => e.scenario.coversProperty).length,
    technology: coverage.filter((e) => e.scenario.coversTechnology).length,
    dataAvailability: coverage.filter((e) => e.scenario.coversDataAvailability).length,
    dataIntegrity: coverage.filter((e) => e.scenario.coversDataIntegrity).length,
    thirdParty: coverage.filter((e) => e.scenario.coversThirdParty).length,
  };
  const harmTypesCovered = Object.values(tested).filter((n) => n > 0).length;
  const testedIBS = ibsCount - untestedIBS;

  // Resilience Pulse — composite score
  const pulse = computePulse({
    ibsTotal: ibsCount,
    ibsTested: testedIBS,
    actionItemsTotal: openActionItems,
    actionItemsOverdue: overdueActionItems,
    exercisesLast90Days,
    harmTypesCovered,
  });

  // Headline pick
  const headline = pickHeadline({
    liveExercises: inProgress.map((e) => ({ id: e.id, title: e.title })),
    overdueActionItems,
    ibsTotal: ibsCount,
    exercisesLast90Days,
    lastExerciseAt: lastExercise?.startedAt ?? null,
    pendingInvites,
    rolesConfigured: rolesCount,
  });

  // 12-week exercise sparkline
  const weeklyBuckets = Array.from({ length: 12 }, () => 0);
  for (const e of weeklyExercises) {
    if (!e.startedAt) continue;
    const weeksAgo = Math.floor((now.getTime() - e.startedAt.getTime()) / (7 * 86_400_000));
    if (weeksAgo >= 0 && weeksAgo < 12) {
      weeklyBuckets[11 - weeksAgo] += 1;
    }
  }

  // IBS × harm-type heatmap (top 8 IBSs)
  const harmCols = ["People", "Prop.", "Tech.", "Avail.", "Integ.", "3rd"];
  const heatmapCells: number[][] = ibsList.map((ibs) => {
    const links = ibs.exerciseLinks.map((l) => l.exercise.scenario);
    return [
      links.filter((s) => s.coversPeople).length,
      links.filter((s) => s.coversProperty).length,
      links.filter((s) => s.coversTechnology).length,
      links.filter((s) => s.coversDataAvailability).length,
      links.filter((s) => s.coversDataIntegrity).length,
      links.filter((s) => s.coversThirdParty).length,
    ];
  });

  const featuredExercise = inProgress[0] ?? upcoming[0] ?? null;

  return (
    <div className="space-y-8">
      <PageHeader userName={userName} pulse={pulse} />

      <HeadlineBanner headline={headline} />

      <PulseSection pulse={pulse} weeklyBuckets={weeklyBuckets} />

      <AttentionStrip
        overdueActionItems={overdueActionItems}
        pendingInvites={pendingInvites}
        upcoming={upcoming.length}
        inProgress={inProgress.length}
        untestedIBS={untestedIBS}
        ibsCount={ibsCount}
        rolesCount={rolesCount}
      />

      {featuredExercise && (
        <FeaturedExerciseCard
          exercise={featuredExercise}
          isLive={inProgress.length > 0}
        />
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <CoverageHeatmapPanel
          rows={ibsList.map((i) => i.name)}
          cols={harmCols}
          cells={heatmapCells}
          testedIBS={testedIBS}
          ibsCount={ibsCount}
        />
        <ConcentrationPanel
          rolesCount={rolesCount}
          seatedRoles={seatedRoles}
          vendorCount={vendorCount}
          memberCount={memberCount}
        />
      </section>

      <QuickActions canManage={canManage} ibsCount={ibsCount} rolesCount={rolesCount} />

      {canManage && recentAudit.length > 0 && <RecentActivity items={recentAudit} />}
    </div>
  );
}

function PageHeader({ userName, pulse }: { userName: string; pulse: ReturnType<typeof computePulse> }) {
  const trendIcon =
    pulse.tone === "ok" ? (
      <TrendingUp size={12} />
    ) : pulse.tone === "warn" ? (
      <Clock size={12} />
    ) : (
      <TrendingDown size={12} />
    );

  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-soft">
          Operational resilience console
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          Welcome back, {userName.split(" ")[0]}
        </h1>
      </div>
      <div
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
          pulse.tone === "ok"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
            : pulse.tone === "warn"
              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200"
        }`}
      >
        {trendIcon}
        <span className="font-semibold">Pulse {pulse.total}</span>
        <span className="opacity-70">· grade {pulse.grade}</span>
      </div>
    </header>
  );
}

function HeadlineBanner({ headline }: { headline: ReturnType<typeof pickHeadline> }) {
  const toneClass =
    headline.tone === "live"
      ? "border-rose-300 dark:border-rose-700"
      : headline.tone === "critical"
        ? "border-rose-300 dark:border-rose-700"
        : headline.tone === "warn"
          ? "border-amber-300 dark:border-amber-700"
          : headline.tone === "info"
            ? "border-indigo-300 dark:border-indigo-700"
            : "border-emerald-300 dark:border-emerald-700";

  const eyebrowClass =
    headline.tone === "live"
      ? "text-rose-600 dark:text-rose-300"
      : headline.tone === "critical"
        ? "text-rose-600 dark:text-rose-300"
        : headline.tone === "warn"
          ? "text-amber-600 dark:text-amber-300"
          : headline.tone === "info"
            ? "text-indigo-600 dark:text-indigo-300"
            : "text-emerald-600 dark:text-emerald-300";

  return (
    <FeaturedCard className={toneClass} glow={headline.tone === "live"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <div className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${eyebrowClass}`}>
            {headline.tone === "live" && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
            )}
            {headline.tone === "ok" && <Sparkles size={11} />}
            {headline.tone === "critical" && <ShieldAlert size={11} />}
            {headline.eyebrow}
          </div>
          <h2 className="mt-1.5 text-xl font-semibold text-ink">{headline.title}</h2>
          <p className="mt-1.5 text-sm text-muted">{headline.body}</p>
        </div>
        <Link
          href={headline.cta.href}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {headline.cta.label}
          <ArrowRight size={14} />
        </Link>
      </div>
    </FeaturedCard>
  );
}

function PulseSection({
  pulse,
  weeklyBuckets,
}: {
  pulse: ReturnType<typeof computePulse>;
  weeklyBuckets: number[];
}) {
  const breakdown = [
    { label: "Coverage", value: pulse.coverage, hint: "IBS tested in an exercise" },
    { label: "Hygiene", value: pulse.hygiene, hint: "Action items not overdue" },
    { label: "Cadence", value: pulse.cadence, hint: "Exercises in last 90 days" },
    { label: "Depth", value: pulse.depth, hint: "Harm types covered" },
  ];

  return (
    <section className="grid gap-4 rounded-xl border border-line bg-surface-1 p-5 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center justify-center gap-3 lg:border-r lg:border-line lg:pr-6">
        <ProgressRing
          value={pulse.total}
          label={String(pulse.total)}
          sublabel="Resilience pulse"
          size={170}
          thickness={14}
        />
        <p className="text-center text-xs text-muted">
          Composite of coverage, hygiene, cadence and depth.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {breakdown.map((b) => (
          <div key={b.label} className="space-y-2 rounded-lg border border-line bg-surface-0 p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-soft">
                {b.label}
              </span>
              <span className="text-2xl font-semibold text-ink">{b.value}</span>
            </div>
            <Donut value={b.value} size={56} thickness={6} />
            <p className="text-[10px] text-muted">{b.hint}</p>
          </div>
        ))}
        <div className="col-span-2 rounded-lg border border-line bg-surface-0 p-3 md:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
                Exercise tempo
              </p>
              <p className="text-xs text-muted">Last 12 weeks · one bar per week</p>
            </div>
            <span className="text-xs text-muted">
              Total: {weeklyBuckets.reduce((a, b) => a + b, 0)}
            </span>
          </div>
          <div className="mt-3">
            <Sparkline
              values={weeklyBuckets}
              width={520}
              height={36}
              color="var(--accent)"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AttentionStrip({
  overdueActionItems,
  pendingInvites,
  upcoming,
  inProgress,
  untestedIBS,
  ibsCount,
  rolesCount,
}: {
  overdueActionItems: number;
  pendingInvites: number;
  upcoming: number;
  inProgress: number;
  untestedIBS: number;
  ibsCount: number;
  rolesCount: number;
}) {
  const overdue =
    overdueActionItems +
    (pendingInvites > 5 ? 1 : 0);
  const risk = untestedIBS + (ibsCount === 0 ? 1 : 0) + (rolesCount < 5 ? 1 : 0);

  if (overdue === 0 && risk === 0 && upcoming + inProgress === 0) return null;

  return (
    <section className="grid gap-3 md:grid-cols-3">
      <AttentionCard
        tone="critical"
        icon={<Flame size={14} />}
        label="Overdue"
        value={overdue}
        items={[
          ...(overdueActionItems > 0
            ? [
                {
                  text: `${overdueActionItems} action item${overdueActionItems === 1 ? "" : "s"} past due`,
                  href: "/action-items?status=overdue",
                },
              ]
            : []),
          ...(pendingInvites > 5
            ? [{ text: `${pendingInvites} unaccepted invitations`, href: "/org" }]
            : []),
        ]}
      />
      <AttentionCard
        tone="info"
        icon={<CalendarPlus size={14} />}
        label="Upcoming"
        value={upcoming + inProgress}
        items={[
          ...(inProgress > 0
            ? [{ text: `${inProgress} exercise${inProgress === 1 ? "" : "s"} live now`, href: "/exercises" }]
            : []),
          ...(upcoming > 0
            ? [{ text: `${upcoming} planned in the next 90 days`, href: "/calendar" }]
            : []),
        ]}
      />
      <AttentionCard
        tone="warn"
        icon={<ShieldAlert size={14} />}
        label="Risk"
        value={risk}
        items={[
          ...(ibsCount === 0
            ? [{ text: "No IBS register — regulator's first ask", href: "/ibs/new" }]
            : []),
          ...(untestedIBS > 0
            ? [
                {
                  text: `${untestedIBS} IBS${untestedIBS === 1 ? "" : "s"} never stress-tested`,
                  href: "/ibs",
                },
              ]
            : []),
          ...(rolesCount < 5
            ? [
                {
                  text: `Only ${rolesCount} role${rolesCount === 1 ? "" : "s"} configured — add IMT seats`,
                  href: "/org/roles",
                },
              ]
            : []),
        ]}
      />
    </section>
  );
}

function FeaturedExerciseCard({
  exercise,
  isLive,
}: {
  exercise: { id: string; title: string; scenario: { title: string }; plannedDate: Date | null };
  isLive: boolean;
}) {
  return (
    <Card className="!p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
              isLive
                ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
                : "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300"
            }`}
          >
            {isLive ? <Flame size={22} /> : <CalendarPlus size={22} />}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft">
              {isLive ? "Live exercise" : "Next exercise"}
            </p>
            <h3 className="mt-0.5 text-lg font-semibold text-ink">{exercise.title}</h3>
            <p className="text-xs text-muted">
              {exercise.scenario.title}
              {!isLive && exercise.plannedDate && (
                <>
                  {" "}· {exercise.plannedDate.toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </>
              )}
            </p>
          </div>
        </div>
        <Link
          href={`/exercises/${exercise.id}`}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
        >
          Open
          <ArrowRight size={12} />
        </Link>
      </div>
    </Card>
  );
}

function CoverageHeatmapPanel({
  rows,
  cols,
  cells,
  testedIBS,
  ibsCount,
}: {
  rows: string[];
  cols: string[];
  cells: number[][];
  testedIBS: number;
  ibsCount: number;
}) {
  return (
    <Card className="!p-5">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Coverage heatmap</h3>
          <p className="mt-0.5 text-xs text-muted">
            IBS × harm type · darker = more times stress-tested
          </p>
        </div>
        <Link href="/ibs" className="text-xs text-muted hover:text-ink hover:underline">
          View all →
        </Link>
      </header>
      <div className="mt-4">
        {rows.length === 0 ? (
          <p className="rounded border border-dashed border-line p-4 text-center text-xs text-muted">
            No IBSs registered yet.
          </p>
        ) : (
          <MiniHeatmap
            cells={cells}
            rowLabels={rows}
            colLabels={cols}
            cellSize={20}
            ariaLabel="IBS by harm type coverage"
          />
        )}
      </div>
      <p className="mt-3 text-[11px] text-muted">
        {testedIBS} of {ibsCount} IBSs tested at least once.
      </p>
    </Card>
  );
}

function ConcentrationPanel({
  rolesCount,
  seatedRoles,
  vendorCount,
  memberCount,
}: {
  rolesCount: number;
  seatedRoles: number;
  vendorCount: number;
  memberCount: number;
}) {
  const seatedPct = rolesCount === 0 ? 0 : Math.round((seatedRoles / rolesCount) * 100);

  return (
    <Card className="!p-5">
      <header>
        <h3 className="text-sm font-semibold text-ink">Concentration & coverage</h3>
        <p className="mt-0.5 text-xs text-muted">
          The single-points-of-failure your auditor will probe first.
        </p>
      </header>
      <ul className="mt-4 space-y-4">
        <li>
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink">Role seats with a default holder</span>
            <span className="font-semibold text-ink">{seatedPct}%</span>
          </div>
          <div className="mt-1.5">
            <Bar
              segments={[
                { label: "Assigned", value: seatedRoles, color: "var(--accent)" },
                { label: "Empty", value: Math.max(0, rolesCount - seatedRoles), color: "var(--surface-2)" },
              ]}
              showLegend={false}
              height={8}
            />
          </div>
        </li>
        <li className="flex items-center justify-between text-xs">
          <span className="text-ink">Roles in catalogue</span>
          <span className="font-semibold text-ink">{rolesCount}</span>
        </li>
        <li className="flex items-center justify-between text-xs">
          <span className="text-ink">Third parties tracked</span>
          <span className="font-semibold text-ink">{vendorCount}</span>
        </li>
        <li className="flex items-center justify-between text-xs">
          <span className="text-ink">Team members on roster</span>
          <span className="font-semibold text-ink">{memberCount}</span>
        </li>
      </ul>
    </Card>
  );
}

function QuickActions({
  canManage,
  ibsCount,
  rolesCount,
}: {
  canManage: boolean;
  ibsCount: number;
  rolesCount: number;
}) {
  const actions: { icon: React.ReactNode; label: string; href: string; hint: string }[] = [
    {
      icon: <CalendarPlus size={16} />,
      label: "Plan exercise",
      href: "/exercises/new",
      hint: "Pick a scenario, set a date.",
    },
    {
      icon: <Layers size={16} />,
      label: ibsCount === 0 ? "Add your first IBS" : "Add IBS",
      href: "/ibs/new",
      hint: ibsCount === 0 ? "Required for coverage analytics." : "Register a new business service.",
    },
    {
      icon: <Users size={16} />,
      label: rolesCount < 5 ? "Build role catalogue" : "Edit roles",
      href: "/org/roles",
      hint: "Define the IMT seats participants can claim.",
    },
    {
      icon: <UserPlus size={16} />,
      label: "Invite teammates",
      href: "/org",
      hint: "Get more bodies on the war-room bench.",
    },
  ];

  if (!canManage) return null;

  return (
    <section>
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Quick actions</h3>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <li key={a.label}>
            <Link
              href={a.href}
              className="group flex h-full flex-col gap-2 rounded-lg border border-line bg-surface-1 p-4 transition-all hover:-translate-y-px hover:border-line-strong hover:shadow-[var(--shadow-card-md)]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-indigo-600 dark:text-indigo-300">
                {a.icon}
              </span>
              <span className="text-sm font-semibold text-ink">{a.label}</span>
              <span className="flex items-center gap-1 text-[11px] text-muted">
                {a.hint}
                <ArrowRight size={11} className="opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentActivity({
  items,
}: {
  items: { id: string; createdAt: Date; summary: string; actor: { name: string | null; email: string } | null }[];
}) {
  return (
    <Card className="!p-5">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Recent activity</h3>
        <Link href="/audit" className="text-xs text-muted hover:text-ink hover:underline">
          View all →
        </Link>
      </header>
      <ul className="mt-3 space-y-1.5 text-xs">
        {items.map((e) => (
          <li key={e.id} className="flex items-center gap-2 rounded border border-line bg-surface-0 px-3 py-2">
            <Clock size={11} className="shrink-0 text-soft" />
            <span className="font-mono text-soft">
              {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}
            </span>
            <span className="truncate text-ink">{e.summary}</span>
            <span className="ml-auto shrink-0 text-soft">
              {e.actor?.name ?? e.actor?.email ?? "system"}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AttentionCard({
  tone,
  icon,
  label,
  value,
  items,
}: {
  tone: "critical" | "warn" | "info";
  icon: React.ReactNode;
  label: string;
  value: number;
  items: { text: string; href: string }[];
}) {
  const cls =
    tone === "critical"
      ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
        : "border-indigo-200 bg-indigo-50 dark:border-indigo-800/60 dark:bg-indigo-950/30";
  const badge =
    tone === "critical"
      ? "bg-rose-600 text-white"
      : tone === "warn"
        ? "bg-amber-600 text-white"
        : "bg-indigo-600 text-white";
  return (
    <div className={`rounded-lg border p-4 ${cls}`}>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge}`}>
          {icon}
          {label}
        </span>
        <span className="text-2xl font-bold text-ink">{value}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-muted">All clear.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-xs">
          {items.map((it, i) => (
            <li key={i}>
              <Link href={it.href} className="text-ink hover:underline">
                {it.text} →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FreshOrgWelcome({ userName }: { userName: string }) {
  const steps = [
    {
      title: "Clone a scenario from the library",
      body: "26 ready-made scenarios in the Dynamic Scenario Library. Pick one suited to your firm's tier.",
      href: "/templates",
      cta: "Open library",
    },
    {
      title: "Build the role catalogue",
      body: "Define the IMT seats your firm uses — participants will claim from this list in exercises.",
      href: "/org/roles",
      cta: "Edit roles",
    },
    {
      title: "Capture your IBS register",
      body: "Add your firm's Important Business Services with FCA and PRA tolerances. Required for coverage analytics.",
      href: "/ibs/new",
      cta: "Add an IBS",
    },
    {
      title: "Plan your first exercise",
      body: "Pick a scenario, set a date, assemble the team. The platform handles the rest.",
      href: "/exercises/new",
      cta: "Plan an exercise",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome, {userName.split(" ")[0]}</h1>
        <p className="mt-2 text-sm text-muted">
          Let&apos;s get your operational-resilience programme set up. Four steps and you&apos;re ready to run your first exercise.
        </p>
      </header>
      <FeaturedCard glow>
        <div className="flex items-center gap-3">
          <ListChecks size={20} className="text-indigo-600 dark:text-indigo-300" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              Setup wizard
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-ink">
              You&apos;re four steps from running an exercise.
            </h2>
          </div>
        </div>
      </FeaturedCard>
      <ul className="space-y-2">
        {steps.map((s, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-4 rounded-md border border-line bg-surface-1 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong text-xs text-soft">
                {i + 1}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-ink">{s.title}</div>
                <p className="text-xs text-muted">{s.body}</p>
              </div>
            </div>
            <Link
              href={s.href}
              className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {s.cta}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">SnapFix — Operational Resilience</h1>
        <p className="max-w-2xl text-muted">
          Plan, run, and learn from operational resilience exercises. Design CMORG-aligned scenarios,
          run live functional exercises with your incident management team, capture decisions and
          communications against a D-Day clock, and produce after-action reports that feed back into
          your operational resilience programme.
        </p>
        <div className="flex gap-3 pt-2">
          <Link href="/sign-up" className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
            Create an organisation
          </Link>
          <Link href="/sign-in" className="rounded-md border border-line-strong px-4 py-2 hover:bg-surface-1">
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}

const _CheckCircle2 = CheckCircle2;
void _CheckCircle2;
