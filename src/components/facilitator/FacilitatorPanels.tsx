"use client";

import { useState, type ReactNode } from "react";
import {
  FileText,
  ListChecks,
  MessageSquareReply,
  type LucideIcon,
} from "lucide-react";

export type FacilitatorPanelKey = "runsheet" | "receipts" | "responses";

const TABS: {
  key: FacilitatorPanelKey;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  { key: "runsheet", label: "Run sheet", hint: "Release events & injects", icon: ListChecks },
  { key: "receipts", label: "Read receipts", hint: "Who's seen what", icon: FileText },
  { key: "responses", label: "Responses", hint: "Participant assessments", icon: MessageSquareReply },
];

type Props = {
  panels: Partial<Record<FacilitatorPanelKey, ReactNode>>;
  counts?: Partial<Record<FacilitatorPanelKey, number>>;
};

export default function FacilitatorPanels({ panels, counts }: Props) {
  const [tab, setTab] = useState<FacilitatorPanelKey>("runsheet");
  const visible = TABS.filter((t) => panels[t.key] != null);

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-1 rounded-xl border border-line bg-surface-1/95 p-1 backdrop-blur"
      >
        {visible.map((t) => {
          const active = tab === t.key;
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

      {visible.map((t) => (
        <div key={t.key} hidden={t.key !== tab}>
          {panels[t.key]}
        </div>
      ))}
    </div>
  );
}
