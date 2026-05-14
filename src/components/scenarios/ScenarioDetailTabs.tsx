"use client";

import { useState, type ReactNode } from "react";
import {
  BookOpen,
  Building,
  FileText,
  Layers,
  Paperclip,
  Play,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type ScenarioTabKey =
  | "overview"
  | "timeline"
  | "events"
  | "injects"
  | "ibs"
  | "documents";

const TABS: {
  key: ScenarioTabKey;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  { key: "overview", label: "Overview", hint: "Story + runs", icon: BookOpen },
  { key: "timeline", label: "Timeline", hint: "Animated playback", icon: Play },
  { key: "events", label: "Events", hint: "MSEL list + add", icon: FileText },
  { key: "injects", label: "Injects", hint: "Surprise injects", icon: Zap },
  { key: "ibs", label: "IBSs", hint: "Services exercised", icon: Building },
  { key: "documents", label: "Documents", hint: "Briefings & artefacts", icon: Paperclip },
];

type Props = {
  panels: Partial<Record<ScenarioTabKey, ReactNode>>;
  counts?: Partial<Record<ScenarioTabKey, number>>;
};

export default function ScenarioDetailTabs({ panels, counts }: Props) {
  const [tab, setTab] = useState<ScenarioTabKey>("overview");
  const visible = TABS.filter((t) => panels[t.key] != null);

  return (
    <div className="space-y-5">
      <div
        role="tablist"
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
              onClick={() => setTab(t.key)}
              className={`group flex flex-1 min-w-[130px] items-center gap-2 rounded-lg px-3 py-2 text-left transition-all ${
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

      <div className="space-y-5">
        {visible.map((t) => (
          <div key={t.key} hidden={t.key !== tab}>
            {panels[t.key]}
          </div>
        ))}
      </div>
    </div>
  );
}

// re-export common icons so the page can reuse them in section headers
export { BookOpen, Building, FileText, Layers, Paperclip, Play, Zap };
