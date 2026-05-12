import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadInbox } from "@/lib/inbox";
import DDayClockTicker from "@/components/DDayClockTicker";
import { markEventReadAction, markInjectReadAction } from "@/app/actions/inbox";

export default async function InboxPage({
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
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
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

  const items = await loadInbox(exercise.id, {
    roleTitle: participant.roleTitle,
    participantId: participant.id,
  });

  const unreadCount = items.filter((i) => i.unread).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {exercise.scenario.title} · {participant.roleTitle}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Inbox{" "}
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-rose-600 px-2 py-0.5 align-middle text-xs text-white">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500">{exercise.title}</p>
        </div>
        <DDayClockTicker
          anchor={exercise.dDayAnchor?.toISOString() ?? null}
          speedMultiplier={exercise.speedMultiplier}
          status={exercise.status}
        />
      </header>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No messages addressed to <span className="font-medium">{participant.roleTitle}</span> yet.
          {exercise.status !== "IN_PROGRESS" && (
            <> The exercise is currently <strong>{exercise.status}</strong>.</>
          )}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={`${item.kind}:${item.id}`}
              className={`rounded-md border p-4 ${
                item.unread ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono">
                      {item.scheduledTime}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.kind}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        item.addressing === "TO"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {item.addressing}
                    </span>
                    {item.unread && (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-white">unread</span>
                    )}
                  </div>
                  <div className="mt-1 font-medium">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.from && (
                      <>
                        <span className="font-semibold">From:</span> {item.from}
                      </>
                    )}
                    {item.to.length > 0 && (
                      <>
                        {" "}
                        · <span className="font-semibold">To:</span> {item.to.join(", ")}
                      </>
                    )}
                    {item.cc.length > 0 && (
                      <>
                        {" "}
                        · <span className="font-semibold">Cc:</span> {item.cc.join(", ")}
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{item.summary}</p>
                </div>
                {item.unread && (
                  <form
                    action={item.kind === "EVENT" ? markEventReadAction : markInjectReadAction}
                  >
                    <input type="hidden" name="exerciseId" value={exercise.id} />
                    <input
                      type="hidden"
                      name={item.kind === "EVENT" ? "eventId" : "injectId"}
                      value={item.id}
                    />
                    <button className="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-white">
                      Mark read
                    </button>
                  </form>
                )}
              </div>
              {item.attachments.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs">
                  {item.attachments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1"
                    >
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono">
                        {a.kind}
                      </span>
                      <a
                        href={a.blobUrl}
                        target="_blank"
                        rel="noopener"
                        className="flex-1 truncate font-medium text-slate-800 hover:underline"
                      >
                        {a.title}
                      </a>
                      <span className="text-slate-400">
                        {a.contentType ?? "file"} ·{" "}
                        {a.sizeBytes
                          ? a.sizeBytes < 1024 * 1024
                            ? `${(a.sizeBytes / 1024).toFixed(1)} KB`
                            : `${(a.sizeBytes / 1024 / 1024).toFixed(1)} MB`
                          : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {item.kind === "INJECT" && (
                <div className="mt-3">
                  <Link
                    href={`/exercises/${exercise.id}/participant#inject-${item.id}`}
                    className="text-xs text-slate-700 underline"
                  >
                    Open response form →
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
