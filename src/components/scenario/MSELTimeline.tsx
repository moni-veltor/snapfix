"use client";

import { useMemo, useState } from "react";
import InjectPreviewModal from "./InjectPreviewModal";

type Marker = {
  id: string;
  kind: "EVENT" | "INJECT";
  no: number;
  time: string; // HH:MM
  title: string;
  description: string;
  senderRoleTitle: string | null;
  toRoleTitles: string[];
  ccRoleTitles: string[];
};

type Props = {
  durationMin: number;
  events: Marker[];
  injects: Marker[];
  /** Role titles already on the exercise rosters — used by the addressing validator. */
  knownRoles?: string[];
};

const parseHHMM = (s: string): number => {
  const [h, m] = s.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
};

const formatHHMM = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** A horizontal D-Day timeline of events + injects with click-to-preview. */
export default function MSELTimeline({ durationMin, events, injects, knownRoles = [] }: Props) {
  const [active, setActive] = useState<Marker | null>(null);

  const total = Math.max(durationMin, 60);
  const allMarkers = [...events, ...injects];

  // Tick density — one tick every 30 minutes
  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let m = 0; m <= total; m += 30) out.push(m);
    return out;
  }, [total]);

  const knownLower = new Set(knownRoles.map((r) => r.toLowerCase()));
  const collisions = useMemo(() => {
    // Two markers at the same minute that share at least one TO role
    const byTime = new Map<number, Marker[]>();
    for (const m of allMarkers) {
      const t = parseHHMM(m.time);
      const arr = byTime.get(t) ?? [];
      arr.push(m);
      byTime.set(t, arr);
    }
    const out = new Set<string>();
    for (const arr of byTime.values()) {
      if (arr.length < 2) continue;
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const overlap = arr[i].toRoleTitles.some((r) =>
            arr[j].toRoleTitles.some((s) => s.toLowerCase() === r.toLowerCase()),
          );
          if (overlap) {
            out.add(arr[i].id);
            out.add(arr[j].id);
          }
        }
      }
    }
    return out;
  }, [allMarkers]);

  if (allMarkers.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line bg-surface-1 p-6 text-center text-xs text-muted">
        No events or injects yet. As you add them, they'll appear on the timeline below.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">
          D-Day timeline
        </h3>
        <span className="text-xs text-muted">
          {events.length} event{events.length === 1 ? "" : "s"} ·{" "}
          {injects.length} inject{injects.length === 1 ? "" : "s"}
          {collisions.size > 0 && (
            <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
              {collisions.size} collision{collisions.size === 1 ? "" : "s"}
            </span>
          )}
        </span>
      </div>

      <div className="relative overflow-x-auto pb-2">
        <div className="relative min-w-[640px] py-8" style={{ height: 160 }}>
          {/* Axis */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-line-strong" />

          {/* Ticks */}
          {ticks.map((m) => {
            const left = `${(m / total) * 100}%`;
            return (
              <div key={m} className="absolute top-1/2" style={{ left }}>
                <div className="h-2 w-px -translate-y-1 bg-line-strong" />
                <div className="mt-1 -translate-x-1/2 text-[10px] font-mono text-muted">
                  {formatHHMM(m)}
                </div>
              </div>
            );
          })}

          {/* Markers — events above the line, injects below */}
          {events.map((e) => (
            <Marker
              key={e.id}
              marker={e}
              total={total}
              above
              collided={collisions.has(e.id)}
              onClick={() => setActive(e)}
              knownLower={knownLower}
            />
          ))}
          {injects.map((j) => (
            <Marker
              key={j.id}
              marker={j}
              total={total}
              collided={collisions.has(j.id)}
              onClick={() => setActive(j)}
              knownLower={knownLower}
            />
          ))}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-muted">
        Click any marker to preview it as the addressed participant will see it.
      </p>

      <InjectPreviewModal
        open={active !== null}
        onClose={() => setActive(null)}
        marker={active}
        knownLower={knownLower}
      />
    </div>
  );
}

function Marker({
  marker,
  total,
  above,
  collided,
  onClick,
  knownLower,
}: {
  marker: Marker;
  total: number;
  above?: boolean;
  collided: boolean;
  onClick: () => void;
  knownLower: Set<string>;
}) {
  const minutes = parseHHMM(marker.time);
  const left = `${(minutes / total) * 100}%`;
  const unknownAddressing =
    knownLower.size > 0 &&
    !marker.toRoleTitles.some((r) => knownLower.has(r.toLowerCase()));

  const baseCls =
    marker.kind === "EVENT"
      ? "border-indigo-400 bg-indigo-500/10 text-indigo-200"
      : "border-violet-400 bg-violet-500/10 text-violet-200";
  const warnCls = collided
    ? "ring-2 ring-rose-400"
    : unknownAddressing
      ? "ring-2 ring-amber-400"
      : "";

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${marker.kind} #${marker.no} · ${marker.time} · ${marker.title}${
        collided ? " · COLLISION" : ""
      }${unknownAddressing ? " · unknown role" : ""}`}
      className={`group absolute flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition hover:scale-110 ${baseCls} ${warnCls}`}
      style={{
        left,
        transform: "translateX(-50%)",
        top: above ? "calc(50% - 28px)" : "calc(50% + 12px)",
      }}
    >
      <span className="font-mono text-ink dark:text-slate-200">{marker.time}</span>
      <span className="hidden text-muted sm:inline dark:text-slate-300">
        #{marker.no}
      </span>
    </button>
  );
}
