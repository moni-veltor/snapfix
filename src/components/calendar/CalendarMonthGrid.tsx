"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  List as ListIcon,
  CalendarDays,
} from "lucide-react";

type ExerciseDot = {
  id: string;
  title: string;
  scenarioTitle: string;
  facilitator: string | null;
  status: string;
  dateISO: string; // ISO string; component re-parses
};

type Props = {
  exercises: ExerciseDot[];
  initialMonth?: string; // YYYY-MM; defaults to current month
};

const STATUS_TONE: Record<string, string> = {
  PLANNING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  READY: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  IN_PROGRESS: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  PAUSED: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  CANCELLED: "bg-surface-2 text-muted",
};

/**
 * Month-grid calendar view. Each cell shows the day number plus up to
 * three exercise dots; overflow surfaces a "+N more" pill. A list view
 * remains available via a toggle for users who prefer chronological
 * scanning over spatial layout.
 */
export default function CalendarMonthGrid({ exercises, initialMonth }: Props) {
  const today = new Date();
  const todayKey = isoDayKey(today);

  const initialYM = initialMonth ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [ym, setYm] = useState(initialYM);
  const [view, setView] = useState<"grid" | "list">("grid");

  const [year, monthOneIdx] = ym.split("-").map(Number);
  const monthIdx = monthOneIdx - 1; // JS months are 0-indexed

  const monthLabel = new Date(year, monthIdx, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    const d = new Date(year, monthIdx + delta, 1);
    setYm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function goToToday() {
    const now = new Date();
    setYm(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }

  /** Build a Map<dayKey, ExerciseDot[]> for fast cell lookup. */
  const byDay = useMemo(() => {
    const map = new Map<string, ExerciseDot[]>();
    for (const ex of exercises) {
      const d = new Date(ex.dateISO);
      const key = isoDayKey(d);
      const arr = map.get(key) ?? [];
      arr.push(ex);
      map.set(key, arr);
    }
    return map;
  }, [exercises]);

  /** Compute 6-week grid (Monday-first) covering the displayed month. */
  const cells = useMemo(() => {
    const first = new Date(year, monthIdx, 1);
    // Monday-first offset: getDay() is 0=Sun..6=Sat. We want 0=Mon..6=Sun.
    const dayOfWeekMonFirst = (first.getDay() + 6) % 7;
    const gridStart = new Date(year, monthIdx, 1 - dayOfWeekMonFirst);
    const out: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      out.push({ date: d, inMonth: d.getMonth() === monthIdx });
    }
    return out;
  }, [year, monthIdx]);

  /** Exercises in the currently displayed month, chronologically. */
  const monthList = useMemo(() => {
    return exercises
      .filter((ex) => {
        const d = new Date(ex.dateISO);
        return d.getFullYear() === year && d.getMonth() === monthIdx;
      })
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  }, [exercises, year, monthIdx]);

  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-1 p-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Previous month"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Next month"
          >
            <ChevronRight size={14} />
          </button>
          <h2 className="ml-2 text-sm font-semibold text-ink">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-surface-2 p-0.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all ${
              view === "grid"
                ? "bg-surface-1 text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            <CalendarDays size={11} />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all ${
              view === "list"
                ? "bg-surface-1 text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            <ListIcon size={11} />
            List
          </button>
        </div>
      </header>

      {view === "grid" ? (
        <div className="overflow-hidden rounded-md border border-line bg-surface-1">
          <div className="grid grid-cols-7 border-b border-line bg-surface-0">
            {weekdayLabels.map((w) => (
              <div
                key={w}
                className="p-2 text-center text-[10px] font-semibold uppercase tracking-wider text-soft"
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map(({ date, inMonth }) => {
              const key = isoDayKey(date);
              const dayExercises = byDay.get(key) ?? [];
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={`min-h-[88px] border-b border-r border-line p-1.5 last:border-r-0 ${
                    inMonth ? "bg-surface-1" : "bg-surface-0"
                  } ${isToday ? "ring-1 ring-inset ring-indigo-400 dark:ring-indigo-700" : ""}`}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                      isToday
                        ? "bg-indigo-600 text-white dark:bg-indigo-500"
                        : inMonth
                          ? "text-ink"
                          : "text-soft"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayExercises.slice(0, 3).map((ex) => (
                      <Link
                        key={ex.id}
                        href={`/exercises/${ex.id}`}
                        className={`block truncate rounded-sm px-1 py-0.5 text-[10px] font-medium hover:opacity-80 ${STATUS_TONE[ex.status] ?? "bg-surface-2 text-muted"}`}
                        title={`${ex.title} · ${ex.status}`}
                      >
                        {ex.title}
                      </Link>
                    ))}
                    {dayExercises.length > 3 && (
                      <span className="block px-1 text-[10px] text-soft">
                        +{dayExercises.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {monthList.length === 0 ? (
            <p className="rounded-md border border-dashed border-line bg-surface-1 p-6 text-center text-sm text-muted">
              No exercises scheduled in {monthLabel}.
            </p>
          ) : (
            monthList.map((ex) => {
              const d = new Date(ex.dateISO);
              return (
                <Link
                  key={ex.id}
                  href={`/exercises/${ex.id}`}
                  className="flex items-center gap-3 rounded-md border border-line bg-surface-1 p-3 text-sm transition-all hover:-translate-y-px hover:border-line-strong hover:bg-surface-2"
                >
                  <div className="w-16 shrink-0 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-soft">
                      {d.toLocaleDateString("en-GB", { weekday: "short" })}
                    </div>
                    <div className="text-xl font-semibold text-ink">{d.getDate()}</div>
                    <div className="text-[10px] text-soft">
                      {d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{ex.title}</div>
                    <div className="truncate text-xs text-muted">
                      {ex.scenarioTitle}
                      {ex.facilitator && ` · ${ex.facilitator}`}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_TONE[ex.status] ?? "bg-surface-2 text-muted"}`}
                  >
                    {ex.status}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}

function isoDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
