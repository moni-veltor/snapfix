"use client";

import { useState } from "react";
import {
  CalendarClock,
  Gauge,
  Globe,
  Lock,
  MapPin,
  Repeat,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Type,
} from "lucide-react";
import { submitStep1BasicsAction, type WizardBasics } from "@/app/actions/exercise-wizard";

type Props = {
  /** Pre-fill from URL params when the user navigates back from Step 2+. */
  defaults?: Partial<WizardBasics>;
};

const TIME_ZONES = [
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Frankfurt",
  "Europe/Amsterdam",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const DURATION_PRESETS = [
  { value: 60, label: "1h" },
  { value: 90, label: "90 min" },
  { value: 120, label: "2h" },
  { value: 180, label: "3h" },
  { value: 240, label: "4h" },
  { value: 480, label: "All day" },
];

export default function StepBasics({ defaults = {} }: Props) {
  const [exerciseType, setExerciseType] = useState(defaults.exerciseType ?? "TABLETOP");
  const [classification, setClassification] = useState(defaults.classification ?? "INTERNAL");
  const [regulatorMode, setRegulatorMode] = useState(defaults.regulatorMode ?? false);
  const [mode, setMode] = useState(defaults.mode ?? "PRODUCTION");
  const [durationMin, setDurationMin] = useState(defaults.durationMin ?? 180);
  const [jurisdiction, setJurisdiction] = useState(defaults.jurisdiction ?? "UK");
  const [confidentiality, setConfidentiality] = useState(defaults.confidentiality ?? "OPEN");
  const [speed, setSpeed] = useState(defaults.speedMultiplier ?? 1);

  const showCaveat = classification === "CONFIDENTIAL" || classification === "SECRET";

  return (
    <form action={submitStep1BasicsAction} className="space-y-6">
      <Section icon={Type} title="What is this exercise?">
        <Field
          label="Title"
          name="title"
          required
          maxLength={200}
          defaultValue={defaults.title}
          placeholder="e.g. Q3 Functional Exercise — Ransomware on payments rails"
          hint="One line a Board member would read. Make it specific to the test."
        />
        <TextArea
          label="Description"
          name="description"
          rows={3}
          defaultValue={defaults.description}
          placeholder="What's the test, why now, who's it for. (Optional.)"
        />

        <Toggle3
          name="exerciseType"
          value={exerciseType}
          onChange={setExerciseType}
          options={[
            {
              value: "TABLETOP",
              label: "Tabletop",
              hint: "Facilitated discussion · low realism · easy to schedule",
            },
            {
              value: "LIVE",
              label: "Live war-room",
              hint: "Real-time response · high realism · highest cost",
            },
            {
              value: "WALKTHROUGH",
              label: "Walkthrough",
              hint: "Explanatory tour · onboarding-grade · lowest stress",
            },
          ]}
        />

        <Toggle3
          name="mode"
          value={mode}
          onChange={setMode}
          options={[
            {
              value: "PRODUCTION",
              label: "Production",
              hint: "Generates evidence · counts toward annual obligations",
            },
            {
              value: "DRY_RUN",
              label: "Dry run",
              hint: "Private rehearsal · auto-purged after 30d · doesn't count",
            },
          ]}
          icon={mode === "DRY_RUN" ? TestTube2 : undefined}
        />
      </Section>

      <Section icon={CalendarClock} title="When does it run?">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Planned date + time"
            name="plannedDate"
            type="datetime-local"
            defaultValue={defaults.plannedDate}
          />
          <label className="block text-sm">
            <span className="text-ink">Time zone</span>
            <select
              name="timeZone"
              defaultValue={defaults.timeZone ?? "Europe/London"}
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm"
            >
              {TIME_ZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] text-soft">
              D-Day is interpreted in this zone for distributed teams.
            </span>
          </label>
        </div>

        <div>
          <span className="block text-sm text-ink">Duration</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {DURATION_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setDurationMin(p.value)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                  durationMin === p.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
                    : "border-line bg-surface-1 text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            ))}
            <input
              type="number"
              min={15}
              max={2880}
              step={15}
              value={durationMin}
              onChange={(e) => setDurationMin(parseInt(e.target.value, 10) || 0)}
              className="w-20 rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              aria-label="Duration in minutes"
            />
            <span className="self-center text-xs text-soft">min</span>
          </div>
          <input type="hidden" name="durationMin" value={durationMin} />
        </div>

        <div>
          <span className="block text-sm text-ink">Speed multiplier</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {[1, 5, 15, 60].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                  speed === s
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
                    : "border-line bg-surface-1 text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                <Gauge size={11} className="mr-1 inline" />×{s}
                {s === 60 && <span className="ml-1 text-soft">(1 min = 1 D-Day hr)</span>}
              </button>
            ))}
          </div>
          <input type="hidden" name="speedMultiplier" value={speed} />
          {speed > 1 && (
            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
              ⚠ ×{speed} compresses regulator clocks. The 4h FCA window becomes{" "}
              {Math.round((4 * 60) / speed)} min — CRO sign-off advised in pre-flight.
            </p>
          )}
        </div>
      </Section>

      <Section icon={MapPin} title="Where + who can see it?">
        <Field
          label="Location"
          name="location"
          maxLength={200}
          defaultValue={defaults.location}
          placeholder="e.g. London HQ war-room · distributed · hybrid (LDN + remote)"
        />

        <Toggle3
          name="confidentiality"
          value={confidentiality}
          onChange={setConfidentiality}
          options={[
            { value: "OPEN", label: "Open", hint: "Whole org sees it in exercise lists" },
            { value: "RESTRICTED", label: "Restricted", hint: "Only roster + explicit observers see it" },
          ]}
        />
      </Section>

      <Section icon={Globe} title="Regulatory scope">
        <label className="block text-sm">
          <span className="text-ink">Jurisdiction</span>
          <select
            name="jurisdiction"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value as typeof jurisdiction)}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm"
          >
            <option value="UK">UK (FCA / PRA / ICO)</option>
            <option value="EU">EU (DORA / ESA)</option>
            <option value="UK_AND_EU">UK + EU (dual)</option>
            <option value="US">US (CFTC / SEC / OCC)</option>
            <option value="GLOBAL">Global (all of the above)</option>
          </select>
          <span className="mt-1 block text-[11px] text-soft">
            Drives which notification clocks and threshold helpers fire during severity classification.
          </span>
        </label>

        <Toggle3
          name="classification"
          value={classification}
          onChange={setClassification}
          options={[
            { value: "PUBLIC", label: "Public", hint: "Marketing-grade, shareable externally" },
            { value: "INTERNAL", label: "Internal", hint: "Default — visible inside the org only" },
            { value: "CONFIDENTIAL", label: "Confidential", hint: "Restricted reader list, audited reads" },
            { value: "SECRET", label: "Secret", hint: "MNPI / deal-related · watermarked everywhere" },
          ]}
          cols={4}
        />

        {showCaveat && (
          <Field
            label="Classification caveat"
            name="classificationCaveat"
            maxLength={120}
            defaultValue={defaults.classificationCaveat}
            placeholder="e.g. MNPI · INSIDER LIST · DEAL-RELATED · PRE-DECISIONAL"
            icon={Lock}
            hint="Shown in the page-header pill on every page of the exercise."
          />
        )}

        <div className="rounded-lg border border-line bg-surface-0 p-3">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="regulatorMode"
              value="true"
              checked={regulatorMode}
              onChange={(e) => setRegulatorMode(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="flex items-center gap-1 font-semibold text-ink">
                <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-300" />
                Regulator-evidence mode
              </span>
              <span className="block text-[11px] text-muted">
                Locks edits after kickoff, requires approvers on every decision and comm, enforces
                strict closure, generates a tamper-evident evidence pack on closure.
              </span>
            </span>
          </label>

          {regulatorMode && (
            <Field
              label="Regulator audience"
              name="regulatorAudience"
              maxLength={120}
              defaultValue={defaults.regulatorAudience}
              placeholder="e.g. PRA SS1/21 · FCA SYSC 15A · BoE FMI · DORA Art. 25"
              icon={ShieldCheck}
              hint="Used to shape the evidence-pack format on closure."
            />
          )}
        </div>
      </Section>

      <Section icon={Repeat} title="Cadence (optional)">
        <Field
          label="Recurrence rule"
          name="recurrenceRule"
          maxLength={500}
          defaultValue={defaults.recurrenceRule}
          placeholder="e.g. FREQ=YEARLY;BYMONTH=10 (annual cyber drill in October)"
          icon={Repeat}
          hint="RFC 5545 RRULE string. Leave blank for a one-off exercise."
        />
      </Section>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-[11px] text-soft">
          <Sparkles size={11} className="mr-1 inline" />
          We&apos;ll create the draft when you pick a scenario on the next step.
        </p>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-indigo-500"
        >
          Next: Scenario →
        </button>
      </div>
    </form>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Icon size={14} className="text-indigo-600 dark:text-indigo-300" />
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <label className="block text-sm">
      <span className="flex items-center gap-1.5 text-ink">
        {Icon && <Icon size={12} className="text-soft" />}
        {label}
      </span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {hint && <span className="mt-1 block text-[11px] text-soft">{hint}</span>}
    </label>
  );
}

function TextArea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-ink">{label}</span>
      <textarea
        {...props}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}

function Toggle3<T extends string>({
  name,
  value,
  onChange,
  options,
  cols = 3,
  icon: Icon,
}: {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint: string }[];
  cols?: 2 | 3 | 4;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const grid =
    cols === 4 ? "sm:grid-cols-4" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <div className={`grid grid-cols-1 gap-2 ${grid}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`group rounded-lg border p-3 text-left transition-all ${
              active
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                : "border-line bg-surface-0 hover:border-line-strong hover:bg-surface-2"
            }`}
          >
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                active ? "text-indigo-800 dark:text-indigo-200" : "text-ink"
              }`}
            >
              {Icon && active && <Icon size={11} />}
              {o.label}
            </div>
            <div className="mt-0.5 text-[10px] text-muted">{o.hint}</div>
          </button>
        );
      })}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
