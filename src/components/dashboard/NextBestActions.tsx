"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertOctagon,
  ArrowRight,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Server,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NextBestAction } from "@/lib/dashboard";

const ICON_FOR: Record<NextBestAction["iconKey"], LucideIcon> = {
  shield: ShieldAlert,
  flame: Flame,
  calendar: CalendarClock,
  server: Server,
  users: Users,
  boxes: Boxes,
  alert: AlertOctagon,
  sparkles: Sparkles,
};

const PRIORITY_RING: Record<NextBestAction["priority"], string> = {
  critical: "border-rose-300 dark:border-rose-700",
  warn: "border-amber-300 dark:border-amber-700",
  info: "border-indigo-300 dark:border-indigo-700",
};

const PRIORITY_CHIP: Record<NextBestAction["priority"], string> = {
  critical: "bg-rose-600 text-white",
  warn: "bg-amber-600 text-white",
  info: "bg-indigo-600 text-white",
};

function fmtEffort(min: number): string {
  if (min < 60) return `${min}m`;
  if (min < 60 * 24) return `${Math.round(min / 60)}h`;
  return `${Math.round(min / (60 * 24))}d`;
}

/**
 * "Next best actions" surface at the top of the dashboard. Shows the
 * top 3 cards by default with a "Show all (N)" expander that reveals
 * the rest. Each card carries priority + effort + ownerHint chips so
 * the user can pick the right one to grab without opening it.
 */
export default function NextBestActions({ actions }: { actions: NextBestAction[] }) {
  const [expanded, setExpanded] = useState(false);

  if (actions.length === 0) {
    return (
      <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
        <header className="flex items-center gap-2">
          <CheckCircle2 size={14} />
          <h2 className="font-semibold">Nothing demands you right now</h2>
        </header>
        <p className="mt-1 text-xs">Good week to plan a tabletop.</p>
      </section>
    );
  }

  const visible = expanded ? actions : actions.slice(0, 3);
  const hidden = actions.length - 3;
  const totalEffort = visible.reduce((sum, a) => sum + a.effortMin, 0);

  return (
    <section>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-ink">Next best actions</h2>
          <span className="text-[11px] text-soft">
            {actions.length} ranked · ≈ {fmtEffort(totalEffort)} to clear the top {visible.length}
          </span>
        </div>
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((s) => !s)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-indigo-600 hover:bg-surface-2 dark:text-indigo-300"
          >
            {expanded ? (
              <>
                <ChevronUp size={11} />
                Show top 3 only
              </>
            ) : (
              <>
                <ChevronDown size={11} />
                Show all ({hidden} more)
              </>
            )}
          </button>
        )}
      </header>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((a) => {
          const Icon = ICON_FOR[a.iconKey];
          return (
            <li key={a.id}>
              <Link
                href={a.cta.href}
                className={`group flex h-full flex-col gap-2 rounded-xl border bg-surface-1 p-3 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${PRIORITY_RING[a.priority]}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${PRIORITY_CHIP[a.priority]}`}
                  >
                    <Icon size={13} />
                  </span>
                  <h3 className="text-sm font-semibold text-ink">{a.title}</h3>
                </div>
                <p className="text-xs text-muted">{a.body}</p>
                <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-semibold uppercase tracking-wider ${PRIORITY_CHIP[a.priority]}`}
                  >
                    {a.priority}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-2 px-1.5 py-0.5 text-muted">
                    <Clock size={9} />
                    {fmtEffort(a.effortMin)}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-2 px-1.5 py-0.5 text-muted">
                    <User size={9} />
                    {a.ownerHint}
                  </span>
                </div>
                <footer className="mt-auto flex items-center justify-end border-t border-line pt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                    {a.cta.label}
                    <ArrowRight size={11} />
                  </span>
                </footer>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
