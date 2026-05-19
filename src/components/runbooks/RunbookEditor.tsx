"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Link as LinkIcon,
  Megaphone,
  Pencil,
  Plus,
  Send,
  ShieldAlert,
  Trash2,
  Workflow,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import {
  addRunbookStepAction,
  deleteRunbookStepAction,
  moveRunbookStepAction,
  publishRunbookAction,
  setRunbookIBSLinksAction,
  setRunbookScenarioLinksAction,
  setRunbookTriggerAction,
  unpublishRunbookAction,
  updateRunbookMetadataAction,
  updateRunbookStepAction,
} from "@/app/actions/runbooks";
import type { RunbookStepKind } from "@/generated/prisma/enums";

// ── Types matching the page-level Prisma include shape ────────────────────

type StepKind = RunbookStepKind;

type EditorStep = {
  id: string;
  orderIdx: number;
  title: string;
  description: string | null;
  kind: StepKind;
  ownerRoleTitle: string | null;
  estimatedMin: number | null;
  successCriteria: string | null;
  blocksOrders: number[];
  decisionTypeCode: string | null;
  orgDecisionTypeId: string | null;
  regulatorTrigger: { regulator: string; slaHours: number; trigger: string } | null;
  commsTemplate: { stakeholder: string; subject: string; bodyTemplate: string } | null;
};

export type RunbookEditorProps = {
  runbook: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    ownerRoleTitle: string | null;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    version: number;
    publishedAt: Date | null;
    trigger: {
      severityAtLeast: string | null;
      scenarioCategoryEquals: string | null;
    } | null;
  };
  steps: EditorStep[];
  ibsOptions: { id: string; code: string; name: string }[];
  ibsSelectedIds: string[];
  scenarioOptions: { id: string; title: string; category: string | null }[];
  scenarioSelectedIds: string[];
  scenarioCategories: string[];
  canEdit: boolean;
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

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "CYBER", label: "Cyber" },
  { value: "RANSOMWARE", label: "Ransomware" },
  { value: "CLOUD_REGION_OUTAGE", label: "Cloud region outage" },
  { value: "VENDOR_FAILURE", label: "Vendor failure" },
  { value: "BCP_ACTIVATION", label: "BCP activation" },
  { value: "DATA_INCIDENT", label: "Data incident" },
  { value: "PEOPLE_DISRUPTION", label: "People disruption" },
  { value: "REGULATORY_NOTIFICATION", label: "Regulatory notification" },
  { value: "OTHER", label: "Other" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "Manual activation only" },
  { value: "LOW", label: "Any severity (LOW+)" },
  { value: "MEDIUM", label: "MEDIUM and above" },
  { value: "HIGH", label: "HIGH and above" },
  { value: "CRITICAL", label: "CRITICAL only" },
];

const DECISION_TYPE_OPTIONS = [
  "INVOKE_IMT",
  "STAND_DOWN_IMT",
  "CLASSIFY_SEVERITY",
  "ACTIVATE_BCP",
  "DEACTIVATE_BCP",
  "NOTIFY_FCA",
  "NOTIFY_PRA",
  "NOTIFY_ICO",
  "CONVENE_ACTION_COMMITTEE",
  "APPROVE_CRISIS_COMMS",
  "APPROVE_REGULATOR_COMMS",
  "CFO_EMERGENCY_SPEND",
  "DRAW_CONTINGENT_LIQUIDITY",
  "DO_NOT_PAY_RANSOM",
  "INSURANCE_INVOCATION",
  "RECOVERY_OPTION_CHOSEN",
  "OTHER",
];

const REGULATOR_OPTIONS = ["FCA", "PRA", "ICO", "BANK_OF_ENGLAND", "OTHER"];

const STAKEHOLDER_OPTIONS = [
  "EMPLOYEES",
  "CUSTOMERS",
  "REGULATORS",
  "MEDIA",
  "BOARD",
  "VENDORS",
  "SHAREHOLDERS",
];

export default function RunbookEditor(props: RunbookEditorProps) {
  const { runbook, steps, canEdit } = props;

  return (
    <div className="space-y-6">
      {canEdit && (
        <PublishStrip
          runbook={runbook}
          stepCount={steps.length}
          canPublish={steps.length > 0}
        />
      )}

      {canEdit && <MetadataPanel runbook={runbook} />}

      {canEdit && <TriggerPanel runbook={runbook} categories={props.scenarioCategories} />}

      <StepListPanel steps={steps} runbookId={runbook.id} canEdit={canEdit} />

      {canEdit && (
        <>
          <IBSLinkPanel
            runbookId={runbook.id}
            options={props.ibsOptions}
            selectedIds={props.ibsSelectedIds}
          />
          <ScenarioLinkPanel
            runbookId={runbook.id}
            options={props.scenarioOptions}
            selectedIds={props.scenarioSelectedIds}
          />
        </>
      )}
    </div>
  );
}

// ─── Publish / status strip ──────────────────────────────────────────────

function PublishStrip({
  runbook,
  stepCount,
  canPublish,
}: {
  runbook: RunbookEditorProps["runbook"];
  stepCount: number;
  canPublish: boolean;
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-1 p-4">
      <div className="flex items-center gap-3">
        <StatusPill status={runbook.status} version={runbook.version} />
        <p className="text-[12px] text-soft">
          {runbook.status === "PUBLISHED"
            ? `v${runbook.version} live · ${stepCount} step${stepCount === 1 ? "" : "s"}`
            : runbook.status === "ARCHIVED"
              ? "Archived — restore from the bottom panel"
              : `Draft · ${stepCount} step${stepCount === 1 ? "" : "s"}`}
        </p>
      </div>
      <div className="flex gap-2">
        {runbook.status === "PUBLISHED" ? (
          <form action={unpublishRunbookAction}>
            <input type="hidden" name="id" value={runbook.id} />
            <button
              type="submit"
              className="rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
            >
              Move back to draft
            </button>
          </form>
        ) : null}
        <form action={publishRunbookAction}>
          <input type="hidden" name="id" value={runbook.id} />
          <button
            type="submit"
            disabled={!canPublish}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
            title={canPublish ? "" : "Add at least one step before publishing"}
          >
            <Send size={13} />
            {runbook.status === "PUBLISHED" ? `Publish v${runbook.version + 1}` : "Publish"}
          </button>
        </form>
      </div>
    </section>
  );
}

function StatusPill({
  status,
  version,
}: {
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
}) {
  const cls =
    status === "PUBLISHED"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : status === "ARCHIVED"
        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  const label = status === "PUBLISHED" ? `Published · v${version}` : status === "ARCHIVED" ? "Archived" : "Draft";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

// ─── Metadata edit panel ─────────────────────────────────────────────────

function MetadataPanel({ runbook }: { runbook: RunbookEditorProps["runbook"] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl border border-line bg-surface-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 p-4 text-left"
      >
        <span className="flex items-center gap-2">
          <Pencil size={14} className="text-muted" />
          <span className="text-sm font-semibold text-ink">Metadata</span>
          <span className="text-[11px] text-soft">title · description · category · owner</span>
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <form
          action={updateRunbookMetadataAction}
          className="space-y-4 border-t border-line p-4"
        >
          <input type="hidden" name="id" value={runbook.id} />
          <FormRow label="Title">
            <input
              name="title"
              defaultValue={runbook.title}
              required
              className="w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </FormRow>
          <FormRow label="Owner role">
            <input
              name="ownerRoleTitle"
              defaultValue={runbook.ownerRoleTitle ?? ""}
              placeholder="e.g. CISO, CRO"
              className="w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </FormRow>
          <FormRow label="Category">
            <select
              name="category"
              defaultValue={runbook.category}
              className="w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </FormRow>
          <FormRow label="Description">
            <textarea
              name="description"
              defaultValue={runbook.description ?? ""}
              rows={3}
              className="w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </FormRow>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Save metadata
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

// ─── Trigger condition panel ─────────────────────────────────────────────

function TriggerPanel({
  runbook,
  categories,
}: {
  runbook: RunbookEditorProps["runbook"];
  categories: string[];
}) {
  return (
    <section className="rounded-xl border border-line bg-surface-1 p-4">
      <header className="mb-3 flex items-center gap-2">
        <ShieldAlert size={14} className="text-muted" />
        <h2 className="text-sm font-semibold text-ink">Auto-activation</h2>
        <span className="text-[11px] text-soft">
          when this fires automatically during a live incident
        </span>
      </header>
      <form action={setRunbookTriggerAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="runbookId" value={runbook.id} />
        <FormRow label="Severity threshold">
          <select
            name="severityAtLeast"
            defaultValue={runbook.trigger?.severityAtLeast ?? ""}
            className="w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="Scenario category (optional)">
          <select
            name="scenarioCategoryEquals"
            defaultValue={runbook.trigger?.scenarioCategoryEquals ?? ""}
            className="w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Any category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormRow>
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Save trigger
          </button>
        </div>
      </form>
    </section>
  );
}

// ─── Step list ───────────────────────────────────────────────────────────

function StepListPanel({
  steps,
  runbookId,
  canEdit,
}: {
  steps: EditorStep[];
  runbookId: string;
  canEdit: boolean;
}) {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Steps</h2>
          <p className="text-[11px] text-soft">
            Each step has an owner role and an expected time. Click a step to edit
            inline. Use the arrow buttons to reorder.
          </p>
        </div>
        {canEdit && (
          <form action={addRunbookStepAction}>
            <input type="hidden" name="runbookId" value={runbookId} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
            >
              <Plus size={13} />
              Add step
            </button>
          </form>
        )}
      </header>
      {steps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-6 text-center text-sm text-soft">
          No steps yet. {canEdit ? "Click " : ""}
          {canEdit && <span className="font-medium">Add step</span>}
          {canEdit ? " to start building." : "Ask an admin to add steps."}
        </div>
      ) : (
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <StepCard
              key={s.id}
              step={s}
              indexLabel={i + 1}
              totalSteps={steps.length}
              priorSteps={steps.slice(0, i).map((p) => ({
                orderIdx: p.orderIdx,
                title: p.title,
              }))}
              canEdit={canEdit}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

// ─── Step card (collapsed view + inline edit form) ───────────────────────

function StepCard({
  step,
  indexLabel,
  totalSteps,
  priorSteps,
  canEdit,
}: {
  step: EditorStep;
  indexLabel: number;
  totalSteps: number;
  priorSteps: { orderIdx: number; title: string }[];
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const Icon = KIND_ICON[step.kind];

  return (
    <li className="rounded-xl border border-line bg-surface-1">
      <div className="flex items-start gap-3 p-4">
        <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-surface-2 font-mono text-[11px] font-semibold text-muted">
          {indexLabel}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
          disabled={!canEdit}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_TONE[step.kind]}`}
            >
              <Icon size={10} />
              {KIND_LABEL[step.kind]}
            </span>
            <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
            {step.ownerRoleTitle && (
              <span className="text-[11px] text-soft">· {step.ownerRoleTitle}</span>
            )}
            {step.estimatedMin !== null && (
              <span className="text-[11px] text-soft">· ~{step.estimatedMin}m</span>
            )}
            {canEdit && (
              <span className="ml-auto text-[10px] text-soft">
                {open ? "click to collapse" : "click to edit"}
              </span>
            )}
          </div>
          {step.description && !open && (
            <p className="mt-1 line-clamp-2 text-[12px] text-soft">{step.description}</p>
          )}
          {step.blocksOrders.length > 0 && !open && (
            <p className="mt-1 text-[10px] text-soft">
              depends on step{step.blocksOrders.length === 1 ? "" : "s"}{" "}
              {step.blocksOrders.map((n) => n + 1).join(", ")}
            </p>
          )}
        </button>
        {canEdit && (
          <div className="flex flex-none flex-col gap-1">
            <form action={moveRunbookStepAction}>
              <input type="hidden" name="stepId" value={step.id} />
              <input type="hidden" name="direction" value="up" />
              <button
                type="submit"
                disabled={indexLabel === 1}
                className="rounded-md border border-line p-1 text-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                title="Move up"
              >
                <ArrowUp size={12} />
              </button>
            </form>
            <form action={moveRunbookStepAction}>
              <input type="hidden" name="stepId" value={step.id} />
              <input type="hidden" name="direction" value="down" />
              <button
                type="submit"
                disabled={indexLabel === totalSteps}
                className="rounded-md border border-line p-1 text-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                title="Move down"
              >
                <ArrowDown size={12} />
              </button>
            </form>
          </div>
        )}
      </div>
      {open && canEdit && (
        <StepEditForm
          step={step}
          priorSteps={priorSteps}
          onClose={() => setOpen(false)}
        />
      )}
    </li>
  );
}

// ─── Inline step edit form ───────────────────────────────────────────────

function StepEditForm({
  step,
  priorSteps,
  onClose,
}: {
  step: EditorStep;
  priorSteps: { orderIdx: number; title: string }[];
  onClose: () => void;
}) {
  const [kind, setKind] = useState<StepKind>(step.kind);

  return (
    <form
      action={updateRunbookStepAction}
      className="space-y-4 border-t border-line bg-surface-0 p-4"
    >
      <input type="hidden" name="stepId" value={step.id} />

      <FormRow label="Title">
        <input
          name="title"
          defaultValue={step.title}
          required
          className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </FormRow>

      <div className="grid gap-3 sm:grid-cols-3">
        <FormRow label="Kind">
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as StepKind)}
            className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {(Object.keys(KIND_LABEL) as StepKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="Owner role">
          <input
            name="ownerRoleTitle"
            defaultValue={step.ownerRoleTitle ?? ""}
            placeholder="e.g. CTO, Head of Comms"
            className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </FormRow>
        <FormRow label="Estimated minutes">
          <input
            name="estimatedMin"
            type="number"
            min={0}
            defaultValue={step.estimatedMin ?? ""}
            className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </FormRow>
      </div>

      <FormRow label="Description">
        <textarea
          name="description"
          defaultValue={step.description ?? ""}
          rows={3}
          className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="What does this step do? Markdown is supported."
        />
      </FormRow>

      <FormRow label="Success criteria">
        <input
          name="successCriteria"
          defaultValue={step.successCriteria ?? ""}
          placeholder='"How do we know this step is done?"'
          className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </FormRow>

      {priorSteps.length > 0 && (
        <FormRow label="Depends on (blocks this step until those are complete)">
          <ul className="space-y-1">
            {priorSteps.map((p) => (
              <li key={p.orderIdx} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  id={`dep-${step.id}-${p.orderIdx}`}
                  name="blocksOrders"
                  value={p.orderIdx}
                  defaultChecked={step.blocksOrders.includes(p.orderIdx)}
                  className="h-4 w-4 rounded border-line-strong text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor={`dep-${step.id}-${p.orderIdx}`} className="cursor-pointer text-soft">
                  <span className="font-mono text-[10px] text-muted">#{p.orderIdx + 1}</span> · {p.title}
                </label>
              </li>
            ))}
          </ul>
        </FormRow>
      )}

      {kind === "DECISION" && (
        <FormRow label="Decision type">
          <select
            name="decisionTypeCode"
            defaultValue={step.decisionTypeCode ?? ""}
            className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">— select —</option>
            {DECISION_TYPE_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </FormRow>
      )}

      {kind === "NOTIFICATION" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <FormRow label="Regulator">
            <select
              name="regulator"
              defaultValue={step.regulatorTrigger?.regulator ?? "FCA"}
              className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {REGULATOR_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FormRow>
          <FormRow label="SLA hours">
            <input
              name="slaHours"
              type="number"
              min={0}
              defaultValue={step.regulatorTrigger?.slaHours ?? 4}
              className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </FormRow>
          <FormRow label="Clock starts">
            <select
              name="regTriggerSource"
              defaultValue={step.regulatorTrigger?.trigger ?? "POST_INVOCATION"}
              className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="POST_INVOCATION">After IMT invocation</option>
              <option value="POST_AWARENESS">After awareness</option>
            </select>
          </FormRow>
        </div>
      )}

      {kind === "COMMS" && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormRow label="Stakeholder">
              <select
                name="commsStakeholder"
                defaultValue={step.commsTemplate?.stakeholder ?? "EMPLOYEES"}
                className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {STAKEHOLDER_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Subject">
              <input
                name="commsSubject"
                defaultValue={step.commsTemplate?.subject ?? ""}
                className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </FormRow>
          </div>
          <FormRow label='Body template (use {{incident.title}}, {{nextSitrepDDay}}, {{ownerRoleTitle}})'>
            <textarea
              name="commsBody"
              defaultValue={step.commsTemplate?.bodyTemplate ?? ""}
              rows={4}
              className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </FormRow>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <form action={deleteRunbookStepAction}>
          <input type="hidden" name="stepId" value={step.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-900 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
          >
            <Trash2 size={12} />
            Delete step
          </button>
        </form>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Close
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <CheckCircle2 size={13} />
            Save step
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── IBS link panel ──────────────────────────────────────────────────────

function IBSLinkPanel({
  runbookId,
  options,
  selectedIds,
}: {
  runbookId: string;
  options: { id: string; code: string; name: string }[];
  selectedIds: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl border border-line bg-surface-1 p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon size={14} className="text-muted" />
          <h2 className="text-sm font-semibold text-ink">Covers IBSs</h2>
          <span className="text-[11px] text-soft">
            ({selectedIds.length}/{options.length})
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-line-strong bg-surface-0 px-3 py-1 text-xs font-medium text-ink hover:bg-surface-2"
        >
          Edit links
        </button>
      </header>
      {selectedIds.length === 0 ? (
        <p className="text-[12px] text-soft">No IBSs linked yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {options
            .filter((o) => selectedIds.includes(o.id))
            .map((o) => (
              <li
                key={o.id}
                className="inline-flex items-center rounded-full border border-line bg-surface-2 px-3 py-1 text-[12px]"
              >
                <span className="font-mono text-[10px] text-muted">{o.code}</span>
                <span className="ml-1.5">{o.name}</span>
              </li>
            ))}
        </ul>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title="Link IBSs"
        subtitle="Tick every IBS this runbook protects. Updates the registry on save."
      >
        <form
          action={setRunbookIBSLinksAction}
          onSubmit={() => setOpen(false)}
          className="space-y-4"
        >
          <input type="hidden" name="runbookId" value={runbookId} />
          {options.length === 0 ? (
            <p className="text-sm text-soft">No IBSs in your register yet.</p>
          ) : (
            <ul className="max-h-[55vh] space-y-1 overflow-y-auto pr-1">
              {options.map((o) => (
                <li key={o.id} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-surface-2">
                  <input
                    type="checkbox"
                    id={`ibs-${o.id}`}
                    name="ibsIds"
                    value={o.id}
                    defaultChecked={selectedIds.includes(o.id)}
                    className="h-4 w-4 rounded border-line-strong text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={`ibs-${o.id}`} className="cursor-pointer text-sm">
                    <span className="font-mono text-[10px] text-muted">{o.code}</span>
                    <span className="ml-1.5">{o.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Save links
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

// ─── Scenario link panel ─────────────────────────────────────────────────

function ScenarioLinkPanel({
  runbookId,
  options,
  selectedIds,
}: {
  runbookId: string;
  options: { id: string; title: string; category: string | null }[];
  selectedIds: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl border border-line bg-surface-1 p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon size={14} className="text-muted" />
          <h2 className="text-sm font-semibold text-ink">Tested by scenarios</h2>
          <span className="text-[11px] text-soft">
            ({selectedIds.length}/{options.length})
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-line-strong bg-surface-0 px-3 py-1 text-xs font-medium text-ink hover:bg-surface-2"
        >
          Edit links
        </button>
      </header>
      {selectedIds.length === 0 ? (
        <p className="text-[12px] text-soft">No scenarios linked yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {options
            .filter((o) => selectedIds.includes(o.id))
            .map((o) => (
              <li
                key={o.id}
                className="inline-flex items-center rounded-full border border-line bg-surface-2 px-3 py-1 text-[12px]"
              >
                {o.title}
              </li>
            ))}
        </ul>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title="Link scenarios"
        subtitle="Tick every scenario in your library that exercises this runbook."
      >
        <form
          action={setRunbookScenarioLinksAction}
          onSubmit={() => setOpen(false)}
          className="space-y-4"
        >
          <input type="hidden" name="runbookId" value={runbookId} />
          {options.length === 0 ? (
            <p className="text-sm text-soft">No scenarios in your library yet.</p>
          ) : (
            <ul className="max-h-[55vh] space-y-1 overflow-y-auto pr-1">
              {options.map((o) => (
                <li key={o.id} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-surface-2">
                  <input
                    type="checkbox"
                    id={`sc-${o.id}`}
                    name="scenarioIds"
                    value={o.id}
                    defaultChecked={selectedIds.includes(o.id)}
                    className="h-4 w-4 rounded border-line-strong text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={`sc-${o.id}`} className="cursor-pointer text-sm">
                    {o.title}
                    {o.category && (
                      <span className="ml-2 text-[10px] text-soft">· {o.category}</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Save links
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

// ─── Tiny form helpers ───────────────────────────────────────────────────

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

