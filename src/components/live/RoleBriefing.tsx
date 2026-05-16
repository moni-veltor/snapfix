"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { EXPECTATIONS, GENERIC_EXPECTATIONS } from "@/lib/role-expectations";

type Props = {
  seatId: string;
  abbreviation: string;
  title: string;
  responsibility: string | null;
  isSMF: boolean;
  isDeputy: boolean;
};

const STORAGE_PREFIX = "snapfix-role-briefing-";

/**
 * Short briefing shown the first time a user holds a particular seat in an
 * exercise. Captures the doctrine for that role's first-ten-minutes — what
 * they own, what's expected, how they're scored. Dismissable; persists per
 * seat in localStorage so it doesn't keep re-firing.
 */
export default function RoleBriefing({
  seatId,
  abbreviation,
  title,
  responsibility,
  isSMF,
  isDeputy,
}: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${STORAGE_PREFIX}${seatId}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
  }, [seatId]);

  if (!show) return null;

  const expectations = EXPECTATIONS[abbreviation] ?? GENERIC_EXPECTATIONS;

  return (
    <div className="relative overflow-hidden rounded-lg border border-indigo-300 bg-gradient-to-br from-indigo-50 via-indigo-50 to-cyan-50 p-5 shadow-[var(--shadow-card-md)] dark:border-indigo-700 dark:from-indigo-950/50 dark:via-indigo-950/50 dark:to-cyan-950/40">
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="Dismiss briefing"
        className="absolute right-2 top-2 rounded-md p-1 text-soft hover:bg-surface-2 hover:text-ink"
      >
        <X size={14} />
      </button>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white">
          <Sparkles size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
            Role briefing
          </p>
          <h3 className="mt-1 text-base font-semibold text-ink">
            You&apos;re sitting <span className="font-mono">{abbreviation}</span> — {title}
            {isSMF && (
              <span className="ml-2 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] text-white">
                SMF
              </span>
            )}
            {isDeputy && (
              <span className="ml-2 rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] text-white">
                Deputy
              </span>
            )}
          </h3>
          {responsibility && (
            <p className="mt-2 text-sm text-muted">{responsibility}</p>
          )}
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Your first 10 minutes
            </p>
            <ul className="mt-1.5 space-y-1.5 text-sm text-ink">
              {expectations.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

