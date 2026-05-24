import { AlertOctagon, ShieldAlert, ShieldCheck, Timer } from "lucide-react";
import type { LiveToleranceRow } from "@/lib/rto-rpo-check";

/**
 * Live impact-tolerance burn-down for an active incident. Sits in the
 * /exercises/[id]/live workspace so the IMT can watch each IBS's
 * tolerance budget consume in real time, instead of waiting for the
 * post-incident /exec view.
 *
 * Status thresholds (computed in evaluateLiveTolerance):
 *   - OK        — < 50% of tolerance consumed
 *   - WARNING   — 50%–80%
 *   - AT_RISK   — 80%–100% (the "burn-down warning")
 *   - BREACHED  — ≥ 100% (regulator-notifiable on a real incident)
 *
 * Auto-hides when there's nothing to track (no incident, no IBSs).
 */
export default function LiveToleranceBreachPanel({
  rows,
}: {
  rows: LiveToleranceRow[];
}) {
  if (rows.length === 0) return null;

  const breached = rows.filter((r) => r.status === "BREACHED").length;
  const atRisk = rows.filter((r) => r.status === "AT_RISK").length;
  const warning = rows.filter((r) => r.status === "WARNING").length;
  const ok = rows.length - breached - atRisk - warning;

  const headerTone =
    breached > 0
      ? "border-rose-300 bg-rose-50/60 dark:border-rose-800/60 dark:bg-rose-950/30"
      : atRisk > 0
        ? "border-amber-300 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/30"
        : "border-line bg-surface-1";
  const HeaderIcon = breached > 0 ? AlertOctagon : atRisk > 0 ? ShieldAlert : ShieldCheck;
  const headerIconCls =
    breached > 0
      ? "text-rose-700 dark:text-rose-300"
      : atRisk > 0
        ? "text-amber-700 dark:text-amber-300"
        : "text-emerald-700 dark:text-emerald-300";

  return (
    <section
      className={`rounded-xl border p-4 ${headerTone}`}
      aria-label="IBS impact-tolerance burn-down"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <HeaderIcon size={14} className={headerIconCls} aria-hidden="true" />
          IBS impact tolerance
        </h3>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {breached > 0 && (
            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {breached} breached
            </span>
          )}
          {atRisk > 0 && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {atRisk} at risk
            </span>
          )}
          {warning > 0 && (
            <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 font-semibold text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
              {warning} warning
            </span>
          )}
          {ok > 0 && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              {ok} OK
            </span>
          )}
        </div>
      </header>

      <ul className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <ToleranceRow key={r.ibsName} row={r} />
        ))}
      </ul>

      <p className="mt-2 text-[10px] text-soft">
        Elapsed since invocation vs declared impact tolerance. Breach = regulator-notifiable on a
        real incident.
      </p>
    </section>
  );
}

function ToleranceRow({ row }: { row: LiveToleranceRow }) {
  const pctClamped = Math.min(1, row.pctConsumed);
  const barCls =
    row.status === "BREACHED"
      ? "bg-rose-500"
      : row.status === "AT_RISK"
        ? "bg-amber-500"
        : row.status === "WARNING"
          ? "bg-cyan-500"
          : "bg-emerald-500";
  const pillCls =
    row.status === "BREACHED"
      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
      : row.status === "AT_RISK"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        : row.status === "WARNING"
          ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200"
          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";

  const remainingLabel =
    row.status === "BREACHED"
      ? `Breached by ${Math.abs(row.remainingMin)} min`
      : `${row.remainingMin} min left`;

  return (
    <li className="rounded-md border border-line bg-surface-1 p-2.5 text-[12px]">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-medium text-ink">{row.ibsName}</span>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${pillCls}`}
        >
          {row.status.replace("_", " ")}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-all ${barCls}`}
          style={{ width: `${Math.max(2, pctClamped * 100)}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-soft">
        <span className="inline-flex items-center gap-1">
          <Timer size={9} aria-hidden="true" />
          {row.elapsedMin}m elapsed · tolerance {row.toleranceMin}m
        </span>
        <span
          className={
            row.status === "BREACHED" ? "font-semibold text-rose-700 dark:text-rose-300" : ""
          }
        >
          {remainingLabel}
        </span>
      </div>
    </li>
  );
}
