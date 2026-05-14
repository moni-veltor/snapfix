"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Flame, Info } from "lucide-react";

type Props = {
  ibsCode: string;
  primaryToleranceMin: number;
  fcaToleranceMin: number | null;
  praToleranceMin: number | null;
};

type Verdict = {
  tone: "ok" | "warn" | "critical";
  label: string;
  body: string;
};

function fmt(min: number): string {
  if (min < 60) return `${min}m`;
  if (min < 60 * 24) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  const d = Math.floor(min / (60 * 24));
  const h = Math.floor((min % (60 * 24)) / 60);
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
}

/**
 * Interactive tolerance tester. Slider models "service is down for X minutes"
 * and shows live verdict against the primary tolerance, the FCA tolerance and
 * the PRA tolerance — plus the harm cascade you'd expect at that duration.
 *
 * Default scale: 0 to 4× primary tolerance. Useful for stress-thinking
 * tolerance design ("if FCA tolerance is 2h, what happens at 8h?") and for
 * coaching the IMT on what each milestone actually means.
 */
export default function ToleranceTester({
  ibsCode,
  primaryToleranceMin,
  fcaToleranceMin,
  praToleranceMin,
}: Props) {
  const maxScale = Math.max(primaryToleranceMin, fcaToleranceMin ?? 0, praToleranceMin ?? 0) * 4;
  const safeMax = Math.max(maxScale, 240);
  const [downtimeMin, setDowntimeMin] = useState(primaryToleranceMin);

  const verdicts: Verdict[] = useMemo(() => {
    const out: Verdict[] = [];

    if (downtimeMin < primaryToleranceMin) {
      out.push({
        tone: "ok",
        label: "Within primary tolerance",
        body: `Operating inside your declared tolerance of ${fmt(primaryToleranceMin)}. Continue executing the response plan; no escalation yet.`,
      });
    } else {
      out.push({
        tone: "critical",
        label: "Primary tolerance breached",
        body: `Past ${fmt(primaryToleranceMin)} — this is now a reportable breach of your own declared tolerance. Notify the CRO and prepare a 'cause of intolerable harm' note for the post-incident review.`,
      });
    }

    if (fcaToleranceMin !== null) {
      if (downtimeMin < fcaToleranceMin) {
        out.push({
          tone: downtimeMin < fcaToleranceMin * 0.8 ? "ok" : "warn",
          label: "Within FCA tolerance",
          body: `${fmt(fcaToleranceMin - downtimeMin)} of headroom remaining against the FCA limit of ${fmt(fcaToleranceMin)}. Brief external affairs now if you'll need to notify.`,
        });
      } else {
        out.push({
          tone: "critical",
          label: "FCA tolerance breached",
          body: `Past ${fmt(fcaToleranceMin)}. FCA notification is required — this is intolerable harm in the regulator's terms. Trigger the Section 65 / SUP 15A notification path.`,
        });
      }
    }

    if (praToleranceMin !== null) {
      if (downtimeMin < praToleranceMin) {
        out.push({
          tone: downtimeMin < praToleranceMin * 0.8 ? "ok" : "warn",
          label: "Within PRA tolerance",
          body: `${fmt(praToleranceMin - downtimeMin)} of headroom against the PRA limit of ${fmt(praToleranceMin)}. PRA-driven tolerances generally focus on financial stability; brief the CFO.`,
        });
      } else {
        out.push({
          tone: "critical",
          label: "PRA tolerance breached",
          body: `Past ${fmt(praToleranceMin)}. PRA-relevant intolerable harm — convene the IMT and notify supervisor lead. If this is a dual-regulated firm, both FCA and PRA need updates.`,
        });
      }
    }

    return out;
  }, [downtimeMin, primaryToleranceMin, fcaToleranceMin, praToleranceMin]);

  const worst = verdicts.reduce<Verdict["tone"]>((acc, v) => {
    if (v.tone === "critical") return "critical";
    if (v.tone === "warn" && acc !== "critical") return "warn";
    return acc;
  }, "ok");

  return (
    <section className="rounded-xl border border-line bg-surface-1 p-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Tolerance scenario tester</h3>
          <p className="mt-0.5 text-xs text-muted">
            Model how long {ibsCode} can be down before each tolerance breaches.
          </p>
        </div>
        <div
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            worst === "ok"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              : worst === "warn"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
          }`}
        >
          {worst === "ok" ? "Within tolerances" : worst === "warn" ? "Near breach" : "Breached"}
        </div>
      </header>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Downtime simulated</span>
          <span className="font-mono text-base font-semibold text-ink">{fmt(downtimeMin)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={safeMax}
          step={Math.max(1, Math.floor(safeMax / 240))}
          value={downtimeMin}
          onChange={(e) => setDowntimeMin(Number(e.target.value))}
          className="mt-2 w-full accent-indigo-500"
          aria-label="Simulated downtime in minutes"
        />
        <div className="mt-1 flex justify-between text-[10px] text-soft">
          <span>0</span>
          <span>{fmt(Math.floor(safeMax / 4))}</span>
          <span>{fmt(Math.floor(safeMax / 2))}</span>
          <span>{fmt(Math.floor((safeMax * 3) / 4))}</span>
          <span>{fmt(safeMax)}</span>
        </div>

        <div className="mt-3">
          <ToleranceMarkers
            downtimeMin={downtimeMin}
            primary={primaryToleranceMin}
            fca={fcaToleranceMin}
            pra={praToleranceMin}
            max={safeMax}
          />
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {verdicts.map((v, i) => (
          <li
            key={i}
            className={`rounded-md border p-3 text-xs ${
              v.tone === "ok"
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
                : v.tone === "warn"
                  ? "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
                  : "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
              {v.tone === "ok" ? (
                <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-300" />
              ) : v.tone === "warn" ? (
                <AlertTriangle size={11} className="text-amber-600 dark:text-amber-300" />
              ) : (
                <Flame size={11} className="text-rose-600 dark:text-rose-300" />
              )}
              <span
                className={
                  v.tone === "ok"
                    ? "text-emerald-700 dark:text-emerald-300"
                    : v.tone === "warn"
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-rose-700 dark:text-rose-300"
                }
              >
                {v.label}
              </span>
            </div>
            <p className="mt-1 text-ink">{v.body}</p>
          </li>
        ))}
      </ul>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-soft">
        <Info size={11} className="mt-0.5 shrink-0" />
        This is a coaching tool, not a live monitor — values you set here are not saved.
      </p>
    </section>
  );
}

function ToleranceMarkers({
  downtimeMin,
  primary,
  fca,
  pra,
  max,
}: {
  downtimeMin: number;
  primary: number;
  fca: number | null;
  pra: number | null;
  max: number;
}) {
  const ticks: { pos: number; label: string; color: string }[] = [];
  ticks.push({ pos: (primary / max) * 100, label: "Primary", color: "var(--accent)" });
  if (fca !== null) ticks.push({ pos: (fca / max) * 100, label: "FCA", color: "#f59e0b" });
  if (pra !== null) ticks.push({ pos: (pra / max) * 100, label: "PRA", color: "#8b5cf6" });

  const currentPos = (downtimeMin / max) * 100;

  return (
    <div className="relative h-6">
      <div className="absolute left-0 top-2 h-2 w-full rounded-full bg-surface-2" />
      <div
        className="absolute left-0 top-2 h-2 rounded-full bg-gradient-brand"
        style={{ width: `${Math.min(100, currentPos)}%` }}
      />
      {ticks.map((t) => (
        <div
          key={t.label}
          className="absolute -top-1 -translate-x-1/2"
          style={{ left: `${Math.min(100, t.pos)}%` }}
        >
          <div className="h-5 w-0.5" style={{ background: t.color }} />
          <div
            className="absolute top-5 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold uppercase tracking-wider"
            style={{ color: t.color }}
          >
            {t.label}
          </div>
        </div>
      ))}
    </div>
  );
}
