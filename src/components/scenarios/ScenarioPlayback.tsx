"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";

type Beat = {
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

type Props = {
  events: {
    id: string;
    eventNo: number;
    scheduledTime: string;
    title: string;
    description: string;
    senderRoleTitle: string | null;
    toRoleTitles: string[];
    ccRoleTitles: string[];
  }[];
  injects: {
    id: string;
    injectNo: number;
    scheduledTime: string;
    summary: string;
    description: string;
    relation: string | null;
    senderRoleTitle: string | null;
    toRoleTitles: string[];
    ccRoleTitles: string[];
  }[];
  durationMin: number;
};

/**
 * Animated MSEL playback. Drops events + injects onto a chronological
 * timeline and walks them one beat at a time on Play. Lets a facilitator
 * preview the cadence of the exercise without scrolling through walls of
 * text. Same visual rhythm as the system-template detail viewer.
 */
export default function ScenarioPlayback({ events, injects, durationMin }: Props) {
  const items = merge(events, injects);
  const [playing, setPlaying] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);

  useEffect(() => {
    if (!playing) return;
    if (stepIdx >= items.length - 1) return;
    const t = setTimeout(() => setStepIdx((i) => i + 1), 850);
    return () => clearTimeout(t);
  }, [playing, stepIdx, items.length]);

  const finished = stepIdx >= items.length - 1;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
        No events or injects yet. Add some on the Events / Injects tabs to see the
        animated playback.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-1 p-3">
        <div className="text-xs text-muted">
          <span className="font-semibold text-ink">{items.length}</span> beats over{" "}
          <span className="font-semibold text-ink">{durationMin}m</span> — facilitator
          preview.
        </div>
        <div className="flex items-center gap-2">
          {!playing && !finished && (
            <button
              type="button"
              onClick={() => {
                if (stepIdx === -1) setStepIdx(-1);
                setPlaying(true);
              }}
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
            onClick={() => {
              setPlaying(false);
              setStepIdx(items.length - 1);
            }}
            className="rounded-md border border-line bg-surface-0 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
          >
            Reveal all
          </button>
          {stepIdx > -1 && (
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStepIdx(-1);
              }}
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
              style={{ transform: revealed ? "translateY(0)" : "translateY(6px)" }}
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
                  <p className="mt-1 text-[10px] italic text-soft">{it.relation}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function merge(
  events: Props["events"],
  injects: Props["injects"],
): Beat[] {
  const out: Beat[] = [];
  for (const e of events) {
    out.push({
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
    out.push({
      key: `i-${j.id}`,
      kind: "inject",
      no: j.injectNo,
      scheduledTime: j.scheduledTime,
      title: j.summary,
      description: j.description,
      from: j.senderRoleTitle,
      to: j.toRoleTitles ?? [],
      relation: j.relation,
    });
  }
  return out.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}
