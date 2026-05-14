"use client";

import { useState } from "react";

type Stakeholder = {
  key: string;
  label: string;
  owner: string;
  approver: string;
  /** Must be SENT before this stakeholder can be informed. */
  requires: string[];
};

const STAKEHOLDERS: Stakeholder[] = [
  { key: "EMPLOYEES", label: "Employees", owner: "CPO", approver: "CEO", requires: [] },
  { key: "CUSTOMERS", label: "Customers", owner: "COO", approver: "CEO", requires: ["EMPLOYEES"] },
  {
    key: "THIRD_PARTY",
    label: "Third-party vendors",
    owner: "CTO",
    approver: "CEO",
    requires: ["EMPLOYEES"],
  },
  {
    key: "INTERMEDIARIES",
    label: "Intermediaries",
    owner: "Sales Director",
    approver: "CEO",
    requires: ["EMPLOYEES"],
  },
  { key: "MEDIA", label: "Media", owner: "Head of External Affairs", approver: "CEO", requires: ["EMPLOYEES"] },
  { key: "REGULATORS", label: "Regulators (PRA/FCA)", owner: "CRO", approver: "CEO", requires: [] },
  { key: "ICO", label: "ICO", owner: "Head of Compliance", approver: "CRO", requires: [] },
];

type Status = "PENDING" | "SENT";

export default function CascadeVisualizer() {
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [attempt, setAttempt] = useState<{ key: string; reason: string } | null>(null);

  const sentSet = new Set(Object.entries(statuses).filter(([_, v]) => v === "SENT").map(([k]) => k));

  const trySend = (s: Stakeholder) => {
    const missing = s.requires.filter((r) => !sentSet.has(r));
    if (missing.length > 0) {
      const names = missing
        .map((m) => STAKEHOLDERS.find((x) => x.key === m)?.label ?? m)
        .join(" and ");
      setAttempt({
        key: s.key,
        reason: `Per industry best practice, communications to ${s.label} must come AFTER ${names}. Send ${names} first.`,
      });
      return;
    }
    setStatuses((prev) => ({ ...prev, [s.key]: "SENT" }));
    setAttempt(null);
  };

  const reset = () => {
    setStatuses({});
    setAttempt(null);
  };

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-white">Try the cascade</h3>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Reset
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Try to send each comms in any order. The platform — and policy — blocks out-of-order
        sends.
      </p>

      <ul className="space-y-2">
        {STAKEHOLDERS.map((s) => {
          const sent = sentSet.has(s.key);
          const blocked = s.requires.some((r) => !sentSet.has(r));
          return (
            <li
              key={s.key}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm ${
                sent
                  ? "border-emerald-400/40 bg-emerald-500/[0.08]"
                  : blocked
                    ? "border-amber-400/30 bg-amber-500/[0.05]"
                    : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="min-w-0">
                <div className="font-semibold text-white">{s.label}</div>
                <div className="text-[11px] text-slate-400">
                  Drafted by {s.owner} · approved by {s.approver}
                  {s.requires.length > 0 && (
                    <>
                      {" "}
                      · waits on{" "}
                      {s.requires.map((r) => STAKEHOLDERS.find((x) => x.key === r)?.label).join(", ")}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {sent ? (
                  <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[11px] font-medium text-emerald-100">
                    ✓ Sent
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => trySend(s)}
                    className={`rounded-md px-3 py-1 text-xs font-medium ${
                      blocked
                        ? "bg-rose-500/15 text-rose-200 hover:bg-rose-500/25"
                        : "bg-indigo-500 text-white hover:bg-indigo-400"
                    }`}
                  >
                    Send
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {attempt && (
        <div className="rounded-md border border-rose-400/30 bg-rose-500/[0.08] p-3 text-xs">
          <div className="font-semibold text-rose-100">Cascade rule violated</div>
          <p className="mt-1 text-rose-100/90">{attempt.reason}</p>
        </div>
      )}

      {sentSet.size === STAKEHOLDERS.length && (
        <div className="rounded-md border border-emerald-400/30 bg-emerald-500/[0.08] p-3 text-xs text-emerald-100">
          ✓ Full cascade complete — in the policy-correct order.
        </div>
      )}
    </div>
  );
}
