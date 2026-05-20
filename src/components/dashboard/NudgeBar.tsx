"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { ArrowRight, Flame, ShieldAlert, Sparkles, X } from "lucide-react";
import type { DashboardNudge, NudgeTone } from "@/lib/dashboard-nudge";

const TONE_CLS: Record<NudgeTone, { ring: string; icon: string; chip: string }> = {
  critical: {
    ring: "border-rose-300 dark:border-rose-700/60",
    icon: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
    chip: "bg-rose-600 text-white",
  },
  warn: {
    ring: "border-amber-300 dark:border-amber-700/60",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
    chip: "bg-amber-600 text-white",
  },
  info: {
    ring: "border-indigo-300 dark:border-indigo-700/60",
    icon: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200",
    chip: "bg-indigo-600 text-white",
  },
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(nudgeId: string): string {
  return `snapfix:nudge-dismissed:${nudgeId}:${todayKey()}`;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * One-line "do this next" prompt above the recap. Dismissals persist for the
 * rest of the calendar day via localStorage, so the same nudge can resurface
 * tomorrow if it's still the most urgent thing.
 */
export default function NudgeBar({ nudge }: { nudge: DashboardNudge }) {
  const key = storageKey(nudge.id);
  const getSnapshot = useCallback(
    () => (typeof window === "undefined" ? null : window.localStorage.getItem(key)),
    [key],
  );
  // SSR + first paint: treat as not-yet-dismissed (server has no localStorage),
  // and let the client snapshot decide visibility.
  const stored = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const dismissed = stored === "1";
  if (dismissed) return null;

  const tone = TONE_CLS[nudge.tone];
  const Icon = nudge.tone === "critical" ? Flame : nudge.tone === "warn" ? ShieldAlert : Sparkles;

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border bg-surface-1 px-4 py-2.5 shadow-[var(--shadow-card)] ${tone.ring}`}
    >
      <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-md ${tone.icon}`}>
        <Icon size={14} />
      </span>
      <span
        className={`flex-none rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tone.chip}`}
      >
        {nudge.tone === "critical" ? "Act now" : nudge.tone === "warn" ? "Worth a look" : "Suggestion"}
      </span>
      <p className="min-w-0 flex-1 text-sm text-ink">{nudge.text}</p>
      <Link
        href={nudge.ctaHref}
        className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        {nudge.ctaLabel}
        <ArrowRight size={11} />
      </Link>
      <button
        type="button"
        aria-label="Dismiss for today"
        onClick={() => {
          window.localStorage.setItem(key, "1");
          // Notify other tabs / same-tab subscribers.
          window.dispatchEvent(new StorageEvent("storage", { key }));
        }}
        className="rounded-md p-1 text-soft hover:bg-surface-2 hover:text-ink"
      >
        <X size={14} />
      </button>
    </div>
  );
}
