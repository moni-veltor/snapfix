"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import {
  bulkInviteMembersAction,
  type BulkInviteResult,
} from "@/app/actions/org";

/**
 * Bulk CSV import for member invitations. Admins paste a CSV (or upload a
 * file that we read client-side into the textarea), submit, and get a
 * per-row outcome table back.
 */
export default function OrgBulkImportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
      >
        <Upload size={14} strokeWidth={2.2} />
        Bulk import
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Bulk-invite from CSV"
        subtitle="Paste up to 500 rows (email, role). One invitation per row — invites are created but not auto-emailed; accept URLs come back so you can send via your own broadcast."
        size="lg"
      >
        <BulkImportForm />
      </Modal>
    </>
  );
}

function BulkImportForm() {
  const [state, action, pending] = useActionState<BulkInviteResult | undefined, FormData>(
    bulkInviteMembersAction,
    undefined,
  );
  const [csv, setCsv] = useState("");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? "");
      setCsv(text);
    };
    reader.readAsText(f);
  }

  return (
    <form action={action} className="space-y-4 text-sm">
      <div>
        <label className="block text-xs">
          <span className="text-soft">Upload a CSV file</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="mt-1 block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-surface-1"
          />
        </label>
        <p className="mt-1 text-[10px] text-soft">
          Or paste rows directly into the textarea below.
        </p>
      </div>

      <label className="block text-xs">
        <span className="text-soft">CSV payload</span>
        <textarea
          name="csv"
          required
          rows={10}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={`email,role\nalice@bank.com,ADMIN\nbob@bank.com,MEMBER\ncharlie@bank.com,MEMBER`}
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 font-mono text-xs"
        />
        <span className="mt-1 block text-[10px] text-soft">
          Header row optional. Roles: ADMIN or MEMBER (case-insensitive). Blank or
          unrecognised → defaults to MEMBER. Maximum 500 rows.
        </span>
      </label>

      {state && !state.ok && (
        <p className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}

      {state?.ok && (
        <div className="space-y-2 rounded-md border border-line bg-surface-0 p-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-ink">Result</span>
            <Pill tone="ok">{state.created} created</Pill>
            <Pill tone="info">{state.updated} refreshed</Pill>
            {state.skipped > 0 && <Pill tone="neutral">{state.skipped} skipped</Pill>}
            {state.errors > 0 && <Pill tone="critical">{state.errors} errors</Pill>}
            <span className="text-[10px] text-soft">{state.total} rows total</span>
          </div>
          {state.rows.length > 0 && (
            <details className="text-[11px] text-muted">
              <summary className="cursor-pointer text-muted hover:text-ink">
                Per-row detail
              </summary>
              <ul className="mt-1.5 space-y-0.5">
                {state.rows.map((r) => (
                  <li key={`${r.row}-${r.email}`} className="flex items-baseline gap-2">
                    <span className="w-8 shrink-0 font-mono text-[10px] text-soft">
                      #{r.row}
                    </span>
                    <span
                      className={`w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wider ${
                        r.status === "created"
                          ? "text-emerald-700 dark:text-emerald-300"
                          : r.status === "updated"
                            ? "text-cyan-700 dark:text-cyan-300"
                            : r.status === "skipped"
                              ? "text-soft"
                              : "text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-ink">
                      {r.email}
                    </span>
                    {r.reason && (
                      <span className="text-[10px] text-soft">— {r.reason}</span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {state.created > 0 && (
            <p className="flex items-start gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={11} className="mt-0.5 shrink-0" />
              Invitations are in the pending list — accept URLs can be re-fetched via the
              Resend action.
            </p>
          )}
        </div>
      )}

      <footer className="flex items-center justify-end gap-2 border-t border-line pt-3">
        <button
          type="submit"
          disabled={pending || csv.trim().length === 0}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {pending ? "Processing…" : "Import"}
        </button>
      </footer>
    </form>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "ok" | "info" | "neutral" | "critical";
}) {
  const cls =
    tone === "ok"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
      : tone === "info"
        ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200"
        : tone === "critical"
          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
          : "bg-surface-2 text-muted";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {children}
    </span>
  );
}
