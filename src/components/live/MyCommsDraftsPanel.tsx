"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Mail,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useChangeDetector, type ChangeEvent } from "@/lib/use-change-detector";

type MyDraft = {
  id: string;
  stakeholder: string | null;
  subject: string;
  body: string;
  status: string;
  approver: string | null;
  approvedAt: Date | null;
  sentAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
};

type Props = {
  drafts: MyDraft[];
};

const STATUS_TONE: Record<string, { pill: string; icon: typeof Clock; label: string }> = {
  DRAFT: {
    pill: "bg-surface-2 text-muted",
    icon: Mail,
    label: "Drafted — not yet submitted",
  },
  PENDING_APPROVAL: {
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    icon: Clock,
    label: "Awaiting approval",
  },
  APPROVED: {
    pill: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
    icon: CheckCircle2,
    label: "Approved — ready to send",
  },
  REJECTED: {
    pill: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    icon: XCircle,
    label: "Rejected — see reason",
  },
  SENT: {
    pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    icon: Send,
    label: "Sent",
  },
};

/**
 * Participant-focused view of comms drafts the current user authored.
 * Sits above the org-wide CommsCascadePanel on the comms tab so the
 * drafter can immediately see "did my message get approved? is it stuck?"
 * without scrolling through the whole stakeholder cascade.
 */
export default function MyCommsDraftsPanel({ drafts }: Props) {
  const onChange = useCallback((event: ChangeEvent<MyDraft>) => {
    const d = event.item;
    const stakeholder = d.stakeholder ? d.stakeholder.replace(/_/g, " ").toLowerCase() : "stakeholder";
    if (event.kind === "added") return; // own-drafts list — author already knows they created it
    switch (d.status) {
      case "APPROVED":
        toast.success(`Your ${stakeholder} comms was approved`, {
          description: d.subject,
        });
        return;
      case "REJECTED":
        toast.error(`Your ${stakeholder} comms was rejected`, {
          description: d.rejectionReason ?? "See the panel for the reason.",
        });
        return;
      case "SENT":
        toast.success(`Your ${stakeholder} comms was sent`, {
          description: d.subject,
        });
        return;
    }
  }, []);
  const flashing = useChangeDetector(drafts, signatureOf, onChange);

  if (drafts.length === 0) return null;

  const sorted = [...drafts].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  // Count by status for the header summary
  const counts = sorted.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="space-y-2 rounded-xl border border-line bg-surface-1 p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Mail size={13} />
          Your drafts
          <span className="text-xs font-normal text-soft">
            {sorted.length} item{sorted.length === 1 ? "" : "s"}
          </span>
        </h3>
        <div className="flex flex-wrap items-center gap-1">
          {(["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "REJECTED"] as const).map(
            (s) => {
              const c = counts[s] ?? 0;
              if (c === 0) return null;
              const tone = STATUS_TONE[s];
              return (
                <span
                  key={s}
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.pill}`}
                >
                  {c} {labelShort(s)}
                </span>
              );
            },
          )}
        </div>
      </header>

      <ul className="space-y-1.5">
        {sorted.map((d) => {
          const tone = STATUS_TONE[d.status] ?? STATUS_TONE.DRAFT;
          const Icon = tone.icon;
          const isFlashing = flashing.has(d.id);
          return (
            <li
              key={d.id}
              className={`rounded-md border p-2.5 text-sm ${borderFromStatus(d.status)} ${isFlashing ? "ring-2 ring-amber-300 ring-offset-1 dark:ring-amber-400/60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.pill}`}
                    >
                      <Icon size={9} />
                      {labelShort(d.status)}
                    </span>
                    {d.stakeholder && (
                      <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        {d.stakeholder.replace(/_/g, " ")}
                      </span>
                    )}
                    <span className="text-[10px] text-soft">
                      {d.createdAt.toISOString().slice(11, 16)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-sm font-medium text-ink">
                    <span className="truncate">{d.subject}</span>
                    {isFlashing && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                        <Sparkles size={9} />
                        Updated
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted">{d.body}</p>
                  <p className="mt-1 text-[10px] text-soft">{tone.label}</p>
                  {d.status === "REJECTED" && d.rejectionReason && (
                    <p className="mt-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-200">
                      Reason: {d.rejectionReason}
                    </p>
                  )}
                  {d.approver && (d.status === "APPROVED" || d.status === "SENT") && (
                    <p className="mt-1 text-[10px] text-soft">
                      {d.status === "SENT"
                        ? `Sent at ${d.sentAt?.toISOString().slice(11, 16) ?? "—"} · approved by ${d.approver}`
                        : `Approved by ${d.approver}${d.approvedAt ? ` at ${d.approvedAt.toISOString().slice(11, 16)}` : ""}`}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function signatureOf(d: MyDraft): string {
  return `${d.status}::${d.rejectionReason ?? ""}`;
}

function labelShort(status: string): string {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Pending";
    case "REJECTED":
      return "Rejected";
    case "APPROVED":
      return "Approved";
    case "SENT":
      return "Sent";
    case "DRAFT":
    default:
      return "Draft";
  }
}

function borderFromStatus(status: string): string {
  switch (status) {
    case "REJECTED":
      return "border-rose-200 bg-rose-50/40 dark:border-rose-800/60 dark:bg-rose-950/20";
    case "APPROVED":
      return "border-cyan-200 bg-cyan-50/40 dark:border-cyan-800/60 dark:bg-cyan-950/20";
    case "SENT":
      return "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800/60 dark:bg-emerald-950/20";
    case "PENDING_APPROVAL":
      return "border-amber-200 bg-amber-50/40 dark:border-amber-800/60 dark:bg-amber-950/20";
    default:
      return "border-line bg-surface-1";
  }
}
