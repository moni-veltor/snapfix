import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  Clock,
  FileText,
  History,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addIBSAction,
  deleteEventAction,
  deleteIBSAction,
  deleteInjectAction,
} from "@/app/actions/scenarios";
import ArtefactList from "@/components/ArtefactList";
import ArtefactUpload from "@/components/ArtefactUpload";
import InjectComposerModal from "@/components/scenario/InjectComposerModal";
import EventComposerModal from "@/components/scenario/EventComposerModal";
import ScenarioDetailTabs from "@/components/scenarios/ScenarioDetailTabs";
import ScenarioPlayback from "@/components/scenarios/ScenarioPlayback";

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
      templateOrigin: { select: { id: true, title: true, category: true } },
    },
  });
  if (!scenario) notFound();
  const canEdit = user.orgRole === "OWNER" || user.orgRole === "ADMIN";

  const knownRoles = Array.from(
    new Set(scenario.exercises.flatMap((e) => e.participants.map((p) => p.roleTitle))),
  );
  const nextInjectNo =
    Math.max(0, ...scenario.injects.map((j) => j.injectNo)) + 1;
  const nextEventNo =
    Math.max(0, ...scenario.events.map((e) => e.eventNo)) + 1;

  return (
    <div className="space-y-6">
      <Link
        href="/scenarios"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        Back to scenarios
      </Link>

      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-line bg-gradient-brand-soft p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-brand)" }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-200">
              {scenario.category && <span>{scenario.category}</span>}
              {scenario.templateOrigin && (
                <>
                  <span className="text-soft">·</span>
                  <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-indigo-700 dark:text-indigo-200">
                    cloned from {scenario.templateOrigin.title}
                  </span>
                </>
              )}
            </div>
            <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {scenario.title}
            </h1>
            <p className="mt-3 line-clamp-3 text-sm text-muted">
              {scenario.background}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <HeroStat
              icon={<Clock size={14} />}
              value={`${scenario.durationMin}m`}
              label="Duration"
            />
            <HeroStat
              icon={<FileText size={14} />}
              value={scenario.events.length}
              label="Events"
            />
            <HeroStat
              icon={<Zap size={14} />}
              value={scenario.injects.length}
              label="Injects"
            />
          </div>
        </div>
        {canEdit && (
          <div className="relative mt-5 flex flex-wrap gap-2">
            <Link
              href={`/exercises/new?scenarioId=${scenario.id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Plan an exercise from this scenario
            </Link>
          </div>
        )}
      </header>

      <ScenarioDetailTabs
        counts={{
          events: scenario.events.length,
          injects: scenario.injects.length,
          ibs: scenario.ibsList.length,
          documents: scenario.artefacts.length,
        }}
        panels={{
          overview: (
            <div className="space-y-4">
              <SectionCard title="Background" icon={<FileText size={14} />} tone="indigo">
                <p className="whitespace-pre-wrap text-sm text-ink">
                  {scenario.background}
                </p>
              </SectionCard>

              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard
                  title={`D-Day · ${scenario.dDayDate.toISOString().slice(0, 10)}`}
                  icon={<Clock size={14} />}
                  tone="cyan"
                >
                  <ul className="text-xs text-muted">
                    <li>
                      Duration: <span className="text-ink">{scenario.durationMin} minutes</span>
                    </li>
                    {scenario.category && (
                      <li>
                        Category: <span className="text-ink">{scenario.category}</span>
                      </li>
                    )}
                    {scenario.srrRef && (
                      <li>
                        Strategic risk ref: <span className="font-mono text-ink">{scenario.srrRef}</span>
                      </li>
                    )}
                    {scenario.tier && (
                      <li>
                        Firm tier: <span className="text-ink">{scenario.tier.replace("_", " ")}</span>
                      </li>
                    )}
                  </ul>
                </SectionCard>

                <SectionCard
                  title={`Recent runs (${scenario.exercises.length})`}
                  icon={<History size={14} />}
                  tone="emerald"
                >
                  {scenario.exercises.length === 0 ? (
                    <p className="text-xs text-muted">
                      This scenario has never been exercised.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-xs">
                      {scenario.exercises.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface-0 px-2.5 py-1.5"
                        >
                          <Link href={`/exercises/${r.id}`} className="text-ink hover:underline">
                            {r.title}
                          </Link>
                          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted">
                            {r.status.replace("_", " ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>
            </div>
          ),
          timeline: (
            <ScenarioPlayback
              durationMin={scenario.durationMin}
              events={scenario.events.map((e) => ({
                id: e.id,
                eventNo: e.eventNo,
                scheduledTime: e.scheduledTime,
                title: e.title,
                description: e.description,
                senderRoleTitle: e.senderRoleTitle,
                toRoleTitles: e.toRoleTitles,
                ccRoleTitles: e.ccRoleTitles,
              }))}
              injects={scenario.injects.map((j) => ({
                id: j.id,
                injectNo: j.injectNo,
                scheduledTime: j.scheduledTime,
                summary: j.summary,
                description: j.description,
                relation: j.relation,
                senderRoleTitle: j.senderRoleTitle,
                toRoleTitles: j.toRoleTitles,
                ccRoleTitles: j.ccRoleTitles,
                kind: j.kind,
              }))}
            />
          ),
          events: (
            <div className="space-y-4">
              {canEdit && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-1 p-3">
                  <div className="text-xs text-muted">
                    <span className="font-semibold text-ink">
                      {scenario.events.length}
                    </span>{" "}
                    event{scenario.events.length === 1 ? "" : "s"} authored ·
                    Next is #
                    <span className="font-mono text-ink">{nextEventNo}</span>
                  </div>
                  <EventComposerModal
                    scenarioId={scenario.id}
                    nextEventNo={nextEventNo}
                    knownRoles={knownRoles}
                  />
                </div>
              )}
              {scenario.events.length === 0 ? (
                <EmptyTab
                  icon={<FileText size={20} />}
                  title="No events yet"
                  body="Events are the scheduled beats of the scenario — the messages your team responds to. Use the +Add event button above."
                />
              ) : (
                <ol className="space-y-2">
                  {scenario.events.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-xl border border-line bg-surface-1 p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                              Event #{e.eventNo}
                            </span>
                            <span className="font-mono text-[10px] text-soft">
                              {e.scheduledTime}
                            </span>
                            <h3 className="font-semibold text-ink">{e.title}</h3>
                          </div>
                          <p className="mt-1.5 whitespace-pre-wrap text-xs text-muted">
                            {e.description}
                          </p>
                          <AddressingBlock
                            from={e.senderRoleTitle}
                            to={e.toRoleTitles}
                            cc={e.ccRoleTitles}
                          />
                          {e.expectedActions.length > 0 && (
                            <details className="mt-2 text-xs">
                              <summary className="cursor-pointer text-muted">
                                Expected actions ({e.expectedActions.length})
                              </summary>
                              <ul className="mt-1 list-disc pl-5 text-ink">
                                {e.expectedActions.map((a, i) => (
                                  <li key={i}>{a}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                          {(e.artefacts.length > 0 || canEdit) && (
                            <details className="mt-2 text-xs">
                              <summary className="cursor-pointer text-muted">
                                Attachments ({e.artefacts.length})
                              </summary>
                              <div className="mt-2 space-y-2">
                                <ArtefactList
                                  artefacts={e.artefacts}
                                  canManage={canEdit}
                                  empty="No attachments."
                                />
                                {canEdit && (
                                  <ArtefactUpload target="EVENT" targetId={e.id} compact />
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                        {canEdit && (
                          <form action={deleteEventAction}>
                            <input type="hidden" name="id" value={e.id} />
                            <input type="hidden" name="scenarioId" value={scenario.id} />
                            <button
                              type="submit"
                              className="rounded-md p-1.5 text-soft hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                              aria-label="Delete event"
                            >
                              <Trash2 size={13} />
                            </button>
                          </form>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}

            </div>
          ),
          injects: (
            <div className="space-y-4">
              {canEdit && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-1 p-3">
                  <div className="text-xs text-muted">
                    <span className="font-semibold text-ink">
                      {scenario.injects.length}
                    </span>{" "}
                    inject{scenario.injects.length === 1 ? "" : "s"} authored ·
                    Next is #
                    <span className="font-mono text-ink">{nextInjectNo}</span>
                  </div>
                  <InjectComposerModal
                    scenarioId={scenario.id}
                    nextInjectNo={nextInjectNo}
                    knownRoles={knownRoles}
                  />
                </div>
              )}
              {scenario.injects.length === 0 ? (
                <EmptyTab
                  icon={<Zap size={20} />}
                  title="No injects yet"
                  body="Injects are unscheduled pressure beats — the curveballs that test how your team adapts. Use the +Add inject button above."
                />
              ) : (
                <ul className="space-y-2">
                  {scenario.injects.map((j) => (
                    <li
                      key={j.id}
                      className="rounded-xl border border-line bg-surface-1 p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                              Inject #{j.injectNo}
                            </span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                                j.kind === "TECHNICAL"
                                  ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200"
                                  : "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
                              }`}
                            >
                              {j.kind === "TECHNICAL" ? "Technical" : "Business"}
                            </span>
                            <span className="font-mono text-[10px] text-soft">
                              {j.scheduledTime}
                            </span>
                            <h3 className="font-semibold text-ink">{j.summary}</h3>
                          </div>
                          <p className="mt-1.5 whitespace-pre-wrap text-xs text-muted">
                            {j.description}
                          </p>
                          <AddressingBlock
                            from={j.senderRoleTitle}
                            to={j.toRoleTitles}
                            cc={j.ccRoleTitles}
                          />
                          {j.relation && (
                            <p className="mt-1.5 rounded-md bg-surface-0 px-2 py-1 text-[11px] italic text-muted">
                              {j.relation}
                            </p>
                          )}
                          {(j.artefacts.length > 0 || canEdit) && (
                            <details className="mt-2 text-xs">
                              <summary className="cursor-pointer text-muted">
                                Attachments ({j.artefacts.length})
                              </summary>
                              <div className="mt-2 space-y-2">
                                <ArtefactList
                                  artefacts={j.artefacts}
                                  canManage={canEdit}
                                  empty="No attachments."
                                />
                                {canEdit && (
                                  <ArtefactUpload target="INJECT" targetId={j.id} compact />
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                        {canEdit && (
                          <form action={deleteInjectAction}>
                            <input type="hidden" name="id" value={j.id} />
                            <input type="hidden" name="scenarioId" value={scenario.id} />
                            <button
                              type="submit"
                              className="rounded-md p-1.5 text-soft hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                              aria-label="Delete inject"
                            >
                              <Trash2 size={13} />
                            </button>
                          </form>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

            </div>
          ),
          ibs: (
            <div className="space-y-4">
              {scenario.ibsList.length === 0 ? (
                <EmptyTab
                  icon={<Building size={20} />}
                  title="No IBSs linked yet"
                  body="Link the Important Business Services this scenario stresses. Used for coverage analytics and tolerance reporting."
                />
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {scenario.ibsList.map((ibs) => (
                    <li
                      key={ibs.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-line bg-surface-1 p-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-mono text-[10px] text-soft">{ibs.code}</span>
                          <span className="font-medium text-ink">{ibs.name}</span>
                          <CriticalityPill kind={ibs.criticality} />
                        </div>
                        <div className="mt-1 text-[11px] text-muted">
                          Tolerance {ibs.impactToleranceMin} min
                          {ibs.impactMetrics ? ` · ${ibs.impactMetrics}` : ""}
                        </div>
                        {ibs.description && (
                          <p className="mt-1 text-[11px] text-muted">{ibs.description}</p>
                        )}
                      </div>
                      {canEdit && (
                        <form action={deleteIBSAction}>
                          <input type="hidden" name="id" value={ibs.id} />
                          <input type="hidden" name="scenarioId" value={scenario.id} />
                          <button
                            type="submit"
                            className="rounded-md p-1.5 text-soft hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                            aria-label="Delete IBS"
                          >
                            <Trash2 size={13} />
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {canEdit && (
                <form
                  action={addIBSAction}
                  className="grid grid-cols-2 gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-surface-1 p-4 text-sm dark:border-indigo-700"
                >
                  <div className="col-span-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    <Plus size={11} /> Add an IBS
                  </div>
                  <input type="hidden" name="scenarioId" value={scenario.id} />
                  <input
                    name="code"
                    required
                    placeholder="IBS_06" aria-label="IBS_06"
                    className="rounded-md border border-line bg-surface-0 px-2 py-1.5"
                  />
                  <input
                    name="name"
                    required
                    placeholder="Name" aria-label="Name"
                    className="rounded-md border border-line bg-surface-0 px-2 py-1.5"
                  />
                  <input
                    name="impactToleranceMin"
                    type="number"
                    min={0}
                    required
                    placeholder="Impact tolerance (min)" aria-label="Impact tolerance (min)"
                    className="rounded-md border border-line bg-surface-0 px-2 py-1.5"
                  />
                  <select
                    name="criticality"
                    required
                    defaultValue="HIGH"
                    className="rounded-md border border-line bg-surface-0 px-2 py-1.5"
                  >
                    <option>LOW</option>
                    <option>MEDIUM</option>
                    <option>HIGH</option>
                    <option>CRITICAL</option>
                  </select>
                  <input
                    name="impactMetrics"
                    placeholder="Impact metrics (optional)" aria-label="Impact metrics (optional)"
                    className="col-span-2 rounded-md border border-line bg-surface-0 px-2 py-1.5"
                  />
                  <textarea
                    name="description"
                    placeholder="Description (optional)" aria-label="Description (optional)"
                    rows={2}
                    className="col-span-2 rounded-md border border-line bg-surface-0 px-2 py-1.5"
                  />
                  <button
                    type="submit"
                    className="col-span-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  >
                    Add IBS
                  </button>
                </form>
              )}
            </div>
          ),
          documents: (
            <div className="space-y-4">
              <ArtefactList
                artefacts={scenario.artefacts}
                canManage={canEdit}
                empty="No scenario documents yet (facilitator/participant/scenario guide, briefing docs)."
              />
              {canEdit && <ArtefactUpload target="SCENARIO" targetId={scenario.id} />}
            </div>
          ),
        }}
      />
    </div>
  );
}

function HeroStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-0/70 p-2.5 text-center backdrop-blur">
      <span className="mx-auto mb-0.5 inline-flex text-indigo-600 dark:text-indigo-300">
        {icon}
      </span>
      <div className="text-base font-semibold text-ink">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-soft">{label}</div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "indigo" | "rose" | "amber" | "cyan" | "emerald" | "violet";
  children: React.ReactNode;
}) {
  const bar = {
    indigo: "from-indigo-500 to-indigo-400",
    rose: "from-rose-500 to-rose-400",
    amber: "from-amber-500 to-amber-400",
    cyan: "from-cyan-500 to-cyan-400",
    emerald: "from-emerald-500 to-emerald-400",
    violet: "from-violet-500 to-violet-400",
  }[tone];
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface-1">
      <div className={`h-1 bg-gradient-to-r ${bar}`} />
      <div className="p-4">
        <header className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="text-indigo-600 dark:text-indigo-300">{icon}</span>
          {title}
        </header>
        {children}
      </div>
    </section>
  );
}

function EmptyTab({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center">
      <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-indigo-600 dark:text-indigo-300">
        {icon}
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-muted">{body}</p>
    </div>
  );
}

function CriticalityPill({ kind }: { kind: string }) {
  const cls =
    kind === "CRITICAL"
      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
      : kind === "HIGH"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        : kind === "MEDIUM"
          ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200"
          : "bg-surface-2 text-muted";
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${cls}`}
    >
      {kind}
    </span>
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
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-soft">
      {from && (
        <span>
          <span className="font-semibold">From:</span>{" "}
          <span className="text-muted">{from}</span>
        </span>
      )}
      {to.length > 0 && (
        <span>
          <span className="font-semibold">To:</span>{" "}
          <span className="text-muted">{to.join(", ")}</span>
        </span>
      )}
      {cc.length > 0 && (
        <span>
          <span className="font-semibold">Cc:</span>{" "}
          <span className="text-muted">{cc.join(", ")}</span>
        </span>
      )}
    </div>
  );
}

