"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import type { PulseScore } from "@/lib/dashboard";

const TONE_CHIP: Record<PulseScore["tone"], string> = {
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  warn: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  critical: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
};

const FACTOR_HINT: Record<keyof Omit<PulseScore, "total" | "grade" | "tone">, string> = {
  coverage: "% of IBSs ever stress-tested",
  hygiene: "100 − overdue / open action items",
  cadence: "Exercises in last 90d (capped at 4)",
  depth: "Harm types exercised this year / 6",
};

type Factor = {
  key: keyof Omit<PulseScore, "total" | "grade" | "tone">;
  label: string;
  value: number;
};

/**
 * StatusBar chip showing the composite Pulse score. Click to open a
 * popover that decomposes the score into its four factors so the user
 * can see *which one* is dragging it down and where to go fix it.
 * Optional `prior` (a 90d-ago snapshot of the same score) renders a
 * delta line inside the popover.
 */
export default function PulseScoreChip({
  pulse,
  prior,
}: {
  pulse: PulseScore;
  prior?: PulseScore;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const factors: Factor[] = [
    { key: "coverage", label: "Coverage", value: pulse.coverage },
    { key: "hygiene", label: "Hygiene", value: pulse.hygiene },
    { key: "cadence", label: "Cadence", value: pulse.cadence },
    { key: "depth", label: "Depth", value: pulse.depth },
  ];
  const worst = factors.reduce((acc, f) => (f.value < acc.value ? f : acc), factors[0]);
  const tone = TONE_CHIP[pulse.tone];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${tone}`}
        title="Show pulse breakdown"
      >
        Pulse <span className="font-bold">{pulse.total}</span>
        <span className="opacity-70">· {pulse.grade}</span>
        <ChevronDown
          size={10}
          className={`opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-line bg-surface-elev p-4 shadow-[var(--shadow-card-md)]"
        >
          <header className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-ink">Resilience pulse</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>
              {pulse.total} · {pulse.grade}
            </span>
          </header>
          <p className="mt-1 text-[11px] text-muted">
            Average of four 0–100 factors. <span className="font-semibold text-ink">{worst.label}</span> is
            dragging the score down — that&apos;s where to focus.
          </p>
          {prior && (
            <p className="mt-1 text-[11px]">
              <span className="text-soft">vs 90d ago:</span>{" "}
              {(() => {
                const d = pulse.total - prior.total;
                if (d === 0) return <span className="text-soft">flat at {prior.total}</span>;
                const up = d > 0;
                return (
                  <span
                    className={
                      up
                        ? "font-semibold text-emerald-700 dark:text-emerald-300"
                        : "font-semibold text-rose-700 dark:text-rose-300"
                    }
                  >
                    {up ? "↑" : "↓"} {Math.abs(d)} (was {prior.total} · {prior.grade})
                  </span>
                );
              })()}
            </p>
          )}

          <ul className="mt-3 space-y-2">
            {factors.map((f) => (
              <li key={f.key}>
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`font-medium ${
                      f.key === worst.key ? "text-rose-700 dark:text-rose-300" : "text-ink"
                    }`}
                  >
                    {f.label}
                  </span>
                  <span className="tabular-nums text-soft">{f.value}</span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full ${
                      f.key === worst.key
                        ? "bg-rose-500"
                        : f.value >= 70
                          ? "bg-emerald-500"
                          : f.value >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.max(2, f.value)}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-soft">{FACTOR_HINT[f.key]}</p>
              </li>
            ))}
          </ul>

          <footer className="mt-3 flex items-center gap-1 border-t border-line pt-2 text-[10px] text-soft">
            <Info size={9} />
            Each factor is computed live from the data behind your IBSs, actions and exercises.
          </footer>
        </div>
      )}
    </div>
  );
}
