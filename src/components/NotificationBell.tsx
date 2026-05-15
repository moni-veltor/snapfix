"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Flame,
  ListChecks,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { Notification, NotificationKind } from "@/lib/notifications";

type Props = {
  notifications: {
    id: string;
    kind: NotificationKind;
    title: string;
    body: string;
    href: string;
    at: string; // ISO
    weight?: number;
  }[];
};

const STORAGE_KEY = "snapfix-notifications-seen-at";

const ICON: Record<NotificationKind, LucideIcon> = {
  "action-item-overdue": Flame,
  "action-item-due-soon": CalendarClock,
  "exercise-live": ListChecks,
  "exercise-completed": CheckCircle2,
  "pir-overdue": ShieldAlert,
  "audit-event": Bell,
};

const TONE: Record<NotificationKind, string> = {
  "action-item-overdue": "text-rose-600 dark:text-rose-300",
  "action-item-due-soon": "text-amber-600 dark:text-amber-300",
  "exercise-live": "text-indigo-600 dark:text-indigo-300",
  "exercise-completed": "text-emerald-600 dark:text-emerald-300",
  "pir-overdue": "text-rose-600 dark:text-rose-300",
  "audit-event": "text-muted",
};

export default function NotificationBell({ notifications }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Track last-seen-at timestamp in localStorage so unread count is
  // device-local without needing a backing table.
  const [seenAt, setSeenAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? parseInt(raw, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = notifications.filter((n) => new Date(n.at).getTime() > seenAt).length;
  const highImpactUnread = notifications.filter(
    (n) => new Date(n.at).getTime() > seenAt && (n.weight ?? 1) > 1,
  ).length;

  const markSeen = () => {
    const now = Date.now();
    setSeenAt(now);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(now));
    } catch {
      // ignore
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markSeen();
        }}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-soft hover:bg-surface-2 hover:text-ink"
      >
        <Bell size={15} />
        {unread > 0 && (
          <span
            className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ring-2 ring-surface-1 ${
              highImpactUnread > 0 ? "bg-rose-600" : "bg-indigo-600"
            }`}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        // Anchor to the bell's LEFT edge so the dropdown opens out into
        // the main content area instead of clipping past the sidebar.
        <div className="absolute left-0 top-full z-50 mt-1.5 w-80 overflow-hidden rounded-xl border border-line bg-surface-elev shadow-[var(--shadow-card-lg)]">
          <header className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-xs font-semibold text-ink">Notifications</span>
            <span className="text-[10px] text-soft">
              {notifications.length === 0 ? "All clear" : `${notifications.length} recent`}
            </span>
          </header>
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-line">
              {notifications.map((n) => {
                const Icon = ICON[n.kind] ?? Bell;
                const tone = TONE[n.kind] ?? "text-muted";
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-surface-2"
                    >
                      <Icon size={13} className={`mt-0.5 shrink-0 ${tone}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-ink">
                          {n.title}
                        </p>
                        <p className="truncate text-[10px] text-muted">{n.body}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-soft">
                        {timeAgo(new Date(n.at))}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function timeAgo(d: Date): string {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// keep the type-only Notification import linkable
type _Keep = Notification;
const _k: _Keep | null = null;
void _k;
