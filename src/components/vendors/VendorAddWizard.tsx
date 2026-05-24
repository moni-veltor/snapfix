"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  FileSignature,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { upsertVendorAction } from "@/app/actions/vendors";

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

export type VendorExisting = {
  id: string;
  name: string;
  description: string | null;
  serviceKind: string | null;
  tier: "TIER_1" | "TIER_2" | "TIER_3" | string;
  contactName: string | null;
  contactEmail: string | null;
  statusUrl: string | null;
  isDoraCritical: boolean;
  doraIctTier: "TIER_1" | "TIER_2" | "TIER_3" | string | null;
  hyperscaler: string | null;
  region: string | null;
  contractStartAt: Date | null;
  contractEndAt: Date | null;
  contractRenewalNoticeDays: number | null;
  contractAnnualValueGBP: number | null;
  assuranceKind: string | null;
  assuranceExpiryAt: Date | null;
  exitPlanReviewedAt: Date | null;
  exitPlanRTOMin: number | null;
  exitPlanNotes: string | null;
};

function toDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * Five-step add-vendor wizard, designed to live inside a Modal or
 * Drawer. All fields render in the DOM (visually hidden for inactive
 * steps) so a single form submission carries every value to
 * `upsertVendorAction`.
 *
 * When `existing` is passed the wizard pre-fills every field and sends
 * a hidden `id` — the action's upsert branch then performs an update.
 * This guarantees create + edit cover the same field set.
 */
export default function VendorAddWizard({
  onDone,
  onSaved,
  existing,
  embedded = false,
}: {
  onDone: () => void;
  /** Fires after the action resolves with the upserted vendor id. When
   *  provided, takes precedence over onDone — lets the parent transition
   *  (e.g. create-mode → edit-mode in the drawer) instead of closing. */
  onSaved?: (id: string) => void;
  existing?: VendorExisting;
  /** When true, the wizard renders its step rail + step pages + prev/next
   *  but skips the surrounding <form> and the final "Save vendor" submit
   *  button. Used by CreateBody so wizard fields submit alongside MTP
   *  fields in one unified parent form. */
  embedded?: boolean;
}) {
  const [step, setStep] = useState(0);
  const isEdit = !!existing;

  const handleSubmit = async (fd: FormData) => {
    const toastId = toast.loading(isEdit ? "Updating vendor…" : "Saving vendor…");
    try {
      const result = await upsertVendorAction(fd);
      toast.success(isEdit ? "Vendor updated" : "Vendor saved", {
        id: toastId,
        description: isEdit ? undefined : "Open it in the register to link IBSs.",
      });
      if (onSaved) onSaved(result.id);
      else onDone();
    } catch (err) {
      toast.error(isEdit ? "Couldn't update vendor" : "Couldn't save vendor", {
        id: toastId,
      });
      throw err;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          {STEPS[step].label} · step {step + 1} of {STEPS.length}
        </p>
        <p className="mt-1 text-xs text-muted">{STEPS[step].blurb}</p>
      </div>

      <StepRail step={step} setStep={setStep} />

      {embedded ? (
        <div className="space-y-4 text-sm">
          <WizardSteps step={step} existing={existing} />
          <WizardFooterNav
            step={step}
            setStep={setStep}
            isEdit={isEdit}
            embedded
          />
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-4 text-sm">
          {existing && <input type="hidden" name="id" value={existing.id} />}
          <WizardSteps step={step} existing={existing} />
          <WizardFooterNav step={step} setStep={setStep} isEdit={isEdit} />
        </form>
      )}
    </div>
  );
}

function WizardSteps({
  step,
  existing,
}: {
  step: number;
  existing?: VendorExisting;
}) {
  return (
    <>
      <div className={step === 0 ? "" : "hidden"}>
        <BasicsStep existing={existing} />
      </div>
      <div className={step === 1 ? "" : "hidden"}>
        <DoraStep existing={existing} />
      </div>
      <div className={step === 2 ? "" : "hidden"}>
        <ContractStep existing={existing} />
      </div>
      <div className={step === 3 ? "" : "hidden"}>
        <AssuranceStep existing={existing} />
      </div>
      <div className={step === 4 ? "" : "hidden"}>
        <ExitStep existing={existing} />
      </div>
    </>
  );
}

function WizardFooterNav({
  step,
  setStep,
  isEdit,
  embedded = false,
}: {
  step: number;
  setStep: (n: number) => void;
  isEdit: boolean;
  embedded?: boolean;
}) {
  return (
    <footer className="flex items-center justify-between gap-2 border-t border-line pt-4">
      <button
        type="button"
        onClick={() => setStep(Math.max(0, step - 1))}
        disabled={step === 0}
        className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ArrowLeft size={12} />
        Back
      </button>
      {step < STEPS.length - 1 ? (
        <button
          type="button"
          onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Next
          <ArrowRight size={12} />
        </button>
      ) : embedded ? null : (
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <Check size={12} />
          {isEdit ? "Save changes" : "Save vendor"}
        </button>
      )}
    </footer>
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

function BasicsStep({ existing }: { existing?: VendorExisting }) {
  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-soft">Vendor name *</span>
          <input
            name="name"
            required
            defaultValue={existing?.name ?? ""}
            placeholder="Thought Machine" aria-label="Thought Machine"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Commercial tier *</span>
          <select
            name="tier"
            required
            defaultValue={existing?.tier ?? "TIER_2"}
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
            defaultValue={existing?.serviceKind ?? ""}
            placeholder="Core banking / Payments / Reconciliations" aria-label="Core banking / Payments / Reconciliations"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Status page URL</span>
          <input
            name="statusUrl"
            defaultValue={existing?.statusUrl ?? ""}
            placeholder="https://status.vendor.com" aria-label="https://status.vendor.com"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Account manager</span>
          <input
            name="contactName"
            defaultValue={existing?.contactName ?? ""}
            placeholder="Name" aria-label="Name"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Contact email</span>
          <input
            name="contactEmail"
            type="email"
            defaultValue={existing?.contactEmail ?? ""}
            placeholder="contact@vendor.com" aria-label="contact@vendor.com"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="block text-xs">
        <span className="text-soft">Short description</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={existing?.description ?? ""}
          placeholder="What they do and which capability they underpin." aria-label="What they do and which capability they underpin."
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
      </label>
    </fieldset>
  );
}

function DoraStep({ existing }: { existing?: VendorExisting }) {
  return (
    <fieldset className="space-y-3">
      <label className="flex items-start gap-2 rounded-md border border-line bg-surface-0 p-3 text-xs">
        <input
          type="checkbox"
          name="isDoraCritical"
          defaultChecked={!!existing?.isDoraCritical}
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
            defaultValue={existing?.doraIctTier ?? "none"}
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
            defaultValue={existing?.hyperscaler ?? ""}
            placeholder="AWS / GCP / Azure / on-prem" aria-label="AWS / GCP / Azure / on-prem"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Region</span>
          <input
            name="region"
            defaultValue={existing?.region ?? ""}
            placeholder="eu-west-2" aria-label="eu-west-2"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
      </div>
    </fieldset>
  );
}

function ContractStep({ existing }: { existing?: VendorExisting }) {
  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="text-xs">
          <span className="text-soft">Start date</span>
          <input
            type="date"
            name="contractStartAt"
            defaultValue={toDateInput(existing?.contractStartAt)}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">End date</span>
          <input
            type="date"
            name="contractEndAt"
            defaultValue={toDateInput(existing?.contractEndAt)}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Notice (days)</span>
          <input
            type="number"
            name="contractRenewalNoticeDays"
            min={0}
            defaultValue={existing?.contractRenewalNoticeDays ?? ""}
            placeholder="90" aria-label="90"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Annual £</span>
          <input
            type="number"
            name="contractAnnualValueGBP"
            min={0}
            defaultValue={existing?.contractAnnualValueGBP ?? ""}
            placeholder="250000" aria-label="250000"
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

function AssuranceStep({ existing }: { existing?: VendorExisting }) {
  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-soft">Assurance kind</span>
          <select
            name="assuranceKind"
            defaultValue={existing?.assuranceKind ?? ""}
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
            defaultValue={toDateInput(existing?.assuranceExpiryAt)}
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

function ExitStep({ existing }: { existing?: VendorExisting }) {
  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-soft">Last reviewed</span>
          <input
            type="date"
            name="exitPlanReviewedAt"
            defaultValue={toDateInput(existing?.exitPlanReviewedAt)}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-soft">Exit RTO (minutes)</span>
          <input
            type="number"
            name="exitPlanRTOMin"
            min={0}
            defaultValue={existing?.exitPlanRTOMin ?? ""}
            placeholder="2880" aria-label="2880"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <label className="block text-xs">
        <span className="text-soft">Exit-plan summary</span>
        <textarea
          name="exitPlanNotes"
          rows={4}
          defaultValue={existing?.exitPlanNotes ?? ""}
          placeholder="Trigger conditions, target alternative provider, switching steps, data extraction approach." aria-label="Trigger conditions, target alternative provider, switching steps, data extraction approach."
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
      </label>
    </fieldset>
  );
}
