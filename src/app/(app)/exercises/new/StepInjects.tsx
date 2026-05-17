"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Layers,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import type { AggregatedInject, CoverageGap, Density } from "@/lib/exercise-injects-types";
import { ddayMinToHhmm } from "@/lib/exercise-injects-types";
import {
  addCustomInjectAction,
  removeCustomInjectAction,
  retimeScenarioInjectAction,
  toggleHideScenarioInjectAction,
} from "@/app/actions/exercise-wizard";

type Props = {
  exerciseId: string;
  injects: AggregatedInject[];
  coverageGaps: CoverageGap[];
  densityHotspots: Density[];
  rosterRoleTitles: string[];
  totalParticipants: number;
  preReadAckedCount: number;
};

// Scenario sequence → background colour, so injects from different scenarios
// in a chain are visually distinct on the timeline.
const SCENARIO_TONE = [
  "bg-indigo-100 border-indigo-300 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-100",
  "bg-violet-100 border-violet-300 text-violet-900 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-100",
  "bg-cyan-100 border-cyan-300 text-cyan-900 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-100",
  "bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100",
];
const CUSTOM_TONE = "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-100";

export default function StepInjects({
  exerciseId,
  injects,
  coverageGaps,
  densityHotspots,
  rosterRoleTitles,
  totalParticipants,
  preReadAckedCount,
}: Props) {
  const [showCustomForm, setShowCustomForm] = useState(false);

  const visibleInjects = injects.filter((i) => !i.hidden);
  const maxDDayMin = visibleInjects.length > 0
    ? Math.max(...visibleInjects.map((i) => i.effectiveDDayMin), 60)
    : 60;
  const timelineMaxMin = Math.ceil(maxDDayMin / 60) * 60;

  const gapsByInject = useMemo(() => {
    const map = new Map<string, CoverageGap[]>();
    for (const g of coverageGaps) {
      const list = map.get(g.injectId) ?? [];
      list.push(g);
      map.set(g.injectId, list);
    }
    return map;
  }, [coverageGaps]);

  return (
    <div className="space-y-6">
      {/* ─── Stat strip ───────────────────────────────────────────────── */}
      <section className="grid gap-3 rounded-xl border border-line bg-surface-1 p-5 sm:grid-cols-4">
        <Tile icon={Layers} label="Total injects" value={String(visibleInjects.length)} sub={`${injects.length - visibleInjects.length} hidden`} />
        <Tile
          icon={AlertTriangle}
          label="Coverage gaps"
          value={String(coverageGaps.length)}
          tone={coverageGaps.length === 0 ? "ok" : "critical"}
          sub={coverageGaps.length === 0 ? "all addressed" : "need a fix"}
        />
        <Tile
          icon={ShieldAlert}
          label="Density hotspots"
          value={String(densityHotspots.length)}
          tone={densityHotspots.length === 0 ? "ok" : "warn"}
          sub={densityHotspots.length === 0 ? "well-paced" : "team may be buried"}
        />
        <Tile
          icon={CheckCircle2}
          label="Pre-read acked"
          value={`${preReadAckedCount}/${totalParticipants}`}
          tone={
            totalParticipants === 0 || preReadAckedCount === totalParticipants
              ? "ok"
              : preReadAckedCount / totalParticipants >= 0.5
                ? "warn"
                : "critical"
          }
        />
      </section>

      {/* ─── Coverage gaps ────────────────────────────────────────────── */}
      {coverageGaps.length > 0 && (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800/60 dark:bg-rose-950/30">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-rose-900 dark:text-rose-100">
            <AlertTriangle size={14} />
            Coverage gaps — fix before going live
          </h3>
          <p className="mt-1 text-[11px] text-rose-800 dark:text-rose-200">
            These injects address roles nobody on the roster is playing. The inject would arrive
            unread on D-Day and produce a silent failure in the coaching findings.
          </p>
          <ul className="mt-2 space-y-1">
            {coverageGaps.slice(0, 10).map((g, i) => (
              <li key={`${g.injectId}-${i}`} className="text-[11px] text-rose-800 dark:text-rose-200">
                <span className="font-mono">{g.missingRole}</span> · {g.injectSummary}
              </li>
            ))}
            {coverageGaps.length > 10 && (
              <li className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                + {coverageGaps.length - 10} more
              </li>
            )}
          </ul>
          <p className="mt-2 text-[11px] text-rose-800 dark:text-rose-200">
            Fix by: (a) adding a participant in that role on{" "}
            <Link href={`/exercises/new?step=3&id=${exerciseId}`} className="font-semibold underline">
              Step 3 — Team
            </Link>
            , (b) retiming the inject below, or (c) hiding it from this exercise.
          </p>
        </section>
      )}

      {/* ─── Density hotspots ─────────────────────────────────────────── */}
      {densityHotspots.length > 0 && (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800/60 dark:bg-amber-950/30">
          <p className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-100">
            <ShieldAlert size={13} />
            Inject pacing — risk of burying the team
          </p>
          <ul className="ml-5 mt-1 space-y-0.5 text-amber-800 dark:text-amber-200">
            {densityHotspots.map((h) => (
              <li key={h.bucketStartMin}>
                D-Day {ddayMinToHhmm(h.bucketStartMin)} – {ddayMinToHhmm(h.bucketStartMin + 5)} ·
                {" "}
                <span className="font-semibold">{h.injectCount} injects in 5 min</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── Timeline ─────────────────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
        <header className="flex items-baseline justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Clock size={14} className="text-indigo-600 dark:text-indigo-300" />
            Timeline — D-Day 00:00 to {ddayMinToHhmm(timelineMaxMin)}
          </h2>
          <p className="text-[11px] text-soft">
            <Sparkles size={11} className="mr-1 inline" />
            Colour-coded by scenario · click an inject to retime or hide
          </p>
        </header>

        {/* Hour grid background */}
        <div className="relative rounded-md border border-line bg-surface-0">
          <div className="flex border-b border-line bg-surface-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            {Array.from({ length: timelineMaxMin / 60 + 1 }, (_, i) => (
              <span
                key={i}
                style={{ width: `${(60 / timelineMaxMin) * 100}%` }}
                className="font-mono"
              >
                D+{String(i).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          {visibleInjects.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted">
              No injects scheduled. Add a custom inject below or chain a scenario in Step 2.
            </p>
          ) : (
            <ul className="space-y-1.5 p-3">
              {visibleInjects.map((i) => {
                const gaps = gapsByInject.get(i.id) ?? [];
                const leftPct = Math.min(98, (i.effectiveDDayMin / timelineMaxMin) * 100);
                const tone =
                  i.source === "custom"
                    ? CUSTOM_TONE
                    : SCENARIO_TONE[(i.scenarioSequence ?? 0) % SCENARIO_TONE.length];

                return (
                  <li key={i.id} className="relative">
                    {/* Position indicator on the time axis */}
                    <div
                      className="pointer-events-none absolute top-0 h-full w-px bg-indigo-300/40"
                      style={{ left: `${leftPct}%` }}
                      aria-hidden
                    />
                    <div
                      className={`relative rounded-md border p-2 text-xs ${tone} ${gaps.length > 0 ? "ring-2 ring-rose-400" : ""}`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="font-mono">
                              {i.source === "custom" ? "CUSTOM" : `#${i.injectNo}`}
                            </span>
                            <span className="font-mono">
                              D-Day {ddayMinToHhmm(i.effectiveDDayMin)}
                            </span>
                            {i.scenarioTitle && (
                              <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[9px] font-semibold dark:bg-black/30">
                                {i.scenarioLabel ?? i.scenarioTitle}
                              </span>
                            )}
                            {i.kind && (
                              <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider dark:bg-black/30">
                                {i.kind}
                              </span>
                            )}
                          </p>
                          <p className="mt-1 font-medium">{i.summary}</p>
                          <p className="mt-0.5 text-[10px] opacity-70">
                            {i.senderRoleTitle && <>From {i.senderRoleTitle} → </>}
                            {i.toRoleTitles.length > 0 ? i.toRoleTitles.join(", ") : "(no addressees)"}
                            {i.ccRoleTitles.length > 0 && (
                              <> · cc {i.ccRoleTitles.join(", ")}</>
                            )}
                          </p>
                          {gaps.length > 0 && (
                            <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                              <AlertTriangle size={9} />
                              Coverage gap: no participant playing{" "}
                              {gaps.map((g) => g.missingRole).join(", ")}
                            </p>
                          )}
                        </div>
                        <InjectActions
                          exerciseId={exerciseId}
                          inject={i}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {injects.some((i) => i.hidden) && (
          <p className="text-[11px] text-soft">
            <EyeOff size={10} className="mr-1 inline" />
            {injects.filter((i) => i.hidden).length} inject(s) hidden from this exercise.
          </p>
        )}
      </section>

      {/* ─── Add custom inject ───────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
        <header>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Wand2 size={14} className="text-indigo-600 dark:text-indigo-300" />
            Add a custom inject (specific to this exercise)
          </h2>
          <p className="mt-0.5 text-[11px] text-soft">
            Doesn&apos;t modify the underlying scenario template — only this run sees it.
          </p>
        </header>

        {!showCustomForm ? (
          <button
            type="button"
            onClick={() => setShowCustomForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line bg-surface-0 px-3 py-2 text-sm text-muted hover:border-line-strong hover:text-ink"
          >
            <Plus size={12} />
            Add inject
          </button>
        ) : (
          <form
            action={async (fd) => {
              await addCustomInjectAction(fd);
              setShowCustomForm(false);
            }}
            className="grid gap-2 sm:grid-cols-2"
          >
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <label className="text-[11px] sm:col-span-2">
              <span className="text-muted">Summary</span>
              <input
                name="summary"
                required
                maxLength={200}
                placeholder="e.g. CEO call from regulator's private secretary"
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-[11px] sm:col-span-2">
              <span className="text-muted">Description</span>
              <textarea
                name="description"
                rows={3}
                maxLength={2000}
                placeholder="Full text of the inject as it'll appear in the participant's inbox."
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-[11px]">
              <span className="text-muted">D-Day time (HH:MM)</span>
              <input
                name="scheduledTime"
                required
                pattern="\d{1,2}:\d{2}"
                defaultValue="00:30"
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 font-mono text-sm"
              />
            </label>
            <label className="text-[11px]">
              <span className="text-muted">Kind</span>
              <select
                name="kind"
                defaultValue=""
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              >
                <option value="">— pick —</option>
                <option value="BUSINESS">BUSINESS</option>
                <option value="REGULATOR">REGULATOR</option>
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="MEDIA">MEDIA</option>
                <option value="VENDOR">VENDOR</option>
                <option value="INTERNAL">INTERNAL</option>
              </select>
            </label>
            <label className="text-[11px] sm:col-span-2">
              <span className="text-muted">Sender role title</span>
              <input
                name="senderRoleTitle"
                maxLength={120}
                placeholder="e.g. FCA Supervisor"
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-[11px]">
              <span className="text-muted">To (comma-separated role titles)</span>
              <input
                name="toRoleTitlesCsv"
                placeholder="CRO, CEO"
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-[11px]">
              <span className="text-muted">CC (optional)</span>
              <input
                name="ccRoleTitlesCsv"
                placeholder="Head of Compliance"
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              />
            </label>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="rounded-md px-2 py-1 text-[11px] text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">
                <Plus size={11} />
                Add to timeline
              </button>
            </div>
          </form>
        )}

        {rosterRoleTitles.length > 0 && (
          <p className="text-[11px] text-soft">
            Roles available on the roster: {rosterRoleTitles.slice(0, 12).join(", ")}
            {rosterRoleTitles.length > 12 && ` + ${rosterRoleTitles.length - 12} more`}
          </p>
        )}
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <Link
          href={`/exercises/new?step=3&id=${exerciseId}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
        >
          <ArrowLeft size={14} />
          Back to Team
        </Link>
        <Link
          href={`/exercises/new?step=5&id=${exerciseId}`}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-indigo-500"
        >
          Next: Pre-flight
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function InjectActions({ exerciseId, inject }: { exerciseId: string; inject: AggregatedInject }) {
  if (inject.source === "custom") {
    return (
      <form action={removeCustomInjectAction}>
        <input type="hidden" name="exerciseId" value={exerciseId} />
        <input type="hidden" name="overrideId" value={inject.overrideId ?? ""} />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-soft hover:text-rose-700"
          title="Remove custom inject"
        >
          <Trash2 size={10} />
        </button>
      </form>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <form action={retimeScenarioInjectAction} className="flex items-center gap-1">
        <input type="hidden" name="exerciseId" value={exerciseId} />
        <input type="hidden" name="injectId" value={inject.id} />
        <input
          name="scheduledTime"
          defaultValue={inject.scenarioScheduledTime ?? "00:00"}
          pattern="\d{1,2}:\d{2}"
          className="w-14 rounded border border-line-strong bg-surface-1 px-1 py-0.5 font-mono text-[10px]"
          title="Override scheduled time (HH:MM)"
        />
        <button
          type="submit"
          className="rounded bg-white/60 px-1.5 py-0.5 text-[10px] dark:bg-black/30"
          title="Save retime"
        >
          Save
        </button>
      </form>
      <form action={toggleHideScenarioInjectAction}>
        <input type="hidden" name="exerciseId" value={exerciseId} />
        <input type="hidden" name="injectId" value={inject.id} />
        <button
          type="submit"
          className="rounded-md px-1.5 py-1 text-[10px] text-soft hover:text-ink"
          title="Toggle hide"
        >
          {inject.hidden ? <Eye size={10} /> : <EyeOff size={10} />}
        </button>
      </form>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "ok" | "warn" | "critical";
}) {
  const valueColor =
    tone === "ok"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-300"
        : tone === "critical"
          ? "text-rose-600 dark:text-rose-300"
          : "text-ink";
  return (
    <div className="rounded-md border border-line bg-surface-0 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
        <Icon size={11} />
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-semibold ${valueColor}`}>{value}</div>
      {sub && <div className="text-[10px] text-soft">{sub}</div>}
    </div>
  );
}
