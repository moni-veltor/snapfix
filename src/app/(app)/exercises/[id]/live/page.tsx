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
import LiveQuickCapture from "@/components/LiveQuickCapture";

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

  const [inbox, feed, presence, myResponses] = await Promise.all([
    loadInbox(exercise.id, { roleTitle: participant.roleTitle, participantId: participant.id }),
    loadLiveFeed(exercise.id),
    loadPresence(exercise.id),
    prisma.participantResponse.findMany({
      where: { exerciseId: exercise.id, authorId: me.id },
    }),
  ]);

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

      <LivePresenceBar
        exerciseId={exercise.id}
        members={presence}
        status={exercise.status}
        pollMs={3000}
      />

      <LiveQuickCapture exerciseId={exercise.id} dDayHHMM={clock.hhmm} />

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
