import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadInbox } from "@/lib/inbox";
import { loadLiveFeed, loadPresence, type LiveFeedItem } from "@/lib/live";
import { currentDDay } from "@/lib/dday";
import DDayClockTicker from "@/components/DDayClockTicker";
import LivePresenceBar from "@/components/LivePresenceBar";
import LiveInboxItem from "@/components/LiveInboxItem";
import IncidentBanner from "@/components/IncidentBanner";
import IncidentCapturePanel from "@/components/IncidentCapturePanel";
import RegulatorClocks from "@/components/RegulatorClocks";
import CommsCascadePanel from "@/components/CommsCascadePanel";
import MyCommsDraftsPanel from "@/components/live/MyCommsDraftsPanel";
import MyExerciseActionItems from "@/components/live/MyExerciseActionItems";
import BCPPanel from "@/components/BCPPanel";
import ClosureGate from "@/components/ClosureGate";
import Pill from "@/components/ui/Pill";
import LiveScoreBadge from "@/components/scoring/LiveScoreBadge";
import { scoreIncident } from "@/lib/scoring";
import SeatLobby from "@/components/seats/SeatLobby";
import SeatBoardCompact from "@/components/seats/SeatBoardCompact";
import { loadSeats } from "@/lib/seats";
import { ensureSeatsForExercise } from "@/app/actions/seats";
import NudgePanel from "@/components/live/NudgePanel";
import { computeNudges } from "@/lib/nudges";
import ActivityTicker from "@/components/live/ActivityTicker";
import { autoReleaseExpired } from "@/lib/auto-release";
import FloatingChatDrawer from "@/components/live/FloatingChatDrawer";
import { loadChat } from "@/lib/chat";
import Scratchpad from "@/components/live/Scratchpad";
import OnCallStatus from "@/components/live/OnCallStatus";
import RoleBriefing from "@/components/live/RoleBriefing";
import LiveTabs from "@/components/live/LiveTabs";
import LiveRunbookTab, {
  type LiveExecution,
  type LiveStep,
  type AvailableRunbook,
} from "@/components/runbooks/LiveRunbookTab";
import type { FrozenRunbook } from "@/lib/runbook-activation";
import LivePoller from "@/components/live/LivePoller";
import InjectArrivalNotifier from "@/components/live/InjectArrivalNotifier";
import FirstTimeLiveTour from "@/components/live/FirstTimeLiveTour";
import SitrepCadenceBanner from "@/components/live/SitrepCadenceBanner";
import MyApprovalsDock from "@/components/live/MyApprovalsDock";
import { loadApprovalsQueue } from "@/lib/approvals";
import FacilitatorAnnouncementsBanner, {
  type Announcement,
} from "@/components/live/FacilitatorAnnouncementsBanner";

export default async function LiveWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireOrgUser();
  const { id } = await params;

  const exercise = await prisma.exercise.findFirst({
    where: { id, orgId: me.orgId },
    include: { scenario: { select: { title: true } } },
  });
  if (!exercise) notFound();

  // Ensure seats exist for this exercise so the seat-board is meaningful.
  await ensureSeatsForExercise(exercise.id, me.orgId);
  // Auto-release any scheduled events/injects whose D-Day time has come.
  await autoReleaseExpired(exercise.id);
  const seats = await loadSeats(exercise.id);
  const mySeat = seats.find((s) => s.holderUserId === me.id) ?? null;
  let participant = await prisma.exerciseParticipant.findFirst({
    where: { exerciseId: exercise.id, userId: me.id },
  });

  // Seat-claim entry view — the "war room lobby". Card grid with a hero,
  // suggested-for-you, family filters, and live presence ribbon. Replaces
  // the old "you're not on the roster" wall — any org member can walk in
  // and claim a seat in a live exercise.
  if (!participant && !mySeat) {
    const lobbyClock = currentDDay(exercise.dDayAnchor, exercise.speedMultiplier);
    const lobbyPresence = await loadPresence(exercise.id);
    return (
      <SeatLobby
        exerciseId={exercise.id}
        exerciseTitle={exercise.title}
        scenarioTitle={exercise.scenario.title}
        dDayHHMM={lobbyClock.hhmm}
        seats={seats}
        presence={lobbyPresence}
        meId={me.id}
        meName={me.name ?? me.email}
      />
    );
  }
  // Auto-create a participant record on first claim if missing (back-compat)
  if (!participant && mySeat) {
    participant = await prisma.exerciseParticipant.create({
      data: {
        exerciseId: exercise.id,
        userId: me.id,
        roleTitle: mySeat.roleAbbreviation,
        exerciseRole: "PARTICIPANT",
        mobilisationStatus: "MOBILISED",
        mobilisedAt: new Date(),
      },
    });
  }
  if (!participant) {
    // Safety net — shouldn't happen, but TypeScript needs it
    return null;
  }

  const [
    inbox,
    feed,
    presence,
    myResponses,
    activeIncident,
    regulatorClocks,
    commsDrafts,
    bcpActivation,
    orgUsers,
    myActionItems,
    recentReleases,
    orgDecisionPresets,
    approvalsQueue,
    announcementRows,
    recentSitreps,
  ] = await Promise.all([
    loadInbox(exercise.id, { roleTitle: participant.roleTitle, participantId: participant.id }),
    loadLiveFeed(exercise.id),
    loadPresence(exercise.id),
    prisma.participantResponse.findMany({
      where: { exerciseId: exercise.id, authorId: me.id },
    }),
    prisma.incident.findFirst({
      where: { exerciseId: exercise.id, status: { in: ["INVOKED", "CONTAINED", "RESOLVED"] } },
      orderBy: { invokedAt: "desc" },
      include: { invokedBy: { select: { name: true, email: true } } },
    }),
    prisma.regulatorNotification.findMany({
      where: { incident: { exerciseId: exercise.id } },
      orderBy: { dueAt: "asc" },
    }),
    prisma.communicationDraft.findMany({
      where: { exerciseId: exercise.id },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, email: true } },
        approver: { select: { name: true, email: true } },
      },
    }),
    prisma.bCPActivation.findFirst({
      where: { incident: { exerciseId: exercise.id }, deactivatedAt: null },
      orderBy: { activatedAt: "desc" },
      include: {
        activatedByCEO: { select: { name: true, email: true } },
        activatedByCRO: { select: { name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: { orgId: me.orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.exerciseActionItem.findMany({
      where: {
        exerciseId: exercise.id,
        ownerUserId: me.id,
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { dueAt: "asc" },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        dueAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    // Injects released in the last hour — offered as the likely trigger
    // when the participant records a decision. Decisions made shortly
    // after an inject lands are almost always caused by it; capturing
    // the link makes the post-incident timeline reconstructable.
    prisma.injectRelease.findMany({
      where: {
        exerciseId: exercise.id,
        // eslint-disable-next-line react-hooks/purity
        releasedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      orderBy: { releasedAt: "desc" },
      take: 8,
      include: {
        inject: { select: { id: true, injectNo: true, summary: true } },
      },
    }),
    // Active org-defined decision presets — shown in the decision form
    // alongside the built-in IMT vocabulary.
    prisma.orgDecisionType.findMany({
      where: { orgId: me.orgId, archived: false },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, label: true, hint: true },
    }),
    // Role-routed approvals queue (decisions + comms drafts awaiting my
    // role's sign-off). Renders inline in MyApprovalsDock — see
    // src/lib/approvals.ts for the matching policy.
    loadApprovalsQueue(exercise.id, me.id),
    // Out-of-band facilitator signals — broadcasts pin sticky, the rest
    // are toast-only and auto-fade from the banner stack client-side.
    prisma.facilitatorAnnouncement.findMany({
      where: { exerciseId: exercise.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { author: { select: { name: true, email: true } } },
    }),
    // Sitreps filed against any incident in this exercise — drives the
    // cadence banner (regular sitreps per business unit are expected).
    prisma.sitrep.findMany({
      where: { incident: { exerciseId: exercise.id } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        businessUnit: true,
        status: true,
        nextUpdateDDayTime: true,
        dDayTime: true,
        createdAt: true,
      },
    }),
  ]);

  // ─── Runbook executions for the active incident ────────────────────────
  const runbookExecutionRows = activeIncident
    ? await prisma.runbookExecution.findMany({
        where: { incidentId: activeIncident.id },
        orderBy: { startedAt: "asc" },
        include: { stepExecutions: { orderBy: { stepOrderIdx: "asc" } } },
      })
    : [];

  const linkedDecisionIds = runbookExecutionRows
    .flatMap((r) => r.stepExecutions.map((s) => s.linkedDecisionId))
    .filter((v): v is string => !!v);
  const linkedNotificationIds = runbookExecutionRows
    .flatMap((r) => r.stepExecutions.map((s) => s.linkedNotificationId))
    .filter((v): v is string => !!v);
  const linkedCommsIds = runbookExecutionRows
    .flatMap((r) => r.stepExecutions.map((s) => s.linkedCommsId))
    .filter((v): v is string => !!v);

  const [linkedDecisionsRows, linkedNotificationRows, linkedCommsRows] = await Promise.all([
    linkedDecisionIds.length === 0
      ? Promise.resolve([])
      : prisma.decisionRecord.findMany({
          where: { id: { in: linkedDecisionIds } },
          select: {
            id: true,
            title: true,
            decisionType: true,
            approverRolesRequired: true,
            approvedAt: true,
          },
        }),
    linkedNotificationIds.length === 0
      ? Promise.resolve([])
      : prisma.regulatorNotification.findMany({
          where: { id: { in: linkedNotificationIds } },
          select: { id: true, regulator: true, status: true, dueAt: true, sentAt: true },
        }),
    linkedCommsIds.length === 0
      ? Promise.resolve([])
      : prisma.communicationDraft.findMany({
          where: { id: { in: linkedCommsIds } },
          select: { id: true, subject: true, stakeholder: true, status: true },
        }),
  ]);
  const linkedDecisionsById = new Map(linkedDecisionsRows.map((d) => [d.id, d]));
  const linkedNotificationsById = new Map(linkedNotificationRows.map((n) => [n.id, n]));
  const linkedCommsById = new Map(linkedCommsRows.map((c) => [c.id, c]));

  const availableRunbookRows = activeIncident
    ? await prisma.runbook.findMany({
        where: {
          orgId: me.orgId,
          status: "PUBLISHED",
          executions: { none: { incidentId: activeIncident.id } },
        },
        orderBy: [{ category: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          category: true,
          _count: { select: { steps: true } },
        },
      })
    : [];

  const liveExecutions: LiveExecution[] = runbookExecutionRows.map((r) => {
    const frozen = r.runbookJson as unknown as FrozenRunbook;
    const stepById = new Map<number, (typeof r.stepExecutions)[number]>();
    for (const se of r.stepExecutions) stepById.set(se.stepOrderIdx, se);

    const steps: LiveStep[] = frozen.steps.map((s) => {
      const exec = stepById.get(s.orderIdx);
      const linkedDecision = exec?.linkedDecisionId
        ? linkedDecisionsById.get(exec.linkedDecisionId) ?? null
        : null;
      const linkedNotification = exec?.linkedNotificationId
        ? linkedNotificationsById.get(exec.linkedNotificationId) ?? null
        : null;
      const linkedComms = exec?.linkedCommsId
        ? linkedCommsById.get(exec.linkedCommsId) ?? null
        : null;
      return {
        stepExecutionId: exec?.id ?? "",
        orderIdx: s.orderIdx,
        title: s.title,
        description: s.description,
        kind: s.kind as LiveStep["kind"],
        ownerRoleTitle: s.ownerRoleTitle,
        estimatedMin: s.estimatedMin,
        successCriteria: s.successCriteria,
        blocksOrders: s.blocksOrders ?? [],
        status: (exec?.status ?? "PENDING") as LiveStep["status"],
        notes: exec?.notes ?? null,
        startedAt: exec?.startedAt ?? null,
        completedAt: exec?.completedAt ?? null,
        decisionTypeCode: s.decisionTypeCode,
        regulatorTrigger: s.regulatorTrigger,
        commsTemplate: s.commsTemplate,
        linkedDecision: linkedDecision
          ? {
              id: linkedDecision.id,
              title: linkedDecision.title,
              decisionType: linkedDecision.decisionType,
              approverRolesRequired: linkedDecision.approverRolesRequired,
              approvedAt: linkedDecision.approvedAt,
            }
          : null,
        linkedNotification: linkedNotification
          ? {
              id: linkedNotification.id,
              regulator: linkedNotification.regulator,
              status: linkedNotification.status,
              dueAt: linkedNotification.dueAt,
              sentAt: linkedNotification.sentAt,
            }
          : null,
        linkedComms: linkedComms
          ? {
              id: linkedComms.id,
              subject: linkedComms.subject,
              stakeholder: linkedComms.stakeholder,
              status: linkedComms.status,
            }
          : null,
      };
    });

    return {
      executionId: r.id,
      runbookId: r.runbookId,
      runbookTitle: frozen.title,
      runbookCategory: frozen.category,
      version: frozen.version,
      status: r.status,
      activatedBy: r.activatedBy,
      activationReason: r.activationReason,
      startedAt: r.startedAt,
      steps,
    };
  });

  const availableRunbooks: AvailableRunbook[] = availableRunbookRows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    stepCount: r._count.steps,
  }));

  // Badge = count of my queued/in-progress steps across all active executions.
  const myRunbookQueueCount = liveExecutions
    .filter((e) => e.status === "ACTIVE")
    .reduce((sum, e) => {
      const mine = e.steps.filter(
        (s) =>
          (s.status === "PENDING" || s.status === "IN_PROGRESS") &&
          (s.ownerRoleTitle ?? "").toLowerCase() === participant.roleTitle.toLowerCase(),
      );
      return sum + mine.length;
    }, 0);

  const incidentForBanner = activeIncident
    ? {
        id: activeIncident.id,
        shortCode: activeIncident.shortCode,
        title: activeIncident.title,
        status: activeIncident.status,
        severity: activeIncident.severity,
        severityFinancial: activeIncident.severityFinancial,
        severityCustomer: activeIncident.severityCustomer,
        severityData: activeIncident.severityData,
        severitySystems: activeIncident.severitySystems,
        severityReputational: activeIncident.severityReputational,
        consumerDutyTrigger: activeIncident.consumerDutyTrigger,
        cyberDefaultHigh: activeIncident.cyberDefaultHigh,
        invokedAt: activeIncident.invokedAt,
        invokedByName:
          activeIncident.invokedBy?.name ?? activeIncident.invokedBy?.email ?? null,
      }
    : null;

  const responseByInject = new Map(myResponses.map((r) => [r.injectId, r]));
  const unreadCount = inbox.filter((i) => i.unread).length;
  const clock = currentDDay(exercise.dDayAnchor, exercise.speedMultiplier);

  const recentInjects = recentReleases.map((r) => ({
    id: r.inject.id,
    injectNo: r.inject.injectNo,
    summary: r.inject.summary,
  }));

  const minutesSinceLastSitrep = recentSitreps.length
    ? Math.floor(
        // eslint-disable-next-line react-hooks/purity
        (Date.now() - recentSitreps[0].createdAt.getTime()) / 60_000,
      )
    : null;

  // Live performance score — only meaningful once an incident has been invoked.
  const liveScore = activeIncident ? await scoreIncident(activeIncident.id) : null;

  // Compute next-best-action nudges for this user given the current state.
  const nudges = await computeNudges({
    exerciseId: exercise.id,
    userId: me.id,
    clockHHMM: clock.hhmm,
    mySeatAbbreviation: mySeat?.roleAbbreviation ?? participant?.roleTitle ?? null,
  });

  // Last 6 activity entries for the rolling ticker.
  const tickerEntries = feed.slice(0, 6).map((item) => ({
    id: item.id,
    at: item.at,
    kind: item.kind,
    text: tickerLineFor(item),
  }));

  // Team chat — the back-channel real incidents need.
  const chat = await loadChat(exercise.id, me.id);
  // Shared scratchpad
  const scratchpad = await prisma.exerciseScratchpad.findUnique({
    where: { exerciseId: exercise.id },
    include: { lastEditedBy: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-4">
      <FirstTimeLiveTour />
      {/* Top stripe — incident state is always at the top */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted dark:text-soft">
            {exercise.scenario.title} · Playing as{" "}
            <span className="font-semibold text-ink dark:text-slate-200">{participant.roleTitle}</span>
          </p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{exercise.title}</h1>
          <p className="mt-1 text-xs text-muted dark:text-soft">
            <span className={`rounded-full px-2 py-0.5 ${statusBadge(exercise.status)}`}>
              {exercise.status}
            </span>
            {" · "}
            <Link href={`/exercises/${exercise.id}`} className="underline">
              Overview
            </Link>
            {" · "}
            <Link href={`/exercises/${exercise.id}/debrief`} className="underline">
              Debrief
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OnCallStatus
            exerciseId={exercise.id}
            currentStatus={participant.onCallStatus}
            currentSince={participant.onCallSince}
          />
          {liveScore && (
            <LiveScoreBadge
              exerciseId={exercise.id}
              score={liveScore.overall}
              criticalCount={liveScore.coaching.filter((c) => c.level === "critical").length}
              warnCount={liveScore.coaching.filter((c) => c.level === "warn").length}
            />
          )}
          <DDayClockTicker
            anchor={exercise.dDayAnchor?.toISOString() ?? null}
            speedMultiplier={exercise.speedMultiplier}
            status={exercise.status}
            pollMs={3000}
          />
        </div>
      </header>

      <IncidentBanner exerciseId={exercise.id} incident={incidentForBanner} />

      <FacilitatorAnnouncementsBanner
        exerciseId={exercise.id}
        announcements={announcementRows.map<Announcement>((a) => ({
          id: a.id,
          kind: a.kind,
          message: a.message,
          authorName: a.author?.name ?? a.author?.email ?? null,
          dDayTime: a.dDayTime,
          pinned: a.pinned,
          createdAt: a.createdAt,
        }))}
      />

      <MyApprovalsDock
        exerciseId={exercise.id}
        decisions={approvalsQueue.decisions}
        comms={approvalsQueue.comms}
      />

      {tickerEntries.length > 0 && <ActivityTicker entries={tickerEntries} />}

      <LiveTabs
        unreadCount={unreadCount}
        runbookBadge={myRunbookQueueCount}
        decisionsBadge={activeIncident ? 1 : 0}
        commsBadge={commsDrafts.length}
        teamBadge={presence.filter((p) => p.online).length}
        briefing={
          <div className="space-y-4">
            {mySeat && (
              <RoleBriefing
                seatId={mySeat.id}
                abbreviation={mySeat.roleAbbreviation}
                title={mySeat.roleTitle}
                responsibility={mySeat.responsibility}
                isSMF={mySeat.isSMF}
                isDeputy={mySeat.isDeputy}
              />
            )}
            <SitrepCadenceBanner
              sitreps={recentSitreps}
              dDayHHMM={clock.hhmm}
              minutesSinceLastSitrep={minutesSinceLastSitrep}
              incidentActive={!!activeIncident}
            />
            <MyExerciseActionItems
              items={myActionItems}
              nowIso={new Date().toISOString()}
            />
            <NudgePanel nudges={nudges} />
            <Scratchpad
              exerciseId={exercise.id}
              initialBody={scratchpad?.body ?? ""}
              lastEditedByName={
                scratchpad?.lastEditedBy?.name ?? scratchpad?.lastEditedBy?.email ?? null
              }
              lastEditedAt={scratchpad?.lastEditedAt ?? null}
            />
          </div>
        }
        inbox={
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-ink">My inbox</h2>
              <span className="text-xs text-muted">
                {inbox.length} message{inbox.length === 1 ? "" : "s"}
                {unreadCount > 0 && (
                  <span className="ml-2 rounded-full bg-rose-600 px-2 py-0.5 text-white">
                    {unreadCount} unread
                  </span>
                )}
              </span>
            </div>
            {inbox.length === 0 ? (
              <p className="rounded-md border border-dashed border-line-strong bg-surface-1 p-6 text-center text-xs text-muted">
                No messages addressed to{" "}
                <span className="font-medium">{participant.roleTitle}</span> yet.
                {exercise.status !== "IN_PROGRESS" && (
                  <>
                    <br />
                    Exercise is currently <strong>{exercise.status}</strong>.
                  </>
                )}
              </p>
            ) : (
              <ul className="space-y-2">
                {inbox.map((item) => {
                  const existing =
                    item.kind === "INJECT" ? responseByInject.get(item.id) ?? null : null;
                  return (
                    <LiveInboxItem
                      key={`${item.kind}:${item.id}`}
                      exerciseId={exercise.id}
                      item={item}
                      existingResponse={
                        existing
                          ? {
                              assessment: existing.assessment,
                              proposedActions: existing.proposedActions,
                              stakeholders: existing.stakeholders,
                              resources: existing.resources,
                              commsNeeds: existing.commsNeeds,
                            }
                          : null
                      }
                    />
                  );
                })}
              </ul>
            )}
          </section>
        }
        runbook={
          <LiveRunbookTab
            incidentId={activeIncident?.id ?? null}
            executions={liveExecutions}
            availableRunbooks={availableRunbooks}
            myRoleTitle={participant.roleTitle}
            canActivate={
              me.orgRole === "OWNER" || me.orgRole === "ADMIN" || participant.exerciseRole === "FACILITATOR"
            }
          />
        }
        decisions={
          <div className="space-y-4">
            <IncidentCapturePanel
              exerciseId={exercise.id}
              incidentId={activeIncident?.id ?? null}
              dDayHHMM={clock.hhmm}
              recentInjects={recentInjects}
              orgDecisionPresets={orgDecisionPresets}
            />
            {activeIncident && (
              <ClosureGate
                exerciseId={exercise.id}
                incidentId={activeIncident.id}
                checks={{
                  closureImpactCeased: activeIncident.closureImpactCeased,
                  closureRegsNotified: activeIncident.closureRegsNotified,
                  closureLogComplete: activeIncident.closureLogComplete,
                  closurePreliminaryRCA: activeIncident.closurePreliminaryRCA,
                  closureCRO_SignOff: activeIncident.closureCRO_SignOff,
                }}
              />
            )}
            {activeIncident && (
              <BCPPanel
                exerciseId={exercise.id}
                incidentId={activeIncident.id}
                activation={
                  bcpActivation
                    ? {
                        id: bcpActivation.id,
                        activatedAt: bcpActivation.activatedAt,
                        ceoName:
                          bcpActivation.activatedByCEO?.name ??
                          bcpActivation.activatedByCEO?.email ??
                          null,
                        croName:
                          bcpActivation.activatedByCRO?.name ??
                          bcpActivation.activatedByCRO?.email ??
                          null,
                        rationale: bcpActivation.rationale,
                        deactivatedAt: bcpActivation.deactivatedAt,
                      }
                    : null
                }
                orgUsers={orgUsers}
              />
            )}
          </div>
        }
        comms={
          <div className="space-y-4">
            <MyCommsDraftsPanel
              drafts={commsDrafts
                .filter((d) => d.authorId === me.id)
                .map((d) => ({
                  id: d.id,
                  stakeholder: d.stakeholder,
                  subject: d.subject,
                  body: d.body,
                  status: d.status,
                  approver: d.approver?.name ?? d.approver?.email ?? null,
                  approvedAt: d.approvedAt,
                  sentAt: d.sentAt,
                  rejectionReason: d.rejectionReason,
                  createdAt: d.createdAt,
                }))}
            />
            <CommsCascadePanel
              exerciseId={exercise.id}
              drafts={commsDrafts.map((d) => ({
                id: d.id,
                stakeholder: d.stakeholder,
                audience: d.audience,
                subject: d.subject,
                body: d.body,
                status: d.status,
                author: d.author?.name ?? d.author?.email ?? "—",
                approver: d.approver?.name ?? d.approver?.email ?? null,
                approvedAt: d.approvedAt,
                sentAt: d.sentAt,
                rejectionReason: d.rejectionReason,
                createdAt: d.createdAt,
              }))}
            />
            <RegulatorClocks
              exerciseId={exercise.id}
              incidentId={activeIncident?.id ?? null}
              clocks={regulatorClocks.map((c) => ({
                id: c.id,
                regulator: c.regulator,
                trigger: c.trigger,
                slaHours: c.slaHours,
                dueAt: c.dueAt,
                status: c.status,
                sentAt: c.sentAt,
                ownerRoleTitle: c.ownerRoleTitle,
                approverRoleTitle: c.approverRoleTitle,
                waiverRationale: c.waiverRationale,
              }))}
            />
          </div>
        }
        team={
          <div className="space-y-4">
            <LivePresenceBar
              exerciseId={exercise.id}
              members={presence}
              status={exercise.status}
              pollMs={3000}
            />
            <SeatBoardCompact exerciseId={exercise.id} seats={seats} meId={me.id} />
            <section className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-ink">Live team feed</h2>
                <span className="text-xs text-muted">{feed.length} entries</span>
              </div>
              {feed.length === 0 ? (
                <p className="rounded-md border border-dashed border-line-strong bg-surface-1 p-6 text-center text-xs text-muted">
                  No activity yet. Anything anyone logs, releases or responds to will
                  appear here in real-time.
                </p>
              ) : (
                <ul className="space-y-2">
                  {feed.map((item) => (
                    <FeedRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        }
      />

      {/* Floating team chat — always reachable, bottom-right drawer. */}
      <FloatingChatDrawer exerciseId={exercise.id} meId={me.id} messages={chat} />

      {/* Real-time spine — gentle polling refresh + dramatic modal for new
          injects / events addressed to me. */}
      {exercise.status === "IN_PROGRESS" && (
        <>
          <LivePoller intervalMs={10_000} />
          <InjectArrivalNotifier
            exerciseId={exercise.id}
            roleTitle={participant.roleTitle}
            inbox={inbox.map((i) => ({
              kind: i.kind,
              id: i.id,
              scheduledTime: i.scheduledTime,
              title: i.title,
              description: i.summary,
              senderRoleTitle: i.from,
            }))}
          />
        </>
      )}
    </div>
  );
}

function statusBadge(status: string): string {
  switch (status) {
    case "IN_PROGRESS":
      return "bg-emerald-100 text-emerald-800";
    case "PAUSED":
      return "bg-amber-100 text-amber-800";
    case "COMPLETED":
      return "bg-surface-2 text-ink";
    case "READY":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-surface-2 text-ink";
  }
}

/** Short, human-readable summary of a feed item for the rolling ticker. */
function tickerLineFor(item: LiveFeedItem): string {
  switch (item.kind) {
    case "EVENT_RELEASED":
      return `Event #${item.eventNo} released — ${item.title}`;
    case "INJECT_RELEASED":
      return `Inject #${item.injectNo} released — ${item.title}`;
    case "DECISION":
      return `${item.author} recorded ${item.decisionType.replace(/_/g, " ").toLowerCase()}`;
    case "SITREP":
      return `${item.author} filed ${item.status} sitrep · ${item.businessUnit}`;
    case "MEETING":
      return `IMT meeting #${item.meetingNumber} recorded`;
    case "RESPONSE":
      return `${item.author} responded to inject ${item.injectSummary}`;
    case "COMMS":
      return `${item.author} drafted comms to ${item.audience.toLowerCase()}`;
    case "LOG":
      return `${item.author} logged ${item.logKind.toLowerCase()}`;
    case "INCIDENT":
      return `${item.shortCode} · ${item.transition}`;
    case "STATUS":
      return item.status;
  }
}

function timeOnly(d: Date): string {
  return d.toISOString().slice(11, 16);
}

function FeedRow({ item }: { item: LiveFeedItem }) {
  const time = timeOnly(item.at);
  // All feed rows share the same neutral card; the tag pill carries the meaning.
  const neutralCard = "rounded-md border border-line bg-surface-1 p-3 text-sm dark:border-slate-700 dark:bg-slate-900";
  // Incident-state transitions are the only "stop-and-read" rows — they get a
  // tinted background to stand out from the noise.
  const criticalCard = "rounded-md border border-rose-300 bg-rose-50 p-3 text-sm dark:border-rose-700 dark:bg-rose-950/40";
  switch (item.kind) {
    case "EVENT_RELEASED":
      return (
        <li className={neutralCard}>
          <FeedLine time={time} tag="EVENT" tagVariant="info">
            <span className="font-medium">#{item.eventNo} {item.title}</span>
            <span className="text-xs text-muted dark:text-soft">
              {" "}· released · D-Day {item.scheduledTime}
              {item.toRoleTitles.length > 0 && ` · to ${item.toRoleTitles.join(", ")}`}
            </span>
          </FeedLine>
        </li>
      );
    case "INJECT_RELEASED":
      return (
        <li className={neutralCard}>
          <FeedLine time={time} tag="INJECT" tagVariant="info">
            <span className="font-medium">#{item.injectNo} {item.title}</span>
            <span className="text-xs text-muted dark:text-soft">
              {" "}· released · D-Day {item.scheduledTime}
              {item.toRoleTitles.length > 0 && ` · to ${item.toRoleTitles.join(", ")}`}
            </span>
          </FeedLine>
        </li>
      );
    case "LOG":
      return (
        <li className={neutralCard}>
          <FeedLine time={time} tag={item.logKind} tagVariant="neutral">
            <span className="text-xs text-muted dark:text-soft">{item.author} · D-Day {item.dDayTime}</span>
          </FeedLine>
          <p className="mt-1 whitespace-pre-wrap text-ink dark:text-slate-200">{item.body}</p>
        </li>
      );
    case "RESPONSE":
      return (
        <li className={neutralCard}>
          <FeedLine time={time} tag="RESPONSE" tagVariant="ok">
            <span className="text-xs text-muted dark:text-soft">
              {item.author} responded to <span className="font-medium">{item.injectSummary}</span>
            </span>
          </FeedLine>
          <p className="mt-1 line-clamp-2 text-ink dark:text-slate-200">{item.assessment}</p>
        </li>
      );
    case "COMMS":
      return (
        <li className={neutralCard}>
          <FeedLine time={time} tag="COMMS" tagVariant="warn">
            <span className="text-xs text-muted dark:text-soft">
              {item.author} drafted comms to <span className="font-medium">{item.audience}</span>
            </span>
          </FeedLine>
          <p className="mt-1 font-medium text-ink dark:text-slate-100">{item.subject}</p>
        </li>
      );
    case "DECISION":
      return (
        <li className={criticalCard}>
          <FeedLine time={time} tag="DECISION" tagVariant="critical">
            <span className="font-mono text-[10px] uppercase text-muted dark:text-soft">
              {item.decisionType}
            </span>
            <span className="text-xs text-muted dark:text-slate-300">· {item.author}</span>
          </FeedLine>
          <p className="mt-1 font-medium text-ink dark:text-slate-100">{item.title}</p>
          {item.rationale && (
            <p className="mt-0.5 text-xs text-muted dark:text-slate-300">{item.rationale}</p>
          )}
          {item.approverRoles.length > 0 && (
            <p className="mt-1 text-[10px] uppercase tracking-wide text-muted dark:text-soft">
              Approval required: {item.approverRoles.join(" + ")}
            </p>
          )}
        </li>
      );
    case "SITREP":
      return (
        <li className={neutralCard}>
          <FeedLine time={time} tag={`SITREP · ${item.status}`} tagVariant={SITREP_VARIANT[item.status] ?? "neutral"}>
            <span className="text-xs text-muted dark:text-soft">
              {item.businessUnit} · {item.author}
            </span>
          </FeedLine>
          <p className="mt-1 text-ink dark:text-slate-200">{item.summary}</p>
        </li>
      );
    case "MEETING":
      return (
        <li className={neutralCard}>
          <FeedLine time={time} tag={`IMT MEETING #${item.meetingNumber}`} tagVariant="info">
            {item.nextMeetingDDay && (
              <span className="text-xs text-muted dark:text-soft">Next meeting D-Day {item.nextMeetingDDay}</span>
            )}
          </FeedLine>
        </li>
      );
    case "INCIDENT":
      return (
        <li className={criticalCard}>
          <FeedLine time={time} tag={item.shortCode} tagVariant="critical">
            <span className="font-medium text-ink dark:text-slate-100">{item.transition}</span>
            {item.severity && (
              <span className="text-xs text-muted dark:text-slate-300">· severity {item.severity}</span>
            )}
          </FeedLine>
        </li>
      );
    case "STATUS":
      return (
        <li className={neutralCard}>
          <FeedLine time={time} tag="STATUS" tagVariant="neutral">
            <span className="font-medium text-ink dark:text-slate-200">{item.status}</span>
          </FeedLine>
        </li>
      );
  }
}

const SITREP_VARIANT: Record<string, "ok" | "warn" | "critical"> = {
  GREEN: "ok",
  AMBER: "warn",
  RED: "critical",
};

function FeedLine({
  time,
  tag,
  tagVariant,
  children,
}: {
  time: string;
  tag: string;
  tagVariant: "neutral" | "critical" | "warn" | "ok" | "info";
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[11px] text-muted dark:text-soft">{time}</span>
      <Pill variant={tagVariant} tone="solid" size="sm" className="uppercase tracking-wide">
        {tag}
      </Pill>
      {children}
    </div>
  );
}
