import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cloneTemplateAction } from "@/app/actions/templates";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireOrgUser();
  const { id } = await params;
  const template = await prisma.scenario.findFirst({
    where: { id, isTemplate: true, orgId: null },
    include: {
      ibsList: { orderBy: { code: "asc" } },
      events: { orderBy: { eventNo: "asc" } },
      injects: { orderBy: { injectNo: "asc" } },
      facilitatorQuestions: { orderBy: { orderIdx: "asc" } },
      debriefQuestions: { orderBy: { orderIdx: "asc" } },
    },
  });
  if (!template) notFound();
  const canClone = me.orgRole === "OWNER" || me.orgRole === "ADMIN";
  const caseStudy = template.caseStudy as
    | { title?: string; causation?: string; impactScale?: string; duration?: string; sourceUrl?: string }
    | null;
  const stressVars = template.stressVariables as
    | { name: string; options: string[] }[]
    | null;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-white">Template</span>
          {template.category && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5">{template.category}</span>
          )}
          {template.srrRef && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono">
              SRR {template.srrRef}
            </span>
          )}
        </div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{template.title}</h1>
          {canClone && (
            <form action={cloneTemplateAction}>
              <input type="hidden" name="templateId" value={template.id} />
              <button className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
                Clone into my org
              </button>
            </form>
          )}
        </div>
        <p className="whitespace-pre-wrap text-ink">{template.background}</p>
        <div className="text-xs text-muted">
          <Link href="/templates" className="underline">
            ← Back to library
          </Link>
        </div>
      </header>

      <Section title="Cause">
        <Prose body={template.cause} />
      </Section>

      <Section title="Impact narrative">
        <Prose body={template.impactNarrative} />
      </Section>

      <Section title="Risk coverage (DSL 6-box)">
        <RiskCoverageMatrix scenario={template} />
      </Section>

      {template.characteristics.length > 0 && (
        <Section title="Characteristics">
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
            {template.characteristics.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Section>
      )}

      {template.assumptions.length > 0 && (
        <Section title="Assumptions">
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
            {template.assumptions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Section>
      )}

      {stressVars && stressVars.length > 0 && (
        <Section title="Stress variables">
          <div className="grid gap-3 sm:grid-cols-2">
            {stressVars.map((sv) => (
              <div key={sv.name} className="rounded-md border border-line bg-surface-1 p-3 text-sm">
                <div className="font-medium">{sv.name}</div>
                <ul className="mt-1 flex flex-wrap gap-1 text-xs">
                  {sv.options.map((opt, i) => (
                    <li
                      key={i}
                      className="rounded-full border border-line-strong px-2 py-0.5"
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {caseStudy && (caseStudy.title || caseStudy.causation) && (
        <Section title="Case study">
          <div className="space-y-2 rounded-md border border-line bg-surface-1 p-4 text-sm">
            {caseStudy.title && <div className="font-medium">{caseStudy.title}</div>}
            {caseStudy.causation && (
              <FieldRow label="Causation" body={caseStudy.causation} />
            )}
            {caseStudy.impactScale && (
              <FieldRow label="Impact scale" body={caseStudy.impactScale} />
            )}
            {caseStudy.duration && <FieldRow label="Duration" body={caseStudy.duration} />}
            {caseStudy.sourceUrl && (
              <a
                href={caseStudy.sourceUrl}
                className="text-xs underline"
                target="_blank"
                rel="noopener"
              >
                Source →
              </a>
            )}
          </div>
        </Section>
      )}

      {template.compoundScenarioNotes && (
        <Section title="Compound-scenario considerations">
          <Prose body={template.compoundScenarioNotes} />
        </Section>
      )}

      {template.takeaways && (
        <Section title="Takeaways">
          <Prose body={template.takeaways} />
        </Section>
      )}

      {template.ibsList.length > 0 && (
        <Section title={`Important Business Services (${template.ibsList.length})`}>
          <ul className="space-y-1 text-sm">
            {template.ibsList.map((i) => (
              <li
                key={i.id}
                className="rounded border border-line bg-surface-1 px-3 py-2"
              >
                <span className="font-mono text-xs">{i.code}</span> · {i.name}
                <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                  {i.criticality}
                </span>
                <span className="ml-2 text-xs text-muted">
                  Impact tolerance: {i.impactToleranceMin} min
                </span>
                {i.description && (
                  <p className="mt-1 text-xs text-muted">{i.description}</p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {template.events.length > 0 && (
        <Section title={`Master Scenario Events List (${template.events.length})`}>
          <ol className="space-y-2 text-sm">
            {template.events.map((e) => (
              <li
                key={e.id}
                className="rounded border border-line bg-surface-1 px-3 py-2"
              >
                <div className="font-medium">
                  Event #{e.eventNo} · {e.scheduledTime} — {e.title}
                </div>
                <p className="mt-1 text-ink">{e.description}</p>
                <AddressingBlock
                  from={e.senderRoleTitle}
                  to={e.toRoleTitles}
                  cc={e.ccRoleTitles}
                />
              </li>
            ))}
          </ol>
        </Section>
      )}

      {template.injects.length > 0 && (
        <Section title={`Injects (${template.injects.length})`}>
          <ul className="space-y-2 text-sm">
            {template.injects.map((j) => (
              <li
                key={j.id}
                className="rounded border border-line bg-surface-1 px-3 py-2"
              >
                <div className="font-medium">
                  Inject #{j.injectNo} · {j.scheduledTime} — {j.summary}
                </div>
                <p className="mt-1 text-ink">{j.description}</p>
                <AddressingBlock
                  from={j.senderRoleTitle}
                  to={j.toRoleTitles}
                  cc={j.ccRoleTitles}
                />
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
    <section className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Prose({ body }: { body: string | null | undefined }) {
  if (!body) return null;
  return <p className="whitespace-pre-wrap text-sm text-ink">{body}</p>;
}

function FieldRow({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}: </span>
      <span className="text-ink">{body}</span>
    </div>
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
    <div className="mt-2 space-y-0.5 text-xs text-muted">
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

function RiskCoverageMatrix({
  scenario,
}: {
  scenario: {
    coversPeople: boolean;
    coversProperty: boolean;
    coversTechnology: boolean;
    coversDataAvailability: boolean;
    coversDataIntegrity: boolean;
    coversThirdParty: boolean;
  };
}) {
  const boxes: { label: string; on: boolean }[] = [
    { label: "People", on: scenario.coversPeople },
    { label: "Property", on: scenario.coversProperty },
    { label: "Technology", on: scenario.coversTechnology },
    { label: "Data Availability", on: scenario.coversDataAvailability },
    { label: "Data Integrity", on: scenario.coversDataIntegrity },
    { label: "Third Party", on: scenario.coversThirdParty },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {boxes.map((b) => (
        <div
          key={b.label}
          className={`rounded-md border p-3 text-center text-xs ${
            b.on
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-line bg-surface-1 text-soft"
          }`}
        >
          {b.label}
        </div>
      ))}
    </div>
  );
}
