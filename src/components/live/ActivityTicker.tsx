"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

type Entry = {
  id: string;
  at: Date;
  kind: string;
  text: string;
};

type Props = {
  entries: Entry[];
};

/**
 * Compact rolling ticker showing the last 6 actions across the team — the
 * "Stripe-recent-activity" pattern. Re-cycles every 4 seconds so it never
 * feels static. Stays empty (and hides) when there's been no activity.
 */
export default function ActivityTicker({ entries }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (entries.length === 0) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % entries.length);
    }, 4000);
    return () => clearInterval(t);
  }, [entries.length]);

  if (entries.length === 0) return null;

  const current = entries[idx % entries.length];
  const relative = relativeTime(current.at);

  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-surface-1 px-3 py-1.5 text-xs shadow-[var(--shadow-card)]">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <Activity size={12} className="shrink-0 text-soft" aria-hidden />
      <div key={current.id} className="min-w-0 flex-1 animate-[fadeUp_0.4s_ease-out]">
        <span className="text-muted">{relative}</span>
        <span className="mx-1.5 text-soft">·</span>
        <span className="text-ink">{current.text}</span>
      </div>
    </div>
  );
}

function relativeTime(d: Date): string {
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 30) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
