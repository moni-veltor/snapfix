"use client";

import { useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckSquare, Clock, Flame, Sparkles } from "lucide-react";
import { useChangeDetector, type ChangeEvent } from "@/lib/use-change-detector";

type Item = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function signatureOf(i: Item): string {
  return `${i.status}::${i.priority}::${i.updatedAt.toISOString()}`;
}

const PRIORITY_TONE: Record<string, string> = {
  CRITICAL: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  MEDIUM: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  LOW: "bg-surface-2 text-muted",
};

const STATUS_TONE: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  IN_PROGRESS: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  BLOCKED: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  DONE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  WONT_FIX: "bg-surface-2 text-muted",
};

/**
 * Participant-focused list of action items they own that came out of
 * (or were assigned within) this specific exercise. Sits in a side
 * panel on the live page so the participant can answer "what's mine,
 * right now?" without leaving the live view.
 *
 * Open items appear first, ordered by due-date. Closed items collapse
 * into a count at the bottom.
 */
export default function MyExerciseActionItems({
  items,
  nowIso,
}: {
  items: Item[];
  nowIso: string;
}) {
  const onChange = useCallback((event: ChangeEvent<Item>) => {
    const i = event.item;
    if (event.kind === "added") {
      toast.info(`New action item assigned to you`, {
        description: `${i.priority} · ${i.title}`,
      });
    } else if (event.kind === "updated") {
      toast.info(`Action item updated`, { description: i.title });
    }
  }, []);
  const flashing = useChangeDetector(items, signatureOf, onChange);

  if (items.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-line bg-surface-1 p-3 text-xs text-soft">
        No action items assigned to you in this exercise yet.
      </section>
    );
  }

  const now = new Date(nowIso).getTime();
  const open = items.filter((i) => i.status !== "DONE" && i.status !== "WONT_FIX");
  const closed = items.filter((i) => i.status === "DONE" || i.status === "WONT_FIX");

  const overdueCount = open.filter(
    (i) => i.dueAt && i.dueAt.getTime() < now,
  ).length;

  return (
    <section className="space-y-2 rounded-xl border border-line bg-surface-1 p-3">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
          <CheckSquare size={11} />
          Your action items in this run
        </h3>
        <div className="flex items-center gap-1 text-[10px]">
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 font-semibold text-muted">
            {open.length} open
          </span>
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              <Flame size={9} />
              {overdueCount} overdue
            </span>
          )}
        </div>
      </header>

      <ul className="space-y-1.5">
        {open.map((i) => {
          const overdue = i.dueAt && i.dueAt.getTime() < now;
          const isFlashing = flashing.has(i.id);
          return (
            <li
              key={i.id}
              className={`rounded-md border p-2 text-xs ${
                overdue
                  ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/20"
                  : "border-line bg-surface-0"
              } ${isFlashing ? "ring-2 ring-amber-300 ring-offset-1 dark:ring-amber-400/60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate font-medium text-ink">
                    <span className="truncate">{i.title}</span>
                    {isFlashing && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                        <Sparkles size={8} />
                        New
                      </span>
                    )}
                  </p>
                  {i.description && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted">
                      {i.description}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${PRIORITY_TONE[i.priority] ?? "bg-surface-2 text-muted"}`}
                    >
                      {i.priority}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${STATUS_TONE[i.status] ?? "bg-surface-2 text-muted"}`}
                    >
                      {i.status.replace("_", " ")}
                    </span>
                    {i.dueAt && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] ${
                          overdue
                            ? "font-semibold text-rose-700 dark:text-rose-300"
                            : "text-soft"
                        }`}
                      >
                        <Clock size={9} />
                        {overdue ? "OVERDUE " : "Due "}
                        {i.dueAt.toISOString().slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {closed.length > 0 && (
        <p className="text-[10px] text-soft">
          + {closed.length} closed
        </p>
      )}

      <Link
        href="/action-items"
        className="block text-center text-[10px] text-soft hover:text-muted hover:underline"
      >
        View all action items →
      </Link>
    </section>
  );
}
