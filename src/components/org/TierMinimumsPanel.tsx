import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import type { TierMinimum, TierMinimumsResult } from "@/lib/tier-minimums";

const STATUS_CHIP: Record<TierMinimum["status"], string> = {
  met: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  unmet: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
};

const STATUS_DOT: Record<TierMinimum["status"], string> = {
  met: "bg-emerald-500",
  partial: "bg-amber-500",
  unmet: "bg-rose-500",
};

const STATUS_LABEL: Record<TierMinimum["status"], string> = {
  met: "OK",
  partial: "Partial",
  unmet: "Gap",
};

/**
 * Per-tier readiness checklist for the /org hub. Each item shows
 * met / partial / gap with a one-click deep-link to the relevant
 * editor. The panel's tone is driven by gap count so a Tier-1 firm
 * with 6 unmet minimums lights up rose even before the user reads
 * any rows.
 */
export default function TierMinimumsPanel({
  result,
}: {
  result: TierMinimumsResult;
}) {
  const { items, metCount, totalCount, tierPitch } = result;
  const gapCount = items.filter((i) => i.status === "unmet").length;
  const partialCount = items.filter((i) => i.status === "partial").length;
  const pct = totalCount === 0 ? 100 : Math.round((metCount / totalCount) * 100);

  const tone =
    gapCount === 0 && partialCount === 0
      ? "ok"
      : gapCount === 0
        ? "warn"
        : "critical";

  const ring =
    tone === "ok"
      ? "border-emerald-300 dark:border-emerald-700/60"
      : tone === "warn"
        ? "border-amber-300 dark:border-amber-700/60"
        : "border-rose-300 dark:border-rose-700/60";

  const bar =
    tone === "ok"
      ? "from-emerald-500 to-emerald-400"
      : tone === "warn"
        ? "from-amber-500 to-amber-400"
        : "from-rose-500 to-rose-400";

  return (
    <section
      className={`overflow-hidden rounded-xl border bg-surface-1 ${ring}`}
    >
      <div className={`h-1 bg-gradient-to-r ${bar}`} />
      <div className="space-y-4 p-5">
        <header className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-300" />
            <h2 className="text-sm font-semibold text-ink">Tier minimums</h2>
            <span className="text-[11px] text-soft">
              {metCount} of {totalCount} met · {pct}%
            </span>
          </div>
          <p className="text-[11px] text-muted">{tierPitch}</p>
        </header>

        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.fixHref}
                className="group flex h-full flex-col gap-2 rounded-md border border-line bg-surface-0 p-3 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full ${STATUS_CHIP[item.status]}`}
                    >
                      {item.status === "met" ? (
                        <CheckCircle2 size={9} />
                      ) : item.status === "partial" ? (
                        <AlertCircle size={9} />
                      ) : (
                        <span className={`block h-1.5 w-1.5 rounded-full ${STATUS_DOT[item.status]}`} />
                      )}
                    </span>
                    <div>
                      <p className="text-[12px] font-medium text-ink">{item.label}</p>
                      <p className="mt-0.5 text-[10px] text-soft">{item.hint}</p>
                    </div>
                  </div>
                  <span
                    className={`flex-none rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${STATUS_CHIP[item.status]}`}
                  >
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>
                <footer className="mt-auto flex items-center justify-end border-t border-line pt-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-0.5 font-medium text-indigo-600 group-hover:underline dark:text-indigo-300">
                    {item.fixLabel}
                    <ArrowRight size={9} />
                  </span>
                </footer>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
