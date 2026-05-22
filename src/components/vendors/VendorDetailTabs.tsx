"use client";

import { useState, type ReactNode } from "react";
import {
  Building2,
  FileSearch,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type VendorTabKey = "basics" | "mtp" | "assessments" | "notifications";

type TabDef = {
  key: VendorTabKey;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const TABS: TabDef[] = [
  { key: "basics", label: "Basics", hint: "Name, tier, contact, DORA, exit plan", icon: Building2 },
  { key: "mtp", label: "MTP register", hint: "Annex 3 sections 2–5", icon: ShieldCheck },
  { key: "assessments", label: "Assessments", hint: "Risk · audit · financial · cyber DD", icon: FileSearch },
  { key: "notifications", label: "Notifications", hint: "Submitted + draft filings", icon: Mail },
];

type Props = {
  vendorId: string;
  panels: Partial<Record<VendorTabKey, ReactNode>>;
  /** Optional badge counts (e.g. number of assessments / notifications). */
  counts?: Partial<Record<VendorTabKey, number>>;
};

/**
 * Tabs for /vendors/[id]. The previous detail page stacked the MTP form,
 * assessments grid and notifications panel into one ~40-field scroll;
 * here each section is its own tab with the readiness header staying
 * visible above. Selected tab persists per vendor in localStorage so an
 * admin who came back to file a notification doesn't have to click
 * through Basics → MTP → Assessments first.
 */
export default function VendorDetailTabs({ vendorId, panels, counts }: Props) {
  const STORAGE_KEY = `snapfix-vendor-tab.${vendorId}`;
  const [tab, setTab] = useState<VendorTabKey>(() => {
    if (typeof window === "undefined") return "basics";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && TABS.some((t) => t.key === stored)) {
      return stored as VendorTabKey;
    }
    return "basics";
  });

  const choose = (next: VendorTabKey) => {
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
        aria-label="Vendor detail sections"
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
              className={`group flex flex-1 min-w-[150px] items-center gap-2 rounded-lg px-3 py-2 text-left transition-all ${
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
