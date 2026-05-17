import Link from "next/link";
import { Check } from "lucide-react";

type Step = {
  /** 1-indexed step number used in the URL. */
  num: number;
  label: string;
  /** Short description shown beneath the label. */
  hint: string;
};

export const WIZARD_STEPS: Step[] = [
  { num: 1, label: "Basics", hint: "When, how long, where" },
  { num: 2, label: "Scenarios", hint: "What you're testing" },
  { num: 3, label: "Team", hint: "Roster & seats" },
  { num: 4, label: "Injects", hint: "Timeline & coverage" },
  { num: 5, label: "Pre-flight", hint: "Review & launch" },
];

type Props = {
  current: number;
  /** When set, render previous steps as clickable links that preserve query params. */
  baseHref?: string;
  /** Preserve these query params when generating back-links to earlier steps. */
  carryParams?: Record<string, string | undefined>;
};

export default function StepIndicator({ current, baseHref = "/exercises/new", carryParams = {} }: Props) {
  return (
    <ol
      className="flex flex-wrap items-stretch gap-2 rounded-xl border border-line bg-surface-1 p-2"
      aria-label="Wizard progress"
    >
      {WIZARD_STEPS.map((s) => {
        const isCurrent = s.num === current;
        const isDone = s.num < current;
        const isFuture = s.num > current;
        const className = isCurrent
          ? "bg-gradient-brand text-white shadow-[var(--shadow-card)]"
          : isDone
            ? "border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
            : "border border-line bg-surface-0 text-soft";

        const params = new URLSearchParams();
        params.set("step", String(s.num));
        for (const [k, v] of Object.entries(carryParams)) {
          if (v !== undefined && v !== "") params.set(k, v);
        }
        const href = `${baseHref}?${params.toString()}`;

        const inner = (
          <span className="flex items-start gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isCurrent
                  ? "bg-white/30 text-white"
                  : isDone
                    ? "bg-emerald-600 text-white"
                    : "bg-surface-2 text-soft"
              }`}
              aria-hidden
            >
              {isDone ? <Check size={11} /> : s.num}
            </span>
            <span className="min-w-0">
              <span
                className={`block text-xs font-semibold ${
                  isCurrent ? "text-white" : isDone ? "text-emerald-800 dark:text-emerald-200" : "text-ink"
                }`}
              >
                {s.label}
              </span>
              <span
                className={`block text-[10px] ${
                  isCurrent ? "text-white/80" : "text-soft"
                }`}
              >
                {s.hint}
              </span>
            </span>
          </span>
        );

        return (
          <li
            key={s.num}
            className={`flex-1 min-w-[140px] rounded-lg px-3 py-2 transition-all ${className}`}
            aria-current={isCurrent ? "step" : undefined}
          >
            {isDone || isCurrent ? (
              <Link href={href} className="block" aria-disabled={isFuture}>
                {inner}
              </Link>
            ) : (
              <div className="block opacity-70">{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
