"use client";

import { useState, useTransition } from "react";
import { closeIncidentAction, updateClosureChecksAction } from "@/app/actions/closure";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import PolicyHint from "@/components/ui/PolicyHint";

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
  const passedCount = Object.values(checks).filter(Boolean).length;

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
    <Section
      title={
        <>
          Closure gate
          <PolicyHint clause="IMP §6.4.1">
            All five criteria must be ✓ before an incident can be closed.
          </PolicyHint>
        </>
      }
      subtitle={`${passedCount} of 5 satisfied`}
      variant={passed ? "ok" : "neutral"}
    >
      <ul className="space-y-1.5">
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
              <div className="min-w-0 text-xs">
                <div className={v ? "text-slate-700 dark:text-slate-200" : "text-slate-600 dark:text-slate-300"}>
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">{item.clause}</div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {passed ? "All criteria satisfied." : "Closure blocked until all five ✓."}
        </span>
        <Button onClick={close} disabled={!passed || pending} size="sm" type="button">
          {pending ? "Closing…" : "Close incident"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">{error}</p>}
    </Section>
  );
}
