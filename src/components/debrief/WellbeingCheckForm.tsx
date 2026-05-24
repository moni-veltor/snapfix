"use client";

import { useState } from "react";
import { Heart, Send } from "lucide-react";
import { submitWellbeingCheckAction } from "@/app/actions/exercise-runtime";

const LEVELS = [
  { value: 1, label: "Energising", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" },
  { value: 2, label: "OK", tone: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200" },
  { value: 3, label: "Heavy", tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" },
  { value: 4, label: "Draining", tone: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200" },
  { value: 5, label: "Severely draining", tone: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200" },
] as const;

type Props = {
  exerciseId: string;
};

export default function WellbeingCheckForm({ exerciseId }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [attributed, setAttributed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-700 dark:bg-emerald-950/40">
        <p className="flex items-center gap-1.5 font-semibold text-emerald-900 dark:text-emerald-100">
          <Heart size={13} />
          Thanks — feedback recorded
        </p>
        <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-200">
          Aggregated stress signal goes into the programme dashboard so we can flag burnout risk.
        </p>
      </section>
    );
  }

  return (
    <form
      action={async (fd) => {
        await submitWellbeingCheckAction(fd);
        setSubmitted(true);
      }}
      className="space-y-3 rounded-xl border border-line bg-surface-1 p-5"
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <header>
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Heart size={14} className="text-rose-600 dark:text-rose-300" />
          How was that for you?
        </h2>
        <p className="mt-0.5 text-[11px] text-soft">
          One question, anonymous by default. Aggregates feed the programme-level burnout
          indicator so we don&apos;t book the same people on three back-to-back exercises.
        </p>
      </header>
      <div className="grid grid-cols-5 gap-1.5">
        {LEVELS.map((l) => (
          <label
            key={l.value}
            className={`cursor-pointer rounded-md border p-2 text-center text-[11px] transition-all ${
              picked === l.value
                ? `border-indigo-500 ${l.tone}`
                : "border-line bg-surface-0 text-muted hover:border-line-strong"
            }`}
          >
            <input
              type="radio"
              name="stressLevel"
              value={l.value}
              required
              className="sr-only"
              onChange={() => setPicked(l.value)}
            />
            <div className="font-display text-lg font-semibold">{l.value}</div>
            <div className="text-[9px]">{l.label}</div>
          </label>
        ))}
      </div>
      <label className="block text-[11px]">
        <span className="text-muted">Optional note</span>
        <input
          name="note"
          maxLength={500}
          placeholder="What contributed (or what helped)" aria-label="What contributed (or what helped)"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex items-center gap-2 text-[11px] text-muted">
        <input
          type="checkbox"
          name="attributed"
          checked={attributed}
          onChange={(e) => setAttributed(e.target.checked)}
        />
        Attribute to me (default is anonymous)
      </label>
      <div className="flex justify-end">
        <button
          disabled={picked === null}
          className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:bg-surface-2 disabled:text-soft"
        >
          <Send size={11} />
          Submit
        </button>
      </div>
    </form>
  );
}
