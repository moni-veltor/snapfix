"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Award,
  Boxes,
  Building2,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Database,
  FileText,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import FeaturedCard from "@/components/ui/FeaturedCard";
import type { DashboardRecap, RecapItem, RecapTone } from "@/lib/dashboard-recap";

export type ActivityItem = {
  id: string;
  kind: "sitrep" | "decision" | "clone";
  title: string;
  sub: string;
  href: string;
  at: Date;
};

const ICON_MAP: Record<RecapItem["icon"], LucideIcon> = {
  ibs: Building2,
  exercise: Flame,
  regulator: ShieldAlert,
  sitrep: FileText,
  decision: CheckSquare,
  trophy: Trophy,
  dr: Zap,
  runbook: Workflow,
  action: CheckCircle2,
  vendor: Boxes,
  sparkles: Sparkles,
};

const TONE_CLS: Record<RecapTone, { dot: string; pill: string }> = {
  critical: {
    dot: "bg-rose-500",
    pill: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  },
  warn: {
    dot: "bg-amber-500",
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  },
  ok: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  info: {
    dot: "bg-indigo-500",
    pill: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  },
};

/**
 * "Since you were last here" recap. Replaces the static HeadlineBanner so the
 * dashboard leads with what's *different* this visit, not the same picture
 * the user saw three days ago.
 *
 * Three render modes:
 *  - First-time visitor → welcome state (no `since` timestamp yet)
 *  - Returning + quiet week → light "programme held steady" line
 *  - Returning + things happened → list of items with deep links
 */
export default function RecapCard({
  recap,
  userName,
  recentActivity = [],
}: {
  recap: DashboardRecap;
  userName: string;
  /** Optional last-7d feed of sitreps / decisions / scenario clones —
   *  rendered as an expandable section below the recap items. */
  recentActivity?: ActivityItem[];
}) {
  const [activityOpen, setActivityOpen] = useState(false);
  // ── First-time visitor ────────────────────────────────────────────────
  if (recap.since === null) {
    return (
      <FeaturedCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-indigo-700 dark:text-indigo-200">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft">
                Welcome
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-ink">
                Hello {userName.split(" ")[0]}
              </h2>
              <p className="mt-0.5 text-[12px] text-soft">
                This is where your weekly recap will appear — what changed since you
                were last here.
              </p>
            </div>
          </div>
        </div>
      </FeaturedCard>
    );
  }

  // ── Returning + quiet week ────────────────────────────────────────────
  if (recap.isQuiet) {
    return (
      <FeaturedCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 size={18} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft">
                Since {recap.sinceLabel}
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-ink">
                Quiet stretch — programme held steady
              </h2>
              <p className="mt-0.5 text-[12px] text-soft">
                Nothing material changed in the {recap.daysSince ?? 0}-day window. A
                good moment to schedule a tabletop.
              </p>
            </div>
          </div>
          <Link
            href="/exercises/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Plan an exercise
            <ArrowRight size={13} />
          </Link>
        </div>
      </FeaturedCard>
    );
  }

  // ── Returning + things happened ───────────────────────────────────────
  const top = recap.items[0];
  return (
    <FeaturedCard>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity
            size={14}
            className="text-indigo-600 dark:text-indigo-300"
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft">
            Since {recap.sinceLabel}
          </p>
          {top && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TONE_CLS[top.tone].pill}`}
            >
              {top.tone === "critical"
                ? "Needs attention"
                : top.tone === "warn"
                  ? "Worth a look"
                  : "Programme moved"}
            </span>
          )}
        </div>
        <Link
          href="/audit"
          className="text-[11px] font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300"
        >
          Full audit log →
        </Link>
      </header>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {recap.items.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? Award;
          const tone = TONE_CLS[item.tone];
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex h-full items-center gap-2 rounded-md border border-line bg-surface-1 px-3 py-2 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card)]"
              >
                <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-md ${tone.pill}`}>
                  <Icon size={13} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">
                  {item.text}
                </span>
                <ArrowRight
                  size={11}
                  className="flex-none text-soft transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          );
        })}
      </ul>

      {recentActivity.length > 0 && (
        <div className="mt-3 border-t border-line pt-2">
          <button
            type="button"
            onClick={() => setActivityOpen((s) => !s)}
            aria-expanded={activityOpen}
            className="flex w-full items-center justify-between text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-300"
          >
            <span>
              {activityOpen ? "Hide" : "Show"} last 7 days activity ({recentActivity.length})
            </span>
            {activityOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {activityOpen && (
            <ul className="mt-2 space-y-1">
              {recentActivity.map((f) => (
                <li key={f.id}>
                  <Link
                    href={f.href}
                    className="flex items-start gap-2 rounded-md border border-line bg-surface-0 px-2.5 py-1.5 text-xs hover:bg-surface-2"
                  >
                    <FeedIcon kind={f.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-ink">{f.title}</p>
                      <p className="truncate text-[10px] text-soft">{f.sub}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-soft">{timeAgo(f.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </FeaturedCard>
  );
}

function FeedIcon({ kind }: { kind: ActivityItem["kind"] }) {
  if (kind === "sitrep")
    return <FileText size={11} className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-300" />;
  if (kind === "decision")
    return (
      <ShieldCheck size={11} className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-300" />
    );
  return <Database size={11} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-300" />;
}

function timeAgo(d: Date): string {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
