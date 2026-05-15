"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileSignature,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { upsertVendorAction } from "@/app/actions/vendors";
import { withToast } from "@/lib/toast-action";

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
    blurb: "Name, commercial tier and what the vendor does.",
    Icon: Building2,
  },
  {
    id: "dora",
    label: "DORA",
    blurb: "Mark DORA-critical providers and capture the ICT tier.",
    Icon: ShieldCheck,
  },
  {
    id: "contract",
    label: "Contract",
    blurb: "Dates, notice period and annual value for renewal planning.",
    Icon: FileSignature,
  },
  {
    id: "assurance",
    label: "Assurance",
    blurb: "What evidence you hold — SOC 2 / ISAE 3402 / ISO 27001.",
    Icon: ClipboardCheck,
  },
  {
    id: "exit",
    label: "Exit plan",
    blurb: "RTO + summary so a vendor outage can trigger the runbook.",
    Icon: Sparkles,
  },
];

/**
 * Five-step add-vendor wizard. All fields render in the DOM (visually
 * hidden for inactive steps) so a single form submission carries every
 * value to `upsertVendorAction`. Back/Next are `type="button"` so they
 * never accidentally submit; only the final "Save" is a real submit.
 */
export default function VendorAddWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const action = withToast(upsertVendorAction, {
    success: "Vendor saved",
    description: "Open it in the register to link IBSs.",
    error: "Couldn't save vendor",
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-line bg-surface-1 p-4 text-left transition-all hover:-translate-y-px hover:border-line-strong hover:bg-surface-2 hover:shadow-[var(--shadow-card-md)]"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-indigo-600 dark:text-indigo-300">
            <Plus size={16} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Add a vendor manually</span>
            <span className="block text-xs text-muted">
              Five-step wizard — basics, DORA, contract, assurance, exit plan.
            </span>
          </span>
        </span>
        <ChevronDown size={14} className="text-soft" />
      </button>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-line bg-surface-1 p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Add a vendor
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-ink">
            {STEPS[step].label} · step {step + 1} of {STEPS.length}
          </h2>
          <p className="mt-1 text-xs text-muted">{STEPS[step].blurb}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setStep(0);
          }}
          aria-label="Collapse wizard"
          className="rounded-md p-1 text-soft hover:bg-surface-2 hover:text-ink"
        >
          <ChevronUp size={14} />
        </button>
      </header>

      <StepRail step={step} setStep={setStep} />

      <form action={action} className="space-y-4 text-sm">
        <div className={step === 0 ? "" : "hidden"}>
          <BasicsStep />
        </div>
        <div className={step === 1 ? "" : "hidden"}>
          <DoraStep />
        </div>
        <div className={step === 2 ? "" : "hidden"}>
          <ContractStep />
        </div>
        <div className={step === 3 ? "" : "hidden"}>
          <AssuranceStep />
        </div>
        <div className={step === 4 ? "" : "hidden"}>
          <ExitStep />
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
              Save vendor
            </button>
          )}
        </footer>
      </form>
    </section>
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
    <ol className="grid grid-cols-5 gap-1.5">
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
          <span className="text-soft">Vendor name *</span>
          <input
            name="name"
            required
            placeholder="Thought Machine"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Commercial tier *</span>
          <select
            name="tier"
            required
            defaultValue="TIER_2"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          >
            <option value="TIER_1">Tier 1 — mission-critical</option>
            <option value="TIER_2">Tier 2 — business-critical</option>
            <option value="TIER_3">Tier 3 — business-operational</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="text-soft">Service</span>
          <input
            name="serviceKind"
            placeholder="Core banking / Payments / Reconciliations"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Status page URL</span>
          <input
            name="statusUrl"
            placeholder="https://status.vendor.com"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Account manager</span>
          <input
            name="contactName"
            placeholder="Name"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Contact email</span>
          <input
            name="contactEmail"
            type="email"
            placeholder="contact@vendor.com"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="block text-xs">
        <span className="text-soft">Short description</span>
        <textarea
          name="description"
          rows={2}
          placeholder="What they do and which capability they underpin."
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
      </label>
    </fieldset>
  );
}

function DoraStep() {
  return (
    <fieldset className="space-y-3">
      <label className="flex items-start gap-2 rounded-md border border-line bg-surface-0 p-3 text-xs">
        <input
          type="checkbox"
          name="isDoraCritical"
          className="mt-0.5 rounded border-line"
        />
        <span>
          <span className="block font-medium text-ink">
            Tag as DORA-critical third party
          </span>
          <span className="block text-soft">
            Required for inclusion in the Register of Information and quarterly
            reporting to the regulator.
          </span>
        </span>
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-soft">DORA ICT tier</span>
          <select
            name="doraIctTier"
            defaultValue="none"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          >
            <option value="none">Same as commercial tier</option>
            <option value="TIER_1">DORA · Tier 1</option>
            <option value="TIER_2">DORA · Tier 2</option>
            <option value="TIER_3">DORA · Tier 3</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="text-soft">Hyperscaler</span>
          <input
            name="hyperscaler"
            placeholder="AWS / GCP / Azure / on-prem"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Region</span>
          <input
            name="region"
            placeholder="eu-west-2"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
      </div>
    </fieldset>
  );
}

function ContractStep() {
  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="text-xs">
          <span className="text-soft">Start date</span>
          <input
            type="date"
            name="contractStartAt"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">End date</span>
          <input
            type="date"
            name="contractEndAt"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Notice (days)</span>
          <input
            type="number"
            name="contractRenewalNoticeDays"
            min={0}
            placeholder="90"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Annual £</span>
          <input
            type="number"
            name="contractAnnualValueGBP"
            min={0}
            placeholder="250000"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <p className="text-[11px] text-soft">
        Renewal-window alerts kick in {`{notice days}`} before the end date and surface on the
        vendor card. Leaving these blank is fine — you can backfill later.
      </p>
    </fieldset>
  );
}

function AssuranceStep() {
  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-soft">Assurance kind</span>
          <select
            name="assuranceKind"
            defaultValue=""
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          >
            <option value="">— Select —</option>
            <option value="SOC2_TYPE_2">SOC 2 Type 2</option>
            <option value="SOC2_TYPE_1">SOC 2 Type 1</option>
            <option value="ISAE3402">ISAE 3402</option>
            <option value="ISO27001">ISO 27001</option>
            <option value="NONE">None / pending</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="text-soft">Report expiry date</span>
          <input
            type="date"
            name="assuranceExpiryAt"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <p className="text-[11px] text-soft">
        Expired assurance reports trigger a coverage gap on the DORA insights strip.
      </p>
    </fieldset>
  );
}

function ExitStep() {
  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-soft">Last reviewed</span>
          <input
            type="date"
            name="exitPlanReviewedAt"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Exit RTO (minutes)</span>
          <input
            type="number"
            name="exitPlanRTOMin"
            min={0}
            placeholder="2880"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <label className="block text-xs">
        <span className="text-soft">Exit-plan summary</span>
        <textarea
          name="exitPlanNotes"
          rows={4}
          placeholder="Trigger conditions, target alternative provider, switching steps, data extraction approach."
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
      </label>
    </fieldset>
  );
}
