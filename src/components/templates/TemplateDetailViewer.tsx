"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
  Building,
  Clock,
  Database,
  FileText,
  Layers,
  MessageSquare,
  Play,
  Server,
  ShieldAlert,
  Sliders,
  Sparkles,
  Users,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

type IBS = {
  id: string;
  code: string;
  name: string;
  criticality: string;
  impactToleranceMin: number;
  description: string | null;
};

type Event = {
  id: string;
  eventNo: number;
  scheduledTime: string;
  title: string;
  description: string;
  senderRoleTitle: string | null;
  toRoleTitles: string[];
  ccRoleTitles: string[];
};

type Inject = {
  id: string;
  injectNo: number;
  scheduledTime: string;
  summary: string;
  description: string;
  relation: string | null;
};

type FacilQ = { id: string; category: string; text: string };
type DebriefQ = { id: string; category: string; text: string };

type Props = {
  template: {
    id: string;
    title: string;
    category: string | null;
    tier: "TIER_1" | "TIER_2" | "TIER_3" | null;
    srrRef: string | null;
    background: string;
    cause: string | null;
    impactNarrative: string | null;
    characteristics: string[];
    assumptions: string[];
    compoundScenarioNotes: string | null;
    takeaways: string | null;
    stressVariables: { name: string; options: string[] }[] | null;
    caseStudy: { title?: string; causation?: string; impactScale?: string; duration?: string; sourceUrl?: string } | null;
    coversPeople: boolean;
    coversProperty: boolean;
    coversTechnology: boolean;
    coversDataAvailability: boolean;
    coversDataIntegrity: boolean;
    coversThirdParty: boolean;
    durationMin: number;
  };
  ibsList: IBS[];
  events: Event[];
  injects: Inject[];
  facilitatorQuestions: FacilQ[];
  debriefQuestions: DebriefQ[];
};

type TabKey = "story" | "timeline" | "risk" | "stress" | "casestudy" | "questions";

const TABS: { key: TabKey; label: string; hint: string; icon: LucideIcon }[] = [
  { key: "story", label: "Story", hint: "Background, cause, impact", icon: BookOpen },
  { key: "timeline", label: "Timeline", hint: "Animated MSEL playback", icon: Play },
  { key: "risk", label: "Risk profile", hint: "6-box harm coverage, IBSs", icon: ShieldAlert },
  { key: "stress", label: "Stress dials", hint: "Variables you can turn", icon: Sliders },
  { key: "casestudy", label: "Case study", hint: "Real-world precedent", icon: FileText },
  { key: "questions", label: "Questions", hint: "Facilitator + debrief", icon: MessageSquare },
];

const HARM_ICONS: { key: keyof Props["template"]; label: string; icon: LucideIcon; tone: string }[] = [
  {
    key: "coversPeople",
    label: "People",
    icon: Users,
    tone: "from-rose-500 to-rose-400",
  },
  {
    key: "coversProperty",
    label: "Property",
    icon: Building,
    tone: "from-amber-500 to-amber-400",
  },
  {
    key: "coversTechnology",
    label: "Technology",
    icon: Server,
    tone: "from-cyan-500 to-cyan-400",
  },
  {
    key: "coversDataAvailability",
    label: "Data availability",
    icon: Wifi,
    tone: "from-indigo-500 to-indigo-400",
  },
  {
    key: "coversDataIntegrity",
    label: "Data integrity",
    icon: Database,
    tone: "from-violet-500 to-violet-400",
  },
  {
    key: "coversThirdParty",
    label: "Third party",
    icon: Layers,
    tone: "from-emerald-500 to-emerald-400",
  },
];

export default function TemplateDetailViewer({
  template,
  ibsList,
  events,
  injects,
  facilitatorQuestions,
  debriefQuestions,
}: Props) {
  const [tab, setTab] = useState<TabKey>("story");

  return (
    <div className="space-y-5">
      <Hero template={template} />

      <div
        role="tablist"
        className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-1 rounded-xl border border-line bg-surface-1/95 p-1 backdrop-blur"
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`group flex flex-1 min-w-[130px] items-center gap-2 rounded-lg px-3 py-2 text-left transition-all ${
                active
                  ? "bg-gradient-brand text-white shadow-[var(--shadow-card)]"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">{t.label}</span>
                <span
                  className={`block truncate text-[10px] ${
                    active ? "text-white/80" : "text-soft"
                  }`}
                >
                  {t.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-5">
        <Panel active={tab === "story"}>
          <StoryPanel template={template} />
        </Panel>
        <Panel active={tab === "timeline"}>
          <TimelinePanel events={events} injects={injects} duration={template.durationMin} />
        </Panel>
        <Panel active={tab === "risk"}>
          <RiskPanel template={template} ibsList={ibsList} />
        </Panel>
        <Panel active={tab === "stress"}>
          <StressPanel variables={template.stressVariables} />
        </Panel>
        <Panel active={tab === "casestudy"}>
          <CaseStudyPanel caseStudy={template.caseStudy} takeaways={template.takeaways} />
        </Panel>
        <Panel active={tab === "questions"}>
          <QuestionsPanel facilitator={facilitatorQuestions} debrief={debriefQuestions} />
        </Panel>
      </div>
    </div>
  );
}

function Panel({ active, children }: { active: boolean; children: ReactNode }) {
  return <div hidden={!active}>{children}</div>;
}

function Hero({ template }: { template: Props["template"] }) {
  const harms = HARM_ICONS.filter((h) => template[h.key]).length;
  return (
    <header className="relative overflow-hidden rounded-2xl border border-line bg-gradient-brand-soft p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-brand)" }}
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-200">
            {template.category && <span>{template.category}</span>}
            {template.tier && <span className="text-soft">·</span>}
            {template.tier && <span>{template.tier.replace("_", " ")}</span>}
            {template.srrRef && (
              <>
                <span className="text-soft">·</span>
                <span className="font-mono">SRR {template.srrRef}</span>
              </>
            )}
          </div>
          <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {template.title}
          </h1>
          <p className="mt-3 text-sm text-muted">{template.background.split("\n")[0]}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <HeroStat icon={Clock} value={`${template.durationMin}m`} label="Duration" />
          <HeroStat icon={ShieldAlert} value={`${harms}/6`} label="Harms" />
          <HeroStat icon={Zap} value="Run" label="Live exercise" pulse />
        </div>
      </div>
    </header>
  );
}

function HeroStat({
  icon: Icon,
  value,
  label,
  pulse,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-0/70 p-2.5 text-center backdrop-blur">
      <Icon
        size={14}
        className={`mx-auto mb-0.5 text-indigo-600 dark:text-indigo-300 ${pulse ? "animate-pulse" : ""}`}
      />
      <div className="text-base font-semibold text-ink">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-soft">{label}</div>
    </div>
  );
}

function StoryPanel({ template }: { template: Props["template"] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Cause" tone="rose" icon={Zap} className="lg:col-span-1">
        <Prose body={template.cause} />
      </Card>
      <Card title="Impact narrative" tone="amber" icon={ShieldAlert} className="lg:col-span-2">
        <Prose body={template.impactNarrative} />
      </Card>
      {template.characteristics.length > 0 && (
        <Card title="Characteristics" tone="indigo" icon={Sparkles}>
          <ul className="space-y-1.5 text-sm text-ink">
            {template.characteristics.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {template.assumptions.length > 0 && (
        <Card title="Assumptions" tone="cyan" icon={BookOpen}>
          <ul className="space-y-1.5 text-sm text-ink">
            {template.assumptions.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {template.compoundScenarioNotes && (
        <Card title="Compound considerations" tone="violet" icon={Layers}>
          <Prose body={template.compoundScenarioNotes} />
        </Card>
      )}
    </div>
  );
}

function TimelinePanel({
  events,
  injects,
  duration,
}: {
  events: Event[];
  injects: Inject[];
  duration: number;
}) {
  const [playing, setPlaying] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const items = mergeTimeline(events, injects);

  useEffect(() => {
    if (!playing) return;
    if (stepIdx >= items.length - 1) return; // playhead has reached the end
    const t = setTimeout(() => setStepIdx((i) => i + 1), 850);
    return () => clearTimeout(t);
  }, [playing, stepIdx, items.length]);

  const finished = stepIdx >= items.length - 1;

  const play = () => {
    setStepIdx(-1);
    setPlaying(true);
  };
  const reset = () => {
    setPlaying(false);
    setStepIdx(-1);
  };
  const revealAll = () => {
    setPlaying(false);
    setStepIdx(items.length - 1);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
        This scenario doesn&apos;t have any pre-authored timeline events.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-1 p-3">
        <div className="text-xs text-muted">
          <span className="font-semibold text-ink">{items.length}</span> beats over{" "}
          <span className="font-semibold text-ink">{duration}m</span> — events and injects
          mixed in chronological order.
        </div>
        <div className="flex items-center gap-2">
          {!playing && !finished && (
            <button
              type="button"
              onClick={play}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Play size={11} />
              {stepIdx === -1 ? "Play timeline" : "Continue"}
            </button>
          )}
          {playing && !finished && (
            <button
              type="button"
              onClick={() => setPlaying(false)}
              className="rounded-md border border-line bg-surface-0 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
            >
              Pause
            </button>
          )}
          <button
            type="button"
            onClick={revealAll}
            className="rounded-md border border-line bg-surface-0 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
          >
            Reveal all
          </button>
          {stepIdx > -1 && (
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-line bg-surface-0 px-3 py-1.5 text-xs text-muted hover:text-ink"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <ol className="relative space-y-3 border-l-2 border-line pl-6">
        {items.map((it, i) => {
          const revealed = i <= stepIdx;
          return (
            <li
              key={it.key}
              className={`relative transition-all duration-500 ${
                revealed ? "opacity-100" : "opacity-30 blur-[1px]"
              }`}
              style={{
                transform: revealed ? "translateY(0)" : "translateY(6px)",
              }}
            >
              <span
                className={`absolute -left-[33px] top-2 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ring-2 ring-surface-0 ${
                  it.kind === "event"
                    ? "bg-rose-500 text-white"
                    : "bg-amber-500 text-white"
                }`}
              >
                {it.kind === "event" ? "E" : "I"}
              </span>
              <div className="rounded-xl border border-line bg-surface-1 p-3">
                <header className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-[10px] text-soft">
                    {it.scheduledTime}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                      it.kind === "event"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                    }`}
                  >
                    {it.kind === "event" ? `Event #${it.no}` : `Inject #${it.no}`}
                  </span>
                  <h3 className="text-sm font-semibold text-ink">{it.title}</h3>
                </header>
                <p className="mt-1.5 text-xs text-muted">{it.description}</p>
                {it.from && (
                  <p className="mt-2 text-[10px] text-soft">
                    <span className="font-semibold">From:</span> {it.from}
                    {it.to.length > 0 && (
                      <>
                        {" · "}
                        <span className="font-semibold">To:</span> {it.to.join(", ")}
                      </>
                    )}
                  </p>
                )}
                {it.relation && (
                  <p className="mt-1 text-[10px] text-soft italic">
                    {it.relation}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type TimelineItem = {
  key: string;
  kind: "event" | "inject";
  no: number;
  scheduledTime: string;
  title: string;
  description: string;
  from: string | null;
  to: string[];
  relation: string | null;
};

function mergeTimeline(events: Event[], injects: Inject[]): TimelineItem[] {
  const all: TimelineItem[] = [];
  for (const e of events) {
    all.push({
      key: `e-${e.id}`,
      kind: "event",
      no: e.eventNo,
      scheduledTime: e.scheduledTime,
      title: e.title,
      description: e.description,
      from: e.senderRoleTitle,
      to: e.toRoleTitles ?? [],
      relation: null,
    });
  }
  for (const j of injects) {
    all.push({
      key: `i-${j.id}`,
      kind: "inject",
      no: j.injectNo,
      scheduledTime: j.scheduledTime,
      title: j.summary,
      description: j.description,
      from: null,
      to: [],
      relation: j.relation,
    });
  }
  return all.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

function RiskPanel({
  template,
  ibsList,
}: {
  template: Props["template"];
  ibsList: IBS[];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-surface-1 p-5">
        <h2 className="text-sm font-semibold text-ink">Six-box harm coverage</h2>
        <p className="mt-0.5 text-xs text-muted">
          Which harm dimensions this scenario stress-tests.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {HARM_ICONS.map(({ key, label, icon: Icon, tone }) => {
            const on = template[key] as boolean;
            return (
              <li
                key={label}
                className={`group relative overflow-hidden rounded-lg border p-3 text-center transition-all ${
                  on
                    ? "border-line bg-surface-0"
                    : "border-dashed border-line bg-surface-1 opacity-40 grayscale"
                }`}
              >
                {on && (
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone}`}
                  />
                )}
                <Icon
                  size={20}
                  className={`mx-auto ${on ? "text-ink" : "text-soft"}`}
                />
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
                  {label}
                </div>
                <div className="text-[9px] text-soft">{on ? "covered" : "not covered"}</div>
              </li>
            );
          })}
        </ul>
      </div>

      {ibsList.length > 0 && (
        <div className="rounded-xl border border-line bg-surface-1 p-5">
          <h2 className="text-sm font-semibold text-ink">
            Important Business Services exercised ({ibsList.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {ibsList.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-0 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-soft">{i.code}</span>
                    <span className="text-sm font-medium text-ink">{i.name}</span>
                    <CriticalityPill kind={i.criticality} />
                  </div>
                  {i.description && (
                    <p className="mt-0.5 text-[11px] text-muted">{i.description}</p>
                  )}
                </div>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-mono text-indigo-700 dark:text-indigo-200">
                  tolerance {i.impactToleranceMin}m
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${cls}`}>
      {kind}
    </span>
  );
}

function StressPanel({
  variables,
}: {
  variables: { name: string; options: string[] }[] | null;
}) {
  const [picks, setPicks] = useState<Record<string, number>>({});

  if (!variables || variables.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
        No stress dials authored for this scenario.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-300 bg-indigo-50/40 p-4 text-xs text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-200">
        <Sparkles size={12} className="-mt-0.5 mr-1 inline" />
        Turn the dials to make this scenario more or less brutal. These are coaching
        variables — choices for how to scale the exercise to your firm&apos;s appetite.
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {variables.map((sv) => {
          const picked = picks[sv.name] ?? 0;
          return (
            <li key={sv.name} className="rounded-xl border border-line bg-surface-1 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">{sv.name}</h3>
                <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                  {sv.options[picked]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {sv.options.map((opt, i) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      setPicks((p) => ({ ...p, [sv.name]: i }))
                    }
                    className={`rounded-md border px-2 py-1 text-[11px] transition-all ${
                      i === picked
                        ? "border-indigo-400 bg-accent-soft text-indigo-700 dark:text-indigo-200"
                        : "border-line text-muted hover:border-line-strong hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full bg-gradient-brand transition-all"
                  style={{
                    width: `${((picked + 1) / sv.options.length) * 100}%`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CaseStudyPanel({
  caseStudy,
  takeaways,
}: {
  caseStudy: Props["template"]["caseStudy"];
  takeaways: string | null;
}) {
  if (!caseStudy?.title && !takeaways) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
        No case study captured for this scenario.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {caseStudy?.title && (
        <article className="rounded-xl border border-line bg-gradient-brand-soft p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-200">
            Real-world precedent
          </div>
          <h2 className="mt-1 text-lg font-semibold text-ink">{caseStudy.title}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {caseStudy.causation && (
              <Field label="Causation" body={caseStudy.causation} />
            )}
            {caseStudy.impactScale && (
              <Field label="Impact scale" body={caseStudy.impactScale} />
            )}
            {caseStudy.duration && (
              <Field label="Duration" body={caseStudy.duration} />
            )}
          </div>
          {caseStudy.sourceUrl && (
            <a
              href={caseStudy.sourceUrl}
              target="_blank"
              rel="noopener"
              className="mt-4 inline-flex text-xs text-indigo-700 underline dark:text-indigo-200"
            >
              Read the original →
            </a>
          )}
        </article>
      )}
      {takeaways && (
        <article className="rounded-xl border border-line bg-surface-1 p-5">
          <h2 className="text-sm font-semibold text-ink">Takeaways</h2>
          <Prose body={takeaways} />
        </article>
      )}
    </div>
  );
}

function Field({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-lg bg-surface-0/70 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-soft">
        {label}
      </div>
      <p className="mt-1 text-xs text-ink">{body}</p>
    </div>
  );
}

function QuestionsPanel({
  facilitator,
  debrief,
}: {
  facilitator: FacilQ[];
  debrief: DebriefQ[];
}) {
  const fGrouped = groupByCategory(facilitator);
  const dGrouped = groupByCategory(debrief);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={`Facilitator questions (${facilitator.length})`} tone="indigo" icon={MessageSquare}>
        <QuestionList grouped={fGrouped} />
      </Card>
      <Card title={`Debrief questions (${debrief.length})`} tone="emerald" icon={BookOpen}>
        <QuestionList grouped={dGrouped} />
      </Card>
    </div>
  );
}

function QuestionList({ grouped }: { grouped: Record<string, { id: string; text: string }[]> }) {
  const entries = Object.entries(grouped);
  if (entries.length === 0) {
    return <p className="text-xs text-muted">None authored.</p>;
  }
  return (
    <ul className="space-y-3">
      {entries.map(([cat, items]) => (
        <li key={cat}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
            {cat}
          </p>
          <ul className="mt-1 space-y-1">
            {items.map((q) => (
              <li key={q.id} className="rounded-md bg-surface-0 px-2.5 py-1.5 text-xs text-ink">
                {q.text}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function groupByCategory<T extends { id: string; category: string; text: string }>(
  items: T[],
): Record<string, { id: string; text: string }[]> {
  const out: Record<string, { id: string; text: string }[]> = {};
  for (const q of items) {
    if (!out[q.category]) out[q.category] = [];
    out[q.category].push({ id: q.id, text: q.text });
  }
  return out;
}

function Card({
  title,
  tone,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  tone: "rose" | "amber" | "indigo" | "cyan" | "violet" | "emerald";
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  const toneCls = {
    rose: "from-rose-500 to-rose-400",
    amber: "from-amber-500 to-amber-400",
    indigo: "from-indigo-500 to-indigo-400",
    cyan: "from-cyan-500 to-cyan-400",
    violet: "from-violet-500 to-violet-400",
    emerald: "from-emerald-500 to-emerald-400",
  }[tone];
  return (
    <section
      className={`overflow-hidden rounded-xl border border-line bg-surface-1 ${className ?? ""}`}
    >
      <div className={`h-1 bg-gradient-to-r ${toneCls}`} />
      <div className="p-5">
        <header className="mb-3 flex items-center gap-2">
          <Icon size={14} className="text-indigo-600 dark:text-indigo-300" />
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </header>
        {children}
      </div>
    </section>
  );
}

function Prose({ body }: { body: string | null | undefined }) {
  if (!body) return null;
  return <p className="whitespace-pre-wrap text-sm text-ink">{body}</p>;
}
