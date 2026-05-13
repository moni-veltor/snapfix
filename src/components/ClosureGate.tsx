"use client";

import { useState, useTransition } from "react";
import { closeIncidentAction, updateClosureChecksAction } from "@/app/actions/closure";

type Checks = {
  closureImpactCeased: boolean;
  closureRegsNotified: boolean;
  closureLogComplete: boolean;
  closurePreliminaryRCA: boolean;
  closureCRO_SignOff: boolean;
};

type Props = {
  exerciseId: string;
  incidentId: string;
  checks: Checks;
};

const CHECK_LABELS: { key: keyof Checks; label: string; clause: string }[] = [
  { key: "closureImpactCeased", label: "Customer impact has ceased — service restored", clause: "IMP §6.4.1 (i) — not a temporary workaround" },
  { key: "closureRegsNotified", label: "Regulator notifications complete (or waived with rationale)", clause: "IMP §6.4.1 (ii)" },
  { key: "closureLogComplete", label: "Incident log complete in the ERM platform", clause: "IMP §6.4.1 (iii)" },
  { key: "closurePreliminaryRCA", label: "Root cause identified (at least preliminary)", clause: "IMP §6.4.1 (iv)" },
  { key: "closureCRO_SignOff", label: "CRO confirms no material residual risk", clause: "IMP §6.4.1 (v)" },
];

export default function ClosureGate({ exerciseId, incidentId, checks }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const passed = Object.values(checks).every(Boolean);

  const toggle = (key: keyof Checks, value: boolean) => {
    start(async () => {
      const fd = new FormData();
      fd.set("exerciseId", exerciseId);
      fd.set("incidentId", incidentId);
      for (const item of CHECK_LABELS) {
        const v = item.key === key ? value : checks[item.key];
        if (v) fd.set(item.key, "on");
      }
      await updateClosureChecksAction(fd);
    });
  };

  const close = () =>
    start(async () => {
      const fd = new FormData();
      fd.set("exerciseId", exerciseId);
      fd.set("incidentId", incidentId);
      const res = await closeIncidentAction(fd);
      setError(res?.error ?? null);
    });

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">
        Closure gate — five mandatory criteria (IMP §6.4.1)
      </div>
      <ul className="mt-2 space-y-1.5">
        {CHECK_LABELS.map((item) => {
          const v = checks[item.key];
          return (
            <li key={item.key} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={v}
                onChange={(e) => toggle(item.key, e.target.checked)}
                disabled={pending}
                className="mt-0.5"
              />
              <div>
                <div className={v ? "text-slate-700" : "text-slate-600"}>{item.label}</div>
                <div className="text-[10px] text-slate-400">{item.clause}</div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500">
          {passed ? "All five criteria satisfied." : "Closure blocked until all five ✓."}
        </span>
        <button
          type="button"
          onClick={close}
          disabled={!passed || pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-slate-300"
        >
          {pending ? "Closing…" : "Close incident"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
    </div>
  );
}
