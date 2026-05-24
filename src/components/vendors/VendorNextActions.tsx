import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import type { Suggestion } from "@/lib/vendor-suggestions";

const TONE: Record<Suggestion["priority"], { wrap: string; chip: string; chipLabel: string }> = {
  high: {
    wrap: "border-rose-300 bg-rose-50/60 dark:border-rose-800/60 dark:bg-rose-950/20",
    chip: "bg-rose-600 text-white",
    chipLabel: "Now",
  },
  medium: {
    wrap: "border-amber-300 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/20",
    chip: "bg-amber-600 text-white",
    chipLabel: "Soon",
  },
  low: {
    wrap: "border-line bg-surface-1",
    chip: "bg-surface-2 text-soft",
    chipLabel: "Tidy",
  },
};

/**
 * "What should I do next on this vendor" panel. Sits above the tab bar
 * on /vendors/[id] so the suggestion is the first thing an admin sees
 * when they open a vendor. Empty-state shows a soft confirmation
 * instead of nothing — easier to spot at scale than a missing element.
 */
export default function VendorNextActions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  if (suggestions.length === 0) {
    return (
      <section className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/60 p-3 text-[12px] dark:border-emerald-800/60 dark:bg-emerald-950/20">
        <CheckCircle2 size={14} className="text-emerald-700 dark:text-emerald-300" />
        <span className="text-emerald-900 dark:text-emerald-100">
          Nothing to fix on this vendor — assurance, contract, register and assessments are
          all current.
        </span>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-surface-1 p-4">
      <header className="flex items-center gap-2">
        <Sparkles size={14} className="text-indigo-600 dark:text-indigo-300" />
        <h2 className="text-sm font-semibold text-ink">Next actions</h2>
        <span className="text-[11px] text-soft">
          Top {suggestions.length} unblockers based on this vendor&apos;s state
        </span>
      </header>
      <ul className="mt-3 space-y-2">
        {suggestions.map((s, i) => {
          const tone = TONE[s.priority];
          return (
            <li
              key={i}
              className={`flex flex-wrap items-start gap-3 rounded-md border p-3 text-sm ${tone.wrap}`}
            >
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.chip}`}
              >
                {tone.chipLabel}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{s.action}</p>
                {s.rationale && (
                  <p className="mt-0.5 text-[11px] text-soft">{s.rationale}</p>
                )}
              </div>
              <Link
                href={s.href}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line bg-surface-1 px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-surface-2"
              >
                {s.cta}
                <ArrowRight size={11} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
