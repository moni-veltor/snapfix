"use client";

import { useState } from "react";
import { Lightbulb, X } from "lucide-react";
import type { Nudge, NudgeSeverity } from "@/lib/nudges";

const TONE: Record<
  NudgeSeverity,
  { wrapper: string; chip: string; chipLabel: string }
> = {
  critical: {
    wrapper: "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40",
    chip: "bg-rose-600 text-white",
    chipLabel: "Act now",
  },
  warn: {
    wrapper: "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40",
    chip: "bg-amber-600 text-white",
    chipLabel: "Watch",
  },
  info: {
    wrapper: "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40",
    chip: "bg-indigo-600 text-white",
    chipLabel: "Suggestion",
  },
};

type Props = {
  nudges: Nudge[];
};

const DISMISS_KEY = "snapfix-nudge-dismissed";

/**
 * Next-best-action panel — surfaces prompts derived from the exercise state
 * so the platform behaves like a third operator. Users can dismiss individual
 * nudges; the dismissal persists in localStorage so the panel doesn't keep
 * re-prompting the same thing within a session.
 */
export default function NudgePanel({ nudges }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) return new Set();
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      return new Set();
    }
  });

  const visible = nudges.filter((n) => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (typeof window !== "undefined") {
        localStorage.setItem(DISMISS_KEY, JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb size={14} className="text-indigo-500 dark:text-indigo-300" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
          Next best action
        </h3>
        <span className="text-[10px] text-muted">
          ({visible.length} {visible.length === 1 ? "prompt" : "prompts"})
        </span>
      </div>
      <ul className="space-y-2">
        {visible.map((n) => {
          const tone = TONE[n.severity];
          return (
            <li
              key={n.id}
              className={`group relative rounded-md border p-3 text-sm ${tone.wrapper}`}
            >
              <div className="flex items-start gap-2 pr-6">
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.chip}`}
                >
                  {tone.chipLabel}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink">{n.text}</div>
                  {n.detail && <div className="mt-0.5 text-[11px] text-muted">{n.detail}</div>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(n.id)}
                aria-label="Dismiss this nudge"
                className="absolute right-1 top-1 rounded-md p-1 text-soft opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
