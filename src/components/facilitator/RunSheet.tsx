"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  Sparkles,
  Undo2,
  Zap,
} from "lucide-react";
import {
  releaseEventAction,
  releaseInjectAction,
} from "@/app/actions/exercises";
import RecallButton from "@/components/facilitator/RecallButton";
import { withToast } from "@/lib/toast-action";
import SubmitButton from "@/components/ui/SubmitButton";

type EventBeat = {
  id: string;
  eventNo: number;
  scheduledTime: string;
  title: string;
  description: string;
  senderRoleTitle: string | null;
  toRoleTitles: string[];
  ccRoleTitles: string[];
  released: boolean;
};

type InjectBeat = {
  id: string;
  injectNo: number;
  scheduledTime: string;
  summary: string;
  description: string;
  senderRoleTitle: string | null;
  toRoleTitles: string[];
  ccRoleTitles: string[];
  released: boolean;
  /** business vs technical inject — renamed to avoid colliding with the
   *  `kind` discriminator on the Beat union below. */
  injectKind?: "BUSINESS" | "TECHNICAL";
};

type Beat =
  | ({ kind: "event"; key: string } & EventBeat)
  | ({ kind: "inject"; key: string } & InjectBeat);

type Filter = "all" | "due" | "pending" | "released";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All beats" },
  { id: "due", label: "Due / overdue" },
  { id: "pending", label: "Pending" },
  { id: "released", label: "Released" },
];

function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

export default function RunSheet({
  exerciseId,
  events,
  injects,
  dDayHHMM,
}: {
  exerciseId: string;
  events: EventBeat[];
  injects: InjectBeat[];
  dDayHHMM: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const beats: Beat[] = useMemo(() => {
    const merged: Beat[] = [
      ...events.map((e): Beat => ({ kind: "event", key: `e-${e.id}`, ...e })),
      ...injects.map((j): Beat => ({ kind: "inject", key: `i-${j.id}`, ...j })),
    ];
    return merged.sort((a, b) =>
      a.scheduledTime.localeCompare(b.scheduledTime),
    );
  }, [events, injects]);

  const nowMin = hhmmToMin(dDayHHMM);
  const nextPending = beats.find(
    (b) => !b.released && hhmmToMin(b.scheduledTime) >= nowMin,
  );
  const overduePending = beats.filter(
    (b) => !b.released && hhmmToMin(b.scheduledTime) < nowMin,
  );

  const counts = {
    all: beats.length,
    due: overduePending.length,
    pending: beats.filter((b) => !b.released).length,
    released: beats.filter((b) => b.released).length,
  };

  const filtered = beats.filter((b) => {
    if (filter === "all") return true;
    if (filter === "released") return b.released;
    if (filter === "pending") return !b.released;
    if (filter === "due")
      return !b.released && hhmmToMin(b.scheduledTime) < nowMin;
    return true;
  });

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock size={13} className="text-muted" />
          <span className="text-muted">D-Day</span>
          <span className="font-mono font-semibold text-ink">{dDayHHMM}</span>
        </div>
        <div role="tablist" className="ml-auto flex flex-wrap gap-1">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const danger = f.id === "due" && counts.due > 0;
            return (
              <button
                key={f.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? danger
                      ? "bg-rose-600 text-white"
                      : "bg-slate-900 text-white dark:bg-indigo-500"
                    : danger
                      ? "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-200"
                      : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {danger && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                  </span>
                )}
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0 text-[9px] font-semibold ${
                    active ? "bg-white/30 dark:bg-black/30" : "bg-surface-2 text-soft"
                  }`}
                >
                  {counts[f.id]}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {overduePending.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-3 text-sm dark:border-rose-700 dark:bg-rose-950/30">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-300" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900 dark:text-rose-200">
              {overduePending.length} beat{overduePending.length === 1 ? "" : "s"} overdue
            </p>
            <p className="text-xs text-rose-800 dark:text-rose-300">
              The clock has passed their scheduled release time. Decide: release now,
              or skip and explain in the debrief.
            </p>
          </div>
        </div>
      )}

      {nextPending && overduePending.length === 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-indigo-300 bg-indigo-50 p-3 text-sm dark:border-indigo-700 dark:bg-indigo-950/30">
          <PlayCircle size={14} className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-300" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-200">
              Next up
            </p>
            <p className="text-sm font-semibold text-ink">
              {nextPending.scheduledTime} ·{" "}
              {nextPending.kind === "event"
                ? `Event #${nextPending.eventNo} — ${nextPending.title}`
                : `Inject #${nextPending.injectNo} — ${nextPending.summary}`}
            </p>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
          No beats match this view.
        </div>
      ) : (
        <ol className="relative space-y-2 border-l-2 border-line pl-6">
          {filtered.map((b) => (
            <li key={b.key} className="relative">
              <BeatDot kind={b.kind} released={b.released} />
              <BeatRow exerciseId={exerciseId} beat={b} nowMin={nowMin} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function BeatDot({ kind, released }: { kind: "event" | "inject"; released: boolean }) {
  const cls = released
    ? "bg-emerald-500"
    : kind === "event"
      ? "bg-rose-500"
      : "bg-amber-500";
  return (
    <span
      className={`absolute -left-[33px] top-3 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-surface-0 ${cls}`}
    >
      {released ? "✓" : kind === "event" ? "E" : "I"}
    </span>
  );
}

function BeatRow({
  exerciseId,
  beat,
  nowMin,
}: {
  exerciseId: string;
  beat: Beat;
  nowMin: number;
}) {
  const dueMin = hhmmToMin(beat.scheduledTime);
  const overdue = !beat.released && dueMin < nowMin;
  const minutesAway = dueMin - nowMin;

  return (
    <div
      className={`rounded-xl border bg-surface-1 p-3 transition-all ${
        beat.released
          ? "border-line opacity-90"
          : overdue
            ? "border-rose-300 ring-2 ring-rose-300/30 dark:border-rose-700"
            : "border-line hover:border-line-strong"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-[10px] text-soft">
          {beat.scheduledTime}
        </span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
            beat.kind === "event"
              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
              : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          }`}
        >
          {beat.kind === "event" ? (
            <>Event #{(beat as EventBeat & { kind: "event" }).eventNo}</>
          ) : (
            <>Inject #{(beat as InjectBeat & { kind: "inject" }).injectNo}</>
          )}
        </span>
        {beat.kind === "inject" && (beat as InjectBeat & { kind: "inject" }).injectKind === "TECHNICAL" && (
          <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
            Technical
          </span>
        )}
        {beat.kind === "inject" && (beat as InjectBeat & { kind: "inject" }).injectKind === "BUSINESS" && (
          <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
            Business
          </span>
        )}
        <h3 className="text-sm font-semibold text-ink">
          {beat.kind === "event"
            ? (beat as EventBeat & { kind: "event" }).title
            : (beat as InjectBeat & { kind: "inject" }).summary}
        </h3>
        {!beat.released && !overdue && minutesAway > 0 && minutesAway <= 60 && (
          <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
            in {minutesAway}m
          </span>
        )}
        <div className="ml-auto">
          {beat.released ? (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                <CheckCircle2 size={10} />
                Released
              </span>
              <RecallButton
                exerciseId={exerciseId}
                kind={beat.kind === "event" ? "EVENT" : "INJECT"}
                id={beat.id}
              />
            </div>
          ) : (
            <form
              action={withToast(
                beat.kind === "event" ? releaseEventAction : releaseInjectAction,
                {
                  success:
                    beat.kind === "event"
                      ? `Event #${(beat as EventBeat & { kind: "event" }).eventNo} released`
                      : `Inject #${(beat as InjectBeat & { kind: "inject" }).injectNo} released`,
                  description: () =>
                    beat.kind === "event"
                      ? (beat as EventBeat & { kind: "event" }).title
                      : (beat as InjectBeat & { kind: "inject" }).summary,
                  error:
                    beat.kind === "event"
                      ? "Couldn't release the event"
                      : "Couldn't release the inject",
                },
              )}
            >
              <input type="hidden" name="exerciseId" value={exerciseId} />
              <input
                type="hidden"
                name={beat.kind === "event" ? "eventId" : "injectId"}
                value={beat.id}
              />
              <SubmitButton
                size="sm"
                tone={overdue ? "danger" : "primary"}
                pendingLabel="Releasing…"
              >
                {beat.kind === "event" ? <PlayCircle size={11} /> : <Zap size={11} />}
                Release
              </SubmitButton>
            </form>
          )}
        </div>
      </div>
      <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-xs text-muted">
        {beat.description}
      </p>
      {beat.senderRoleTitle && (
        <p className="mt-1.5 text-[10px] text-soft">
          <span className="font-semibold">From:</span> {beat.senderRoleTitle}
          {beat.toRoleTitles.length > 0 && (
            <>
              {" · "}
              <span className="font-semibold">To:</span>{" "}
              {beat.toRoleTitles.join(", ")}
            </>
          )}
        </p>
      )}
      {!beat.released && (beat.kind === "event" || beat.kind === "inject") && (
        <details className="mt-1.5 text-[10px] text-soft">
          <summary className="cursor-pointer hover:text-ink">Full description</summary>
          <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{beat.description}</p>
        </details>
      )}
      <span className="sr-only">{overdue ? "overdue" : "scheduled"}</span>
      <Undo2 size={0} className="hidden" />
    </div>
  );
}
