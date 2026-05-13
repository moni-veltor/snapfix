"use client";

import { useEffect, useState } from "react";
import Pill from "./Pill";

type Props = {
  dueAt: Date;
  sentAt?: Date | null;
  waived?: boolean;
};

/**
 * Live countdown pill. Re-renders every second to keep the value fresh.
 * Three states: sent (ok), waived (neutral), counting (warn/critical based on
 * remaining time), breached (critical solid).
 */
export default function Countdown({ dueAt, sentAt, waived }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (sentAt) {
    return (
      <Pill variant="ok" tone="solid">
        Sent {sentAt.toISOString().slice(11, 16)}
      </Pill>
    );
  }
  if (waived) {
    return (
      <Pill variant="neutral" tone="solid">
        Waived
      </Pill>
    );
  }

  const remaining = dueAt.getTime() - now;
  if (remaining < 0) {
    return (
      <Pill variant="critical" tone="solid">
        BREACHED · overdue {formatDuration(-remaining)}
      </Pill>
    );
  }

  const isAlmostDue = remaining < 30 * 60 * 1000;
  return (
    <Pill variant={isAlmostDue ? "warn" : "mono"} tone="solid">
      {formatDuration(remaining)}
    </Pill>
  );
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
