"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { HARM_TYPES, type HarmType } from "@/lib/harm-types";

type Props = {
  /** Which harm types this IBS already covers — highlights them in the list. */
  coverage?: Partial<Record<HarmType, boolean>>;
  defaultOpen?: boolean;
};

/**
 * Coaching reference for the six standard harm types. Collapsible — admins
 * can pop it open while filling in IBS forms or designing scenarios.
 * If `coverage` is passed, marks which harm types the current IBS already
 * stress-tests so the admin can spot gaps.
 */
export default function HarmTypeLibrary({ coverage, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-line bg-surface-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-indigo-500 dark:text-indigo-300" />
          <h3 className="text-sm font-semibold text-ink">Harm typology library</h3>
          <span className="text-xs text-muted">· what each of the 6 harm types actually covers</span>
        </div>
        {open ? <ChevronUp size={14} className="text-soft" /> : <ChevronDown size={14} className="text-soft" />}
      </button>
      {open && (
        <ul className="divide-y divide-line border-t border-line">
          {HARM_TYPES.map((h) => {
            const Icon = h.icon;
            const covered = coverage?.[h.id] === true;
            return (
              <li key={h.id} className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-md ${h.iconBgClass}`}>
                    <Icon size={14} className={h.iconColorClass} />
                  </span>
                  <h4 className="text-sm font-semibold text-ink">{h.label}</h4>
                  {covered ? (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                      Covered
                    </span>
                  ) : (
                    <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                      Gap
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink">{h.summary}</p>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted hover:text-ink">
                    Examples &amp; coaching
                  </summary>
                  <div className="mt-2 space-y-2 rounded-md bg-surface-0 p-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
                        Typical incident patterns
                      </p>
                      <ul className="mt-1 list-disc pl-4 text-[11px] text-muted">
                        {h.examples.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
                        How to test well
                      </p>
                      <p className="mt-1 text-[11px] text-muted">{h.coaching}</p>
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
