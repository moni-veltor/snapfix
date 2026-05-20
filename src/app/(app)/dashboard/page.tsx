import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertOctagon,
  ArrowRight,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Crown,
  Database,
  FileText,
  Flame,
  ListChecks,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computePulse,
  nextBestActions,
  type NextBestAction,
} from "@/lib/dashboard";
import {
  aggregateExitReadiness,
  assuranceStatus,
  hyperscalerConcentration,
  type VendorLite,
} from "@/lib/dora";
import { postureScore, type SystemWithTests } from "@/lib/tech-recovery";
import { MiniHeatmap, ProgressRing, Sparkline } from "@/components/ui/charts";
import FeaturedCard from "@/components/ui/FeaturedCard";
import DailyTipCard from "@/components/fun/DailyTipCard";
import YourLiveExerciseWidget from "@/components/dashboard/YourLiveExerciseWidget";
import RecapCard from "@/components/dashboard/RecapCard";
import {
  buildDashboardRecap,
  consumeRecapCutPoint,
} from "@/lib/dashboard-recap";

export default async function Home() {
  const session = await auth();
  if (session?.user && !session.user.orgId) redirect("/onboarding");
  if (!session?.user?.orgId) return <LandingPage />;

  const canManage =
    session.user.orgRole === "OWNER" || session.user.orgRole === "ADMIN";
  return (
    <Dashboard
      userId={session.user.id}
      userName={session.user.name ?? session.user.email}
      orgId={session.user.orgId}
      canManage={canManage}
    />
  );
}

async function Dashboard({
  userId,
  userName,
  orgId,
  canManage,
}: {
  userId: string;
  userName: string;
  orgId: string;
  canManage: boolean;
}) {
  const now = new Date();
  const ago90 = new Date(now.getTime() - 90 * 86_400_000);
  const ago12w = new Date(now.getTime() - 84 * 86_400_000);
  const ago7d = new Date(now.getTime() - 7 * 86_400_000);
  const in30d = new Date(now.getTime() + 30 * 86_400_000);

  // "Since you were here last" cut point — read + maybe bump in one call.
  // Returns the *prior* timestamp so refreshes within the 4h cooldown keep
  // surfacing the same recap.
  const recapCutPoint = await consumeRecapCutPoint(userId);
  const recap = await buildDashboardRecap({ orgId, since: recapCutPoint });

  const [
    inProgress,
    openActionItems,
    overdueActionItems,
    ibsCount,
    untestedIBS,
    ibsReviewDueSoon,
    ibsSample,
    coverage,
    scenarioCount,
    exerciseCount,
    exercisesLast90Days,
    weeklyExercises,
    memberCount,
    rolesTotal,
    rolesWithDeputy,
    rolesWithDefaultHolder,
    pendingInvites,
    vendors,
    techSystems,
    recentSitreps,
    recentDecisions,
    openRegulatorNotifications,
    overduePIRs,
    recentClones,
  ] = await Promise.all([
    prisma.exercise.findMany({
      where: { orgId, status: { in: ["IN_PROGRESS", "PAUSED"] } },
      orderBy: { startedAt: "desc" },
      include: { scenario: { select: { title: true } } },
    }),
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
    prisma.organizationIBS.count({
      where: { orgId, reviewDueAt: { gte: now, lte: in30d } },
    }),
    prisma.organizationIBS.findMany({
      where: { orgId },
      take: 6,
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
    prisma.exercise.count({ where: { orgId, startedAt: { gte: ago90 } } }),
    prisma.exercise.findMany({
      where: { orgId, startedAt: { gte: ago12w } },
      select: { startedAt: true },
    }),
    prisma.user.count({ where: { orgId } }),
    prisma.organizationRole.count({ where: { orgId } }),
    prisma.organizationRole.count({
      where: { orgId, deputyOfRoleId: { not: null } },
    }),
    prisma.organizationRole.count({
      where: { orgId, defaultHolderId: { not: null } },
    }),
    canManage
      ? prisma.invitation.count({
          where: { orgId, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
        })
      : Promise.resolve(0),
    prisma.vendor.findMany({
      where: { orgId },
      include: { _count: { select: { ibsLinks: true } } },
    }),
    prisma.techSystem.findMany({
      where: { orgId },
      include: { drTests: { orderBy: { testedAt: "desc" }, take: 5 } },
    }),
    prisma.sitrep.findMany({
      where: { incident: { exercise: { orgId } }, createdAt: { gte: ago7d } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { incident: { select: { title: true, exerciseId: true } } },
    }),
    prisma.decisionRecord.findMany({
      where: { incident: { exercise: { orgId } }, createdAt: { gte: ago7d } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { incident: { select: { title: true, exerciseId: true } } },
    }),
    prisma.regulatorNotification.count({
      where: {
        incident: { exercise: { orgId } },
        status: { in: ["PENDING", "IN_DRAFT", "AWAITING_APPROVAL"] },
      },
    }).catch(() => 0),
    prisma.postIncidentReport.count({
      where: {
        incident: { exercise: { orgId } },
        submittedAt: null,
        dueAt: { lt: now },
      },
    }),
    prisma.scenario.findMany({
      where: { orgId, templateOriginId: { not: null }, createdAt: { gte: ago7d } },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, title: true, createdAt: true },
    }),
  ]);

  // ─── MTP roll-up (cheap, used by the dashboard tile) ────────────
  const [mtpVendorsForReadiness, mtpNotificationsByStatus] = await Promise.all([
    prisma.vendor.findMany({
      where: { orgId, isMaterialThirdParty: true },
      include: { assessments: true },
    }),
    prisma.vendorMtpNotification.groupBy({
      by: ["status"],
      where: { vendor: { orgId } },
      _count: true,
    }),
  ]);
  const { evaluateVendorReadiness } = await import("@/lib/vendor-mtp-readiness");
  const mtpReadyCount = mtpVendorsForReadiness.filter(
    (v) => evaluateVendorReadiness(v).isRegisterReady,
  ).length;
  const mtpDraftCount =
    mtpNotificationsByStatus.find((s) => s.status === "DRAFT")?._count ?? 0;

  // ─── Participant personalisation ────────────────────────────────────────
  // "Your live exercise" + "Your next exercise" — drives the top widget.
  const [myLiveParticipation, myNextParticipation, meRow] = await Promise.all([
    prisma.exerciseParticipant.findFirst({
      where: {
        userId,
        exercise: { orgId, status: { in: ["IN_PROGRESS", "PAUSED"] } },
      },
      orderBy: { exercise: { startedAt: "desc" } },
      include: {
        exercise: {
          select: {
            id: true,
            title: true,
            status: true,
            plannedDate: true,
            startedAt: true,
            scenario: { select: { title: true } },
          },
        },
      },
    }),
    prisma.exerciseParticipant.findFirst({
      where: {
        userId,
        exercise: {
          orgId,
          status: { in: ["PLANNING", "READY"] },
          plannedDate: { gte: now },
        },
      },
      orderBy: { exercise: { plannedDate: "asc" } },
      include: {
        exercise: {
          select: {
            id: true,
            title: true,
            status: true,
            plannedDate: true,
            startedAt: true,
            scenario: { select: { title: true } },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { lastReadinessCheckAt: true },
    }),
  ]);

  // Fresh-org gate
  const isFreshOrg =
    canManage &&
    scenarioCount === 0 &&
    exerciseCount === 0 &&
    memberCount <= 1 &&
    ibsCount === 0;
  if (isFreshOrg) return <FreshOrgWelcome userName={userName} />;

  // ─── Derived metrics ────────────────────────────────────────────────────
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

  const pulse = computePulse({
    ibsTotal: ibsCount,
    ibsTested: testedIBS,
    actionItemsTotal: openActionItems,
    actionItemsOverdue: overdueActionItems,
    exercisesLast90Days,
    harmTypesCovered,
  });

  // Weekly tempo
  const weeklyBuckets = Array.from({ length: 12 }, () => 0);
  for (const e of weeklyExercises) {
    if (!e.startedAt) continue;
    const weeksAgo = Math.floor(
      (now.getTime() - e.startedAt.getTime()) / (7 * 86_400_000),
    );
    if (weeksAgo >= 0 && weeksAgo < 12) weeklyBuckets[11 - weeksAgo] += 1;
  }

  // Coverage heatmap (top 6 IBSs × harm types)
  const heatmapCells: number[][] = ibsSample.map((ibs) => {
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

  // Vendor metrics
  const vendorsLite: VendorLite[] = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    tier: v.tier,
    isDoraCritical: v.isDoraCritical,
    doraIctTier: v.doraIctTier,
    hyperscaler: v.hyperscaler,
    region: v.region,
    contractStartAt: v.contractStartAt,
    contractEndAt: v.contractEndAt,
    contractRenewalNoticeDays: v.contractRenewalNoticeDays,
    contractAnnualValueGBP: v.contractAnnualValueGBP,
    assuranceKind: v.assuranceKind,
    assuranceExpiryAt: v.assuranceExpiryAt,
    exitPlanReviewedAt: v.exitPlanReviewedAt,
    exitPlanRTOMin: v.exitPlanRTOMin,
    exitPlanNotes: v.exitPlanNotes,
    fourthParties: v.fourthParties,
    ibsLinkCount: v._count.ibsLinks,
  }));
  const exitReadiness = aggregateExitReadiness(vendorsLite, now);
  const hs = hyperscalerConcentration(vendorsLite);
  const topHs = hs[0] ?? null;
  const assuranceExpiringSoon = vendorsLite.filter(
    (v) => assuranceStatus(v, now) === "expiring",
  ).length;
  const weakExitPlanCount = vendorsLite.filter(
    (v) =>
      (v.isDoraCritical || v.tier === "TIER_1") &&
      (!v.exitPlanNotes || v.exitPlanNotes.length < 40 || !v.exitPlanReviewedAt),
  ).length;

  // Tech systems metrics
  const systemsTyped = techSystems as SystemWithTests[];
  const techPosture = postureScore(systemsTyped, now);
  const systemsNoRto = systemsTyped.filter((s) => s.rtoMin == null).length;
  const systemsNeverTested = systemsTyped.filter((s) => s.drTests.length === 0).length;
  const noFailoverCritical = systemsTyped.filter(
    (s) =>
      (s.tier === "CRITICAL" || s.tier === "ESSENTIAL") && s.failoverKind === "NONE",
  ).length;
  // Oldest DR test for the next-best-actions trigger
  let oldestDrDays: number | null = null;
  for (const s of systemsTyped) {
    const latest = s.drTests[0];
    if (latest) {
      const days = Math.floor((now.getTime() - latest.testedAt.getTime()) / 86_400_000);
      if (oldestDrDays == null || days > oldestDrDays) oldestDrDays = days;
    }
  }

  // Next-best-actions
  const actions = nextBestActions({
    ibsCount,
    untestedIBSCount: untestedIBS,
    ibsReviewDueSoon,
    overdueActionItems,
    rolesTotal,
    rolesWithoutDeputy: rolesTotal - rolesWithDeputy,
    exercisesLast90Days,
    oldestSystemDRTestDays: oldestDrDays,
    systemsWithoutRTO: systemsNoRto,
    weakExitPlanCriticalVendors: weakExitPlanCount,
    hyperscalerConcentration:
      topHs && topHs.count >= 3 ? { name: topHs.hyperscaler, count: topHs.count } : null,
    pendingInvites,
    liveExerciseCount: inProgress.length,
  });

  // Combined activity feed
  type FeedItem = {
    id: string;
    kind: "sitrep" | "decision" | "clone";
    title: string;
    sub: string;
    href: string;
    at: Date;
  };
  const feed: FeedItem[] = [
    ...recentSitreps.map((s): FeedItem => ({
      id: `s-${s.id}`,
      kind: "sitrep",
      title: s.summary.slice(0, 80),
      sub: `${s.businessUnit} · ${s.incident.title}`,
      href: `/exercises/${s.incident.exerciseId}`,
      at: s.createdAt,
    })),
    ...recentDecisions.map((d): FeedItem => ({
      id: `d-${d.id}`,
      kind: "decision",
      title: d.title,
      sub: d.incident.title,
      href: `/exercises/${d.incident.exerciseId}`,
      at: d.createdAt,
    })),
    ...recentClones.map((c): FeedItem => ({
      id: `c-${c.id}`,
      kind: "clone",
      title: c.title,
      sub: "Scenario cloned",
      href: `/scenarios/${c.id}`,
      at: c.createdAt,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  // Build widget props for participant personalisation.
  const liveExercise = myLiveParticipation
    ? {
        id: myLiveParticipation.exercise.id,
        title: myLiveParticipation.exercise.title,
        status: myLiveParticipation.exercise.status,
        plannedDate: myLiveParticipation.exercise.plannedDate,
        startedAt: myLiveParticipation.exercise.startedAt,
        scenarioTitle: myLiveParticipation.exercise.scenario.title,
        roleTitle: myLiveParticipation.roleTitle,
      }
    : null;
  const nextExercise = myNextParticipation
    ? {
        id: myNextParticipation.exercise.id,
        title: myNextParticipation.exercise.title,
        status: myNextParticipation.exercise.status,
        plannedDate: myNextParticipation.exercise.plannedDate,
        startedAt: myNextParticipation.exercise.startedAt,
        scenarioTitle: myNextParticipation.exercise.scenario.title,
        roleTitle: myNextParticipation.roleTitle,
      }
    : null;
  const daysUntilNext = nextExercise?.plannedDate
    ? Math.floor(
        (nextExercise.plannedDate.getTime() - now.getTime()) / 86_400_000,
      )
    : null;
  // Show the readiness banner if exercise is < 14 days out and the user
  // hasn't stamped a readiness check in the last 7 days.
  const sevenDaysAgo = now.getTime() - 7 * 86_400_000;
  const needsReadinessCheck =
    !!nextExercise &&
    daysUntilNext !== null &&
    daysUntilNext <= 14 &&
    (!meRow?.lastReadinessCheckAt ||
      meRow.lastReadinessCheckAt.getTime() < sevenDaysAgo);

  return (
    <div className="space-y-5">
      <StatusBar
        userName={userName}
        liveCount={inProgress.length}
        liveTitle={inProgress[0]?.title ?? null}
        liveId={inProgress[0]?.id ?? null}
        overdueCount={overdueActionItems}
        openCount={openActionItems}
        pulse={pulse.total}
        pulseGrade={pulse.grade}
      />

      <YourLiveExerciseWidget
        liveExercise={liveExercise}
        nextExercise={nextExercise}
        needsReadinessCheck={needsReadinessCheck}
        daysUntilNext={daysUntilNext}
        userId={userId}
      />

      <RecapCard recap={recap} userName={userName} />

      <section className="grid gap-4 lg:grid-cols-4">
        <CoverageWidget
          rows={ibsSample.map((i) => i.name)}
          cells={heatmapCells}
          testedIBS={testedIBS}
          ibsCount={ibsCount}
          untestedIBS={untestedIBS}
        />
        <ConcentrationWidget
          totalVendors={vendorsLite.length}
          topHyperscaler={topHs}
          exitReadiness={exitReadiness}
          assuranceExpiring={assuranceExpiringSoon}
          weakExitPlans={weakExitPlanCount}
        />
        <TechRecoveryWidget
          totalSystems={systemsTyped.length}
          posture={techPosture}
          noRto={systemsNoRto}
          neverTested={systemsNeverTested}
          noFailover={noFailoverCritical}
        />
        <ActivityFeed feed={feed} />

        <CadenceWidget weeklyBuckets={weeklyBuckets} harmTypesCovered={harmTypesCovered} />
        <PeopleWidget
          rolesTotal={rolesTotal}
          rolesWithDeputy={rolesWithDeputy}
          rolesWithDefaultHolder={rolesWithDefaultHolder}
          memberCount={memberCount}
        />
        <ComplianceClockWidget
          ibsReviewDueSoon={ibsReviewDueSoon}
          overduePIRs={overduePIRs}
          openRegulatorNotifications={openRegulatorNotifications}
          overdueActionItems={overdueActionItems}
        />
        <MtpRegisterWidget
          mtpTotal={mtpVendorsForReadiness.length}
          mtpReady={mtpReadyCount}
          notifDrafts={mtpDraftCount}
        />
      </section>

      <NextBestActionsSection actions={actions} />

      <DailyTipCard />
    </div>
  );
}

// ─── Status bar ──────────────────────────────────────────────────────────

function StatusBar({
  userName,
  liveCount,
  liveTitle,
  liveId,
  overdueCount,
  openCount,
  pulse,
  pulseGrade,
}: {
  userName: string;
  liveCount: number;
  liveTitle: string | null;
  liveId: string | null;
  overdueCount: number;
  openCount: number;
  pulse: number;
  pulseGrade: string;
}) {
  return (
    <header className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-1 p-2 shadow-[var(--shadow-card)]">
      <div className="mr-1 flex items-center gap-2 px-2 text-xs text-soft">
        <span className="font-semibold text-ink">{userName.split(" ")[0]}</span>
        <span>·</span>
        <span className="hidden sm:inline">CTO console</span>
      </div>
      <div className="flex-1" />

      {liveCount > 0 && liveId ? (
        <Link
          href={`/exercises/${liveId}`}
          className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-[0_0_0_3px_rgba(244,63,94,0.18)] hover:bg-rose-500"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-90" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Live · {liveTitle?.slice(0, 28) ?? "exercise"}
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 size={11} />
          No active incidents
        </span>
      )}

      <StatusPill
        href="/action-items?status=overdue"
        tone={overdueCount === 0 ? "neutral" : "critical"}
        icon={Flame}
      >
        {overdueCount} overdue
      </StatusPill>
      <StatusPill
        href="/action-items"
        tone={openCount > 20 ? "warn" : "neutral"}
        icon={ListChecks}
      >
        {openCount} open
      </StatusPill>

      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
          pulse >= 70
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
            : pulse >= 50
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
        }`}
        title="Composite resilience pulse — coverage × hygiene × cadence × depth"
      >
        Pulse <span className="font-bold">{pulse}</span>
        <span className="opacity-70">· {pulseGrade}</span>
      </span>
    </header>
  );
}

function StatusPill({
  href,
  tone,
  icon: Icon,
  children,
}: {
  href: string;
  tone: "neutral" | "warn" | "critical";
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  const cls =
    tone === "critical"
      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
      : tone === "warn"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        : "bg-surface-2 text-muted hover:text-ink";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${cls}`}
    >
      <Icon size={11} />
      {children}
    </Link>
  );
}

// ─── Widgets ─────────────────────────────────────────────────────────────

function Widget({
  title,
  href,
  icon: Icon,
  tone = "indigo",
  children,
  className = "",
}: {
  title: string;
  href?: string;
  icon: LucideIcon;
  tone?: "indigo" | "amber" | "cyan" | "violet" | "rose" | "emerald";
  children: React.ReactNode;
  className?: string;
}) {
  const bar = {
    indigo: "from-indigo-500 to-indigo-400",
    amber: "from-amber-500 to-amber-400",
    cyan: "from-cyan-500 to-cyan-400",
    violet: "from-violet-500 to-violet-400",
    rose: "from-rose-500 to-rose-400",
    emerald: "from-emerald-500 to-emerald-400",
  }[tone];
  const inner = (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface-1 transition-all ${href ? "hover:-translate-y-px hover:shadow-[var(--shadow-card-md)]" : ""} ${className}`}
    >
      <div className={`h-1 bg-gradient-to-r ${bar}`} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-soft">
            <Icon size={11} />
            {title}
          </div>
          {href && (
            <span className="text-[10px] text-soft group-hover:text-ink">→</span>
          )}
        </header>
        {children}
      </div>
    </article>
  );
  return href ? (
    <Link href={href} className="group block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function CoverageWidget({
  rows,
  cells,
  testedIBS,
  ibsCount,
  untestedIBS,
}: {
  rows: string[];
  cells: number[][];
  testedIBS: number;
  ibsCount: number;
  untestedIBS: number;
}) {
  const pct = ibsCount === 0 ? 0 : Math.round((testedIBS / ibsCount) * 100);
  const tone: "indigo" | "amber" | "rose" =
    pct >= 75 ? "indigo" : pct >= 40 ? "amber" : "rose";
  return (
    <Widget title="Resilience coverage" icon={Wifi} tone={tone} href="/ibs">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-ink">{pct}%</span>
        <span className="text-xs text-muted">of IBSs stress-tested</span>
      </div>
      {rows.length > 0 ? (
        <div className="mt-1 overflow-hidden">
          <MiniHeatmap
            cells={cells}
            rowLabels={rows}
            colLabels={["P", "Pr", "T", "A", "I", "3"]}
            cellSize={14}
            ariaLabel="IBS by harm-type coverage"
          />
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-line p-3 text-center text-[11px] text-muted">
          No IBSs registered yet.
        </p>
      )}
      <footer className="mt-auto flex items-center justify-between border-t border-line pt-2 text-[10px]">
        {untestedIBS > 0 ? (
          <span className="font-semibold text-rose-600 dark:text-rose-300">
            {untestedIBS} never tested
          </span>
        ) : (
          <span className="font-semibold text-emerald-600 dark:text-emerald-300">
            All IBSs tested
          </span>
        )}
        <span className="text-soft">{ibsCount} total</span>
      </footer>
    </Widget>
  );
}

function ConcentrationWidget({
  totalVendors,
  topHyperscaler,
  exitReadiness,
  assuranceExpiring,
  weakExitPlans,
}: {
  totalVendors: number;
  topHyperscaler: { hyperscaler: string; count: number } | null;
  exitReadiness: number;
  assuranceExpiring: number;
  weakExitPlans: number;
}) {
  const concentrationPct =
    totalVendors === 0 || !topHyperscaler
      ? 0
      : Math.round((topHyperscaler.count / totalVendors) * 100);
  const tone: "indigo" | "amber" | "rose" =
    concentrationPct >= 50 ? "rose" : concentrationPct >= 30 ? "amber" : "indigo";
  return (
    <Widget title="Third-party concentration" icon={Boxes} tone={tone} href="/vendors">
      {topHyperscaler ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{topHyperscaler.hyperscaler}</span>
          </div>
          <div className="text-xs text-muted">
            <span className="font-semibold text-ink">{topHyperscaler.count}</span> of{" "}
            {totalVendors} vendors ·{" "}
            <span
              className={
                concentrationPct >= 30
                  ? "font-semibold text-rose-600 dark:text-rose-300"
                  : ""
              }
            >
              {concentrationPct}%
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted">
          {totalVendors} vendor{totalVendors === 1 ? "" : "s"} · no hyperscaler tagged yet
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
        <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-muted">
          Exit readiness {exitReadiness}
        </span>
        {assuranceExpiring > 0 && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {assuranceExpiring} expiring
          </span>
        )}
        {weakExitPlans > 0 && (
          <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            {weakExitPlans} weak exit
          </span>
        )}
      </div>
      <footer className="mt-auto border-t border-line pt-2 text-[10px] text-soft">
        DORA register
      </footer>
    </Widget>
  );
}

function MtpRegisterWidget({
  mtpTotal,
  mtpReady,
  notifDrafts,
}: {
  mtpTotal: number;
  mtpReady: number;
  notifDrafts: number;
}) {
  const pct = mtpTotal === 0 ? 0 : Math.round((mtpReady / mtpTotal) * 100);
  const tone: "indigo" | "amber" | "rose" =
    mtpTotal === 0 ? "indigo" : pct === 100 ? "indigo" : pct >= 50 ? "amber" : "rose";
  return (
    <Widget title="MTP register" icon={ShieldCheck} tone={tone} href="/vendors/register">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-ink">
          {mtpTotal === 0 ? "—" : `${mtpReady}/${mtpTotal}`}
        </span>
        {mtpTotal > 0 && <span className="text-xs text-muted">register-ready ({pct}%)</span>}
      </div>
      <div className="text-xs text-muted">
        {mtpTotal === 0 ? (
          <>No Material Third Parties flagged yet</>
        ) : (
          <>
            {mtpTotal} Material Third Part{mtpTotal === 1 ? "y" : "ies"}
          </>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
        {notifDrafts > 0 && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {notifDrafts} notification draft{notifDrafts === 1 ? "" : "s"}
          </span>
        )}
        {mtpReady < mtpTotal && (
          <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            {mtpTotal - mtpReady} incomplete
          </span>
        )}
      </div>
      <footer className="mt-auto border-t border-line pt-2 text-[10px] text-soft">
        FCA / PRA Annex 3
      </footer>
    </Widget>
  );
}

function TechRecoveryWidget({
  totalSystems,
  posture,
  noRto,
  neverTested,
  noFailover,
}: {
  totalSystems: number;
  posture: number;
  noRto: number;
  neverTested: number;
  noFailover: number;
}) {
  const tone: "indigo" | "amber" | "rose" =
    posture >= 70 ? "indigo" : posture >= 50 ? "amber" : "rose";
  return (
    <Widget title="Technical recovery" icon={Server} tone={tone} href="/tech-recovery">
      {totalSystems === 0 ? (
        <p className="rounded-md border border-dashed border-line p-3 text-center text-[11px] text-muted">
          No systems registered yet.
        </p>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <ProgressRing
              value={posture}
              label={String(posture)}
              size={68}
              thickness={7}
            />
            <ul className="flex-1 space-y-1 text-[11px]">
              <li className="flex items-center justify-between">
                <span className="text-muted">Total systems</span>
                <span className="font-semibold text-ink">{totalSystems}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">No RTO declared</span>
                <span
                  className={`font-semibold ${noRto > 0 ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300"}`}
                >
                  {noRto}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">Never DR-tested</span>
                <span
                  className={`font-semibold ${neverTested > 0 ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300"}`}
                >
                  {neverTested}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">No failover</span>
                <span
                  className={`font-semibold ${noFailover > 0 ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300"}`}
                >
                  {noFailover}
                </span>
              </li>
            </ul>
          </div>
        </>
      )}
      <footer className="mt-auto border-t border-line pt-2 text-[10px] text-soft">
        Posture score 0–100
      </footer>
    </Widget>
  );
}

function CadenceWidget({
  weeklyBuckets,
  harmTypesCovered,
}: {
  weeklyBuckets: number[];
  harmTypesCovered: number;
}) {
  const total = weeklyBuckets.reduce((a, b) => a + b, 0);
  return (
    <Widget title="Exercise tempo" icon={CalendarClock} tone="indigo" href="/exercises">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-ink">{total}</span>
        <span className="text-xs text-muted">exercises in 12 weeks</span>
      </div>
      <Sparkline
        values={weeklyBuckets}
        width={280}
        height={36}
        color="var(--accent)"
        className="mt-1 w-full"
      />
      <div className="mt-1 flex items-center justify-between text-[10px] text-soft">
        <span>12 wk ago</span>
        <span>now</span>
      </div>
      <footer className="mt-auto flex items-center justify-between border-t border-line pt-2 text-[10px]">
        <span className="text-muted">Harms covered this year</span>
        <span className="font-semibold text-ink">{harmTypesCovered} / 6</span>
      </footer>
    </Widget>
  );
}

function PeopleWidget({
  rolesTotal,
  rolesWithDeputy,
  rolesWithDefaultHolder,
  memberCount,
}: {
  rolesTotal: number;
  rolesWithDeputy: number;
  rolesWithDefaultHolder: number;
  memberCount: number;
}) {
  const depPct = rolesTotal === 0 ? 0 : Math.round((rolesWithDeputy / rolesTotal) * 100);
  const holderPct =
    rolesTotal === 0 ? 0 : Math.round((rolesWithDefaultHolder / rolesTotal) * 100);
  const tone: "indigo" | "amber" | "rose" =
    depPct >= 50 ? "indigo" : depPct >= 25 ? "amber" : "rose";
  return (
    <Widget title="People & seats" icon={Users} tone={tone} href="/org/roles">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-ink">{rolesTotal}</span>
        <span className="text-xs text-muted">IMT roles defined</span>
      </div>
      <Bar pct={holderPct} label="With default holder" />
      <Bar pct={depPct} label="With deputy" />
      <footer className="mt-auto flex items-center justify-between border-t border-line pt-2 text-[10px]">
        <span className="text-muted">Team members</span>
        <span className="font-semibold text-ink">{memberCount}</span>
      </footer>
    </Widget>
  );
}

function Bar({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-ink">{pct}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ComplianceClockWidget({
  ibsReviewDueSoon,
  overduePIRs,
  openRegulatorNotifications,
  overdueActionItems,
}: {
  ibsReviewDueSoon: number;
  overduePIRs: number;
  openRegulatorNotifications: number;
  overdueActionItems: number;
}) {
  const totalDue = overduePIRs + openRegulatorNotifications + overdueActionItems;
  const tone: "emerald" | "amber" | "rose" =
    totalDue === 0 ? "emerald" : totalDue >= 5 ? "rose" : "amber";
  return (
    <Widget title="Compliance clock" icon={ShieldCheck} tone={tone} href="/audit">
      <ul className="space-y-1.5 text-xs">
        <Row
          icon={CalendarClock}
          label="IBS reviews due (30d)"
          value={ibsReviewDueSoon}
          tone={ibsReviewDueSoon > 0 ? "warn" : "ok"}
        />
        <Row
          icon={FileText}
          label="PIRs overdue"
          value={overduePIRs}
          tone={overduePIRs > 0 ? "critical" : "ok"}
        />
        <Row
          icon={Crown}
          label="Regulator notifications open"
          value={openRegulatorNotifications}
          tone={openRegulatorNotifications > 0 ? "warn" : "ok"}
        />
        <Row
          icon={Flame}
          label="Action items overdue"
          value={overdueActionItems}
          tone={
            overdueActionItems === 0
              ? "ok"
              : overdueActionItems >= 5
                ? "critical"
                : "warn"
          }
        />
      </ul>
      <footer className="mt-auto border-t border-line pt-2 text-[10px] text-soft">
        Time-bound obligations
      </footer>
    </Widget>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: "ok" | "warn" | "critical";
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-muted">
        <Icon size={10} />
        {label}
      </span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          tone === "critical"
            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
            : tone === "warn"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
        }`}
      >
        {value}
      </span>
    </li>
  );
}

// ─── Activity feed ──────────────────────────────────────────────────────

function ActivityFeed({
  feed,
}: {
  feed: {
    id: string;
    kind: "sitrep" | "decision" | "clone";
    title: string;
    sub: string;
    href: string;
    at: Date;
  }[];
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface-1 lg:row-span-2">
      <div className="h-1 bg-gradient-to-r from-violet-500 to-violet-400" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-soft">
          <FileText size={11} />
          Activity (last 7 days)
        </header>
        {feed.length === 0 ? (
          <p className="rounded-md border border-dashed border-line p-3 text-center text-[11px] text-muted">
            Quiet week — no decisions, sitreps or scenario clones recorded.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {feed.map((f) => (
              <li key={f.id}>
                <Link
                  href={f.href}
                  className="flex items-start gap-2 rounded-md border border-line bg-surface-0 px-2.5 py-1.5 text-xs hover:bg-surface-2"
                >
                  <FeedIcon kind={f.kind} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ink">{f.title}</p>
                    <p className="truncate text-[10px] text-soft">{f.sub}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-soft">
                    {timeAgo(f.at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function FeedIcon({ kind }: { kind: "sitrep" | "decision" | "clone" }) {
  if (kind === "sitrep")
    return <FileText size={11} className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-300" />;
  if (kind === "decision")
    return (
      <ShieldCheck size={11} className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-300" />
    );
  return <Database size={11} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-300" />;
}

function timeAgo(d: Date): string {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// ─── Next best actions ─────────────────────────────────────────────────

const ICON_FOR: Record<NextBestAction["iconKey"], LucideIcon> = {
  shield: ShieldAlert,
  flame: Flame,
  calendar: CalendarClock,
  server: Server,
  users: Users,
  boxes: Boxes,
  alert: AlertOctagon,
  sparkles: Sparkles,
};

function NextBestActionsSection({ actions }: { actions: NextBestAction[] }) {
  if (actions.length === 0) {
    return (
      <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
        <header className="flex items-center gap-2">
          <CheckCircle2 size={14} />
          <h2 className="font-semibold">Nothing demands you right now</h2>
        </header>
        <p className="mt-1 text-xs">Good week to plan a tabletop.</p>
      </section>
    );
  }
  return (
    <section>
      <header className="mb-2 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-ink">Next best actions</h2>
        <span className="text-[11px] text-soft">Ranked by impact</span>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((a) => {
          const Icon = ICON_FOR[a.iconKey];
          const tone =
            a.priority === "critical"
              ? "border-rose-300 dark:border-rose-700"
              : a.priority === "warn"
                ? "border-amber-300 dark:border-amber-700"
                : "border-indigo-300 dark:border-indigo-700";
          const chipTone =
            a.priority === "critical"
              ? "bg-rose-600 text-white"
              : a.priority === "warn"
                ? "bg-amber-600 text-white"
                : "bg-indigo-600 text-white";
          return (
            <li key={a.id}>
              <Link
                href={a.cta.href}
                className={`group flex h-full flex-col gap-2 rounded-xl border bg-surface-1 p-3 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${tone}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-md ${chipTone}`}>
                    <Icon size={13} />
                  </span>
                  <h3 className="text-sm font-semibold text-ink">{a.title}</h3>
                </div>
                <p className="text-xs text-muted">{a.body}</p>
                <footer className="mt-auto flex items-center justify-between border-t border-line pt-2">
                  <span className="text-[10px] uppercase tracking-wider text-soft">
                    {a.priority}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                    {a.cta.label}
                    <ArrowRight size={11} />
                  </span>
                </footer>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─── Fresh-org + landing (unchanged) ───────────────────────────────────

function FreshOrgWelcome({ userName }: { userName: string }) {
  const steps = [
    {
      title: "Apply an industry preset",
      body: "Bank / fintech / insurer starter packs — roles, IBSs, vendors, tech systems in one click.",
      href: "/settings/presets",
      cta: "Open presets",
    },
    {
      title: "Build the role catalogue",
      body: "Define the IMT seats participants will claim in exercises.",
      href: "/org/roles",
      cta: "Edit roles",
    },
    {
      title: "Capture your IBS register",
      body: "Add your firm's Important Business Services with tolerances.",
      href: "/ibs/new",
      cta: "Add an IBS",
    },
    {
      title: "Plan your first exercise",
      body: "Pick a scenario, set a date, assemble the team.",
      href: "/exercises/new",
      cta: "Plan an exercise",
    },
  ];
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome, {userName.split(" ")[0]}</h1>
        <p className="mt-2 text-sm text-muted">
          Let&apos;s get your operational-resilience programme set up. Four steps and
          you&apos;re ready to run your first exercise.
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
          Plan, run, and learn from operational resilience exercises.
        </p>
        <div className="flex gap-3 pt-2">
          <Link
            href="/sign-up"
            className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
          >
            Create an organisation
          </Link>
          <Link
            href="/sign-in"
            className="rounded-md border border-line-strong px-4 py-2 hover:bg-surface-1"
          >
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}

