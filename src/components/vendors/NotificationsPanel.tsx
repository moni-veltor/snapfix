"use client";

import { useState } from "react";
import { CheckCircle2, Download, FileSignature, Plus, Send, X } from "lucide-react";
import {
  flipNotificationStatusAction,
  generateNotificationAction,
} from "@/app/actions/vendor-notifications";
import { MTP_SUBMISSION_TYPE_LABEL } from "@/lib/mtp-taxonomy";

type Notification = {
  id: string;
  submissionType: string;
  submissionId: number;
  reportingDate: Date;
  status: "DRAFT" | "SUBMITTED" | "ACKNOWLEDGED";
  submittedAt: Date | null;
  acknowledgedAt: Date | null;
  ackReference: string | null;
  xlsxBlobUrl: string | null;
  createdAt: Date;
  changeNarrative: string | null;
};

type Props = {
  vendorId: string;
  vendorName: string;
  isMTP: boolean;
  registerReady: boolean;
  canEdit: boolean;
  notifications: Notification[];
};

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  SUBMITTED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  ACKNOWLEDGED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
};

export default function NotificationsPanel({
  vendorId,
  vendorName,
  isMTP,
  registerReady,
  canEdit,
  notifications,
}: Props) {
  const [open, setOpen] = useState(false);
  const [submissionType, setSubmissionType] = useState("NEW_CONTRACT");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <FileSignature size={14} className="text-indigo-600 dark:text-indigo-300" />
            MTP notifications
          </h2>
          <p className="mt-0.5 text-[11px] text-soft">
            File a contract-change / renewal / exit / breach / material-incident notification.
            XLSX matches the official Annex 3 notification template.
          </p>
        </div>
        {canEdit && isMTP && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={!registerReady}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:bg-surface-2 disabled:text-soft"
            title={registerReady ? "" : "Fill out required fields above first"}
          >
            <Plus size={11} />
            File a notification
          </button>
        )}
      </header>

      {!isMTP && (
        <p className="rounded-md border border-dashed border-line bg-surface-0 p-3 text-[11px] text-muted">
          Mark this vendor as a Material Third Party (above) to enable notification filing.
        </p>
      )}

      {isMTP && !registerReady && (
        <p className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
          Vendor is not register-ready. Fill out the required fields above to 100% before filing
          a notification — the regulator won&apos;t accept partial submissions.
        </p>
      )}

      {open && (
        <form
          action={async (fd) => {
            await generateNotificationAction(fd);
            setOpen(false);
          }}
          className="space-y-3 rounded-md border border-line bg-surface-0 p-4"
        >
          <input type="hidden" name="vendorId" value={vendorId} />
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold text-ink">New notification for {vendorName}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-soft hover:text-ink"
            >
              <X size={11} />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-[11px]">
              <span className="text-muted">Submission type</span>
              <select
                name="submissionType"
                required
                value={submissionType}
                onChange={(e) => setSubmissionType(e.target.value)}
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              >
                {Object.entries(MTP_SUBMISSION_TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px]">
              <span className="text-muted">Reporting date</span>
              <input
                type="date"
                name="reportingDate"
                required
                defaultValue={today}
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          {submissionType === "CONTRACT_RENEWAL" && (
            <label className="block text-[11px]">
              <span className="text-muted">Significant changes</span>
              <textarea
                name="changeNarrative"
                rows={3}
                placeholder="Short description of the changes made to the renewed contract" aria-label="Short description of the changes made to the renewed contract"
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              />
            </label>
          )}
          <label className="block text-[11px]">
            <span className="text-muted">Internal note (not filed with the regulator)</span>
            <textarea
              name="notificationNote"
              rows={2}
              placeholder="Why you're filing this notification + any context for future audit" aria-label="Why you're filing this notification + any context for future audit"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-[11px] text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">
              <Send size={11} />
              Generate XLSX + create draft
            </button>
          </div>
        </form>
      )}

      {notifications.length === 0 ? (
        <p className="text-[11px] text-soft">No notifications filed for this vendor yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-line bg-surface-0 p-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink">
                  {MTP_SUBMISSION_TYPE_LABEL[n.submissionType] ?? n.submissionType} · #{n.submissionId}
                  <span
                    className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${STATUS_TONE[n.status]}`}
                  >
                    {n.status}
                  </span>
                </p>
                <p className="text-[10px] text-soft">
                  Reporting {n.reportingDate.toISOString().slice(0, 10)}
                  {n.submittedAt && ` · submitted ${n.submittedAt.toISOString().slice(0, 10)}`}
                  {n.acknowledgedAt && ` · acknowledged ${n.acknowledgedAt.toISOString().slice(0, 10)}`}
                  {n.ackReference && ` (${n.ackReference})`}
                </p>
                {n.changeNarrative && (
                  <p className="mt-0.5 text-[10px] italic text-muted">&ldquo;{n.changeNarrative.slice(0, 100)}{n.changeNarrative.length > 100 ? "…" : ""}&rdquo;</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {n.xlsxBlobUrl && (
                  <a
                    href={n.xlsxBlobUrl}
                    className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2 py-1 text-[10px] font-medium text-ink hover:border-line-strong"
                  >
                    <Download size={9} />
                    XLSX
                  </a>
                )}
                {canEdit && n.status === "DRAFT" && (
                  <form action={flipNotificationStatusAction}>
                    <input type="hidden" name="vendorId" value={vendorId} />
                    <input type="hidden" name="notificationId" value={n.id} />
                    <input type="hidden" name="status" value="SUBMITTED" />
                    <button className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500">
                      <Send size={9} />
                      Mark filed
                    </button>
                  </form>
                )}
                {canEdit && n.status === "SUBMITTED" && (
                  <form action={flipNotificationStatusAction} className="flex items-center gap-1">
                    <input type="hidden" name="vendorId" value={vendorId} />
                    <input type="hidden" name="notificationId" value={n.id} />
                    <input type="hidden" name="status" value="ACKNOWLEDGED" />
                    <input
                      type="text"
                      name="ackReference"
                      placeholder="Ack ref" aria-label="Ack ref"
                      maxLength={120}
                      className="w-24 rounded border border-line-strong bg-surface-1 px-1.5 py-0.5 text-[10px]"
                    />
                    <button className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500">
                      <CheckCircle2 size={9} />
                      Ack
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
