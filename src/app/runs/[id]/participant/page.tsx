import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgUser } from "@/lib/auth";
import { computeVisibility, loadRunWithScenario } from "@/lib/run-queries";
import { createCommsDraftAction, upsertResponseAction } from "@/app/actions/runs";
import DDayClockTicker from "@/components/DDayClockTicker";
import IncidentLogPanel from "@/components/IncidentLogPanel";

export default async function ParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireOrgUser();
  const { id } = await params;
  const run = await loadRunWithScenario(id, user.orgId);
  if (!run) notFound();
  const { clock, events, injects } = computeVisibility(run);

  const myResponses = new Map(
    run.responses.filter((r) => r.authorId === user.id).map((r) => [r.injectId, r]),
  );

  const visibleEvents = events.filter((e) => e.released);
  const visibleInjects = injects.filter((i) => i.released);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{run.title}</h1>
          <p className="text-sm text-slate-500">
            {run.scenario.title} · You: {user.name ?? user.email} ({user.orgRole}) ·{" "}
            <Link href={`/runs/${run.id}/debrief`} className="underline">
              Debrief
            </Link>
            {" · "}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{run.status}</span>
          </p>
        </div>
        <DDayClockTicker
          anchor={run.dDayAnchor?.toISOString() ?? null}
          speedMultiplier={run.speedMultiplier}
          status={run.status}
        />
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active events</h2>
        {visibleEvents.length === 0 ? (
          <p className="rounded border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
            No events released yet. The facilitator will release scenario events on the D-Day clock.
          </p>
        ) : (
          <ul className="space-y-2">
            {visibleEvents.map((e) => (
              <li key={e.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                <div className="font-medium">
                  Event #{e.eventNo} · {e.scheduledTime} — {e.title}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{e.description}</p>
                {e.expectedActions.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-slate-500">Expected actions</summary>
                    <ul className="mt-1 list-disc pl-5 text-slate-700">
                      {e.expectedActions.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active injects — capture your response</h2>
        {visibleInjects.length === 0 ? (
          <p className="rounded border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
            No injects released yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {visibleInjects.map((j) => {
              const existing = myResponses.get(j.id);
              return (
                <li key={j.id} className="rounded-md border border-slate-200 bg-white p-4 text-sm">
                  <div className="font-medium">
                    Inject #{j.injectNo} · {j.scheduledTime} — {j.summary}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700">{j.description}</p>
                  <form action={upsertResponseAction} className="mt-3 grid grid-cols-2 gap-2">
                    <input type="hidden" name="runId" value={run.id} />
                    <input type="hidden" name="injectId" value={j.id} />
                    <TextArea label="Initial assessment" name="assessment" required defaultValue={existing?.assessment} />
                    <TextArea label="Proposed actions" name="proposedActions" required defaultValue={existing?.proposedActions} />
                    <TextArea label="Key stakeholders" name="stakeholders" defaultValue={existing?.stakeholders ?? ""} />
                    <TextArea label="Resource requirements" name="resources" defaultValue={existing?.resources ?? ""} />
                    <TextArea label="Communication needs" name="commsNeeds" defaultValue={existing?.commsNeeds ?? ""} className="col-span-2" />
                    <button className="col-span-2 rounded-md bg-slate-900 px-3 py-1.5 text-white">
                      {existing ? "Update response" : "Save response"}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Incident log</h2>
        <IncidentLogPanel
          runId={run.id}
          dDayHHMM={clock.hhmm}
          entries={run.incidentLog.map((e) => ({
            id: e.id,
            dDayTime: e.dDayTime,
            kind: e.kind,
            body: e.body,
            author: e.author?.name ?? e.author?.email ?? "—",
            createdAt: e.createdAt.toISOString(),
          }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Communication drafts</h2>
        <ul className="space-y-2">
          {run.comms.map((c) => (
            <li key={c.id} className="rounded border border-slate-200 bg-white p-3 text-sm">
              <div className="text-xs text-slate-500">
                {c.audience} · {c.author?.name ?? c.author?.email} · {c.status}
              </div>
              <div className="mt-1 font-medium">{c.subject}</div>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">{c.body}</p>
            </li>
          ))}
        </ul>
        <form action={createCommsDraftAction} className="grid grid-cols-2 gap-2 rounded-md border border-dashed border-slate-300 bg-white p-3 text-sm">
          <input type="hidden" name="runId" value={run.id} />
          <select name="audience" required className="rounded border border-slate-300 px-2 py-1">
            <option value="CUSTOMER">Customer</option>
            <option value="REGULATOR">Regulator</option>
            <option value="INTERNAL">Internal team</option>
            <option value="SENIOR_MGMT">Senior management</option>
            <option value="MEDIA">Media</option>
          </select>
          <input name="subject" required placeholder="Subject" className="rounded border border-slate-300 px-2 py-1" />
          <textarea name="body" required rows={4} placeholder="Draft message body…" className="col-span-2 rounded border border-slate-300 px-2 py-1" />
          <button className="col-span-2 rounded-md bg-slate-900 px-3 py-1.5 text-white">Save draft</button>
        </form>
      </section>
    </div>
  );
}

function TextArea({ label, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="text-slate-700">{label}</span>
      <textarea {...props} rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
    </label>
  );
}
