import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Flame,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePulse, nextBestActions } from "@/lib/dashboard";
import {
  aggregateExitReadiness,
  assuranceStatus,
  hyperscalerConcentration,
  type VendorLite,
} from "@/lib/dora";
import { postureScore, type SystemWithTests } from "@/lib/tech-recovery";
import FeaturedCard from "@/components/ui/FeaturedCard";
import DailyTipCard from "@/components/fun/DailyTipCard";
import YourLiveExerciseWidget from "@/components/dashboard/YourLiveExerciseWidget";
import RecapCard from "@/components/dashboard/RecapCard";
import NudgeBar from "@/components/dashboard/NudgeBar";
import NextBestActions from "@/components/dashboard/NextBestActions";
import UnlockToast from "@/components/dashboard/UnlockToast";
import {
  ResilienceRiskPanel,
  ThirdPartyRiskPanel,
  ComplianceClockPanel,
  type PanelOffender,
} from "@/components/dashboard/OutcomePanels";
import {
  buildDashboardRecap,
  bumpDashboardStreak,
  consumeRecapCutPoint,
} from "@/lib/dashboard-recap";
import { pickNudge } from "@/lib/dashboard-nudge";

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
  const in30d = new Date(now.getTime() + 30 * 86_400_000);

  // "Since you were here last" cut point — read + maybe bump in one call.
  // Returns the *prior* timestamp so refreshes within the 4h cooldown keep
  // surfacing the same recap.
  const [recapCutPoint, streakDays, nudge] = await Promise.all([
    consumeRecapCutPoint(userId),
    bumpDashboardStreak(userId),
    pickNudge(orgId),
  ]);
  const recap = await buildDashboardRecap({ orgId, since: recapCutPoint });

  const newUnlocksSinceVisit = recapCutPoint
    ? await prisma.achievementUnlock.count({
        where: { orgId, unlockedAt: { gte: recapCutPoint } },
      })
    : 0;

  const [
    inProgress,
    openActionItems,
    overdueActionItems,
    ibsCount,
    untestedIBS,
    ibsReviewDueSoon,
    coverage,
    scenarioCount,
    exerciseCount,
    exercisesLast90Days,
    memberCount,
    rolesTotal,
    rolesWithDeputy,
    pendingInvites,
    vendors,
    techSystems,
    openRegulatorNotifications,
    overduePIRs,
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
    prisma.user.count({ where: { orgId } }),
    prisma.organizationRole.count({ where: { orgId } }),
    prisma.organizationRole.count({
      where: { orgId, deputyOfRoleId: { not: null } },
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
  ]);

  // ─── Top-3 offenders for the outcome panels ─────────────────────────────
  const [untestedCriticalIBSs, overdueActionItemsTop, ibsReviewsDueSoon] =
    await Promise.all([
      prisma.organizationIBS.findMany({
        where: { orgId, criticality: "CRITICAL", exerciseLinks: { none: {} } },
        orderBy: { code: "asc" },
        take: 5,
        select: { id: true, code: true, name: true },
      }),
      prisma.exerciseActionItem.findMany({
        where: {
          orgId,
          status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
          dueAt: { lt: now },
        },
        orderBy: { dueAt: "asc" },
        take: 5,
        select: {
          id: true,
          title: true,
          dueAt: true,
          exercise: { select: { id: true, title: true } },
        },
      }),
      prisma.organizationIBS.findMany({
        where: { orgId, reviewDueAt: { gte: now, lte: in30d } },
        orderBy: { reviewDueAt: "asc" },
        take: 5,
        select: { id: true, code: true, name: true, reviewDueAt: true },
      }),
    ]);

  // ─── MTP roll-up (drives the third-party panel's register-ready chip) ──
  const mtpVendorsForReadiness = await prisma.vendor.findMany({
    where: { orgId, isMaterialThirdParty: true },
    include: { assessments: true },
  });
  const { evaluateVendorReadiness } = await import("@/lib/vendor-mtp-readiness");
  const mtpReadyCount = mtpVendorsForReadiness.filter(
    (v) => evaluateVendorReadiness(v).isRegisterReady,
  ).length;

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
        streakDays={streakDays}
      />

      {nudge && <NudgeBar nudge={nudge} />}

      <NextBestActions actions={actions} />

      <YourLiveExerciseWidget
        liveExercise={liveExercise}
        nextExercise={nextExercise}
        needsReadinessCheck={needsReadinessCheck}
        daysUntilNext={daysUntilNext}
        userId={userId}
      />

      <RecapCard recap={recap} userName={userName} />

      {recapCutPoint && newUnlocksSinceVisit > 0 && (
        <UnlockToast
          count={newUnlocksSinceVisit}
          sinceISO={recapCutPoint.toISOString()}
        />
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <ResilienceRiskPanel
          untestedCriticalIBS={untestedCriticalIBSs.map((i): PanelOffender => ({
            label: `${i.code} · ${i.name}`,
            sub: "CRITICAL",
            href: `/ibs/${i.id}`,
          }))}
          ibsTotal={ibsCount}
          ibsTested={testedIBS}
          pulse={pulse.total}
          pulseGrade={pulse.grade}
          techPosture={techPosture}
          harmTypesCovered={harmTypesCovered}
        />
        <ThirdPartyRiskPanel
          weakExitVendors={vendorsLite
            .filter(
              (v) =>
                (v.isDoraCritical || v.tier === "TIER_1") &&
                (!v.exitPlanNotes || v.exitPlanNotes.length < 40 || !v.exitPlanReviewedAt),
            )
            .slice(0, 5)
            .map((v): PanelOffender => ({
              label: v.name,
              sub: v.isDoraCritical ? "DORA" : v.tier === "TIER_1" ? "TIER 1" : undefined,
              href: `/vendors/${v.id}`,
            }))}
          totalVendors={vendorsLite.length}
          topHyperscaler={topHs}
          assuranceExpiringSoon={assuranceExpiringSoon}
          exitReadiness={exitReadiness}
          mtpTotal={mtpVendorsForReadiness.length}
          mtpReady={mtpReadyCount}
        />
        <ComplianceClockPanel
          overdueItems={buildComplianceOffenders({
            overdueActions: overdueActionItemsTop,
            ibsReviews: ibsReviewsDueSoon,
            now,
          })}
          overdueActions={overdueActionItems}
          overduePIRs={overduePIRs}
          openRegulatorNotifications={openRegulatorNotifications}
          ibsReviewDueSoon={ibsReviewDueSoon}
        />
      </section>

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
  streakDays,
}: {
  userName: string;
  liveCount: number;
  liveTitle: string | null;
  liveId: string | null;
  overdueCount: number;
  openCount: number;
  pulse: number;
  pulseGrade: string;
  streakDays: number;
}) {
  return (
    <header className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-1 p-2 shadow-[var(--shadow-card)]">
      <div className="mr-1 flex items-center gap-2 px-2 text-xs text-soft">
        <span className="font-semibold text-ink">{userName.split(" ")[0]}</span>
        <span>·</span>
        <span className="hidden sm:inline">CTO console</span>
        {streakDays > 1 && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            title={`${streakDays}-day visit streak`}
          >
            <Flame size={10} />
            {streakDays}d
          </span>
        )}
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

function buildComplianceOffenders({
  overdueActions,
  ibsReviews,
  now,
}: {
  overdueActions: {
    id: string;
    title: string;
    dueAt: Date | null;
    exercise: { id: string; title: string };
  }[];
  ibsReviews: {
    id: string;
    code: string;
    name: string;
    reviewDueAt: Date | null;
  }[];
  now: Date;
}): PanelOffender[] {
  const fmtDays = (d: Date) => {
    const ms = d.getTime() - now.getTime();
    const days = Math.round(ms / 86_400_000);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return "due today";
    return `due in ${days}d`;
  };
  const actionItems = overdueActions.map((a): PanelOffender => ({
    label: a.title,
    sub: a.dueAt ? fmtDays(a.dueAt) : "no due date",
    href: `/exercises/${a.exercise.id}`,
  }));
  const reviewItems = ibsReviews.map((i): PanelOffender => ({
    label: `${i.code} · ${i.name} review`,
    sub: i.reviewDueAt ? fmtDays(i.reviewDueAt) : undefined,
    href: `/ibs/${i.id}`,
  }));
  // Overdue actions are more urgent than upcoming reviews — surface them first.
  return [...actionItems, ...reviewItems].slice(0, 5);
}

