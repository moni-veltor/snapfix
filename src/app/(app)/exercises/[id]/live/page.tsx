import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadInbox } from "@/lib/inbox";
import { loadLiveFeed, loadPresence, loadMobilisation, type LiveFeedItem } from "@/lib/live";
import { currentDDay } from "@/lib/dday";
import DDayClockTicker from "@/components/DDayClockTicker";
import LivePresenceBar from "@/components/LivePresenceBar";
import LiveInboxItem from "@/components/LiveInboxItem";
import IncidentBanner from "@/components/IncidentBanner";
import MobilisationChecklist from "@/components/MobilisationChecklist";
import IncidentCapturePanel from "@/components/IncidentCapturePanel";
import RegulatorClocks from "@/components/RegulatorClocks";
import CommsCascadePanel from "@/components/CommsCascadePanel";
import BCPPanel from "@/components/BCPPanel";
import ClosureGate from "@/components/ClosureGate";
import Pill from "@/components/ui/Pill";
import LiveScoreBadge from "@/components/scoring/LiveScoreBadge";
import { scoreIncident } from "@/lib/scoring";
import SeatBoard from "@/components/seats/SeatBoard";
import { loadSeats } from "@/lib/seats";
import { ensureSeatsForExercise } from "@/app/actions/seats";
import NudgePanel from "@/components/live/NudgePanel";
import { computeNudges } from "@/lib/nudges";
import ActivityTicker from "@/components/live/ActivityTicker";
import { autoReleaseExpired } from "@/lib/auto-release";
import ChatPanel from "@/components/live/ChatPanel";
import { loadChat } from "@/lib/chat";
import Scratchpad from "@/components/live/Scratchpad";
import OnCallStatus from "@/components/live/OnCallStatus";
import RoleBriefing from "@/components/live/RoleBriefing";

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

  // Seat-claim entry view — shown when the user hasn't yet taken a seat.
  // Replaces the old "you're not on the roster" wall — any org member can
  // walk in and claim a seat in a live exercise.
  if (!participant && !mySeat) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <header>
          <p className="text-xs uppercase tracking-wide text-muted">{exercise.scenario.title}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{exercise.title}</h1>
          <p className="mt-2 text-sm text-muted">
            Welcome to the war room. Pick a seat below to join the exercise — the platform
            routes all addressed messages and decisions through whoever's holding the seat at
            the moment.
          </p>
        </header>
        <SeatBoard exerciseId={exercise.id} seats={seats} meId={me.id} />
      </div>
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
    mobilisation,
    myResponses,
    activeIncident,
    regulatorClocks,
    commsDrafts,
    bcpActivation,
    orgUsers,
  ] = await Promise.all([
    loadInbox(exercise.id, { roleTitle: participant.roleTitle, participantId: participant.id }),
    loadLiveFeed(exercise.id),
    loadPresence(exercise.id),
    loadMobilisation(exercise.id),
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
  ]);

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
      {/* Top stripe — incident state is always at the top */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted dark:text-soft">
            {exercise.scenario.title} · Playing as{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{participant.roleTitle}</span>
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

      {tickerEntries.length > 0 && <ActivityTicker entries={tickerEntries} />}

      {/* Body: left rail with context, right column with action */}
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Left rail — status / context widgets (sticky on desktop) */}
        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <LivePresenceBar
            exerciseId={exercise.id}
            members={presence}
            status={exercise.status}
            pollMs={3000}
          />

          <SeatBoard exerciseId={exercise.id} seats={seats} meId={me.id} />

          {activeIncident && mobilisation.length > 0 && (
            <MobilisationChecklist
              exerciseId={exercise.id}
              members={mobilisation}
              myParticipantId={participant.id}
            />
          )}

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

          <ChatPanel exerciseId={exercise.id} meId={me.id} messages={chat} />
        </aside>

        {/* Right column — where work happens */}
        <main className="space-y-4">
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

          <NudgePanel nudges={nudges} />

          <IncidentCapturePanel
            exerciseId={exercise.id}
            incidentId={activeIncident?.id ?? null}
            dDayHHMM={clock.hhmm}
          />

          <details className="rounded-md border border-line bg-surface-1 p-3 dark:border-slate-700 dark:bg-slate-900" open={commsDrafts.length > 0}>
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
              Comms cascade · {commsDrafts.length} draft{commsDrafts.length === 1 ? "" : "s"}
            </summary>
            <div className="mt-3">
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
            </div>
          </details>

          <Scratchpad
            exerciseId={exercise.id}
            initialBody={scratchpad?.body ?? ""}
            lastEditedByName={
              scratchpad?.lastEditedBy?.name ?? scratchpad?.lastEditedBy?.email ?? null
            }
            lastEditedAt={scratchpad?.lastEditedAt ?? null}
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  My inbox
                </h2>
                <span className="text-xs text-muted dark:text-soft">
                  {inbox.length} message{inbox.length === 1 ? "" : "s"}
                  {unreadCount > 0 && (
                    <span className="ml-2 rounded-full bg-rose-600 px-2 py-0.5 text-white">
                      {unreadCount} unread
                    </span>
                  )}
                </span>
              </div>
              {inbox.length === 0 ? (
                <p className="rounded-md border border-dashed border-line-strong bg-surface-1 p-6 text-center text-xs text-muted dark:border-slate-700 dark:bg-slate-900 dark:text-soft">
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

            <section className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  Live team feed
                </h2>
                <span className="text-xs text-muted dark:text-soft">{feed.length} entries</span>
              </div>
              {feed.length === 0 ? (
                <p className="rounded-md border border-dashed border-line-strong bg-surface-1 p-6 text-center text-xs text-muted dark:border-slate-700 dark:bg-slate-900 dark:text-soft">
                  No activity yet. Anything anyone logs, releases or responds to will appear here in
                  real-time.
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
        </main>
      </div>
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
      return "bg-slate-200 text-slate-700";
    case "READY":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-surface-2 text-slate-700";
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
            <span className="text-xs text-slate-600 dark:text-soft">
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
            <span className="text-xs text-slate-600 dark:text-soft">
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
          <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-200">{item.body}</p>
        </li>
      );
    case "RESPONSE":
      return (
        <li className={neutralCard}>
          <FeedLine time={time} tag="RESPONSE" tagVariant="ok">
            <span className="text-xs text-slate-600 dark:text-soft">
              {item.author} responded to <span className="font-medium">{item.injectSummary}</span>
            </span>
          </FeedLine>
          <p className="mt-1 line-clamp-2 text-slate-700 dark:text-slate-200">{item.assessment}</p>
        </li>
      );
    case "COMMS":
      return (
        <li className={neutralCard}>
          <FeedLine time={time} tag="COMMS" tagVariant="warn">
            <span className="text-xs text-slate-600 dark:text-soft">
              {item.author} drafted comms to <span className="font-medium">{item.audience}</span>
            </span>
          </FeedLine>
          <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">{item.subject}</p>
        </li>
      );
    case "DECISION":
      return (
        <li className={criticalCard}>
          <FeedLine time={time} tag="DECISION" tagVariant="critical">
            <span className="font-mono text-[10px] uppercase text-muted dark:text-soft">
              {item.decisionType}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300">· {item.author}</span>
          </FeedLine>
          <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
          {item.rationale && (
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{item.rationale}</p>
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
            <span className="text-xs text-slate-600 dark:text-soft">
              {item.businessUnit} · {item.author}
            </span>
          </FeedLine>
          <p className="mt-1 text-slate-700 dark:text-slate-200">{item.summary}</p>
        </li>
      );
    case "MEETING":
      return (
        <li className={neutralCard}>
          <FeedLine time={time} tag={`IMT MEETING #${item.meetingNumber}`} tagVariant="info">
            {item.nextMeetingDDay && (
              <span className="text-xs text-slate-600 dark:text-soft">Next meeting D-Day {item.nextMeetingDDay}</span>
            )}
          </FeedLine>
        </li>
      );
    case "INCIDENT":
      return (
        <li className={criticalCard}>
          <FeedLine time={time} tag={item.shortCode} tagVariant="critical">
            <span className="font-medium text-slate-800 dark:text-slate-100">{item.transition}</span>
            {item.severity && (
              <span className="text-xs text-slate-600 dark:text-slate-300">· severity {item.severity}</span>
            )}
          </FeedLine>
        </li>
      );
    case "STATUS":
      return (
        <li className={neutralCard}>
          <FeedLine time={time} tag="STATUS" tagVariant="neutral">
            <span className="font-medium text-slate-700 dark:text-slate-200">{item.status}</span>
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
