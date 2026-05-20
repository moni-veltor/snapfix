"use client";

import { useCallback, useSyncExternalStore } from "react";
import { User } from "lucide-react";

/**
 * Compact "Mine only" toggle pill used across registry grids. Persists
 * across page loads via localStorage so the user's filter sticks. The
 * `scope` key partitions the persisted value per-grid so toggling Mine
 * on the IBS register doesn't affect Exercises.
 */

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function storageKey(scope: string): string {
  return `snapfix:mine-toggle:${scope}`;
}

export function useMineToggle(scope: string): [boolean, (next: boolean) => void] {
  const key = storageKey(scope);
  const getSnapshot = useCallback(
    () => (typeof window === "undefined" ? null : window.localStorage.getItem(key)),
    [key],
  );
  const stored = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const on = stored === "1";

  const setOn = useCallback(
    (next: boolean) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, next ? "1" : "0");
      window.dispatchEvent(new StorageEvent("storage", { key }));
    },
    [key],
  );

  return [on, setOn];
}

export default function MineToggle({
  on,
  onChange,
  count,
  total,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  /** Count of items where the user is the owner / responsible party. */
  count: number;
  /** Total items in the grid; used to disable the toggle when `count === 0`. */
  total: number;
}) {
  const disabled = total > 0 && count === 0;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Show only items I own"
      disabled={disabled}
      onClick={() => onChange(!on)}
      title={
        disabled
          ? "Nothing currently assigned to you in this list"
          : on
            ? "Showing only items assigned to you"
            : "Show only items assigned to you"
      }
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        on
          ? "bg-indigo-600 text-white shadow-[var(--shadow-card)] hover:bg-indigo-500"
          : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <User size={11} />
      <span>Mine</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
          on ? "bg-white/30" : "bg-surface-2 text-soft"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
