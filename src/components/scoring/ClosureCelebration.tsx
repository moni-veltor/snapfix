"use client";

import { useEffect, useState } from "react";
import { Sparkles, Trophy } from "lucide-react";

type Props = {
  closedAt: Date | null;
  shortCode: string;
  overall: number;
};

const STORAGE_KEY_PREFIX = "snapfix-celebration-shown-";

/**
 * Restrained success flourish — shows once per closed incident. Renders a
 * subtle banner with a sparkle animation. Don't be confetti-noisy; this is
 * for senior people closing a regulator-visible incident.
 */
export default function ClosureCelebration({ closedAt, shortCode, overall }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!closedAt) return;
    const key = `${STORAGE_KEY_PREFIX}${shortCode}`;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setShow(true);
  }, [closedAt, shortCode]);

  if (!closedAt || !show) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-emerald-300 bg-gradient-to-r from-emerald-50 via-emerald-50 to-emerald-100 p-4 shadow-[var(--shadow-card-md)] dark:border-emerald-700 dark:from-emerald-950/40 dark:via-emerald-950/40 dark:to-emerald-900/40">
      {/* Sparkles */}
      <Sparkles
        className="absolute right-4 top-3 text-emerald-400 dark:text-emerald-300"
        size={14}
        style={{ animation: "sparkle 1.8s ease-in-out" }}
      />
      <Sparkles
        className="absolute right-12 top-7 text-emerald-300 dark:text-emerald-400"
        size={10}
        style={{ animation: "sparkle 1.8s ease-in-out 0.3s" }}
      />
      <Sparkles
        className="absolute right-20 top-2 text-emerald-500 dark:text-emerald-200"
        size={8}
        style={{ animation: "sparkle 1.8s ease-in-out 0.6s" }}
      />

      <div className="flex items-start gap-3">
        <Trophy className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" size={22} />
        <div>
          <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Incident {shortCode} closed
          </div>
          <p className="mt-0.5 text-xs text-emerald-800/90 dark:text-emerald-200/80">
            Five closure criteria satisfied. Performance score: <strong>{overall}/100</strong>.
            PIR and retrospective have been scheduled.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="ml-auto text-xs text-emerald-700 hover:underline dark:text-emerald-300"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
