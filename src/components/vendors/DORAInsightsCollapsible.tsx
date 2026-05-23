"use client";

import { useState, type ReactNode } from "react";
import { CloudCog, ChevronDown, ChevronUp } from "lucide-react";

/**
 * One-line summary band that expands into the full DORAInsights surface.
 * The audit identified the previous always-on insights as a scroll-wall
 * pushing the actual vendor list below the fold; collapsing it puts the
 * list back at the top while keeping the summary visible.
 *
 * Persists open/closed in localStorage so an admin who wants the
 * insights pinned can leave them open across sessions.
 */
export default function DORAInsightsCollapsible({
  summary,
  children,
}: {
  /** Compact one-line counts shown next to the toggle. */
  summary: {
    totalVendors: number;
    doraCritical: number;
    assuranceExpired: number;
    contractsRenewing: number;
  };
  children: ReactNode;
}) {
  const STORAGE_KEY = "snapfix-dora-insights-open";
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    }
  };

  const Caret = open ? ChevronUp : ChevronDown;
  const { totalVendors, doraCritical, assuranceExpired, contractsRenewing } = summary;

  return (
    <section className="rounded-xl border border-line bg-surface-1">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-2/40"
      >
        <div className="flex min-w-0 items-center gap-2">
          <CloudCog size={14} className="text-indigo-600 dark:text-indigo-300" />
          <span className="text-sm font-semibold text-ink">DORA insights</span>
          <span className="hidden text-[11px] text-soft sm:inline">·</span>
          <div className="hidden flex-wrap items-center gap-2 text-[11px] text-soft sm:flex">
            <span>{totalVendors} vendors</span>
            <span>·</span>
            <span className="font-medium text-indigo-700 dark:text-indigo-300">
              {doraCritical} DORA-critical
            </span>
            {assuranceExpired > 0 && (
              <>
                <span>·</span>
                <span className="font-medium text-rose-700 dark:text-rose-300">
                  {assuranceExpired} assurance expired
                </span>
              </>
            )}
            {contractsRenewing > 0 && (
              <>
                <span>·</span>
                <span className="font-medium text-amber-700 dark:text-amber-300">
                  {contractsRenewing} in notice window
                </span>
              </>
            )}
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted">
          {open ? "Hide" : "Show"}
          <Caret size={14} />
        </span>
      </button>
      {open && <div className="border-t border-line p-4">{children}</div>}
    </section>
  );
}
