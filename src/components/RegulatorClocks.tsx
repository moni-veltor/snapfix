"use client";

import { useState } from "react";
import { Landmark, AlertTriangle, ChevronRight, X } from "lucide-react";
import { transitionRegulatorNotificationAction, flagDataBreachAction } from "@/app/actions/regulator";
import Section from "@/components/ui/Section";
import Pill from "@/components/ui/Pill";
import Countdown from "@/components/ui/Countdown";
import Button from "@/components/ui/Button";
import PolicyHint from "@/components/ui/PolicyHint";
import Drawer from "@/components/ui/Drawer";
import ToastForm from "@/components/ui/ToastForm";

type Clock = {
  id: string;
  regulator: string;
  trigger: string;
  slaHours: number;
  dueAt: Date;
  status: string;
  sentAt: Date | null;
  ownerRoleTitle: string | null;
  approverRoleTitle: string | null;
  waiverRationale: string | null;
};

type Props = {
  exerciseId: string;
  incidentId: string | null;
  clocks: Clock[];
};

export default function RegulatorClocks({ exerciseId, incidentId, clocks }: Props) {
  if (clocks.length === 0 && !incidentId) return null;

  return (
    <Section
      icon={Landmark}
      title={
        <>
          Regulator clocks
          <PolicyHint>
            FCA + PRA: 4h post-invocation for High severity. ICO: 72h. Closure FCA/PRA: 2 business
            days.
          </PolicyHint>
        </>
      }
      right={
        incidentId && (
          <form action={flagDataBreachAction}>
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <input type="hidden" name="incidentId" value={incidentId} />
            <Button variant="warn" size="sm" icon={AlertTriangle} type="submit">
              Flag data breach
            </Button>
          </form>
        )
      }
    >
      {clocks.length === 0 ? (
        <p className="text-xs text-muted dark:text-soft">
          No regulator notifications required yet. FCA + PRA clocks start automatically on a
          High-severity invocation.
        </p>
      ) : (
        <ul className="space-y-2">
          {clocks.map((c) => (
            <ClockRow key={c.id} exerciseId={exerciseId} c={c} />
          ))}
        </ul>
      )}
    </Section>
  );
}

function ClockRow({ exerciseId, c }: { exerciseId: string; c: Clock }) {
  const [open, setOpen] = useState(false);
  const isWaived = c.status === "WAIVED";
  return (
    <li className="rounded-md border border-line bg-surface-1 text-sm dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full flex-wrap items-center justify-between gap-2 p-2 text-left hover:bg-surface-2/40"
        aria-label={`Open ${c.regulator} notification`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Pill variant="critical" tone="solid">{c.regulator}</Pill>
            <span className="text-ink dark:text-slate-200">{c.trigger}</span>
            <span className="text-soft">·</span>
            <span className="text-muted dark:text-soft">SLA {c.slaHours}h</span>
            {c.ownerRoleTitle && (
              <span className="text-muted dark:text-soft">· owner {c.ownerRoleTitle}</span>
            )}
            {c.approverRoleTitle && (
              <span className="text-muted dark:text-soft">
                · approver {c.approverRoleTitle}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Countdown dueAt={c.dueAt} sentAt={c.sentAt} waived={isWaived} />
          <ChevronRight size={14} className="text-soft" />
        </div>
      </button>
      {c.waiverRationale && (
        <p className="px-2 pb-2 text-[11px] text-muted dark:text-soft">
          <strong>Waiver:</strong> {c.waiverRationale}
        </p>
      )}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={`${c.regulator} notification`}
        subtitle={c.trigger}
        width="md"
      >
        <RegulatorNotificationDetail
          exerciseId={exerciseId}
          c={c}
          onClose={() => setOpen(false)}
        />
      </Drawer>
    </li>
  );
}

function RegulatorNotificationDetail({
  exerciseId,
  c,
  onClose,
}: {
  exerciseId: string;
  c: Clock;
  onClose: () => void;
}) {
  const isSent = c.status === "SENT";
  const isWaived = c.status === "WAIVED";
  return (
    <div className="space-y-4 p-4 text-sm">
      <section className="rounded-md border border-line bg-surface-2/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Pill variant="critical" tone="solid">{c.regulator}</Pill>
          <Countdown dueAt={c.dueAt} sentAt={c.sentAt} waived={isWaived} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">SLA</dt>
            <dd className="font-mono text-ink">{c.slaHours}h</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">Status</dt>
            <dd className="font-medium text-ink">{c.status.replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">Owner role</dt>
            <dd className="text-ink">{c.ownerRoleTitle ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">Approver role</dt>
            <dd className="text-ink">{c.approverRoleTitle ?? "—"}</dd>
          </div>
        </dl>
        {c.waiverRationale && (
          <p className="mt-3 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>Existing waiver:</strong> {c.waiverRationale}
          </p>
        )}
      </section>

      {!isSent && !isWaived && (
        <>
          <section>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Move through the lifecycle
            </h4>
            <ToastForm
              action={transitionRegulatorNotificationAction}
              toast={{ success: "Notification status updated" }}
              className="mt-2 flex flex-wrap gap-2"
            >
              <input type="hidden" name="exerciseId" value={exerciseId} />
              <input type="hidden" name="notificationId" value={c.id} />
              <select
                name="status"
                defaultValue={c.status}
                className="rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_DRAFT">In draft</option>
                <option value="AWAITING_APPROVAL">Awaiting approval</option>
                <option value="SENT">Sent</option>
              </select>
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Update
              </button>
            </ToastForm>
          </section>

          <section className="border-t border-line pt-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Or waive (documented)
            </h4>
            <p className="mt-1 text-[11px] text-soft">
              Use only when the threshold isn&apos;t met or a waiver path applies. Captured for the
              audit trail.
            </p>
            <ToastForm
              action={transitionRegulatorNotificationAction}
              toast={{ success: "Waiver recorded" }}
              className="mt-2 space-y-2"
            >
              <input type="hidden" name="exerciseId" value={exerciseId} />
              <input type="hidden" name="notificationId" value={c.id} />
              <input type="hidden" name="status" value="WAIVED" />
              <textarea
                name="waiverRationale"
                required
                rows={3}
                placeholder="Why is no notification required? (e.g. severity below threshold; supervisor verbally agreed)"
                className="w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              />
              <button
                type="submit"
                className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-500"
              >
                Record waiver
              </button>
            </ToastForm>
          </section>
        </>
      )}

      <footer className="flex justify-end border-t border-line pt-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
        >
          <X size={13} />
          Close
        </button>
      </footer>
    </div>
  );
}
