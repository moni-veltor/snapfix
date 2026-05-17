"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  FileStack,
  Layers,
  Link2,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import DifficultyBadge from "@/components/exercises/wizard/DifficultyBadge";
import type { DifficultyOverall } from "@/lib/scenario-difficulty";
import type { DoraEvaluation } from "@/lib/dora-thresholds";
import { submitStep2ScenarioAction, type WizardBasics } from "@/app/actions/exercise-wizard";

export type ScenarioOption = {
  id: string;
  title: string;
  category: string | null;
  durationMin: number;
  isTemplate: boolean;
  ibsCount: number;
  injectCount: number;
  eventCount: number;
  difficulty: DifficultyOverall;
  /** Planning-time DORA evaluation for this scenario in isolation. */
  doraPreview: DoraEvaluation | null;
  ibsList: { id: string; name: string; tierLabel: string | null }[];
};

type Props = {
  scenarios: ScenarioOption[];
  basics: Partial<WizardBasics>;
  backHref: string;
  /** When non-null, compare against the picked scenario's overall difficulty. */
  teamMaturity: { avg: number; sampleSize: number } | null;
  /** True when the jurisdiction implies DORA threshold applicability. */
  doraApplies: boolean;
};

const MAX_CHAINED = 3;

export default function StepScenarios({
  scenarios,
  basics,
  backHref,
  teamMaturity,
  doraApplies,
}: Props) {
  const [primaryId, setPrimaryId] = useState<string>("");
  const [chained, setChained] = useState<{ id: string; offsetMin: number; label: string }[]>([]);
  const [objectivesText, setObjectivesText] = useState("");

  const primary = scenarios.find((s) => s.id === primaryId) ?? null;
  const chainedScenarios = chained
    .map((c) => ({ ...c, s: scenarios.find((x) => x.id === c.id) }))
    .filter((c): c is { id: string; offsetMin: number; label: string; s: ScenarioOption } => !!c.s);

  // Aggregated IBSs from primary + chained.
  const aggregatedIbs = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; tierLabel: string | null }>();
    const all = [primary, ...chainedScenarios.map((c) => c.s)].filter((s): s is ScenarioOption => !!s);
    for (const s of all) for (const i of s.ibsList) if (!seen.has(i.id)) seen.set(i.id, i);
    return Array.from(seen.values());
  }, [primary, chainedScenarios]);

  const totalInjects = (primary?.injectCount ?? 0) + chainedScenarios.reduce((n, c) => n + c.s.injectCount, 0);
  const totalEvents = (primary?.eventCount ?? 0) + chainedScenarios.reduce((n, c) => n + c.s.eventCount, 0);

  const maturityRec = useMemo(() => {
    if (!teamMaturity || !primary?.difficulty.overall) return null;
    const delta = primary.difficulty.overall - teamMaturity.avg;
    if (delta > 1.5)
      return {
        tone: "warn" as const,
        text: `Your team's last ${teamMaturity.sampleSize} exercises averaged difficulty ${teamMaturity.avg.toFixed(1)}. This scenario is ${primary.difficulty.overall} — a meaningful jump. Consider a dry-run first.`,
      };
    if (delta >= -0.5 && delta <= 1)
      return {
        tone: "ok" as const,
        text: `Well-matched: team average ${teamMaturity.avg.toFixed(1)}, this scenario ${primary.difficulty.overall}.`,
      };
    if (delta < -0.5)
      return {
        tone: "info" as const,
        text: `Easier than the team is used to (avg ${teamMaturity.avg.toFixed(1)}, this ${primary.difficulty.overall}). Good for refresher or onboarding.`,
      };
    return null;
  }, [primary, teamMaturity]);

  // Unioned DORA preview: any scenario in the chain hitting major triggers the banner.
  const doraUnion = useMemo(() => {
    const all = [primary, ...chainedScenarios.map((c) => c.s)].filter((s): s is ScenarioOption => !!s);
    const any = all.find((s) => s.doraPreview?.isMajor);
    if (any) return any.doraPreview;
    return primary?.doraPreview ?? null;
  }, [primary, chainedScenarios]);

  if (scenarios.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-line bg-surface-1 p-6 text-sm">
        <p className="font-semibold text-ink">No scenarios in this org yet</p>
        <p className="mt-1 text-muted">
          You need at least one scenario before you can plan an exercise.{" "}
          <Link href="/scenarios/new" className="font-medium text-indigo-600 underline">
            Create one
          </Link>{" "}
          or{" "}
          <Link href="/scenarios/library" className="font-medium text-indigo-600 underline">
            clone from the library
          </Link>
          .
        </p>
      </section>
    );
  }

  const remainingForChain = scenarios.filter((s) => s.id !== primaryId && !chained.some((c) => c.id === s.id));

  return (
    <form action={submitStep2ScenarioAction} className="space-y-6">
      {/* Forward every Step 1 field so the action can build the Exercise. */}
      {Object.entries(basics).map(([k, v]) =>
        v === undefined || v === "" ? null : (
          <input key={k} type="hidden" name={k} value={String(v)} />
        ),
      )}
      <input type="hidden" name="scenarioId" value={primaryId} />
      {chained.map((c, i) => (
        <input
          key={`chain-${i}`}
          type="hidden"
          name="chainedScenario"
          value={`${c.id}:${c.offsetMin}:${c.label}`}
        />
      ))}
      <input
        type="hidden"
        name="ibsIds"
        value={aggregatedIbs.map((i) => i.id).join(",")}
      />
      <input type="hidden" name="objectivesText" value={objectivesText} />

      {/* ─── Primary scenario picker ───────────────────────────────────── */}
      <Section icon={FileStack} title="Primary scenario">
        <ul className="space-y-2">
          {scenarios.map((s) => {
            const isPicked = s.id === primaryId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setPrimaryId(s.id)}
                  className={`block w-full rounded-lg border p-3 text-left transition-all ${
                    isPicked
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                      : "border-line bg-surface-0 hover:border-line-strong hover:bg-surface-2"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{s.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        {s.category && (
                          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold">
                            {s.category}
                          </span>
                        )}
                        <span>{s.durationMin} min default</span>
                        <span>· {s.injectCount} injects · {s.eventCount} events · {s.ibsCount} IBSs</span>
                      </div>
                    </div>
                    <div className="shrink-0 space-y-1">
                      <DifficultyBadge difficulty={s.difficulty} />
                      {s.isTemplate && (
                        <span className="block rounded-full bg-cyan-100 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
                          Template
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {primary && (
          <div className="mt-3 rounded-md border border-line bg-surface-0 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Difficulty breakdown
            </div>
            <div className="mt-1">
              <DifficultyBadge difficulty={primary.difficulty} showAxes />
            </div>
            {maturityRec && (
              <p
                className={`mt-2 text-[11px] ${
                  maturityRec.tone === "warn"
                    ? "text-amber-800 dark:text-amber-200"
                    : maturityRec.tone === "ok"
                      ? "text-emerald-800 dark:text-emerald-200"
                      : "text-muted"
                }`}
              >
                <Sparkles size={10} className="mr-1 inline" />
                {maturityRec.text}
              </p>
            )}
          </div>
        )}
      </Section>

      {/* ─── DORA threshold preview ────────────────────────────────────── */}
      {doraApplies && primary && doraUnion && (
        <div
          className={`rounded-md border p-3 text-xs ${
            doraUnion.isMajor
              ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
              : "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
          }`}
        >
          <p className="flex items-center gap-1.5 font-semibold text-ink">
            <ShieldAlert size={13} className={doraUnion.isMajor ? "text-rose-700 dark:text-rose-300" : "text-amber-700 dark:text-amber-300"} />
            DORA major-incident preview ({basics.jurisdiction})
          </p>
          <p className="mt-1 text-muted">{doraUnion.summary}</p>
          {doraUnion.criteriaMet.length > 0 && (
            <ul className="ml-5 mt-1 list-disc space-y-0.5 text-muted">
              {doraUnion.criteriaMet.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
          {doraUnion.isMajor && (
            <p className="mt-2 text-[11px] text-rose-800 dark:text-rose-200">
              The 24h ESA initial notification clock would start at severity classification during the live run.
            </p>
          )}
        </div>
      )}

      {/* ─── Chained scenarios ─────────────────────────────────────────── */}
      {primary && (
        <Section icon={Link2} title="Chain additional scenarios (optional)">
          <p className="text-[11px] text-soft">
            Compose realistic compound failures: e.g. cyber breach → vendor escalation → BCP walkthrough.
            Each chained scenario fires at an offset from D-Day.
          </p>

          {chainedScenarios.length > 0 && (
            <ul className="space-y-2">
              {chainedScenarios.map((c, i) => (
                <li key={i} className="rounded-md border border-line bg-surface-0 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{c.s.title}</p>
                      <p className="text-[11px] text-muted">
                        Fires at D-Day +{c.offsetMin} min
                        {c.label && ` · "${c.label}"`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChained(chained.filter((_, idx) => idx !== i))}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-soft hover:text-rose-700"
                    >
                      <Trash2 size={11} />
                      Remove
                    </button>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="text-[11px]">
                      <span className="text-muted">Offset (min from D-Day)</span>
                      <input
                        type="number"
                        min={0}
                        max={1440}
                        step={15}
                        value={c.offsetMin}
                        onChange={(e) => {
                          const next = [...chained];
                          next[i] = { ...next[i], offsetMin: parseInt(e.target.value, 10) || 0 };
                          setChained(next);
                        }}
                        className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1 text-sm"
                      />
                    </label>
                    <label className="text-[11px]">
                      <span className="text-muted">Label (optional, shown in timeline)</span>
                      <input
                        type="text"
                        maxLength={60}
                        value={c.label}
                        onChange={(e) => {
                          const next = [...chained];
                          next[i] = { ...next[i], label: e.target.value };
                          setChained(next);
                        }}
                        placeholder={`e.g. "Vendor escalation"`}
                        className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1 text-sm"
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {chained.length < MAX_CHAINED && remainingForChain.length > 0 && (
            <div className="rounded-md border border-dashed border-line bg-surface-0 p-3">
              <label className="block text-[11px] text-muted">
                Add a chained scenario ({chained.length}/{MAX_CHAINED})
              </label>
              <select
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  setChained([
                    ...chained,
                    { id: e.target.value, offsetMin: (chained.length + 1) * 60, label: "" },
                  ]);
                }}
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1 text-sm"
              >
                <option value="">— pick a scenario —</option>
                {remainingForChain.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </Section>
      )}

      {/* ─── IBS aggregation ──────────────────────────────────────────── */}
      {primary && (
        <Section icon={Building2} title="Important Business Services this exercise stress-tests">
          <p className="text-[11px] text-soft">
            Aggregated from the picked scenarios. These map to your IBS register and will be
            referenced in the evidence pack at closure.
          </p>
          {aggregatedIbs.length === 0 ? (
            <p className="rounded-md border border-dashed border-line bg-surface-0 p-3 text-[11px] text-muted">
              No IBSs linked on the chosen scenarios. You can still proceed — link them in the
              exercise overview after creation.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {aggregatedIbs.map((i) => (
                <li
                  key={i.id}
                  className="flex items-baseline justify-between gap-2 rounded-md border border-line bg-surface-0 px-3 py-2 text-xs"
                >
                  <span className="text-ink">{i.name}</span>
                  {i.tierLabel && (
                    <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">
                      {i.tierLabel}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* ─── Objectives ───────────────────────────────────────────────── */}
      {primary && (
        <Section icon={Target} title="Objectives">
          <p className="text-[11px] text-soft">
            1-5 specific behaviours this exercise is testing. The debrief scores against these.
            One per line.
          </p>
          <textarea
            rows={5}
            maxLength={2000}
            value={objectivesText}
            onChange={(e) => setObjectivesText(e.target.value)}
            placeholder={
              "e.g.\n- Test 4h FCA notification path under cyber pressure\n- Validate CRO + CEO joint BCP-activation decision\n- Confirm Comms cascade lands employees-first within 15 min"
            }
            className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm"
          />
        </Section>
      )}

      {/* ─── Validation footer ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
        >
          <ArrowLeft size={14} />
          Back to Basics
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {primary && (
            <span className="text-[11px] text-soft">
              <Layers size={11} className="mr-1 inline" />
              {1 + chainedScenarios.length} scenario{chainedScenarios.length === 0 ? "" : "s"} · {totalEvents} events · {totalInjects} injects · {aggregatedIbs.length} IBSs
            </span>
          )}
          {!primary && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300">
              <AlertTriangle size={11} />
              Pick a primary scenario to continue
            </span>
          )}
          <button
            type="submit"
            disabled={!primaryId}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-indigo-500 disabled:bg-surface-2 disabled:text-soft disabled:shadow-none disabled:hover:translate-y-0"
          >
            Create draft & continue
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Icon size={14} className="text-indigo-600 dark:text-indigo-300" />
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
