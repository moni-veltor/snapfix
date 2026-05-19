"use client";

import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Megaphone,
  Play,
  Plus,
  Shield,
  ShieldAlert,
  SkipForward,
  Workflow,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import {
  abandonRunbookExecutionAction,
  completeRunbookStepAction,
  manualActivateRunbookAction,
  skipRunbookStepAction,
  startRunbookStepAction,
} from "@/app/actions/runbook-execution";

type StepKind = "ACTION" | "DECISION" | "NOTIFICATION" | "COMMS" | "CHECKPOINT";
type StepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETE" | "SKIPPED" | "BLOCKED";

export type LiveStep = {
  stepExecutionId: string;
  orderIdx: number;
  title: string;
  description: string | null;
  kind: StepKind;
  ownerRoleTitle: string | null;
  estimatedMin: number | null;
  successCriteria: string | null;
  blocksOrders: number[];
  status: StepStatus;
  notes: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  /** When kind = DECISION/NOTIFICATION/COMMS, the form to open (wired in Commit D). */
  decisionTypeCode: string | null;
  regulatorTrigger: { regulator: string; slaHours: number; trigger: string } | null;
  commsTemplate: { stakeholder: string; subject: string; bodyTemplate: string } | null;
};

export type LiveExecution = {
  executionId: string;
  runbookId: string;
  runbookTitle: string;
  runbookCategory: string;
  version: number;
  status: "ACTIVE" | "COMPLETE" | "ABANDONED";
  activatedBy: "AUTO" | "MANUAL";
  activationReason: string | null;
  startedAt: Date;
  steps: LiveStep[];
};

export type AvailableRunbook = {
  id: string;
  title: string;
  category: string;
  stepCount: number;
};

type Props = {
  incidentId: string | null;
  /** Active + completed executions for this incident. */
  executions: LiveExecution[];
  /** Published runbooks not yet activated, available to manually activate. */
  availableRunbooks: AvailableRunbook[];
  /** Role title of the current participant — used to highlight "your" steps. */
  myRoleTitle: string | null;
  canActivate: boolean;
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

const KIND_TONE: Record<StepKind, string> = {
  ACTION: "bg-surface-2 text-ink",
  DECISION: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  NOTIFICATION: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  COMMS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  CHECKPOINT: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
};

const STATUS_PILL: Record<StepStatus, string> = {
  PENDING:
    "bg-surface-2 text-soft border border-line",
  IN_PROGRESS:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  COMPLETE:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  SKIPPED:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  BLOCKED:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

export default function LiveRunbookTab(props: Props) {
  const { incidentId, executions, availableRunbooks, myRoleTitle, canActivate } = props;

  if (!incidentId) {
    return (
      <EmptyHint
        icon={Shield}
        title="No active incident"
        message="Runbooks activate against an incident. Invoke the IMT first."
      />
    );
  }

  return (
    <div className="space-y-6">
      {canActivate && (
        <ActivationStrip
          incidentId={incidentId}
          available={availableRunbooks}
          activeCount={executions.filter((e) => e.status === "ACTIVE").length}
        />
      )}

      {executions.length === 0 ? (
        <EmptyHint
          icon={BookOpen}
          title="No runbooks activated"
          message={
            availableRunbooks.length === 0
              ? "No published runbooks in this org. Build one at /runbooks."
              : "Severity-based auto-activation runs on severity classification. Or manually activate one from the panel above."
          }
        />
      ) : (
        <div className="space-y-6">
          {executions.map((execution) => (
            <ExecutionCard
              key={execution.executionId}
              execution={execution}
              myRoleTitle={myRoleTitle}
              canManage={canActivate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Manual activation strip ─────────────────────────────────────────────

function ActivationStrip({
  incidentId,
  available,
  activeCount,
}: {
  incidentId: string;
  available: AvailableRunbook[];
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-1 p-4">
        <div>
          <p className="text-sm font-semibold text-ink">
            {activeCount === 0
              ? "No runbooks active"
              : `${activeCount} runbook${activeCount === 1 ? "" : "s"} active`}
          </p>
          <p className="text-[11px] text-soft">
            Runbooks auto-activate by severity. Manual activation is for the cases the
            trigger rules don&apos;t cover.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={available.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-0 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={13} />
          Activate runbook
        </button>
      </section>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Activate runbook"
        subtitle={`${available.length} published runbook${available.length === 1 ? "" : "s"} available`}
        size="lg"
      >
        <ul className="space-y-2">
          {available.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-1 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {r.category.replace(/_/g, " ")}
                </p>
                <p className="font-display text-sm font-semibold text-ink">{r.title}</p>
                <p className="text-[11px] text-soft">{r.stepCount} steps</p>
              </div>
              <form action={manualActivateRunbookAction} onSubmit={() => setOpen(false)}>
                <input type="hidden" name="incidentId" value={incidentId} />
                <input type="hidden" name="runbookId" value={r.id} />
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Activate
                </button>
              </form>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}

// ─── Execution card ──────────────────────────────────────────────────────

function ExecutionCard({
  execution,
  myRoleTitle,
  canManage,
}: {
  execution: LiveExecution;
  myRoleTitle: string | null;
  canManage: boolean;
}) {
  const total = execution.steps.length;
  const done = execution.steps.filter(
    (s) => s.status === "COMPLETE" || s.status === "SKIPPED",
  ).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  // Personal queue: steps that are PENDING or IN_PROGRESS and addressed to me by role.
  const myQueue = myRoleTitle
    ? execution.steps.filter(
        (s) =>
          (s.status === "PENDING" || s.status === "IN_PROGRESS") &&
          (s.ownerRoleTitle ?? "").toLowerCase() === myRoleTitle.toLowerCase(),
      )
    : [];

  return (
    <section className="rounded-xl border border-line bg-surface-1">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            {execution.runbookCategory.replace(/_/g, " ")} · v{execution.version} ·{" "}
            {execution.activatedBy === "AUTO" ? "Auto-activated" : "Manually activated"}
          </p>
          <h3 className="mt-0.5 font-display text-base font-semibold text-ink">
            {execution.runbookTitle}
          </h3>
          {execution.activationReason && (
            <p className="mt-0.5 text-[11px] text-soft">{execution.activationReason}</p>
          )}
        </div>
        <ExecutionStatusBadge status={execution.status} />
      </header>

      <div className="border-b border-line p-4">
        <div className="mb-2 flex items-center justify-between text-[11px] text-soft">
          <span>
            {done}/{total} step{total === 1 ? "" : "s"} complete
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full transition-all ${
              pct === 100 ? "bg-emerald-500" : "bg-indigo-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {myQueue.length > 0 && (
        <section className="border-b border-line bg-indigo-50/50 p-4 dark:bg-indigo-950/20">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            Your queue
          </h4>
          <p className="mt-0.5 text-[11px] text-soft">
            {myQueue.length} step{myQueue.length === 1 ? "" : "s"} addressed to{" "}
            <span className="font-mono">{myRoleTitle}</span>.
          </p>
          <ul className="mt-3 space-y-2">
            {myQueue.map((s) => (
              <StepRow key={s.stepExecutionId} step={s} highlightMine />
            ))}
          </ul>
        </section>
      )}

      <section className="p-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          All steps
        </h4>
        <ol className="mt-3 space-y-2">
          {execution.steps.map((s) => (
            <StepRow
              key={s.stepExecutionId}
              step={s}
              highlightMine={
                !!myRoleTitle &&
                (s.ownerRoleTitle ?? "").toLowerCase() === myRoleTitle.toLowerCase()
              }
            />
          ))}
        </ol>
      </section>

      {canManage && execution.status === "ACTIVE" && (
        <AbandonStrip executionId={execution.executionId} />
      )}
    </section>
  );
}

function ExecutionStatusBadge({
  status,
}: {
  status: "ACTIVE" | "COMPLETE" | "ABANDONED";
}) {
  const cls =
    status === "COMPLETE"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : status === "ABANDONED"
        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
        : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${cls}`}
    >
      {status}
    </span>
  );
}

function AbandonStrip({ executionId }: { executionId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <footer className="border-t border-line p-3 text-right">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[11px] text-soft hover:text-rose-700 hover:underline dark:hover:text-rose-300"
        >
          Abandon runbook…
        </button>
      </footer>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Abandon runbook"
        subtitle="Capture why so the post-mortem has it. Abandoning marks the execution complete with status ABANDONED."
        size="md"
      >
        <form
          action={abandonRunbookExecutionAction}
          onSubmit={() => setOpen(false)}
          className="space-y-4"
        >
          <input type="hidden" name="executionId" value={executionId} />
          <textarea
            name="reason"
            required
            rows={4}
            placeholder='e.g. "Scope changed; switching to ransomware-response runbook" or "Severity downgraded; standing down."'
            className="w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Abandon
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─── Step row (collapsed + expanded with actions) ────────────────────────

function StepRow({
  step,
  highlightMine,
}: {
  step: LiveStep;
  highlightMine: boolean;
}) {
  const [open, setOpen] = useState(false);
  const Icon = KIND_ICON[step.kind];

  const isTerminal = step.status === "COMPLETE" || step.status === "SKIPPED";
  const canStart = step.status === "PENDING";
  const canFinish = step.status === "IN_PROGRESS" || step.status === "PENDING";

  return (
    <li
      className={`rounded-lg border bg-surface-1 ${
        highlightMine && !isTerminal
          ? "border-indigo-300 dark:border-indigo-700"
          : "border-line"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-surface-2 font-mono text-[11px] font-semibold text-muted">
          {step.orderIdx + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_TONE[step.kind]}`}
            >
              <Icon size={10} />
              {KIND_LABEL[step.kind]}
            </span>
            <h5 className="text-sm font-semibold text-ink">{step.title}</h5>
            {step.ownerRoleTitle && (
              <span className="text-[11px] text-soft">· {step.ownerRoleTitle}</span>
            )}
            {step.estimatedMin !== null && (
              <span className="text-[11px] text-soft">· ~{step.estimatedMin}m</span>
            )}
          </div>
          {!open && step.description && (
            <p className="mt-1 line-clamp-2 text-[12px] text-soft">{step.description}</p>
          )}
        </div>
        <span
          className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_PILL[step.status]}`}
        >
          {step.status === "IN_PROGRESS" ? "In progress" : step.status.toLowerCase()}
        </span>
        {open ? <ChevronDown size={14} className="mt-1 text-muted" /> : <ChevronRight size={14} className="mt-1 text-muted" />}
      </button>
      {open && (
        <div className="space-y-3 border-t border-line bg-surface-0 p-4">
          {step.description && (
            <p className="text-sm text-ink whitespace-pre-wrap">{step.description}</p>
          )}
          {step.successCriteria && (
            <p className="text-[12px] text-emerald-700 dark:text-emerald-300">
              ✓ {step.successCriteria}
            </p>
          )}
          {step.kind === "DECISION" && step.decisionTypeCode && (
            <PrefilledHint
              icon={CheckSquare}
              label="Decision pre-fill"
              detail={step.decisionTypeCode.replace(/_/g, " ")}
            />
          )}
          {step.kind === "NOTIFICATION" && step.regulatorTrigger && (
            <PrefilledHint
              icon={ShieldAlert}
              label="Regulator clock"
              detail={`${step.regulatorTrigger.regulator} · ${step.regulatorTrigger.slaHours}h ${
                step.regulatorTrigger.trigger === "POST_INVOCATION"
                  ? "from invocation"
                  : "from awareness"
              }`}
            />
          )}
          {step.kind === "COMMS" && step.commsTemplate && (
            <PrefilledHint
              icon={Megaphone}
              label={`Comms · ${step.commsTemplate.stakeholder}`}
              detail={step.commsTemplate.subject}
            />
          )}
          {step.status === "BLOCKED" && step.blocksOrders.length > 0 && (
            <p className="text-[12px] text-rose-700 dark:text-rose-300">
              Blocked by step{step.blocksOrders.length === 1 ? "" : "s"}{" "}
              {step.blocksOrders.map((n) => n + 1).join(", ")}
            </p>
          )}
          {step.notes && isTerminal && (
            <p className="rounded-md border border-line bg-surface-1 p-2 text-[12px] text-soft">
              <span className="font-semibold text-muted">Notes:</span> {step.notes}
            </p>
          )}
          {!isTerminal && step.status !== "BLOCKED" && (
            <StepActionForms
              stepExecutionId={step.stepExecutionId}
              canStart={canStart}
              canFinish={canFinish}
            />
          )}
        </div>
      )}
    </li>
  );
}

function PrefilledHint({
  icon: Icon,
  label,
  detail,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  detail: string;
}) {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line-strong bg-surface-1 px-2 py-1 text-[11px] text-soft">
      <Icon size={11} />
      <span className="font-semibold text-muted">{label}:</span> {detail}
    </p>
  );
}

function StepActionForms({
  stepExecutionId,
  canStart,
  canFinish,
}: {
  stepExecutionId: string;
  canStart: boolean;
  canFinish: boolean;
}) {
  const [skipOpen, setSkipOpen] = useState(false);
  return (
    <div className="flex flex-wrap gap-2 border-t border-line pt-3">
      {canStart && (
        <form action={startRunbookStepAction}>
          <input type="hidden" name="stepExecutionId" value={stepExecutionId} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
          >
            <Play size={12} />
            Start
          </button>
        </form>
      )}
      {canFinish && (
        <form action={completeRunbookStepAction}>
          <input type="hidden" name="stepExecutionId" value={stepExecutionId} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            <CheckCircle2 size={12} />
            Mark complete
          </button>
        </form>
      )}
      <button
        type="button"
        onClick={() => setSkipOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
      >
        <SkipForward size={12} />
        Skip…
      </button>
      <Modal
        open={skipOpen}
        onClose={() => setSkipOpen(false)}
        title="Skip step"
        subtitle="Skipped steps need a reason — undocumented skips become coaching findings."
        size="md"
      >
        <form
          action={skipRunbookStepAction}
          onSubmit={() => setSkipOpen(false)}
          className="space-y-3"
        >
          <input type="hidden" name="stepExecutionId" value={stepExecutionId} />
          <textarea
            name="notes"
            required
            rows={3}
            placeholder='e.g. "Not applicable — no personal data in scope" or "Vendor already engaged via separate channel"'
            className="w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSkipOpen(false)}
              className="rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-500"
            >
              Skip with reason
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Empty-state helper ──────────────────────────────────────────────────

function EmptyHint({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  message: string;
}) {
  return (
    <section className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-8 text-center">
      <Icon size={28} className="mx-auto text-soft" />
      <h2 className="mt-3 font-display text-base font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{message}</p>
    </section>
  );
}

