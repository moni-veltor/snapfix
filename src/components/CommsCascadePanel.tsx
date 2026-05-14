"use client";

import { useState, useTransition } from "react";
import {
  approveCommsAction,
  rejectCommsAction,
  sendCommsAction,
  submitCommsForApprovalAction,
} from "@/app/actions/comms";

type Draft = {
  id: string;
  stakeholder: string | null;
  audience: string;
  subject: string;
  body: string;
  status: string;
  author: string;
  approver: string | null;
  approvedAt: Date | null;
  sentAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
};

type Props = {
  exerciseId: string;
  drafts: Draft[];
};

const CASCADE_ORDER = [
  "EMPLOYEES",
  "CUSTOMERS",
  "THIRD_PARTY_VENDORS",
  "INTERMEDIARIES",
  "REGULATORS",
  "ICO",
  "MEDIA",
  "SHAREHOLDERS",
  "INSURERS",
  "OTHER",
];

export default function CommsCascadePanel({ exerciseId, drafts }: Props) {
  const employeeSent = drafts.some(
    (d) => d.stakeholder === "EMPLOYEES" && d.status === "SENT",
  );

  const grouped = new Map<string, Draft[]>();
  for (const d of drafts) {
    const key = d.stakeholder ?? "OTHER";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(d);
  }

  const groups = CASCADE_ORDER.filter((s) => grouped.has(s));

  if (drafts.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line-strong bg-surface-1 p-4 text-center text-xs text-muted">
        No comms drafts yet. Use the <strong>Comms draft</strong> tab above.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted">
        Cascade rule (best practice: <strong>Employees BEFORE</strong> customers / third
        parties. Customers <strong>WITH</strong> third parties. Media <strong>WITH</strong>{" "}
        customers. The platform blocks sending out-of-order.
      </p>
      {groups.map((stakeholder) => (
        <div key={stakeholder}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {STAKEHOLDER_LABEL[stakeholder] ?? stakeholder}
            </span>
            {!employeeSent && CASCADE_BLOCKED_UNTIL_EMPLOYEES.includes(stakeholder) && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
                blocked until employee comms sent
              </span>
            )}
          </div>
          <ul className="mt-1 space-y-2">
            {grouped.get(stakeholder)!.map((d) => (
              <DraftRow key={d.id} exerciseId={exerciseId} draft={d} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function DraftRow({ exerciseId, draft }: { exerciseId: string; draft: Draft }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);

  const send = () =>
    start(async () => {
      const fd = new FormData();
      fd.set("exerciseId", exerciseId);
      fd.set("draftId", draft.id);
      const res = await sendCommsAction(fd);
      setError(res?.error ?? null);
    });

  return (
    <li className={`rounded-md border p-2 text-sm ${STATUS_CLASS[draft.status] ?? "border-line bg-surface-1"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">{draft.audience}</span>
            <StatusBadge status={draft.status} />
            <span>· {draft.author}</span>
            {draft.approver && <span>· approved by {draft.approver}</span>}
            {draft.sentAt && <span>· sent {draft.sentAt.toISOString().slice(11, 16)}</span>}
          </div>
          <div className="mt-1 font-medium text-ink">{draft.subject}</div>
          <p className="mt-0.5 line-clamp-2 text-xs text-ink">{draft.body}</p>
          {draft.rejectionReason && (
            <p className="mt-1 text-[11px] text-rose-700">
              Rejected: {draft.rejectionReason}
            </p>
          )}
          {error && <p className="mt-1 text-[11px] text-rose-700">{error}</p>}
        </div>
        <div className="flex flex-col gap-1">
          {draft.status === "DRAFT" && (
            <form action={submitCommsForApprovalAction}>
              <input type="hidden" name="exerciseId" value={exerciseId} />
              <input type="hidden" name="draftId" value={draft.id} />
              <button className="rounded border border-line-strong px-2 py-0.5 text-[11px] hover:bg-surface-0">
                Submit for approval
              </button>
            </form>
          )}
          {draft.status === "AWAITING_APPROVAL" && (
            <>
              <form action={approveCommsAction}>
                <input type="hidden" name="exerciseId" value={exerciseId} />
                <input type="hidden" name="draftId" value={draft.id} />
                <button className="rounded bg-emerald-600 px-2 py-0.5 text-[11px] text-white">
                  Approve
                </button>
              </form>
              <button
                type="button"
                onClick={() => setRejectOpen(true)}
                className="rounded border border-rose-300 px-2 py-0.5 text-[11px] text-rose-700"
              >
                Reject
              </button>
            </>
          )}
          {(draft.status === "APPROVED" || draft.status === "AWAITING_APPROVAL") && (
            <button
              onClick={send}
              disabled={pending}
              className="rounded bg-slate-900 px-2 py-0.5 text-[11px] text-white disabled:bg-slate-400"
            >
              {pending ? "Sending…" : "Send"}
            </button>
          )}
        </div>
      </div>

      {rejectOpen && (
        <form
          action={async (fd) => {
            await rejectCommsAction(fd);
            setRejectOpen(false);
          }}
          className="mt-2 flex gap-2 rounded bg-surface-0 p-2"
        >
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="draftId" value={draft.id} />
          <input
            name="reason"
            required
            placeholder="Reason for rejection"
            className="flex-1 rounded border border-line-strong px-2 py-1 text-xs"
          />
          <button className="rounded bg-rose-600 px-2 py-1 text-[11px] text-white">
            Confirm reject
          </button>
        </form>
      )}
    </li>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status] ?? "bg-surface-2 text-ink";
  return <span className={`rounded-full px-1.5 py-0.5 ${cls}`}>{status.replace("_", " ")}</span>;
}

const STATUS_CLASS: Record<string, string> = {
  DRAFT: "border-line bg-surface-1",
  AWAITING_APPROVAL: "border-amber-300 bg-amber-50",
  APPROVED: "border-indigo-300 bg-indigo-50",
  SENT: "border-emerald-300 bg-emerald-50",
  REJECTED: "border-rose-300 bg-rose-50",
};
const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-surface-2 text-ink",
  AWAITING_APPROVAL: "bg-amber-600 text-white",
  APPROVED: "bg-indigo-600 text-white",
  SENT: "bg-emerald-600 text-white",
  REJECTED: "bg-rose-600 text-white",
};

const STAKEHOLDER_LABEL: Record<string, string> = {
  EMPLOYEES: "Employees",
  CUSTOMERS: "Customers",
  THIRD_PARTY_VENDORS: "Third-party vendors",
  INTERMEDIARIES: "Intermediaries",
  REGULATORS: "Regulators",
  ICO: "ICO",
  MEDIA: "Media",
  SHAREHOLDERS: "Shareholders",
  INSURERS: "Insurers",
  OTHER: "Other",
};

const CASCADE_BLOCKED_UNTIL_EMPLOYEES = [
  "CUSTOMERS",
  "MEDIA",
  "THIRD_PARTY_VENDORS",
  "INTERMEDIARIES",
];
