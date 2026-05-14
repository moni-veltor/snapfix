"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { heartbeatAction } from "@/app/actions/participant";
import type { PresenceMember } from "@/lib/live";

type Props = {
  exerciseId: string;
  members: PresenceMember[];
  status: string;
  /** Heartbeat (and auto-refresh) interval. Only fires while exercise is IN_PROGRESS. */
  pollMs?: number;
};

function initials(name: string | null, email: string): string {
  const base = (name ?? email).trim();
  const parts = base.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (base[0] ?? "?").toUpperCase();
}

function relativeTime(d: Date | null): string {
  if (!d) return "never";
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 30) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function LivePresenceBar({ exerciseId, members, status, pollMs = 3000 }: Props) {
  const router = useRouter();
  const [, force] = useState(0);

  useEffect(() => {
    if (status !== "IN_PROGRESS") return;
    let cancelled = false;
    const beat = async () => {
      try {
        await heartbeatAction(exerciseId);
        if (!cancelled) router.refresh();
      } catch {
        // swallow — heartbeat is best-effort
      }
    };
    void beat();
    const id = setInterval(beat, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [exerciseId, status, pollMs, router]);

  // Re-render every 10s so relative timestamps tick over.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const online = members.filter((m) => m.online);
  return (
    <div className="rounded-md border border-line bg-surface-1 p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          In the room · {online.length}/{members.length}
        </div>
        {status === "IN_PROGRESS" && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            live
          </span>
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {members.map((m) => (
          <li
            key={m.participantId}
            title={`${m.name ?? m.email} · ${m.roleTitle} · seen ${relativeTime(m.lastSeenAt)}`}
            className="flex items-center gap-2 rounded-full border border-line bg-surface-0 py-1 pl-1 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800"
          >
            <span
              className={`relative flex h-7 w-7 items-center justify-center rounded-full font-semibold text-white ${
                m.online ? "bg-indigo-600" : "bg-slate-400"
              }`}
            >
              {initials(m.name, m.email)}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                  m.online ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-medium text-slate-800 dark:text-slate-100">{m.name ?? m.email}</span>
              <span className="text-[10px] text-muted dark:text-soft">
                {m.roleTitle}
                {m.exerciseRole === "FACILITATOR" && " · facilitator"}
                {!m.online && ` · ${relativeTime(m.lastSeenAt)}`}
              </span>
              {m.onCallStatus && (
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  📞 {m.onCallStatus}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
