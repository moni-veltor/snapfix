"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  Flame,
  PauseCircle,
  Pencil,
  Users,
} from "lucide-react";

type ExerciseStatus =
  | "DRAFT"
  | "PLANNING"
  | "READY"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED";

type ExerciseRow = {
  id: string;
  title: string;
  status: ExerciseStatus | string;
  plannedDate: Date | null;
  scenario: { title: string };
  facilitator: { name: string | null; email: string } | null;
  _count: { participants: number; teams: number };
};

type Filter = "all" | "live" | "upcoming" | "completed" | "draft";

const FILTERS: { id: Filter; label: string; statuses: string[] }[] = [
  { id: "all", label: "All", statuses: [] },
  { id: "live", label: "Live now", statuses: ["IN_PROGRESS", "PAUSED"] },
  { id: "upcoming", label: "Upcoming", statuses: ["PLANNING", "READY"] },
  { id: "completed", label: "Completed", statuses: ["COMPLETED", "ARCHIVED"] },
  { id: "draft", label: "Draft", statuses: ["DRAFT"] },
];

const STATUS_TONE: Record<string, { chip: string; ring: string; bar: string }> = {
  IN_PROGRESS: {
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    ring: "border-rose-300 dark:border-rose-700/60",
    bar: "bg-rose-500",
  },
  PAUSED: {
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    ring: "border-amber-300 dark:border-amber-700/60",
    bar: "bg-amber-500",
  },
  PLANNING: {
    chip: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
    ring: "border-indigo-300 dark:border-indigo-700/60",
    bar: "bg-indigo-500",
  },
  READY: {
    chip: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
    ring: "border-cyan-300 dark:border-cyan-700/60",
    bar: "bg-cyan-500",
  },
  COMPLETED: {
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    ring: "border-emerald-300 dark:border-emerald-700/60",
    bar: "bg-emerald-500",
  },
  ARCHIVED: {
    chip: "bg-surface-2 text-muted",
    ring: "border-line",
    bar: "bg-line-strong",
  },
  DRAFT: {
    chip: "bg-surface-2 text-muted",
    ring: "border-line",
    bar: "bg-line-strong",
  },
};

function StatusIcon({ status, size = 14 }: { status: string; size?: number }) {
  if (status === "IN_PROGRESS") return <Flame size={size} />;
  if (status === "PAUSED") return <PauseCircle size={size} />;
  if (status === "COMPLETED" || status === "ARCHIVED") return <CheckCircle2 size={size} />;
  if (status === "DRAFT") return <Pencil size={size} />;
  return <CalendarPlus size={size} />;
}

export default function ExerciseGrid({ exercises }: { exercises: ExerciseRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: exercises.length,
      live: 0,
      upcoming: 0,
      completed: 0,
      draft: 0,
    };
    for (const e of exercises) {
      for (const f of FILTERS) {
        if (f.id === "all") continue;
        if (f.statuses.includes(e.status)) c[f.id]++;
      }
    }
    return c;
  }, [exercises]);

  const q = query.trim().toLowerCase();
  const filtered = exercises.filter((e) => {
    if (q && !e.title.toLowerCase().includes(q) && !e.scenario.title.toLowerCase().includes(q))
      return false;
    if (filter === "all") return true;
    const f = FILTERS.find((x) => x.id === filter);
    return !!f && f.statuses.includes(e.status);
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by exercise or scenario title…"
          className="min-w-[220px] flex-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <div role="tablist" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const hot = f.id === "live" && counts.live > 0;
            return (
              <button
                key={f.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? hot
                      ? "bg-rose-600 text-white"
                      : "bg-slate-900 text-white dark:bg-indigo-500"
                    : hot
                      ? "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-200"
                      : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {hot && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                  </span>
                )}
                <span>{f.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    active ? "bg-white/30 dark:bg-black/30" : "bg-surface-2 text-soft"
                  }`}
                >
                  {counts[f.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
          No exercises match this view.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => (
            <li key={e.id}>
              <ExerciseCard exercise={e} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ExerciseCard({ exercise }: { exercise: ExerciseRow }) {
  const tone = STATUS_TONE[exercise.status] ?? STATUS_TONE.DRAFT;
  return (
    <Link
      href={`/exercises/${exercise.id}`}
      className={`group block h-full rounded-xl border bg-surface-1 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${tone.ring}`}
    >
      <div className={`h-1 rounded-t-xl ${tone.bar}`} />
      <article className="flex h-full flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tone.chip}`}
            >
              <StatusIcon status={exercise.status} />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-ink">{exercise.title}</h3>
              <p className="truncate text-[11px] text-muted">{exercise.scenario.title}</p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tone.chip}`}
          >
            {exercise.status === "IN_PROGRESS" && (
              <span className="mr-1 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
            )}
            {exercise.status.replace("_", " ")}
          </span>
        </header>

        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          {exercise.plannedDate && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-muted">
              {exercise.plannedDate.toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-muted">
            <Users size={9} />
            {exercise._count.participants}
          </span>
          {exercise._count.teams > 0 && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-muted">
              {exercise._count.teams} team{exercise._count.teams === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <footer className="mt-auto border-t border-line pt-3 text-[11px] text-soft">
          Facilitator:{" "}
          <span className="text-muted">
            {exercise.facilitator?.name ?? exercise.facilitator?.email ?? "—"}
          </span>
        </footer>
      </article>
    </Link>
  );
}
