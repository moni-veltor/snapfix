"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Check,
  ClipboardList,
  Database,
  ExternalLink,
  Layers,
  Server,
  Sparkles,
  Users,
  Wifi,
} from "lucide-react";
import { createScenarioAction } from "@/app/actions/scenarios";
import { withToast } from "@/lib/toast-action";

type StepDef = {
  id: string;
  label: string;
  blurb: string;
  Icon: React.ComponentType<{ size?: number }>;
};

const STEPS: StepDef[] = [
  {
    id: "identity",
    label: "Identity",
    blurb: "What the scenario is about and when it plays out on D-Day.",
    Icon: Sparkles,
  },
  {
    id: "framing",
    label: "CMORG framing",
    blurb: "Category, firm tier, characteristics and planning assumptions.",
    Icon: ClipboardList,
  },
  {
    id: "coverage",
    label: "Risk coverage",
    blurb: "Which of the six CMORG harm dimensions this scenario tests.",
    Icon: Layers,
  },
];

const HARM_DIMENSIONS = [
  { name: "coversPeople", label: "People", description: "Staff, customers, vulnerable cohorts", Icon: Users },
  { name: "coversProperty", label: "Property", description: "Buildings, facilities, physical assets", Icon: Building },
  { name: "coversTechnology", label: "Technology", description: "Systems, platforms, third-party tech", Icon: Server },
  { name: "coversDataAvailability", label: "Data availability", description: "Inability to access data when needed", Icon: Wifi },
  { name: "coversDataIntegrity", label: "Data integrity", description: "Data corruption, inaccuracy, loss of trust", Icon: Database },
  { name: "coversThirdParty", label: "Third party", description: "Vendor, supplier, scheme or counterparty failure", Icon: ExternalLink },
];

const CATEGORIES = [
  "Technology & Data (Cyber)",
  "Third Party",
  "People",
  "Property",
  "Climate & Environment",
  "Geopolitical & Macro",
];

/**
 * Three-step add-scenario wizard, designed to live inside a Modal. All
 * fields render in the DOM (visually hidden for inactive steps) so a
 * single form submission carries every value to `createScenarioAction`.
 */
export default function ScenarioAddWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  const action = withToast(createScenarioAction, {
    success: "Scenario created",
    description: "Now author the MSEL events and injects.",
    error: "Couldn't create the scenario",
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
          <IdentityStep />
        </div>
        <div className={step === 1 ? "" : "hidden"}>
          <FramingStep />
        </div>
        <div className={step === 2 ? "" : "hidden"}>
          <CoverageStep />
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
              Create scenario
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}

function StepRail({ step, setStep }: { step: number; setStep: (n: number) => void }) {
  return (
    <ol className="grid grid-cols-3 gap-1.5">
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

function IdentityStep() {
  const today = new Date();
  const dDayDefault = new Date(today.getTime() + 14 * 86_400_000).toISOString().slice(0, 10);
  return (
    <fieldset className="space-y-3">
      <label className="block text-xs">
        <span className="text-soft">Title *</span>
        <input
          name="title"
          required
          maxLength={200}
          placeholder="Q3 functional exercise — Cyber attack on core ledger"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-[10px] text-soft">
          A scannable headline that participants and facilitators recognise on the schedule.
        </span>
      </label>

      <label className="block text-xs">
        <span className="text-soft">Background *</span>
        <textarea
          name="background"
          required
          rows={4}
          placeholder="The framing the facilitator reads aloud at the start of the exercise. Set the scene — what happened, where, when, who knows what."
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-xs">
        <span className="text-soft">Agenda (optional)</span>
        <textarea
          name="agenda"
          rows={3}
          placeholder="Bullet points: pre-brief 15m · MSEL play 90m · debrief 30m."
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">
          <span className="text-soft">D-Day date *</span>
          <input
            type="date"
            name="dDayDate"
            required
            defaultValue={dDayDefault}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-[10px] text-soft">
            Default: 2 weeks from today. Change when you set a real exercise date.
          </span>
        </label>
        <label className="text-xs">
          <span className="text-soft">Duration (minutes) *</span>
          <input
            type="number"
            name="durationMin"
            required
            defaultValue={120}
            min={15}
            max={1440}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-[10px] text-soft">
            Real-time length of the exercise. Most tabletops run 90–180 minutes.
          </span>
        </label>
      </div>
    </fieldset>
  );
}

function FramingStep() {
  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-soft">CMORG category</span>
          <select
            name="category"
            defaultValue=""
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          >
            <option value="">— Select —</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[10px] text-soft">
            Aligns with CMORG Dynamic Scenario Library taxonomy.
          </span>
        </label>
        <label className="text-xs">
          <span className="text-soft">Firm tier</span>
          <select
            name="tier"
            defaultValue=""
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          >
            <option value="">— Any tier —</option>
            <option value="TIER_1">Tier 1 — Global universal / G-SIB</option>
            <option value="TIER_2">Tier 2 — Digital challenger</option>
            <option value="TIER_3">Tier 3 — Neobank / fintech / EMI</option>
          </select>
          <span className="mt-1 block text-[10px] text-soft">
            Leave blank if the scenario applies regardless of firm size.
          </span>
        </label>
      </div>

      <label className="block text-xs">
        <span className="text-soft">Characteristics (one per line)</span>
        <textarea
          name="characteristics"
          rows={3}
          placeholder={`Single-vendor concentration in the ledger layer\nSettlement deadlines are scheme-controlled\nDR site not live-tested in 14 months`}
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-[10px] text-soft">
          What makes this scenario distinctive — sharpens debrief questions later.
        </span>
      </label>

      <label className="block text-xs">
        <span className="text-soft">Planning assumptions (one per line)</span>
        <textarea
          name="assumptions"
          rows={3}
          placeholder={`Card auth is unaffected (independent service)\nPress monitor incident-status pages\nPRA notification clock starts at confirmation`}
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-[10px] text-soft">
          State what the facilitator is asking participants to take as given. Keeps the exercise focused.
        </span>
      </label>

      <label className="block text-xs">
        <span className="text-soft">Takeaways (optional)</span>
        <textarea
          name="takeaways"
          rows={2}
          placeholder="What you want the debrief to surface. One sentence is enough."
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
      </label>
    </fieldset>
  );
}

function CoverageStep() {
  return (
    <fieldset className="space-y-3">
      <p className="text-xs text-muted">
        Tick the harm dimensions this scenario actually tests. The 6-box CMORG matrix
        helps you spot gaps across an annual exercise plan — e.g. you may be heavy on
        technology but light on people.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {HARM_DIMENSIONS.map(({ name, label, description, Icon }) => (
          <label
            key={name}
            className="flex cursor-pointer items-start gap-2 rounded-md border border-line bg-surface-0 p-3 text-xs hover:bg-surface-2"
          >
            <input
              type="checkbox"
              name={name}
              className="mt-0.5 rounded border-line"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 font-medium text-ink">
                <Icon size={12} />
                {label}
              </span>
              <span className="mt-0.5 block text-[10px] text-soft">{description}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="text-[10px] text-soft">
        You can change these later from the scenario detail page.
      </p>
    </fieldset>
  );
}
