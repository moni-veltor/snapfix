"use client";

import { useState, type ReactNode } from "react";
import {
  History,
  Layers,
  Scale,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type IBSTabKey =
  | "overview"
  | "resources"
  | "tolerance"
  | "governance"
  | "history";

type TabDef = {
  key: IBSTabKey;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const TABS: TabDef[] = [
  { key: "overview", label: "Overview", hint: "Map + tolerance tester", icon: Sparkles },
  { key: "resources", label: "Resource map", hint: "Tech, 3rd parties, processes", icon: Layers },
  { key: "tolerance", label: "Tolerance & impact", hint: "Limits, importance, harms", icon: Scale },
  { key: "governance", label: "Governance", hint: "Ownership & assurance", icon: ShieldCheck },
  { key: "history", label: "Exercise history", hint: "Where this IBS has been tested", icon: History },
];

type Props = {
  ibsId: string;
  panels: Partial<Record<IBSTabKey, ReactNode>>;
  /** Optional badge counts shown next to a tab (e.g. "3 exercises"). */
  counts?: Partial<Record<IBSTabKey, number>>;
};

const STORAGE_KEY = "snapfix-ibs-tab";

/**
 * Client-side tab wrapper for the IBS detail page. Reads server-rendered
 * panels and only renders the active one — keeps the detail surface
 * navigable instead of a 12-section vertical scroll.
 *
 * Selected tab persists per-IBS in localStorage. Tab choice survives
 * navigation between IBSs (so an admin doing a coverage review can stay on
 * the "Tolerance" tab across services).
 */
export default function IBSDetailTabs({ ibsId, panels, counts }: Props) {
  // Lazy initialiser reads localStorage on first render, so we don't need a
  // post-mount setState (which the react-hooks linter rejects).
  const [tab, setTab] = useState<IBSTabKey>(() => {
    if (typeof window === "undefined") return "overview";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && TABS.some((t) => t.key === stored)) {
      return stored as IBSTabKey;
    }
    return "overview";
  });

  const choose = (next: IBSTabKey) => {
    setTab(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  };

  // Hide tabs that have no content rendered for this IBS.
  const visible = TABS.filter((t) => panels[t.key] != null);

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label={`IBS ${ibsId} sections`}
        className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-1 rounded-xl border border-line bg-surface-1/95 p-1 backdrop-blur"
      >
        {visible.map((t) => {
          const active = t.key === tab;
          const Icon = t.icon;
          const count = counts?.[t.key];
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => choose(t.key)}
              className={`group flex flex-1 min-w-[140px] items-center gap-2 rounded-lg px-3 py-2 text-left transition-all ${
                active
                  ? "bg-gradient-brand text-white shadow-[var(--shadow-card)]"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{t.label}</span>
                <span
                  className={`block truncate text-[10px] ${
                    active ? "text-white/80" : "text-soft"
                  }`}
                >
                  {t.hint}
                </span>
              </span>
              {typeof count === "number" && count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    active
                      ? "bg-white/25 text-white"
                      : "bg-accent-soft text-indigo-700 dark:text-indigo-200"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {visible.map((t) => (
          <div key={t.key} hidden={t.key !== tab}>
            {panels[t.key]}
          </div>
        ))}
      </div>

      <details className="rounded-xl border border-dashed border-line bg-surface-1 p-3 text-xs">
        <summary className="cursor-pointer text-muted hover:text-ink">
          Coaching · why these tabs are split this way
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>
            <span className="text-ink">Overview</span> — interactive widgets the IMT
            reaches for first: dependency map and tolerance tester.
          </li>
          <li>
            <span className="text-ink">Resource map</span> — the static lists the
            register captures (tech / 3rd parties / processes / methodology).
          </li>
          <li>
            <span className="text-ink">Tolerance & impact</span> — declared tolerances,
            criticality, importance dimensions, harm coverage.
          </li>
          <li>
            <span className="text-ink">Governance</span> — process owner, reviewer,
            review cycle, vulnerabilities & testing notes.
          </li>
          <li>
            <span className="text-ink">Exercise history</span> — every drill this IBS
            has been part of.
          </li>
        </ul>
      </details>
    </div>
  );
}

