"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  MapPin,
} from "lucide-react";
import { createExerciseAction } from "@/app/actions/exercises";
import { withToast } from "@/lib/toast-action";

type Scenario = { id: string; title: string; dDayDate: string };

type StepDef = {
  id: string;
  label: string;
  blurb: string;
  Icon: React.ComponentType<{ size?: number }>;
};

const STEPS: StepDef[] = [
  {
    id: "scenario",
    label: "Scenario",
    blurb: "Pick the scenario MSEL this run will play out.",
    Icon: FileText,
  },
  {
    id: "schedule",
    label: "Schedule",
    blurb: "When and where the exercise will take place.",
    Icon: CalendarDays,
  },
  {
    id: "details",
    label: "Details",
    blurb: "Title and a one-line description for the schedule.",
    Icon: MapPin,
  },
];

type Props = {
  scenarios: Scenario[];
  defaultScenarioId?: string;
  onDone: () => void;
};

export default function ExerciseAddWizard({ scenarios, defaultScenarioId, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [scenarioId, setScenarioId] = useState<string>(
    defaultScenarioId ?? scenarios[0]?.id ?? "",
  );

  const selected = scenarios.find((s) => s.id === scenarioId);
  const defaultTitle = selected
    ? `${selected.title} — ${new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" })} run`
    : "";

  const action = withToast(createExerciseAction, {
    success: "Exercise created",
    description: "Default IMT, Tech, Comms, CustomerOps and Observers teams seeded.",
    error: "Couldn't create the exercise",
  });

  if (scenarios.length === 0) {
    return (
      <div className="space-y-3 rounded-md border border-dashed border-line bg-surface-1 p-6 text-center text-sm">
        <p className="text-ink">No scenarios in your register yet.</p>
        <p className="text-xs text-muted">
          Create a scenario first — every exercise plays out an existing scenario&apos;s MSEL.
        </p>
      </div>
    );
  }

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
          <ScenarioStep
            scenarios={scenarios}
            scenarioId={scenarioId}
            setScenarioId={setScenarioId}
          />
        </div>
        <div className={step === 1 ? "" : "hidden"}>
          <ScheduleStep />
        </div>
        <div className={step === 2 ? "" : "hidden"}>
          <DetailsStep defaultTitle={defaultTitle} />
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
              Plan exercise
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

function ScenarioStep({
  scenarios,
  scenarioId,
  setScenarioId,
}: {
  scenarios: Scenario[];
  scenarioId: string;
  setScenarioId: (id: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <label className="block text-xs">
        <span className="text-soft">Scenario *</span>
        <select
          name="scenarioId"
          required
          value={scenarioId}
          onChange={(e) => setScenarioId(e.target.value)}
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-[10px] text-soft">
          The exercise will replay this scenario&apos;s MSEL events and injects. If you don&apos;t see the
          right scenario, create one from the Scenarios page.
        </span>
      </label>
    </fieldset>
  );
}

function ScheduleStep() {
  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-soft">Planned date & time</span>
          <input
            type="datetime-local"
            name="plannedDate"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-[10px] text-soft">
            When the exercise will actually run in real time. You can change it later.
          </span>
        </label>
        <label className="text-xs">
          <span className="text-soft">Location</span>
          <input
            name="location"
            placeholder="London HQ, 10 Chiswell St — Sprint Room 1"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-[10px] text-soft">
            Physical room, virtual link, or hybrid — whatever participants need.
          </span>
        </label>
      </div>
      <div className="rounded-md border border-line bg-surface-0 p-3 text-[11px] text-muted">
        <p className="font-medium text-ink">SnapFix will seed five default teams:</p>
        <ul className="mt-1 space-y-0.5">
          <li>· Incident Management</li>
          <li>· Tech Recovery</li>
          <li>· Communications</li>
          <li>· Customer Operations</li>
          <li>· Executive Observers</li>
        </ul>
        <p className="mt-2 text-[10px] text-soft">
          You can rename, remove or add more teams once the exercise is created.
        </p>
      </div>
    </fieldset>
  );
}

function DetailsStep({ defaultTitle }: { defaultTitle: string }) {
  return (
    <fieldset className="space-y-3">
      <label className="block text-xs">
        <span className="text-soft">Exercise title *</span>
        <input
          name="title"
          required
          maxLength={200}
          defaultValue={defaultTitle}
          placeholder="Q3 Functional Exercise — Cyber Disruption"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-[10px] text-soft">
          What appears on the schedule and in audit. We&apos;ve pre-filled from the scenario name.
        </span>
      </label>

      <label className="block text-xs">
        <span className="text-soft">Description (optional)</span>
        <textarea
          name="description"
          rows={3}
          placeholder="Anything specific about this run — observer list, business context, regulatory test it satisfies."
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
      </label>
    </fieldset>
  );
}
