"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Check } from "lucide-react";
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
  { key: "closureImpactCeased", label: "Customer impact has ceased — service restored", clause: "criterion 1 — not a temporary workaround" },
  { key: "closureRegsNotified", label: "Regulator notifications complete (or waived with rationale)", clause: "criterion 2" },
  { key: "closureLogComplete", label: "Incident log complete in the ERM platform", clause: "criterion 3" },
  { key: "closurePreliminaryRCA", label: "Root cause identified (at least preliminary)", clause: "criterion 4" },
  { key: "closureCRO_SignOff", label: "CRO confirms no material residual risk", clause: "criterion 5" },
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
      icon={CheckCircle2}
      title={
        <>
          Closure gate
          <PolicyHint>
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
                <div className={v ? "text-ink dark:text-slate-200" : "text-muted dark:text-slate-300"}>
                  {item.label}
                </div>
                <div className="text-[10px] text-soft dark:text-muted">{item.clause}</div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-muted dark:text-soft">
          {passed ? "All criteria satisfied." : "Closure blocked until all five ✓."}
        </span>
        <Button
          onClick={close}
          disabled={!passed || pending}
          variant={passed ? "gradient" : "primary"}
          size="sm"
          icon={Check}
          loading={pending}
          type="button"
        >
          {pending ? "Closing…" : "Close incident"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">{error}</p>}
    </Section>
  );
}
