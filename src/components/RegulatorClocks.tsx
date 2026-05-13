"use client";

import { useEffect, useState } from "react";
import { transitionRegulatorNotificationAction, flagDataBreachAction } from "@/app/actions/regulator";

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
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (clocks.length === 0 && !incidentId) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Regulator clocks
        </div>
        {incidentId && (
          <form action={flagDataBreachAction}>
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <input type="hidden" name="incidentId" value={incidentId} />
            <button className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100">
              Flag suspected data breach (start ICO 72h)
            </button>
          </form>
        )}
      </div>
      {clocks.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          No regulator notifications required yet. FCA + PRA clocks start automatically on a
          High-severity invocation (IMP §6.3.1.2).
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {clocks.map((c) => (
            <ClockRow key={c.id} exerciseId={exerciseId} c={c} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ClockRow({ exerciseId, c }: { exerciseId: string; c: Clock }) {
  const now = Date.now();
  const due = c.dueAt.getTime();
  const remainingMs = due - now;
  const isSent = c.status === "SENT";
  const isWaived = c.status === "WAIVED";
  const isBreached = !isSent && !isWaived && remainingMs < 0;
  const cls = isSent
    ? "border-emerald-200 bg-emerald-50"
    : isWaived
      ? "border-slate-200 bg-slate-50"
      : isBreached
        ? "border-rose-400 bg-rose-50"
        : remainingMs < 30 * 60 * 1000
          ? "border-amber-300 bg-amber-50"
          : "border-slate-200 bg-white";
  return (
    <li className={`rounded-md border p-2 text-sm ${cls}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-slate-900 px-2 py-0.5 font-semibold text-white">
              {c.regulator}
            </span>
            <span className="text-slate-700">{c.trigger}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">SLA {c.slaHours}h</span>
            {c.ownerRoleTitle && (
              <span className="text-slate-500">· owner {c.ownerRoleTitle}</span>
            )}
            {c.approverRoleTitle && (
              <span className="text-slate-500">· approver {c.approverRoleTitle}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CountdownPill
            isSent={isSent}
            isWaived={isWaived}
            isBreached={isBreached}
            remainingMs={remainingMs}
            sentAt={c.sentAt}
          />
          {!isSent && !isWaived && (
            <form action={transitionRegulatorNotificationAction}>
              <input type="hidden" name="exerciseId" value={exerciseId} />
              <input type="hidden" name="notificationId" value={c.id} />
              <select
                name="status"
                defaultValue={c.status}
                onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()}
                className="rounded border border-slate-300 px-1.5 py-0.5 text-[11px]"
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
        <p className="mt-1 text-[11px] text-slate-500">
          <strong>Waiver:</strong> {c.waiverRationale}
        </p>
      )}
    </li>
  );
}

function CountdownPill({
  isSent,
  isWaived,
  isBreached,
  remainingMs,
  sentAt,
}: {
  isSent: boolean;
  isWaived: boolean;
  isBreached: boolean;
  remainingMs: number;
  sentAt: Date | null;
}) {
  if (isSent && sentAt)
    return (
      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] text-white">
        Sent {sentAt.toISOString().slice(11, 16)}
      </span>
    );
  if (isWaived)
    return <span className="rounded-full bg-slate-500 px-2 py-0.5 text-[11px] text-white">Waived</span>;
  if (isBreached)
    return (
      <span className="rounded-full bg-rose-700 px-2 py-0.5 text-[11px] font-semibold text-white">
        BREACHED · overdue {formatDuration(-remainingMs)}
      </span>
    );
  return (
    <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-white">
      {formatDuration(remainingMs)}
    </span>
  );
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
