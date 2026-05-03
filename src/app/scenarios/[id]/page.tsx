import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addEventAction,
  addIBSAction,
  addInjectAction,
  deleteEventAction,
  deleteIBSAction,
  deleteInjectAction,
} from "@/app/actions/scenarios";
import { createRunAction } from "@/app/actions/runs";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const scenario = await prisma.scenario.findUnique({
    where: { id },
    include: {
      ibsList: { orderBy: { code: "asc" } },
      events: { orderBy: { eventNo: "asc" } },
      injects: { orderBy: { injectNo: "asc" } },
      runs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!scenario) notFound();
  const canEdit = user.role === "FACILITATOR" || user.role === "ADMIN";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{scenario.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          D-Day {scenario.dDayDate.toISOString().slice(0, 10)} · {scenario.durationMin} min
        </p>
        <div className="mt-4 prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
          {scenario.background}
        </div>
      </header>

      {canEdit && (
        <form action={createRunAction} className="flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <input type="hidden" name="scenarioId" value={scenario.id} />
          <label className="block flex-1 text-sm">
            <span className="text-slate-700">Start a new exercise run</span>
            <input
              name="title"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder={`${scenario.title} — ${new Date().toISOString().slice(0, 10)}`}
            />
          </label>
          <button className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
            Start run
          </button>
        </form>
      )}

      <Section title="Important Business Services">
        <ul className="space-y-2">
          {scenario.ibsList.map((ibs) => (
            <li key={ibs.id} className="flex items-start justify-between rounded-md border border-slate-200 bg-white p-3 text-sm">
              <div>
                <div className="font-medium">
                  {ibs.code} — {ibs.name}{" "}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                    {ibs.criticality}
                  </span>
                </div>
                <div className="text-slate-500">
                  Impact tolerance: {ibs.impactToleranceMin} min
                  {ibs.impactMetrics ? ` · ${ibs.impactMetrics}` : ""}
                </div>
                {ibs.description && <div className="mt-1 text-slate-600">{ibs.description}</div>}
              </div>
              {canEdit && (
                <form action={deleteIBSAction}>
                  <input type="hidden" name="id" value={ibs.id} />
                  <input type="hidden" name="scenarioId" value={scenario.id} />
                  <button className="text-xs text-rose-600 hover:underline">Delete</button>
                </form>
              )}
            </li>
          ))}
        </ul>
        {canEdit && (
          <form action={addIBSAction} className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-dashed border-slate-300 bg-white p-3 text-sm">
            <input type="hidden" name="scenarioId" value={scenario.id} />
            <input name="code" required placeholder="IBS_06" className="rounded border border-slate-300 px-2 py-1" />
            <input name="name" required placeholder="Name" className="rounded border border-slate-300 px-2 py-1" />
            <input name="impactToleranceMin" type="number" min={0} required placeholder="Impact tolerance (min)" className="rounded border border-slate-300 px-2 py-1" />
            <select name="criticality" required defaultValue="HIGH" className="rounded border border-slate-300 px-2 py-1">
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
              <option>CRITICAL</option>
            </select>
            <input name="impactMetrics" placeholder="Impact metrics (optional)" className="col-span-2 rounded border border-slate-300 px-2 py-1" />
            <textarea name="description" placeholder="Description (optional)" className="col-span-2 rounded border border-slate-300 px-2 py-1" rows={2} />
            <button className="col-span-2 rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700">Add IBS</button>
          </form>
        )}
      </Section>

      <Section title="Master Scenario Events List (MSEL)">
        <ol className="space-y-2">
          {scenario.events.map((e) => (
            <li key={e.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-start justify-between">
                <div>
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
                </div>
                {canEdit && (
                  <form action={deleteEventAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="scenarioId" value={scenario.id} />
                    <button className="text-xs text-rose-600 hover:underline">Delete</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ol>
        {canEdit && (
          <form action={addEventAction} className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-dashed border-slate-300 bg-white p-3 text-sm">
            <input type="hidden" name="scenarioId" value={scenario.id} />
            <input name="eventNo" type="number" min={1} required placeholder="Event #" className="rounded border border-slate-300 px-2 py-1" />
            <input name="scheduledTime" required pattern="[0-9]{2}:[0-9]{2}" placeholder="HH:MM (D-Day)" className="rounded border border-slate-300 px-2 py-1" />
            <input name="title" required placeholder="Title" className="col-span-2 rounded border border-slate-300 px-2 py-1" />
            <textarea name="description" required placeholder="Description" className="col-span-2 rounded border border-slate-300 px-2 py-1" rows={3} />
            <textarea name="expectedActions" placeholder="Expected actions (one per line)" className="rounded border border-slate-300 px-2 py-1" rows={3} />
            <textarea name="objectives" placeholder="Objectives (one per line)" className="rounded border border-slate-300 px-2 py-1" rows={3} />
            <button className="col-span-2 rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700">Add event</button>
          </form>
        )}
      </Section>

      <Section title="Injects">
        <ul className="space-y-2">
          {scenario.injects.map((j) => (
            <li key={j.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">
                    Inject #{j.injectNo} · {j.scheduledTime} — {j.summary}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700">{j.description}</p>
                  {j.relation && (
                    <p className="mt-2 text-xs text-slate-500"><span className="font-semibold">Relation:</span> {j.relation}</p>
                  )}
                </div>
                {canEdit && (
                  <form action={deleteInjectAction}>
                    <input type="hidden" name="id" value={j.id} />
                    <input type="hidden" name="scenarioId" value={scenario.id} />
                    <button className="text-xs text-rose-600 hover:underline">Delete</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
        {canEdit && (
          <form action={addInjectAction} className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-dashed border-slate-300 bg-white p-3 text-sm">
            <input type="hidden" name="scenarioId" value={scenario.id} />
            <input name="injectNo" type="number" min={1} required placeholder="Inject #" className="rounded border border-slate-300 px-2 py-1" />
            <input name="scheduledTime" required pattern="[0-9]{2}:[0-9]{2}" placeholder="HH:MM" className="rounded border border-slate-300 px-2 py-1" />
            <input name="summary" required placeholder="Summary" className="col-span-2 rounded border border-slate-300 px-2 py-1" />
            <textarea name="description" required placeholder="Description" className="col-span-2 rounded border border-slate-300 px-2 py-1" rows={3} />
            <textarea name="relation" placeholder="How this relates to the scenario" className="col-span-2 rounded border border-slate-300 px-2 py-1" rows={2} />
            <button className="col-span-2 rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700">Add inject</button>
          </form>
        )}
      </Section>

      {scenario.runs.length > 0 && (
        <Section title="Recent runs">
          <ul className="space-y-1 text-sm">
            {scenario.runs.map((r) => (
              <li key={r.id}>
                <Link className="hover:underline" href={`/runs/${r.id}`}>
                  {r.title}
                </Link>
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{r.status}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
