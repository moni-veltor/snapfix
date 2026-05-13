import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addEventAction,
  addIBSAction,
  addInjectAction,
  deleteEventAction,
  deleteIBSAction,
  deleteInjectAction,
} from "@/app/actions/scenarios";
import ArtefactList from "@/components/ArtefactList";
import ArtefactUpload from "@/components/ArtefactUpload";
import MSELTimeline from "@/components/scenario/MSELTimeline";
import InjectComposer from "@/components/scenario/InjectComposer";

const ARTEFACT_INCLUDE = {
  orderBy: { createdAt: "asc" as const },
  include: { uploadedBy: { select: { name: true, email: true } } },
};

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireOrgUser();
  const { id } = await params;
  const scenario = await prisma.scenario.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      ibsList: { orderBy: { code: "asc" } },
      events: {
        orderBy: { eventNo: "asc" },
        include: { artefacts: ARTEFACT_INCLUDE },
      },
      injects: {
        orderBy: { injectNo: "asc" },
        include: { artefacts: ARTEFACT_INCLUDE },
      },
      exercises: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { participants: { select: { roleTitle: true } } },
      },
      artefacts: ARTEFACT_INCLUDE,
    },
  });
  if (!scenario) notFound();
  const canEdit = user.orgRole === "OWNER" || user.orgRole === "ADMIN";

  // Union of role titles used on exercises of this scenario — used by the
  // addressing validator on the inject composer + timeline preview.
  const knownRoles = Array.from(
    new Set(scenario.exercises.flatMap((e) => e.participants.map((p) => p.roleTitle))),
  );
  const nextInjectNo =
    Math.max(0, ...scenario.injects.map((j) => j.injectNo)) + 1;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{scenario.title}</h1>
        <p className="mt-1 text-sm text-muted">
          D-Day {scenario.dDayDate.toISOString().slice(0, 10)} · {scenario.durationMin} min
        </p>
        <div className="mt-4 prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
          {scenario.background}
        </div>
      </header>

      {canEdit && (
        <div className="rounded-lg border border-line bg-surface-1 p-4">
          <Link
            href={`/exercises/new?scenarioId=${scenario.id}`}
            className="inline-block rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Plan an exercise from this scenario
          </Link>
        </div>
      )}

      <Section title="Documents">
        <ArtefactList artefacts={scenario.artefacts} canManage={canEdit} empty="No scenario documents yet (facilitator/participant/scenario guide, briefing docs)." />
        {canEdit && <ArtefactUpload target="SCENARIO" targetId={scenario.id} />}
      </Section>

      <Section title="Important Business Services">
        <ul className="space-y-2">
          {scenario.ibsList.map((ibs) => (
            <li key={ibs.id} className="flex items-start justify-between rounded-md border border-line bg-surface-1 p-3 text-sm">
              <div>
                <div className="font-medium">
                  {ibs.code} — {ibs.name}{" "}
                  <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                    {ibs.criticality}
                  </span>
                </div>
                <div className="text-muted">
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
          <form action={addIBSAction} className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-dashed border-line-strong bg-surface-1 p-3 text-sm">
            <input type="hidden" name="scenarioId" value={scenario.id} />
            <input name="code" required placeholder="IBS_06" className="rounded border border-line-strong px-2 py-1" />
            <input name="name" required placeholder="Name" className="rounded border border-line-strong px-2 py-1" />
            <input name="impactToleranceMin" type="number" min={0} required placeholder="Impact tolerance (min)" className="rounded border border-line-strong px-2 py-1" />
            <select name="criticality" required defaultValue="HIGH" className="rounded border border-line-strong px-2 py-1">
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
              <option>CRITICAL</option>
            </select>
            <input name="impactMetrics" placeholder="Impact metrics (optional)" className="col-span-2 rounded border border-line-strong px-2 py-1" />
            <textarea name="description" placeholder="Description (optional)" className="col-span-2 rounded border border-line-strong px-2 py-1" rows={2} />
            <button className="col-span-2 rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700">Add IBS</button>
          </form>
        )}
      </Section>

      <Section title="Timeline">
        <MSELTimeline
          durationMin={scenario.durationMin}
          events={scenario.events.map((e) => ({
            id: e.id,
            kind: "EVENT" as const,
            no: e.eventNo,
            time: e.scheduledTime,
            title: e.title,
            description: e.description,
            senderRoleTitle: e.senderRoleTitle,
            toRoleTitles: e.toRoleTitles,
            ccRoleTitles: e.ccRoleTitles,
          }))}
          injects={scenario.injects.map((j) => ({
            id: j.id,
            kind: "INJECT" as const,
            no: j.injectNo,
            time: j.scheduledTime,
            title: j.summary,
            description: j.description,
            senderRoleTitle: j.senderRoleTitle,
            toRoleTitles: j.toRoleTitles,
            ccRoleTitles: j.ccRoleTitles,
          }))}
          knownRoles={knownRoles}
        />
      </Section>

      <Section title="Master Scenario Events List (MSEL)">
        <ol className="space-y-2">
          {scenario.events.map((e) => (
            <li key={e.id} className="rounded-md border border-line bg-surface-1 p-3 text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">
                    Event #{e.eventNo} · {e.scheduledTime} — {e.title}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700">{e.description}</p>
                  <AddressingBlock
                    from={e.senderRoleTitle}
                    to={e.toRoleTitles}
                    cc={e.ccRoleTitles}
                  />
                  {e.expectedActions.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted">Expected actions</summary>
                      <ul className="mt-1 list-disc pl-5 text-slate-700">
                        {e.expectedActions.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </details>
                  )}
                  {(e.artefacts.length > 0 || canEdit) && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted">
                        Attachments ({e.artefacts.length})
                      </summary>
                      <div className="mt-2 space-y-2">
                        <ArtefactList artefacts={e.artefacts} canManage={canEdit} empty="No attachments." />
                        {canEdit && <ArtefactUpload target="EVENT" targetId={e.id} compact />}
                      </div>
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
          <form action={addEventAction} className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-dashed border-line-strong bg-surface-1 p-3 text-sm">
            <input type="hidden" name="scenarioId" value={scenario.id} />
            <input name="eventNo" type="number" min={1} required placeholder="Event #" className="rounded border border-line-strong px-2 py-1" />
            <input name="scheduledTime" required pattern="[0-9]{2}:[0-9]{2}" placeholder="HH:MM (D-Day)" className="rounded border border-line-strong px-2 py-1" />
            <input name="title" required placeholder="Title" className="col-span-2 rounded border border-line-strong px-2 py-1" />
            <textarea name="description" required placeholder="Description" className="col-span-2 rounded border border-line-strong px-2 py-1" rows={3} />
            <input name="senderRoleTitle" placeholder='From (role title — e.g. "CTO")' className="col-span-2 rounded border border-line-strong px-2 py-1" />
            <input name="toRoleTitles" placeholder='To (comma-separated role titles — e.g. "Sn.TPM, TPM, ISM")' className="col-span-2 rounded border border-line-strong px-2 py-1" />
            <input name="ccRoleTitles" placeholder='Cc (comma-separated role titles — e.g. "CEO, CRO")' className="col-span-2 rounded border border-line-strong px-2 py-1" />
            <textarea name="expectedActions" placeholder="Expected actions (one per line)" className="rounded border border-line-strong px-2 py-1" rows={3} />
            <textarea name="objectives" placeholder="Objectives (one per line)" className="rounded border border-line-strong px-2 py-1" rows={3} />
            <button className="col-span-2 rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700">Add event</button>
          </form>
        )}
      </Section>

      <Section title="Injects">
        <ul className="space-y-2">
          {scenario.injects.map((j) => (
            <li key={j.id} className="rounded-md border border-line bg-surface-1 p-3 text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">
                    Inject #{j.injectNo} · {j.scheduledTime} — {j.summary}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700">{j.description}</p>
                  <AddressingBlock
                    from={j.senderRoleTitle}
                    to={j.toRoleTitles}
                    cc={j.ccRoleTitles}
                  />
                  {j.relation && (
                    <p className="mt-2 text-xs text-muted"><span className="font-semibold">Relation:</span> {j.relation}</p>
                  )}
                  {(j.artefacts.length > 0 || canEdit) && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted">
                        Attachments ({j.artefacts.length})
                      </summary>
                      <div className="mt-2 space-y-2">
                        <ArtefactList artefacts={j.artefacts} canManage={canEdit} empty="No attachments." />
                        {canEdit && <ArtefactUpload target="INJECT" targetId={j.id} compact />}
                      </div>
                    </details>
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
          <div className="mt-4">
            <InjectComposer
              scenarioId={scenario.id}
              nextInjectNo={nextInjectNo}
              knownRoles={knownRoles}
            />
          </div>
        )}
      </Section>

      {scenario.exercises.length > 0 && (
        <Section title="Recent runs">
          <ul className="space-y-1 text-sm">
            {scenario.exercises.map((r) => (
              <li key={r.id}>
                <Link className="hover:underline" href={`/exercises/${r.id}`}>
                  {r.title}
                </Link>
                <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-slate-600">{r.status}</span>
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

function AddressingBlock({
  from,
  to,
  cc,
}: {
  from: string | null;
  to: string[];
  cc: string[];
}) {
  if (!from && to.length === 0 && cc.length === 0) return null;
  return (
    <div className="mt-2 space-y-0.5 text-xs text-slate-600">
      {from && (
        <div>
          <span className="font-semibold text-muted">From:</span> {from}
        </div>
      )}
      {to.length > 0 && (
        <div>
          <span className="font-semibold text-muted">To:</span> {to.join(", ")}
        </div>
      )}
      {cc.length > 0 && (
        <div>
          <span className="font-semibold text-muted">Cc:</span> {cc.join(", ")}
        </div>
      )}
    </div>
  );
}
