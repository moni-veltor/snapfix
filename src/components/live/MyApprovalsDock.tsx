"use client";

import { useState } from "react";
import { CheckCircle2, FileCheck2, Gavel, ShieldCheck, X } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import ToastForm from "@/components/ui/ToastForm";
import {
  approveDecisionAction,
} from "@/app/actions/decisions";
import {
  approveCommsAction,
  rejectCommsAction,
} from "@/app/actions/comms";
import type {
  CommsApprovalItem,
  DecisionApprovalItem,
} from "@/lib/approvals";

/**
 * Pinned-near-the-top "what's waiting for my approval" dock. The role-
 * routed feed is computed server-side in `loadApprovalsQueue`; this
 * component renders the list, opens a drawer with full context on click,
 * and submits the approve/reject server action. `LivePoller` already
 * refreshes the underlying data on a 10s cadence, so we don't poll here
 * separately — actions trigger an immediate `revalidatePath` server-side.
 *
 * The dock self-hides when both queues are empty. No empty-state noise.
 */

type Props = {
  exerciseId: string;
  decisions: DecisionApprovalItem[];
  comms: CommsApprovalItem[];
};

type SelectedDecision = { kind: "decision"; item: DecisionApprovalItem };
type SelectedComms = { kind: "comms"; item: CommsApprovalItem };
type Selected = SelectedDecision | SelectedComms | null;

export default function MyApprovalsDock({ exerciseId, decisions, comms }: Props) {
  const [selected, setSelected] = useState<Selected>(null);

  const total = decisions.length + comms.length;
  if (total === 0) return null;

  return (
    <section
      className="rounded-xl border border-amber-300 bg-amber-50/60 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/20"
      aria-label="Approvals waiting for you"
    >
      <header className="flex flex-wrap items-center gap-2">
        <ShieldCheck size={16} className="text-amber-700 dark:text-amber-300" />
        <h2 className="font-display text-sm font-semibold text-amber-900 dark:text-amber-100">
          Awaiting your approval
        </h2>
        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
          {total}
        </span>
        <span className="ml-auto text-[11px] text-amber-800/80 dark:text-amber-200/80">
          Click an item to review + decide.
        </span>
      </header>

      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {decisions.map((d) => (
          <li key={d.decisionId}>
            <button
              type="button"
              onClick={() => setSelected({ kind: "decision", item: d })}
              className="group flex w-full items-center gap-2 rounded-md border border-amber-200 bg-surface-1 px-2.5 py-2 text-left text-[12px] hover:border-amber-400 dark:border-amber-900/60"
            >
              <Gavel size={13} className="shrink-0 text-amber-700 dark:text-amber-300" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{d.title}</span>
                <span className="block truncate text-[10px] text-soft">
                  Decision · {humanDecisionType(d.decisionType)}
                  {d.authorRole ? ` · from ${d.authorRole}` : ""}
                </span>
              </span>
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                {d.approverRolesRequired.join(" + ")}
              </span>
            </button>
          </li>
        ))}
        {comms.map((c) => (
          <li key={c.draftId}>
            <button
              type="button"
              onClick={() => setSelected({ kind: "comms", item: c })}
              className="group flex w-full items-center gap-2 rounded-md border border-amber-200 bg-surface-1 px-2.5 py-2 text-left text-[12px] hover:border-amber-400 dark:border-amber-900/60"
            >
              <FileCheck2 size={13} className="shrink-0 text-amber-700 dark:text-amber-300" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{c.subject}</span>
                <span className="block truncate text-[10px] text-soft">
                  Comms · {c.stakeholder ?? c.audience}
                  {c.authorName ? ` · from ${c.authorName}` : ""}
                </span>
              </span>
              {c.assignedToMe ? (
                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
                  Assigned
                </span>
              ) : (
                <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] text-soft">
                  Default approver
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected?.kind === "decision"
            ? "Decision approval"
            : selected?.kind === "comms"
              ? "Comms approval"
              : ""
        }
        width="md"
      >
        {selected?.kind === "decision" && (
          <DecisionApprovalBody
            exerciseId={exerciseId}
            item={selected.item}
            onClose={() => setSelected(null)}
          />
        )}
        {selected?.kind === "comms" && (
          <CommsApprovalBody
            exerciseId={exerciseId}
            item={selected.item}
            onClose={() => setSelected(null)}
          />
        )}
      </Drawer>
    </section>
  );
}

function DecisionApprovalBody({
  exerciseId,
  item,
  onClose,
}: {
  exerciseId: string;
  item: DecisionApprovalItem;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4 p-4">
      <header>
        <h3 className="font-display text-base font-semibold text-ink">{item.title}</h3>
        <p className="mt-1 text-[11px] text-soft">
          {humanDecisionType(item.decisionType)} · taken at D-Day {item.dDayTime}
          {item.authorName ? ` · ${item.authorName}` : ""}
          {item.authorRole ? ` (${item.authorRole})` : ""}
        </p>
      </header>

      {item.rationale && (
        <section className="rounded-md border border-line bg-surface-2/40 p-3 text-[13px] leading-relaxed text-ink">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Rationale</p>
          <p className="mt-1 whitespace-pre-wrap">{item.rationale}</p>
        </section>
      )}

      <section className="text-[11px] text-soft">
        <p>
          Policy requires approval from:{" "}
          <span className="font-semibold text-ink">
            {item.approverRolesRequired.join(" + ")}
          </span>
        </p>
        <p className="mt-1">
          Approving stamps you as the named approver and writes to the
          incident audit trail. The decision is then formally taken — the
          author can act on it from this point.
        </p>
      </section>

      <footer className="flex items-center justify-end gap-2 border-t border-line pt-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
        >
          <X size={13} />
          Close
        </button>
        <ToastForm
          action={approveDecisionAction}
          toast={{ success: "Decision approved" }}
        >
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="decisionId" value={item.decisionId} />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            <CheckCircle2 size={13} />
            Approve
          </button>
        </ToastForm>
      </footer>
    </div>
  );
}

function CommsApprovalBody({
  exerciseId,
  item,
  onClose,
}: {
  exerciseId: string;
  item: CommsApprovalItem;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4 p-4">
      <header>
        <h3 className="font-display text-base font-semibold text-ink">{item.subject}</h3>
        <p className="mt-1 text-[11px] text-soft">
          To {item.stakeholder ?? item.audience}
          {item.authorName ? ` · drafted by ${item.authorName}` : ""}
        </p>
      </header>

      <section className="rounded-md border border-line bg-surface-2/40 p-3 text-[13px] leading-relaxed text-ink">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Body</p>
        <p className="mt-1 whitespace-pre-wrap">{item.body}</p>
      </section>

      <section className="text-[11px] text-soft">
        <p>
          Approving releases the draft to be sent. Rejecting bounces it
          back to the author with your reason; they can revise + re-submit.
        </p>
      </section>

      <footer className="space-y-2 border-t border-line pt-3">
        <ToastForm
          action={approveCommsAction}
          toast={{ success: "Comms approved" }}
        >
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="draftId" value={item.draftId} />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
            >
              <X size={13} />
              Close
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              <CheckCircle2 size={13} />
              Approve
            </button>
          </div>
        </ToastForm>

        <details className="rounded-md border border-line bg-surface-1 p-2 text-[12px]">
          <summary className="cursor-pointer font-medium text-rose-700 dark:text-rose-300">
            Reject with reason
          </summary>
          <ToastForm
            action={rejectCommsAction}
            toast={{ success: "Comms rejected" }}
            className="mt-2 space-y-2"
          >
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <input type="hidden" name="draftId" value={item.draftId} />
            <textarea
              name="reason"
              required
              rows={3}
              placeholder="e.g. Adjust language re: customer impact; resubmit" aria-label="e.g. Adjust language re: customer impact; resubmit"
              className="w-full rounded-md border border-line bg-surface-1 px-2 py-1.5 text-[12px]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Send rejection
            </button>
          </ToastForm>
        </details>
      </footer>
    </div>
  );
}

function humanDecisionType(code: string): string {
  return code
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
