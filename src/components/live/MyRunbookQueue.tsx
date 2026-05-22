"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  CheckSquare,
  ListChecks,
  Play,
  Workflow,
} from "lucide-react";
import ToastForm from "@/components/ui/ToastForm";
import {
  completeRunbookStepAction,
  startRunbookStepAction,
} from "@/app/actions/runbook-execution";
import type { LiveExecution, LiveStep } from "@/components/runbooks/LiveRunbookTab";

const KIND_TONE: Record<string, string> = {
  ACTION: "bg-surface-2 text-muted",
  DECISION: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  NOTIFICATION: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  COMMS: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  CHECKPOINT: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
};

/**
 * Cross-runbook "your steps" panel. Surfaces every PENDING or
 * IN_PROGRESS step owned by the participant's role across every active
 * runbook execution in the current incident — so a CRO doesn't have to
 * open each runbook tab and hunt for their own steps.
 *
 * Hides itself when there's nothing assigned. Renders nothing for
 * facilitator/observer participants whose role doesn't appear on any
 * step either.
 */
export default function MyRunbookQueue({
  executions,
  myRoleTitle,
  exerciseId,
}: {
  executions: LiveExecution[];
  myRoleTitle: string | null;
  exerciseId: string;
}) {
  const queue = useMemo(() => {
    if (!myRoleTitle) return [];
    const me = myRoleTitle.toLowerCase();
    const rows: Array<{ exec: LiveExecution; step: LiveStep }> = [];
    for (const e of executions) {
      if (e.status !== "ACTIVE") continue;
      for (const s of e.steps) {
        if (s.status !== "PENDING" && s.status !== "IN_PROGRESS") continue;
        if ((s.ownerRoleTitle ?? "").toLowerCase() !== me) continue;
        rows.push({ exec: e, step: s });
      }
    }
    // IN_PROGRESS before PENDING; then by execution startedAt, then by orderIdx.
    rows.sort((a, b) => {
      const ap = a.step.status === "IN_PROGRESS" ? 0 : 1;
      const bp = b.step.status === "IN_PROGRESS" ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const t = a.exec.startedAt.getTime() - b.exec.startedAt.getTime();
      if (t !== 0) return t;
      return a.step.orderIdx - b.step.orderIdx;
    });
    return rows;
  }, [executions, myRoleTitle]);

  if (queue.length === 0) return null;

  const inProgress = queue.filter((r) => r.step.status === "IN_PROGRESS").length;

  return (
    <section className="rounded-xl border border-indigo-300 bg-indigo-50/50 p-4 dark:border-indigo-800/60 dark:bg-indigo-950/20">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-indigo-900 dark:text-indigo-100">
          <Workflow size={13} />
          Your runbook steps
        </h3>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="rounded-full bg-indigo-200/70 px-1.5 py-0.5 font-semibold text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100">
            {queue.length} pending
          </span>
          {inProgress > 0 && (
            <span className="rounded-full bg-amber-200/70 px-1.5 py-0.5 font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
              {inProgress} in progress
            </span>
          )}
        </div>
      </header>

      <ul className="mt-3 space-y-1.5">
        {queue.map(({ exec, step }) => (
          <li
            key={step.stepExecutionId}
            className="rounded-md border border-line bg-surface-1 p-2.5 text-[12px]"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${KIND_TONE[step.kind] ?? "bg-surface-2 text-muted"}`}
                  >
                    {step.kind}
                  </span>
                  {step.status === "IN_PROGRESS" && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                      in progress
                    </span>
                  )}
                  <Link
                    href={`/exercises/${exerciseId}/live`}
                    className="text-[10px] text-soft hover:underline"
                    title={exec.runbookTitle}
                  >
                    {exec.runbookTitle}
                  </Link>
                  {step.estimatedMin != null && (
                    <span className="text-[10px] text-soft">· est. {step.estimatedMin}m</span>
                  )}
                </div>
                <p className="mt-1 font-medium text-ink">{step.title}</p>
                {step.description && (
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-soft">{step.description}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                {step.status === "PENDING" ? (
                  <ToastForm
                    action={startRunbookStepAction}
                    toast={{ success: "Step started" }}
                  >
                    <input type="hidden" name="stepExecutionId" value={step.stepExecutionId} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
                    >
                      <Play size={10} />
                      Start
                    </button>
                  </ToastForm>
                ) : (
                  <ToastForm
                    action={completeRunbookStepAction}
                    toast={{ success: "Step completed" }}
                  >
                    <input type="hidden" name="stepExecutionId" value={step.stepExecutionId} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500"
                    >
                      <CheckSquare size={10} />
                      Complete
                    </button>
                  </ToastForm>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-2 flex items-center justify-end gap-1 text-[10px] text-soft">
        <ListChecks size={10} />
        Open the runbook tab for full step context
        <ArrowRight size={10} />
      </p>
    </section>
  );
}
