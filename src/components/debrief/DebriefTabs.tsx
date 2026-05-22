"use client";

import { useState, type ReactNode } from "react";
import {
  CheckSquare,
  FileText,
  MessageSquareWarning,
  PieChart,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type DebriefTabKey =
  | "overview"
  | "findings"
  | "actions"
  | "report"
  | "retro";

type TabDef = {
  key: DebriefTabKey;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const TABS: TabDef[] = [
  { key: "overview", label: "Overview", hint: "Score, highlights, tolerance", icon: PieChart },
  { key: "findings", label: "Findings", hint: "Debrief questions + team answers", icon: MessageSquareWarning },
  { key: "actions", label: "Actions", hint: "AAR + action items", icon: CheckSquare },
  { key: "report", label: "Report", hint: "PIR + hot wash", icon: FileText },
  { key: "retro", label: "Retro", hint: "Wellbeing + retrospective", icon: Sparkles },
];

type Props = {
  exerciseId: string;
  panels: Partial<Record<DebriefTabKey, ReactNode>>;
  counts?: Partial<Record<DebriefTabKey, number>>;
};

/**
 * Client-side tab wrapper for the post-exercise debrief. Replaces the
 * 10-section vertical scroll that used to make participants hunt for the
 * questions / their action items / the PIR. Selected tab persists per
 * exercise in localStorage so a facilitator coming back to finish a PIR
 * lands on the right tab.
 */
export default function DebriefTabs({ exerciseId, panels, counts }: Props) {
  const STORAGE_KEY = `snapfix-debrief-tab.${exerciseId}`;
  const [tab, setTab] = useState<DebriefTabKey>(() => {
    if (typeof window === "undefined") return "overview";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && TABS.some((t) => t.key === stored)) {
      return stored as DebriefTabKey;
    }
    return "overview";
  });

  const choose = (next: DebriefTabKey) => {
    setTab(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  };

  const visible = TABS.filter((t) => panels[t.key] != null);

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Debrief sections"
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
                  className={`block truncate text-[10px] ${active ? "text-white/80" : "text-soft"}`}
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
    </div>
  );
}
