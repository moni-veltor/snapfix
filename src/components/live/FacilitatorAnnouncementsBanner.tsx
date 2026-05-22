"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Clock4,
  Megaphone,
  PackageX,
  Radio,
  X,
} from "lucide-react";
import { useChangeDetector, type ChangeEvent } from "@/lib/use-change-detector";

export type Announcement = {
  id: string;
  kind: "BROADCAST" | "BULK_RELEASE" | "RECALL" | "SCRUB";
  message: string;
  authorName: string | null;
  dDayTime: string | null;
  pinned: boolean;
  createdAt: Date;
};

const ICON = {
  BROADCAST: Megaphone,
  BULK_RELEASE: Radio,
  RECALL: PackageX,
  SCRUB: Clock4,
} as const;

const TONE = {
  BROADCAST: "bg-indigo-50 border-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-800",
  BULK_RELEASE: "bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800",
  RECALL: "bg-rose-50 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800",
  SCRUB: "bg-cyan-50 border-cyan-300 dark:bg-cyan-950/30 dark:border-cyan-800",
} as const;

const ICON_TONE = {
  BROADCAST: "text-indigo-700 dark:text-indigo-300",
  BULK_RELEASE: "text-amber-700 dark:text-amber-300",
  RECALL: "text-rose-700 dark:text-rose-300",
  SCRUB: "text-cyan-700 dark:text-cyan-300",
} as const;

/**
 * Facilitator-action surface for the participant view. Each row arrives
 * via a regular page revalidation (the 10s LivePoller); `useChangeDetector`
 * fires a sonner toast for new arrivals so the participant can't miss
 * them, and BROADCAST rows pin as a top-of-page sticky banner until the
 * participant dismisses them locally (localStorage per exercise+id).
 *
 * The non-pinned kinds (BULK_RELEASE / RECALL / SCRUB) auto-fade from
 * the banner stack 90 seconds after creation — they're "for the record"
 * causality cues, not blocking instructions.
 */
export default function FacilitatorAnnouncementsBanner({
  exerciseId,
  announcements,
}: {
  exerciseId: string;
  announcements: Announcement[];
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const stored = readDismissed(exerciseId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored.size > 0) setDismissed(stored);
  }, [exerciseId]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const onChange = useCallback((event: ChangeEvent<Announcement>) => {
    if (event.kind !== "added") return;
    const a = event.item;
    const opts = a.authorName
      ? { description: `${a.authorName}${a.dDayTime ? ` · D-Day ${a.dDayTime}` : ""}` }
      : a.dDayTime
        ? { description: `D-Day ${a.dDayTime}` }
        : undefined;
    switch (a.kind) {
      case "BROADCAST":
        toast.message(`📢 ${a.message}`, opts);
        return;
      case "BULK_RELEASE":
        toast.info(a.message, opts);
        return;
      case "RECALL":
        toast.warning(a.message, opts);
        return;
      case "SCRUB":
        toast.info(a.message, opts);
        return;
    }
  }, []);
  useChangeDetector(announcements, signatureOf, onChange);

  const visible = announcements.filter((a) => {
    if (dismissed.has(a.id)) return false;
    if (a.pinned) return true;
    return now - a.createdAt.getTime() < 90_000;
  });

  if (visible.length === 0) return null;

  function dismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    writeDismissed(exerciseId, next);
  }

  return (
    <section className="space-y-1.5" aria-label="Facilitator announcements">
      {visible.map((a) => {
        const Icon = ICON[a.kind];
        return (
          <div
            key={a.id}
            className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${TONE[a.kind]}`}
          >
            <Icon size={14} className={`mt-0.5 shrink-0 ${ICON_TONE[a.kind]}`} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{a.message}</p>
              <p className="mt-0.5 text-[11px] text-soft">
                {a.authorName ? `${a.authorName} · ` : ""}
                {a.dDayTime ? `D-Day ${a.dDayTime} · ` : ""}
                {a.kind === "BROADCAST" ? "Pinned" : "Auto-fade"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(a.id)}
              className="shrink-0 rounded-md p-1 text-soft hover:bg-surface-1 hover:text-ink"
              title="Dismiss"
              aria-label="Dismiss announcement"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </section>
  );
}

function signatureOf(a: Announcement): string {
  return `${a.kind}::${a.id}`;
}

const KEY = (exerciseId: string) => `snapfix.facilitator-dismiss.${exerciseId}`;

function readDismissed(exerciseId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY(exerciseId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function writeDismissed(exerciseId: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY(exerciseId), JSON.stringify(Array.from(set)));
  } catch {
    /* quota — best-effort */
  }
}
