"use client";

import { useState } from "react";
import { Phone, X } from "lucide-react";
import { setOnCallStatusAction } from "@/app/actions/chat";

type Props = {
  exerciseId: string;
  currentStatus: string | null;
  currentSince: Date | null;
};

const QUICK_STATUSES = [
  "On a call with the FCA",
  "On a call with the PRA",
  "On a call with the vendor",
  "In a private CRO + Legal call",
  "Drafting the Board update",
  "Off-screen — back in 5m",
];

/**
 * "On a call" presence broadcast. Real incidents have constant phone calls;
 * teammates need to see who's momentarily unavailable. Sets a short status
 * string visible in the presence bar.
 */
export default function OnCallStatus({ exerciseId, currentStatus, currentSince }: Props) {
  const [open, setOpen] = useState(false);

  if (currentStatus) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs dark:border-amber-700 dark:bg-amber-950/40">
        <Phone size={12} className="text-amber-700 dark:text-amber-300" />
        <span className="text-amber-900 dark:text-amber-100">
          <span className="font-medium">{currentStatus}</span>
          {currentSince && (
            <span className="ml-1.5 text-amber-700/80 dark:text-amber-200/70">
              · {relativeTime(currentSince)}
            </span>
          )}
        </span>
        <form action={setOnCallStatusAction} className="ml-1">
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="status" value="" />
          <button
            type="submit"
            aria-label="Clear status"
            className="rounded-full p-0.5 text-amber-700 hover:bg-amber-200/40 dark:text-amber-300"
          >
            <X size={12} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink"
      >
        <Phone size={12} />
        Set "on a call"
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-72 rounded-md border border-line bg-surface-elev p-2 shadow-[var(--shadow-card-lg)]">
          <p className="px-1.5 py-1 text-[10px] uppercase tracking-wider text-soft">
            Quick statuses
          </p>
          <ul className="space-y-1">
            {QUICK_STATUSES.map((s) => (
              <li key={s}>
                <form action={setOnCallStatusAction}>
                  <input type="hidden" name="exerciseId" value={exerciseId} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    type="submit"
                    className="block w-full rounded px-2 py-1 text-left text-xs text-ink hover:bg-surface-2"
                  >
                    {s}
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <form action={setOnCallStatusAction} className="mt-2 border-t border-line pt-2">
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <input
              name="status"
              placeholder="Custom status…" aria-label="Custom status…"
              maxLength={120}
              className="w-full rounded-md border border-line bg-surface-0 px-2 py-1 text-xs placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              type="submit"
              className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500"
            >
              Broadcast
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function relativeTime(d: Date): string {
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
