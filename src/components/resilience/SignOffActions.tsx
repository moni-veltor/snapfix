"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ShieldCheck, CircleDashed, Lock, PenLine, Landmark } from "lucide-react";
import { withToast } from "@/lib/toast-action";
import {
  signAttestationLineAction,
  recordBoardApprovalAction,
} from "@/app/actions/resilience-attestation";

export type LineKey = "first" | "second" | "executive";

export type LineState = {
  key: LineKey;
  label: string;
  signedAt: string | null; // ISO
  signerName: string | null;
  notes: string | null;
};

type Props = {
  cycleId: string;
  status: string; // DRAFT | UNDER_REVIEW | ATTESTED | SUPERSEDED
  lines: LineState[];
  board: { approvedAt: string | null; committee: string | null; minuteRef: string | null };
  smfName: string | null;
  /** True when the current viewer is the named SMF (may sign the executive line). */
  viewerIsSMF: boolean;
  /** True when an SMF is configured at all. */
  smfConfigured: boolean;
};

const signAction = withToast(signAttestationLineAction, {
  success: "Signed",
  error: "Couldn't sign",
});
const boardAction = withToast(recordBoardApprovalAction, {
  success: "Board ratification recorded",
  error: "Couldn't record ratification",
});

export default function SignOffActions({
  cycleId,
  status,
  lines,
  board,
  smfName,
  viewerIsSMF,
  smfConfigured,
}: Props) {
  const locked = status === "ATTESTED" || status === "SUPERSEDED";
  const firstSigned = !!lines.find((l) => l.key === "first")?.signedAt;
  const secondSigned = !!lines.find((l) => l.key === "second")?.signedAt;
  const execSigned = !!lines.find((l) => l.key === "executive")?.signedAt;

  return (
    <div className="space-y-3">
      {lines.map((l, i) => {
        const isSigned = !!l.signedAt;
        // Ordering + role gating for the *next* signable line.
        const blockedByOrder =
          (l.key === "second" && !firstSigned) ||
          (l.key === "executive" && (!firstSigned || !secondSigned));
        const blockedByRole = l.key === "executive" && !viewerIsSMF;
        const canSign = !isSigned && !locked && !blockedByOrder && !blockedByRole;

        return (
          <SignRow
            key={l.key}
            index={i + 1}
            cycleId={cycleId}
            line={l}
            isSigned={isSigned}
            canSign={canSign}
            blockedByOrder={blockedByOrder}
            blockedByRole={blockedByRole}
            smfName={smfName}
            smfConfigured={smfConfigured}
          />
        );
      })}

      {/* Board ratification */}
      <BoardRow
        cycleId={cycleId}
        board={board}
        execSigned={execSigned}
        locked={status === "SUPERSEDED"}
      />
    </div>
  );
}

function SignRow({
  index,
  cycleId,
  line,
  isSigned,
  canSign,
  blockedByOrder,
  blockedByRole,
  smfName,
  smfConfigured,
}: {
  index: number;
  cycleId: string;
  line: LineState;
  isSigned: boolean;
  canSign: boolean;
  blockedByOrder: boolean;
  blockedByRole: boolean;
  smfName: string | null;
  smfConfigured: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={`rounded-xl border p-3 ${
        isSigned
          ? "border-emerald-300/50 bg-emerald-50/40 dark:border-emerald-800/50 dark:bg-emerald-950/20"
          : "border-line bg-surface-1"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            isSigned ? "bg-emerald-500 text-white" : "bg-surface-2 text-soft"
          }`}
        >
          {isSigned ? <ShieldCheck size={14} /> : index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink">{line.label}</span>
            {line.key === "executive" && smfName && (
              <span className="text-[11px] text-muted">· {smfName}</span>
            )}
          </div>
          {isSigned ? (
            <p className="mt-0.5 text-[11px] text-muted">
              Signed {line.signedAt!.slice(0, 16).replace("T", " ")} UTC
              {line.signerName && ` by ${line.signerName}`}
              {line.notes && ` — “${line.notes}”`}
            </p>
          ) : (
            <SignRowStatus
              blockedByOrder={blockedByOrder}
              blockedByRole={blockedByRole}
              isExecutive={line.key === "executive"}
              smfConfigured={smfConfigured}
            />
          )}
        </div>

        {canSign && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            <PenLine size={12} />
            Sign
          </button>
        )}
      </div>

      {canSign && open && (
        <form
          action={(fd) => {
            startTransition(() => signAction(fd));
            setOpen(false);
          }}
          className="mt-3 space-y-2 border-t border-line pt-3"
        >
          <input type="hidden" name="cycleId" value={cycleId} />
          <input type="hidden" name="line" value={line.key} />
          <label className="block text-[11px]">
            <span className="text-muted">Note (optional — context for the record)</span>
            <textarea
              name="notes"
              rows={2}
              maxLength={2000}
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
              placeholder="e.g. Signed on the basis of the Q1 remediation plan for IBS_03."
            />
          </label>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] text-soft hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <ShieldCheck size={12} />
              Confirm signature
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function SignRowStatus({
  blockedByOrder,
  blockedByRole,
  isExecutive,
  smfConfigured,
}: {
  blockedByOrder: boolean;
  blockedByRole: boolean;
  isExecutive: boolean;
  smfConfigured: boolean;
}) {
  if (blockedByOrder) {
    return (
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-soft">
        <Lock size={11} /> Waiting on the previous line
      </p>
    );
  }
  if (isExecutive && !smfConfigured) {
    return (
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300">
        <Lock size={11} /> Name the SMF in{" "}
        <Link href="/settings/resilience" className="underline underline-offset-2">
          settings
        </Link>{" "}
        first
      </p>
    );
  }
  if (blockedByRole) {
    return (
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-soft">
        <Lock size={11} /> Only the named SMF can sign this line
      </p>
    );
  }
  return (
    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-soft">
      <CircleDashed size={11} /> Ready to sign
    </p>
  );
}

function BoardRow({
  cycleId,
  board,
  execSigned,
  locked,
}: {
  cycleId: string;
  board: { approvedAt: string | null; committee: string | null; minuteRef: string | null };
  execSigned: boolean;
  locked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const approved = !!board.approvedAt;

  return (
    <div
      className={`rounded-xl border p-3 ${
        approved
          ? "border-emerald-300/50 bg-emerald-50/40 dark:border-emerald-800/50 dark:bg-emerald-950/20"
          : "border-line bg-surface-1"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            approved ? "bg-emerald-500 text-white" : "bg-surface-2 text-soft"
          }`}
        >
          {approved ? <ShieldCheck size={14} /> : <Landmark size={13} />}
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-ink">Board ratification</span>
          {approved ? (
            <p className="mt-0.5 text-[11px] text-muted">
              {board.committee ?? "Board"} · {board.approvedAt!.slice(0, 10)}
              {board.minuteRef && ` · ${board.minuteRef}`}
            </p>
          ) : (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-soft">
              {execSigned ? (
                <>
                  <CircleDashed size={11} /> Ready to record
                </>
              ) : (
                <>
                  <Lock size={11} /> The executive must sign first
                </>
              )}
            </p>
          )}
        </div>
        {!approved && execSigned && !locked && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong"
          >
            <Landmark size={12} />
            Record
          </button>
        )}
      </div>

      {open && (
        <form
          action={(fd) => {
            startTransition(() => boardAction(fd));
            setOpen(false);
          }}
          className="mt-3 grid gap-2 border-t border-line pt-3 sm:grid-cols-2"
        >
          <input type="hidden" name="cycleId" value={cycleId} />
          <label className="block text-[11px]">
            <span className="text-muted">Committee</span>
            <input
              name="committee"
              maxLength={200}
              defaultValue={board.committee ?? ""}
              placeholder="e.g. Board Risk Committee"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-[11px]">
            <span className="text-muted">Minute reference</span>
            <input
              name="minuteRef"
              maxLength={200}
              placeholder="e.g. BRC-2026-03 item 4.2"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
            />
          </label>
          <div className="sm:col-span-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] text-soft hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Landmark size={12} />
              Record ratification
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
