"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { currentDDay } from "@/lib/dday";

type Props = {
  anchor: string | null;
  speedMultiplier: number;
  status: string;
  pollMs?: number;
};

/**
 * Ticks the D-Day clock locally every second and refreshes the server-rendered
 * page periodically so that newly-due events/injects appear without manual reload.
 */
export default function DDayClockTicker({ anchor, speedMultiplier, status, pollMs = 5000 }: Props) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (status !== "IN_PROGRESS") return;
    const poll = setInterval(() => router.refresh(), pollMs);
    return () => clearInterval(poll);
  }, [status, pollMs, router]);

  const clock = currentDDay(anchor ? new Date(anchor) : null, speedMultiplier, now);
  return (
    <div className="rounded-md bg-slate-900 px-3 py-2 font-mono text-lg text-white">
      D-Day {clock.hhmm}
      {speedMultiplier !== 1 && (
        <span className="ml-2 text-xs text-slate-400">×{speedMultiplier}</span>
      )}
    </div>
  );
}
