"use client";

import { useState, type ReactNode } from "react";

export type TabKey =
  | "readiness"
  | "overview"
  | "ibs"
  | "vendors"
  | "exercises"
  | "actions"
  | "signoff";

const TABS: { key: TabKey; label: string }[] = [
  { key: "readiness", label: "Readiness" },
  { key: "overview", label: "Overview" },
  { key: "ibs", label: "IBS register" },
  { key: "vendors", label: "Vendors" },
  { key: "exercises", label: "Exercises" },
  { key: "actions", label: "Action items" },
  { key: "signoff", label: "Sign-off" },
];

export default function AttestationTabs({
  counts,
  panels,
}: {
  counts: Partial<Record<TabKey, number>>;
  panels: Record<TabKey, ReactNode>;
}) {
  const [active, setActive] = useState<TabKey>("readiness");

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Attestation sections" className="flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => {
          const isActive = active === t.key;
          const count = counts[t.key];
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(t.key)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-indigo-500 text-ink"
                  : "border-transparent text-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              {t.label}
              {typeof count === "number" && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                    isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200" : "bg-surface-2 text-soft"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{panels[active]}</div>
    </div>
  );
}
