"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardSignature, Clock, XCircle } from "lucide-react";
import {
  startAttestationCycleAction,
  decideAttestationAction,
} from "@/app/actions/ibs-attestations";
import { withToast } from "@/lib/toast-action";

type Att = {
  id: string;
  cycle: string;
  line: "FIRST_LINE" | "SECOND_LINE" | "EXECUTIVE";
  status: "REQUESTED" | "ATTESTED" | "REJECTED";
  reviewer: { name: string | null; email: string } | null;
  reviewedAt: string | null;
  comment: string | null;
};

const LINE_LABEL: Record<Att["line"], string> = {
  FIRST_LINE: "1st line (Process owner)",
  SECOND_LINE: "2nd line (Operational risk)",
  EXECUTIVE: "Executive (SMF accountable)",
};

const STATUS_TONE: Record<Att["status"], string> = {
  REQUESTED: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  ATTESTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
};

export default function IBSAttestationPanel({
  ibsId,
  ibsCode,
  attestations,
  canManage,
}: {
  ibsId: string;
  ibsCode: string;
  attestations: Att[];
  canManage: boolean;
}) {
  // Group by cycle, newest cycle first (lexicographic on label works
  // because labels are YYYY-* by convention).
  const byCycle = new Map<string, Att[]>();
  for (const a of attestations) {
    const arr = byCycle.get(a.cycle) ?? [];
    arr.push(a);
    byCycle.set(a.cycle, arr);
  }
  const cycles = Array.from(byCycle.keys()).sort((a, b) => b.localeCompare(a));

  const startAction = withToast(startAttestationCycleAction, {
    success: "Attestation cycle opened",
    description: "Three requests created — 1st line, 2nd line, executive.",
    error: "Couldn't open the attestation cycle",
  });

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-semibold">
            <ClipboardSignature size={15} />
            Attestation
          </h2>
          <p className="text-xs text-muted">
            Annual 3-line-of-defence sign-off (FCA SS1/21). Each cycle requests
            1st-line, 2nd-line and executive attestation; record-keeping captures
            who signed and when.
          </p>
        </div>
        {canManage && (
          <form action={startAction}>
            <input type="hidden" name="ibsId" value={ibsId} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              title="Open a new attestation cycle labelled with the current financial year."
            >
              <ClipboardSignature size={11} />
              Start {new Date().getUTCFullYear()}-FY cycle
            </button>
          </form>
        )}
      </header>

      {cycles.length === 0 ? (
        <div className="rounded-md border border-dashed border-line bg-surface-1 p-6 text-center text-xs text-muted">
          No attestation cycles for {ibsCode} yet. Open one to start the
          three-line-of-defence sign-off chain.
        </div>
      ) : (
        cycles.map((cycle) => (
          <CycleBlock key={cycle} cycle={cycle} attestations={byCycle.get(cycle) ?? []} />
        ))
      )}
    </section>
  );
}

function CycleBlock({
  cycle,
  attestations,
}: {
  cycle: string;
  attestations: Att[];
}) {
  const ordered = (["FIRST_LINE", "SECOND_LINE", "EXECUTIVE"] as Att["line"][]).map(
    (line) => attestations.find((a) => a.line === line),
  );
  const allAttested = attestations.every((a) => a.status === "ATTESTED");
  const anyRejected = attestations.some((a) => a.status === "REJECTED");

  return (
    <article
      className={`rounded-xl border bg-surface-1 ${
        anyRejected
          ? "border-rose-200 dark:border-rose-800/60"
          : allAttested
            ? "border-emerald-300 dark:border-emerald-700/60"
            : "border-line"
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-muted">Cycle</span>
          <span className="font-semibold text-ink">{cycle}</span>
          {allAttested && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 size={10} />
              Fully attested
            </span>
          )}
          {anyRejected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              <XCircle size={10} />
              Has rejection
            </span>
          )}
        </div>
      </header>
      <ul className="divide-y divide-line">
        {ordered.map((a, idx) => (
          <li key={a?.id ?? idx}>
            {a ? <AttestationRow att={a} /> : <span className="block p-3 text-xs text-soft">—</span>}
          </li>
        ))}
      </ul>
    </article>
  );
}

function AttestationRow({ att }: { att: Att }) {
  const [open, setOpen] = useState(false);
  const action = withToast(decideAttestationAction, {
    success: "Attestation recorded",
    error: "Couldn't record this attestation",
  });

  return (
    <div className="space-y-2 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{LINE_LABEL[att.line]}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_TONE[att.status]}`}
            >
              {att.status}
            </span>
          </div>
          {att.reviewer && (
            <p className="mt-0.5 text-[11px] text-muted">
              <Clock size={9} className="mr-1 inline" />
              {att.status === "ATTESTED" ? "Signed by " : "Rejected by "}
              <span className="text-ink">{att.reviewer.name ?? att.reviewer.email}</span>
              {att.reviewedAt && (
                <> on {att.reviewedAt.slice(0, 10)}</>
              )}
            </p>
          )}
          {att.comment && (
            <p className="mt-1 rounded-md border border-line bg-surface-0 p-2 text-[11px] text-muted">
              {att.comment}
            </p>
          )}
        </div>
        {att.status === "REQUESTED" && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-2"
          >
            Sign off / reject
          </button>
        )}
      </div>

      {open && att.status === "REQUESTED" && (
        <form action={action} className="space-y-2 rounded-md border border-line bg-surface-0 p-3">
          <input type="hidden" name="attestationId" value={att.id} />
          <label className="block text-xs">
            <span className="text-soft">Comment (optional)</span>
            <textarea
              name="comment"
              rows={2}
              placeholder="Anything the next reviewer needs to know — caveats, follow-ups, evidence references."
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-xs"
            />
          </label>
          <div className="flex items-center justify-end gap-2">
            <button
              type="submit"
              name="decision"
              value="REJECTED"
              onClick={() => setOpen(false)}
              className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200"
            >
              Reject
            </button>
            <button
              type="submit"
              name="decision"
              value="ATTESTED"
              onClick={() => setOpen(false)}
              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
            >
              Attest
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
