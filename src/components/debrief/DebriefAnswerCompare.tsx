"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle, Users } from "lucide-react";

type Answer = {
  id: string;
  body: string;
  author: { name: string | null; email: string } | null;
};

type Question = {
  id: string;
  text: string;
  category: string;
  answers: Answer[];
};

type Props = {
  questions: Question[];
  /** Total participants on the roster — used as the denominator for "X of Y answered". */
  participantCount: number;
};

const CATEGORY_TONE: Record<string, string> = {
  COMMUNICATION: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  DECISION_MAKING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  TECHNICAL: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  REGULATORY: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  CUSTOMER: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  PROCESS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
};

/**
 * Group-level view of debrief answers. The default debrief layout
 * stacks 200+ answers (20 participants × 10 questions) into one
 * vertical wall — unreadable. This component shows a single line per
 * question with response-rate + distinct-author count, then expands
 * inline to a per-author list of short previews. Each answer is
 * individually expandable for the full body.
 */
export default function DebriefAnswerCompare({ questions, participantCount }: Props) {
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());
  const [openAnswers, setOpenAnswers] = useState<Set<string>>(new Set());

  if (questions.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line bg-surface-1 p-4 text-sm text-muted">
        No debrief questions defined for this scenario.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {questions.map((q) => {
        const isOpen = openQuestions.has(q.id);
        const authorIds = new Set(
          q.answers.map((a) => a.author?.email ?? "anon").filter(Boolean),
        );
        const responseRate = participantCount
          ? Math.round((authorIds.size / participantCount) * 100)
          : 0;

        return (
          <li key={q.id} className="rounded-md border border-line bg-surface-1">
            <button
              type="button"
              onClick={() =>
                setOpenQuestions((prev) => {
                  const next = new Set(prev);
                  if (next.has(q.id)) next.delete(q.id);
                  else next.add(q.id);
                  return next;
                })
              }
              className="flex w-full items-start gap-3 p-3 text-left hover:bg-surface-2/60"
              aria-expanded={isOpen}
            >
              <ChevronDown
                size={14}
                className={`mt-1 shrink-0 text-soft transition-transform ${
                  isOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                      CATEGORY_TONE[q.category] ?? "bg-surface-2 text-muted"
                    }`}
                  >
                    {q.category.replace("_", " ")}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-soft">
                    <Users size={10} />
                    {authorIds.size}/{participantCount} answered
                    {responseRate > 0 && (
                      <span
                        className={`ml-1 font-medium ${
                          responseRate >= 75
                            ? "text-emerald-700 dark:text-emerald-300"
                            : responseRate >= 50
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        ({responseRate}%)
                      </span>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-soft">
                    <MessageCircle size={10} />
                    {q.answers.length} response{q.answers.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-ink">{q.text}</p>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-line bg-surface-0 p-3">
                {q.answers.length === 0 ? (
                  <p className="text-xs text-soft">
                    No answers yet. Be the first to respond — the facilitator will share the full
                    set with the team.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {q.answers.map((a) => {
                      const expanded = openAnswers.has(a.id);
                      const preview =
                        a.body.length > 140 && !expanded
                          ? `${a.body.slice(0, 140).trim()}…`
                          : a.body;
                      return (
                        <li
                          key={a.id}
                          className="rounded-md border border-line bg-surface-1 p-2"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[11px] font-medium text-muted">
                              {a.author?.name ?? a.author?.email ?? "—"}
                            </span>
                            {a.body.length > 140 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenAnswers((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(a.id)) next.delete(a.id);
                                    else next.add(a.id);
                                    return next;
                                  })
                                }
                                className="text-[10px] text-indigo-600 hover:underline dark:text-indigo-300"
                              >
                                {expanded ? "Collapse" : "Show full answer"}
                              </button>
                            )}
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-xs text-ink">{preview}</p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
