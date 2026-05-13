"use client";

import { transitionRegulatorNotificationAction, flagDataBreachAction } from "@/app/actions/regulator";
import Section from "@/components/ui/Section";
import Pill from "@/components/ui/Pill";
import Countdown from "@/components/ui/Countdown";
import Button from "@/components/ui/Button";
import PolicyHint from "@/components/ui/PolicyHint";

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
      title={
        <>
          Regulator clocks
          <PolicyHint clause="IMP §6.3.1.2">
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
            <Button variant="warn" size="sm" type="submit">
              Flag data breach (ICO 72h)
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
  const isSent = c.status === "SENT";
  const isWaived = c.status === "WAIVED";
  return (
    <li className="rounded-md border border-line bg-surface-1 p-2 text-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Pill variant="critical" tone="solid">{c.regulator}</Pill>
            <span className="text-slate-700 dark:text-slate-200">{c.trigger}</span>
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
          {!isSent && !isWaived && (
            <form action={transitionRegulatorNotificationAction}>
              <input type="hidden" name="exerciseId" value={exerciseId} />
              <input type="hidden" name="notificationId" value={c.id} />
              <select
                name="status"
                defaultValue={c.status}
                onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()}
                className="rounded border border-line-strong bg-surface-1 px-1.5 py-0.5 text-[11px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_DRAFT">In draft</option>
                <option value="AWAITING_APPROVAL">Awaiting approval</option>
                <option value="SENT">Sent</option>
                <option value="WAIVED">Waive (documented)</option>
              </select>
            </form>
          )}
        </div>
      </div>
      {c.waiverRationale && (
        <p className="mt-1 text-[11px] text-muted dark:text-soft">
          <strong>Waiver:</strong> {c.waiverRationale}
        </p>
      )}
    </li>
  );
}
