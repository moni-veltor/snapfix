"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { updateActionItemStatusAction } from "@/app/actions/action-items";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Status = "OPEN" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "WONT_FIX";

type ActionItemRow = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority | string;
  status: Status | string;
  dueAt: Date | null;
  ownerText: string | null;
  ownerUser: { name: string | null; email: string } | null;
  exercise: { id: string; title: string };
};

type Filter = "open" | "overdue" | "in-progress" | "blocked" | "closed" | "all";

const FILTERS: { id: Filter; label: string; icon: LucideIcon; statuses: string[] }[] = [
  { id: "open", label: "Open", icon: CircleDashed, statuses: ["OPEN"] },
  { id: "in-progress", label: "In progress", icon: Clock, statuses: ["IN_PROGRESS"] },
  { id: "blocked", label: "Blocked", icon: AlertTriangle, statuses: ["BLOCKED"] },
  { id: "overdue", label: "Overdue", icon: Flame, statuses: [] }, // computed
  { id: "closed", label: "Closed", icon: CheckCircle2, statuses: ["DONE", "WONT_FIX"] },
  { id: "all", label: "All", icon: CalendarClock, statuses: [] },
];

const PRIORITY_TONE: Record<string, { chip: string; bar: string }> = {
  CRITICAL: {
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    bar: "bg-rose-500",
  },
  HIGH: {
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    bar: "bg-amber-500",
  },
  MEDIUM: {
    chip: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
    bar: "bg-cyan-500",
  },
  LOW: {
    chip: "bg-surface-2 text-muted",
    bar: "bg-line-strong",
  },
};

const STATUS_TONE: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  IN_PROGRESS: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  BLOCKED: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  DONE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  WONT_FIX: "bg-surface-2 text-muted",
};

export default function ActionItemBoard({ items }: { items: ActionItemRow[] }) {
  const [filter, setFilter] = useState<Filter>("open");
  const [query, setQuery] = useState("");
  // Stable "now" — captured once at mount, not on every render.
  const [now] = useState(() => Date.now());
  const isOverdue = (i: ActionItemRow) =>
    !!i.dueAt &&
    i.dueAt.getTime() < now &&
    i.status !== "DONE" &&
    i.status !== "WONT_FIX";

  const counts = useMemo(() => {
    const out: Record<Filter, number> = {
      open: 0,
      "in-progress": 0,
      blocked: 0,
      overdue: 0,
      closed: 0,
      all: items.length,
    };
    for (const i of items) {
      if (i.status === "OPEN") out.open++;
      if (i.status === "IN_PROGRESS") out["in-progress"]++;
      if (i.status === "BLOCKED") out.blocked++;
      if (i.status === "DONE" || i.status === "WONT_FIX") out.closed++;
      if (isOverdue(i)) out.overdue++;
    }
    return out;
  }, [items, now]);

  const q = query.trim().toLowerCase();
  const filtered = items.filter((i) => {
    if (
      q &&
      !i.title.toLowerCase().includes(q) &&
      !(i.description ?? "").toLowerCase().includes(q) &&
      !i.exercise.title.toLowerCase().includes(q)
    )
      return false;
    if (filter === "all") return true;
    if (filter === "overdue") return isOverdue(i);
    const f = FILTERS.find((x) => x.id === filter);
    return !!f && f.statuses.includes(i.status);
  });

  // Group by priority within the filtered view
  const grouped = useMemo(() => {
    const out: Record<Priority, ActionItemRow[]> = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };
    for (const i of filtered) {
      const p = (i.priority in out ? i.priority : "MEDIUM") as Priority;
      out[p].push(i);
    }
    return out;
  }, [filtered]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, description or exercise…"
          className="min-w-[220px] flex-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      <div role="tablist" className="flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const danger = f.id === "overdue" && counts.overdue > 0;
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? danger
                    ? "bg-rose-600 text-white"
                    : "bg-slate-900 text-white dark:bg-indigo-500"
                  : danger
                    ? "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-200"
                    : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <Icon size={11} />
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

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
          {filter === "open" || filter === "in-progress"
            ? "Nothing on the table here. Quiet inbox."
            : "Nothing matches this view."}
        </div>
      ) : (
        (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => {
          const arr = grouped[p];
          if (arr.length === 0) return null;
          const tone = PRIORITY_TONE[p];
          return (
            <section key={p}>
              <header className="mb-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.chip}`}
                >
                  {p}
                </span>
                <span className="text-[11px] text-soft">
                  {arr.length} item{arr.length === 1 ? "" : "s"}
                </span>
              </header>
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {arr.map((i) => (
                  <li key={i.id}>
                    <ActionCard item={i} overdue={isOverdue(i)} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </section>
  );
}

function ActionCard({ item, overdue }: { item: ActionItemRow; overdue: boolean }) {
  const tone = PRIORITY_TONE[item.priority] ?? PRIORITY_TONE.MEDIUM;
  return (
    <article
      className={`group flex h-full flex-col rounded-xl border bg-surface-1 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${
        overdue ? "border-rose-300 dark:border-rose-700" : "border-line"
      }`}
    >
      <div className={`h-1 rounded-t-xl ${tone.bar}`} />
      <div className="flex flex-col gap-2 p-3 text-sm">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-medium text-ink">{item.title}</h3>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${STATUS_TONE[item.status] ?? STATUS_TONE.OPEN}`}
          >
            {item.status.replace("_", " ")}
          </span>
        </div>

        {item.description && (
          <p className="line-clamp-2 text-[11px] text-muted">{item.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-1 text-[10px] text-soft">
          <Link
            href={`/exercises/${item.exercise.id}`}
            className="rounded-full bg-surface-2 px-1.5 py-0.5 text-muted hover:bg-surface-elev hover:text-ink"
          >
            {item.exercise.title}
          </Link>
          {(item.ownerUser || item.ownerText) && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-muted">
              {item.ownerUser?.name ?? item.ownerUser?.email ?? item.ownerText}
            </span>
          )}
          {item.dueAt && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ${
                overdue
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                  : "bg-surface-2 text-muted"
              }`}
            >
              {overdue ? <Flame size={9} /> : <CalendarClock size={9} />}
              {item.dueAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>

        <footer className="mt-1 border-t border-line pt-2">
          <form
            action={updateActionItemStatusAction}
            className="flex items-center gap-1.5"
          >
            <input type="hidden" name="id" value={item.id} />
            <select
              name="status"
              defaultValue={item.status}
              className="flex-1 rounded-md border border-line bg-surface-0 px-2 py-1 text-[11px] text-ink"
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="DONE">Done</option>
              <option value="WONT_FIX">Won&apos;t fix</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Save
            </button>
          </form>
        </footer>
      </div>
    </article>
  );
}

