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

  const participant = await prisma.exerciseParticipant.findFirst({
    where: { exerciseId: exercise.id, userId: me.id },
  });

  if (!participant) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Live workspace</h1>
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          You're not on the roster for this exercise. Ask the facilitator to add you on the{" "}
          <Link href={`/exercises/${exercise.id}/team`} className="underline">
            team page
          </Link>
          .
        </p>
      </div>
    );
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

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {exercise.scenario.title} · Playing as{" "}
            <span className="font-semibold text-slate-700">{participant.roleTitle}</span>
          </p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{exercise.title}</h1>
          <p className="mt-1 text-xs text-slate-500">
            <span
              className={`rounded-full px-2 py-0.5 ${statusBadge(exercise.status)}`}
            >
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
        <DDayClockTicker
          anchor={exercise.dDayAnchor?.toISOString() ?? null}
          speedMultiplier={exercise.speedMultiplier}
          status={exercise.status}
          pollMs={3000}
        />
      </header>

      <IncidentBanner exerciseId={exercise.id} incident={incidentForBanner} />

      <LivePresenceBar
        exerciseId={exercise.id}
        members={presence}
        status={exercise.status}
        pollMs={3000}
      />

      {activeIncident && (
        <MobilisationChecklist
          exerciseId={exercise.id}
          members={mobilisation}
          myParticipantId={participant.id}
        />
      )}

      <IncidentCapturePanel
        exerciseId={exercise.id}
        incidentId={activeIncident?.id ?? null}
        dDayHHMM={clock.hhmm}
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

      <details className="rounded-md border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-700">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              My inbox
            </h2>
            <span className="text-xs text-slate-500">
              {inbox.length} message{inbox.length === 1 ? "" : "s"}
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-rose-600 px-2 py-0.5 text-white">
                  {unreadCount} unread
                </span>
              )}
            </span>
          </div>
          {inbox.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Live team feed
            </h2>
            <span className="text-xs text-slate-500">{feed.length} entries</span>
          </div>
          {feed.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
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
      return "bg-slate-100 text-slate-700";
  }
}

function timeOnly(d: Date): string {
  return d.toISOString().slice(11, 16);
}

function FeedRow({ item }: { item: LiveFeedItem }) {
  const time = timeOnly(item.at);
  switch (item.kind) {
    case "EVENT_RELEASED":
      return (
        <li className="rounded-md border border-blue-200 bg-blue-50/60 p-3 text-sm">
          <FeedLine time={time} tag="EVENT" tagClass="bg-blue-600 text-white">
            <span className="font-medium">#{item.eventNo} {item.title}</span>
            <span className="text-xs text-slate-600">
              {" "}released by facilitator · D-Day {item.scheduledTime}
              {item.toRoleTitles.length > 0 && ` · to ${item.toRoleTitles.join(", ")}`}
            </span>
          </FeedLine>
        </li>
      );
    case "INJECT_RELEASED":
      return (
        <li className="rounded-md border border-violet-200 bg-violet-50/60 p-3 text-sm">
          <FeedLine time={time} tag="INJECT" tagClass="bg-violet-600 text-white">
            <span className="font-medium">#{item.injectNo} {item.title}</span>
            <span className="text-xs text-slate-600">
              {" "}released · D-Day {item.scheduledTime}
              {item.toRoleTitles.length > 0 && ` · to ${item.toRoleTitles.join(", ")}`}
            </span>
          </FeedLine>
        </li>
      );
    case "LOG":
      return (
        <li className="rounded-md border border-slate-200 bg-white p-3 text-sm">
          <FeedLine time={time} tag={item.logKind} tagClass="bg-slate-800 text-white">
            <span className="text-xs text-slate-500">{item.author} · D-Day {item.dDayTime}</span>
          </FeedLine>
          <p className="mt-1 whitespace-pre-wrap text-slate-700">{item.body}</p>
        </li>
      );
    case "RESPONSE":
      return (
        <li className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-sm">
          <FeedLine time={time} tag="RESPONSE" tagClass="bg-emerald-600 text-white">
            <span className="text-xs text-slate-600">
              {item.author} responded to <span className="font-medium">{item.injectSummary}</span>
            </span>
          </FeedLine>
          <p className="mt-1 line-clamp-2 text-slate-700">{item.assessment}</p>
        </li>
      );
    case "COMMS":
      return (
        <li className="rounded-md border border-amber-200 bg-amber-50/60 p-3 text-sm">
          <FeedLine time={time} tag="COMMS" tagClass="bg-amber-600 text-white">
            <span className="text-xs text-slate-600">
              {item.author} drafted comms to <span className="font-medium">{item.audience}</span>
            </span>
          </FeedLine>
          <p className="mt-1 font-medium text-slate-800">{item.subject}</p>
        </li>
      );
    case "DECISION":
      return (
        <li className="rounded-md border border-rose-300 bg-rose-50/70 p-3 text-sm">
          <FeedLine time={time} tag="DECISION" tagClass="bg-rose-700 text-white">
            <span className="font-mono text-[10px] uppercase text-slate-500">
              {item.decisionType}
            </span>
            <span className="text-xs text-slate-600">· {item.author}</span>
          </FeedLine>
          <p className="mt-1 font-medium text-slate-800">{item.title}</p>
          {item.rationale && (
            <p className="mt-0.5 text-xs text-slate-600">{item.rationale}</p>
          )}
          {item.approverRoles.length > 0 && (
            <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
              Approval required: {item.approverRoles.join(" + ")}
            </p>
          )}
        </li>
      );
    case "SITREP":
      return (
        <li className={`rounded-md border p-3 text-sm ${SITREP_CLASS[item.status] ?? "border-slate-200 bg-white"}`}>
          <FeedLine time={time} tag={`SITREP · ${item.status}`} tagClass={SITREP_TAG[item.status] ?? "bg-slate-700 text-white"}>
            <span className="text-xs text-slate-600">
              {item.businessUnit} · {item.author}
            </span>
          </FeedLine>
          <p className="mt-1 text-slate-700">{item.summary}</p>
        </li>
      );
    case "MEETING":
      return (
        <li className="rounded-md border border-indigo-200 bg-indigo-50/60 p-3 text-sm">
          <FeedLine time={time} tag={`IMT MEETING #${item.meetingNumber}`} tagClass="bg-indigo-700 text-white">
            {item.nextMeetingDDay && (
              <span className="text-xs text-slate-600">Next meeting D-Day {item.nextMeetingDDay}</span>
            )}
          </FeedLine>
        </li>
      );
    case "INCIDENT":
      return (
        <li className="rounded-md border border-rose-400 bg-rose-100 p-3 text-sm">
          <FeedLine time={time} tag={item.shortCode} tagClass="bg-rose-700 text-white">
            <span className="font-medium text-slate-800">{item.transition}</span>
            {item.severity && (
              <span className="text-xs text-slate-600">· severity {item.severity}</span>
            )}
          </FeedLine>
        </li>
      );
    case "STATUS":
      return (
        <li className="rounded-md border border-slate-300 bg-slate-100 p-3 text-sm">
          <FeedLine time={time} tag="STATUS" tagClass="bg-slate-900 text-white">
            <span className="font-medium text-slate-700">{item.status}</span>
          </FeedLine>
        </li>
      );
  }
}

const SITREP_CLASS: Record<string, string> = {
  GREEN: "border-emerald-200 bg-emerald-50/60",
  AMBER: "border-amber-200 bg-amber-50/60",
  RED: "border-rose-300 bg-rose-50/70",
};
const SITREP_TAG: Record<string, string> = {
  GREEN: "bg-emerald-700 text-white",
  AMBER: "bg-amber-600 text-white",
  RED: "bg-rose-700 text-white",
};

function FeedLine({
  time,
  tag,
  tagClass,
  children,
}: {
  time: string;
  tag: string;
  tagClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[11px] text-slate-500">{time}</span>
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tagClass}`}>
        {tag}
      </span>
      {children}
    </div>
  );
}
