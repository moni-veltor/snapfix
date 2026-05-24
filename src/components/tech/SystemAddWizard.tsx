"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Database,
  HardDriveDownload,
  Layers,
} from "lucide-react";
import { upsertTechSystemAction } from "@/app/actions/tech-recovery";
import { withToast } from "@/lib/toast-action";
import {
  FAILOVER_LABEL,
  SYSTEM_KIND_LABEL,
  SYSTEM_TIER_LABEL,
} from "@/lib/tech-recovery";

type StepDef = {
  id: string;
  label: string;
  blurb: string;
  Icon: React.ComponentType<{ size?: number }>;
};

const STEPS: StepDef[] = [
  {
    id: "basics",
    label: "Basics",
    blurb: "Name, kind, criticality tier and owner.",
    Icon: ClipboardList,
  },
  {
    id: "objectives",
    label: "Objectives",
    blurb: "Recovery targets — RTO, RPO, MTPD in minutes.",
    Icon: Layers,
  },
  {
    id: "failover",
    label: "Failover",
    blurb: "Topology and regions — how this system survives a regional outage.",
    Icon: Database,
  },
  {
    id: "backups",
    label: "Backups",
    blurb: "Frequency, retention and last successful validation.",
    Icon: HardDriveDownload,
  },
];

/**
 * Four-step add-system wizard. Replaces the inline `SystemForm` create
 * mode. All fields render in the DOM so a single form submit carries
 * every value to `upsertTechSystemAction`. Edit flow keeps the inline
 * `SystemForm` since power users prefer that for tweaks.
 */
export default function SystemAddWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  const action = withToast(upsertTechSystemAction, {
    success: "System added",
    description: "Refine objectives or log a DR test in the register.",
    error: "Couldn't save the system",
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          {STEPS[step].label} · step {step + 1} of {STEPS.length}
        </p>
        <p className="mt-1 text-xs text-muted">{STEPS[step].blurb}</p>
      </div>

      <StepRail step={step} setStep={setStep} />

      <form
        action={async (fd) => {
          onDone();
          await action(fd);
        }}
        className="space-y-4 text-sm"
      >
        <div className={step === 0 ? "" : "hidden"}>
          <BasicsStep />
        </div>
        <div className={step === 1 ? "" : "hidden"}>
          <ObjectivesStep />
        </div>
        <div className={step === 2 ? "" : "hidden"}>
          <FailoverStep />
        </div>
        <div className={step === 3 ? "" : "hidden"}>
          <BackupsStep />
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ArrowLeft size={12} />
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Next
              <ArrowRight size={12} />
            </button>
          ) : (
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Check size={12} />
              Add system
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}

function StepRail({
  step,
  setStep,
}: {
  step: number;
  setStep: (n: number) => void;
}) {
  return (
    <ol className="grid grid-cols-4 gap-1.5">
      {STEPS.map((s, idx) => {
        const active = idx === step;
        const done = idx < step;
        const Icon = s.Icon;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setStep(idx)}
              className={`group flex w-full flex-col items-center gap-1 rounded-md border px-2 py-2 text-[10px] font-medium transition-all ${
                active
                  ? "border-indigo-300 bg-accent-soft text-indigo-700 dark:border-indigo-700 dark:text-indigo-200"
                  : done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                    : "border-line bg-surface-0 text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/60 dark:bg-black/30">
                {done ? <Check size={11} /> : <Icon size={11} />}
              </span>
              <span className="truncate">{s.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function BasicsStep() {
  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-soft">System name *</span>
          <input
            name="name"
            required
            placeholder="Core ledger" aria-label="Core ledger"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Owner</span>
          <input
            name="owner"
            placeholder="Team or named owner" aria-label="Team or named owner"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Kind *</span>
          <select
            name="kind"
            defaultValue="APPLICATION"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          >
            {Object.entries(SYSTEM_KIND_LABEL).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="text-soft">Tier *</span>
          <select
            name="tier"
            defaultValue="IMPORTANT"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          >
            {Object.entries(SYSTEM_TIER_LABEL).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-xs">
        <span className="text-soft">Description</span>
        <textarea
          name="description"
          rows={2}
          placeholder="What this system does and which IBSs depend on it." aria-label="What this system does and which IBSs depend on it."
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
      </label>
    </fieldset>
  );
}

function ObjectivesStep() {
  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs">
          <span className="text-soft">RTO (minutes)</span>
          <input
            type="number"
            name="rtoMin"
            min={0}
            placeholder="30" aria-label="30"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-[10px] text-soft">
            Recovery Time Objective — max acceptable downtime.
          </span>
        </label>
        <label className="text-xs">
          <span className="text-soft">RPO (minutes)</span>
          <input
            type="number"
            name="rpoMin"
            min={0}
            placeholder="5" aria-label="5"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-[10px] text-soft">
            Recovery Point Objective — max acceptable data loss.
          </span>
        </label>
        <label className="text-xs">
          <span className="text-soft">MTPD (minutes)</span>
          <input
            type="number"
            name="mtpdMin"
            min={0}
            placeholder="240" aria-label="240"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-[10px] text-soft">
            Max Tolerable Period of Disruption — point of no return.
          </span>
        </label>
      </div>
      <p className="text-[11px] text-soft">
        Leave blank if not yet declared — but missing-RTO is a red badge in the
        register, so it&apos;s worth filling in even with a rough target.
      </p>
    </fieldset>
  );
}

function FailoverStep() {
  return (
    <fieldset className="space-y-3">
      <label className="block text-xs">
        <span className="text-soft">Topology</span>
        <select
          name="failoverKind"
          defaultValue="NONE"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        >
          {Object.entries(FAILOVER_LABEL).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-soft">Primary region</span>
          <input
            name="primaryRegion"
            placeholder="eu-west-2" aria-label="eu-west-2"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Failover region</span>
          <input
            name="failoverRegion"
            placeholder="eu-west-1" aria-label="eu-west-1"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <p className="text-[11px] text-soft">
        Critical / essential systems with topology &ldquo;None&rdquo; trigger a
        coverage gap on the posture score.
      </p>
    </fieldset>
  );
}

function BackupsStep() {
  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="text-xs">
          <span className="text-soft">Frequency</span>
          <input
            name="backupFrequency"
            placeholder="continuous / hourly / daily" aria-label="continuous / hourly / daily"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Retention (days)</span>
          <input
            type="number"
            name="backupRetentionDays"
            min={0}
            placeholder="2555" aria-label="2555"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Last validated</span>
          <input
            type="date"
            name="lastBackupValidatedAt"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="block text-xs">
        <span className="text-soft">Notes</span>
        <textarea
          name="notes"
          rows={3}
          placeholder="Runbook URL, on-call rota, escalation path…" aria-label="Runbook URL, on-call rota, escalation path…"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
      </label>
      <p className="text-[11px] text-soft">
        Backups validated more than 90 days ago surface a warn badge on the
        system card.
      </p>
    </fieldset>
  );
}
