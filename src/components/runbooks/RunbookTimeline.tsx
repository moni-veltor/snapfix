import {
  BookOpen,
  CheckSquare,
  Clock,
  Megaphone,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import type { FrozenRunbook, FrozenRunbookStep } from "@/lib/runbook-activation";

/**
 * Post-incident runbook timeline. Renders one section per RunbookExecution
 * (auto + manually activated) with a strip per step showing the bound
 * artefact and the wall-clock window. Designed for the debrief / evidence
 * pack — print-friendly via tailwind print: variants.
 */

type StepKind = "ACTION" | "DECISION" | "NOTIFICATION" | "COMMS" | "CHECKPOINT";
type StepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETE" | "SKIPPED" | "BLOCKED";

export type TimelineExecution = {
  executionId: string;
  runbookTitle: string;
  runbookCategory: string;
  version: number;
  status: "ACTIVE" | "COMPLETE" | "ABANDONED";
  activatedBy: "AUTO" | "MANUAL";
  activationReason: string | null;
  startedAt: Date;
  completedAt: Date | null;
  abandonedReason: string | null;
  /** Frozen runbook + steps from runbookJson — single source of truth. */
  frozen: FrozenRunbook;
  steps: {
    stepOrderIdx: number;
    status: StepStatus;
    startedAt: Date | null;
    completedAt: Date | null;
    notes: string | null;
    completedByName: string | null;
    linkedDecisionTitle: string | null;
    linkedNotificationLabel: string | null;
    linkedCommsSubject: string | null;
  }[];
};

const KIND_LABEL: Record<StepKind, string> = {
  ACTION: "Action",
  DECISION: "Decision",
  NOTIFICATION: "Notification",
  COMMS: "Comms",
  CHECKPOINT: "Checkpoint",
};

const KIND_ICON: Record<
  StepKind,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  ACTION: Workflow,
  DECISION: CheckSquare,
  NOTIFICATION: ShieldAlert,
  COMMS: Megaphone,
  CHECKPOINT: Clock,
};

const STATUS_BADGE: Record<StepStatus, string> = {
  PENDING: "bg-surface-2 text-soft border border-line",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  COMPLETE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  SKIPPED: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  BLOCKED: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

export default function RunbookTimeline({
  executions,
}: {
  executions: TimelineExecution[];
}) {
  if (executions.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-6 text-sm text-soft">
        No runbooks were activated against this incident.
      </section>
    );
  }
  return (
    <section className="space-y-4 print:space-y-2">
      <header className="flex items-center gap-2">
        <BookOpen size={14} className="text-muted" />
        <h2 className="text-base font-semibold text-ink">Runbook timeline</h2>
        <span className="text-[11px] text-soft">
          {executions.length} runbook{executions.length === 1 ? "" : "s"} activated
        </span>
      </header>

      {executions.map((execution) => (
        <ExecutionSection key={execution.executionId} execution={execution} />
      ))}
    </section>
  );
}

function ExecutionSection({ execution }: { execution: TimelineExecution }) {
  const total = execution.steps.length;
  const terminal = execution.steps.filter(
    (s) => s.status === "COMPLETE" || s.status === "SKIPPED",
  ).length;
  const pct = total === 0 ? 0 : Math.round((terminal / total) * 100);
  const frozenByIdx = new Map<number, FrozenRunbookStep>(
    execution.frozen.steps.map((s) => [s.orderIdx, s]),
  );

  return (
    <section className="rounded-xl border border-line bg-surface-1 print:break-inside-avoid">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            {execution.runbookCategory.replace(/_/g, " ")} · v{execution.version} ·{" "}
            {execution.activatedBy === "AUTO" ? "Auto-activated" : "Manually activated"}
          </p>
          <h3 className="mt-0.5 font-display text-sm font-semibold text-ink">
            {execution.runbookTitle}
          </h3>
          <p className="mt-0.5 text-[11px] text-soft">
            {execution.activationReason ? `${execution.activationReason} · ` : ""}
            started {execution.startedAt.toISOString().slice(0, 16).replace("T", " ")}Z
            {execution.completedAt &&
              ` · ${execution.status.toLowerCase()} ${execution.completedAt.toISOString().slice(0, 16).replace("T", " ")}Z`}
          </p>
          {execution.abandonedReason && (
            <p className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-300">
              Abandoned: {execution.abandonedReason}
            </p>
          )}
        </div>
        <div className="text-right text-[11px]">
          <p className="font-mono font-semibold text-ink">{pct}%</p>
          <p className="text-soft">
            {terminal}/{total} terminal
          </p>
        </div>
      </header>

      <ol className="divide-y divide-line">
        {execution.steps.map((s) => {
          const frozen = frozenByIdx.get(s.stepOrderIdx);
          if (!frozen) return null;
          const Icon = KIND_ICON[frozen.kind as StepKind];
          const window = formatStepWindow(s);
          return (
            <li key={s.stepOrderIdx} className="p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-surface-2 font-mono text-[11px] font-semibold text-muted">
                  {s.stepOrderIdx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                      <Icon size={10} />
                      {KIND_LABEL[frozen.kind as StepKind]}
                    </span>
                    <h4 className="text-sm font-medium text-ink">{frozen.title}</h4>
                    {frozen.ownerRoleTitle && (
                      <span className="text-[11px] text-soft">· {frozen.ownerRoleTitle}</span>
                    )}
                    {frozen.estimatedMin !== null && (
                      <span className="text-[11px] text-soft">
                        · est ~{frozen.estimatedMin}m
                      </span>
                    )}
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_BADGE[s.status]}`}
                    >
                      {s.status === "IN_PROGRESS" ? "In progress" : s.status.toLowerCase()}
                    </span>
                  </div>
                  {window && (
                    <p className="mt-1 font-mono text-[11px] text-soft">{window}</p>
                  )}
                  {s.completedByName && (
                    <p className="text-[11px] text-soft">by {s.completedByName}</p>
                  )}
                  {s.linkedDecisionTitle && (
                    <p className="mt-1 text-[11px] text-indigo-700 dark:text-indigo-300">
                      Decision: {s.linkedDecisionTitle}
                    </p>
                  )}
                  {s.linkedNotificationLabel && (
                    <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-300">
                      Regulator: {s.linkedNotificationLabel}
                    </p>
                  )}
                  {s.linkedCommsSubject && (
                    <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                      Comms: {s.linkedCommsSubject}
                    </p>
                  )}
                  {s.notes && (
                    <p className="mt-1 rounded-md border border-line bg-surface-0 px-2 py-1 text-[11px] text-soft">
                      <span className="font-semibold text-muted">
                        {s.status === "SKIPPED" ? "Skip reason" : "Notes"}:
                      </span>{" "}
                      {s.notes}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function formatStepWindow(step: TimelineExecution["steps"][number]): string | null {
  if (!step.startedAt && !step.completedAt) return null;
  const start = step.startedAt?.toISOString().slice(11, 16) ?? "—";
  const end = step.completedAt?.toISOString().slice(11, 16) ?? "—";
  let durationMin: number | null = null;
  if (step.startedAt && step.completedAt) {
    durationMin = Math.max(
      1,
      Math.round((step.completedAt.getTime() - step.startedAt.getTime()) / 60_000),
    );
  }
  return `${start}Z → ${end}Z${durationMin !== null ? ` · ${durationMin}m` : ""}`;
}
