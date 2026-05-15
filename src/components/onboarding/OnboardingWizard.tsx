"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Layers,
  Sparkles,
  Target,
  UserPlus,
} from "lucide-react";
import Hoot from "@/components/fun/Hoot";

type Step = {
  id: string;
  label: string;
  pitch: string;
  doneLabel: string;
  cta: { href: string; label: string };
  Icon: React.ComponentType<{ size?: number }>;
  done: boolean;
};

type Props = {
  orgName: string;
  myName: string;
  /** Computed server-side from current org state. */
  status: {
    hasPreset: boolean;
    hasRoles: boolean;
    hasIBS: boolean;
    hasTeammates: boolean;
    hasExercise: boolean;
  };
};

const STORAGE_DISMISS = "snapfix-onboarding-dismissed-at";

/**
 * Multi-step onboarding wizard for fresh orgs. Combines a guided
 * checklist with a "next best step" hero. Progress is computed from
 * actual org state — refresh-safe and won't drift. Hoot is the
 * narrator, with mood changing per step.
 */
export default function OnboardingWizard({ orgName, myName, status }: Props) {
  const steps: Step[] = [
    {
      id: "preset",
      label: "Pick a starting point",
      pitch:
        "Apply a tier-1 bank / tier-2 fintech / tier-3 insurer preset — roles, IBSs, vendors and tech systems seeded in one click. Skip if you'll author from scratch.",
      doneLabel: "Preset applied",
      cta: { href: "/settings/presets", label: "Open presets" },
      Icon: Sparkles,
      done: status.hasPreset,
    },
    {
      id: "roles",
      label: "Confirm your IMT roles",
      pitch:
        "Your incident management team — CEO, CRO, CTO, ISM and so on. Participants claim from this list when an exercise starts.",
      doneLabel: "Roles configured",
      cta: { href: "/org/roles", label: "Edit roles" },
      Icon: Building2,
      done: status.hasRoles,
    },
    {
      id: "ibs",
      label: "Capture your IBS register",
      pitch:
        "Your Important Business Services with their tolerances. Either pick from the library or author your own. Required for coverage analytics.",
      doneLabel: "IBS register started",
      cta: { href: "/ibs/library", label: "Browse IBS library" },
      Icon: Layers,
      done: status.hasIBS,
    },
    {
      id: "team",
      label: "Invite your teammates",
      pitch:
        "Add the people who'll participate in exercises. Empty seats kill exercise realism.",
      doneLabel: "Team in place",
      cta: { href: "/org", label: "Invite teammates" },
      Icon: UserPlus,
      done: status.hasTeammates,
    },
    {
      id: "exercise",
      label: "Plan your first exercise",
      pitch:
        "Pick a scenario, set a date, assemble the team. The platform handles the D-Day clock, addressed inbox and decision log.",
      doneLabel: "Exercise scheduled",
      cta: { href: "/exercises/new", label: "Plan an exercise" },
      Icon: Target,
      done: status.hasExercise,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);

  // Find the next-best step automatically.
  const nextIndex = steps.findIndex((s) => !s.done);
  const [activeIdx, setActiveIdx] = useState(nextIndex === -1 ? 0 : nextIndex);

  // Dismiss persistence — clicking "remind me later" stores a timestamp.
  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_DISMISS, String(Date.now()));
    } catch {
      // ignore
    }
    window.location.assign("/dashboard");
  };

  // Re-pin activeIdx on first render to track external state changes.
  useEffect(() => {
    if (nextIndex !== -1 && activeIdx > nextIndex && !steps[activeIdx]?.done) {
      setActiveIdx(nextIndex);
    }
  }, [nextIndex, activeIdx, steps]);

  const active = steps[activeIdx];
  const allDone = completed === total;

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border-2 border-indigo-400 bg-gradient-brand p-6 text-white shadow-[var(--shadow-card-glow)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Hoot mood={allDone ? "happy" : "thinking"} size={88} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">
                Welcome to SnapFix
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Let&apos;s set up <span className="font-bold">{orgName}</span>, {myName.split(" ")[0]}
              </h1>
              <p className="mt-2 text-sm text-white/90">
                Five steps from here to running your first live exercise.
              </p>
            </div>
          </div>
          <div className="min-w-[200px] text-right">
            <div className="text-3xl font-bold">{completed} / {total}</div>
            <div className="text-[11px] uppercase tracking-wider text-white/70">
              steps complete
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <ol className="grid gap-2 sm:grid-cols-5">
        {steps.map((s, i) => {
          const active = i === activeIdx;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`group flex w-full items-start gap-2 rounded-xl border p-2.5 text-left transition-all ${
                  s.done
                    ? "border-emerald-300 bg-emerald-50 hover:border-emerald-400 dark:border-emerald-700 dark:bg-emerald-950/30"
                    : active
                      ? "border-indigo-400 bg-accent-soft"
                      : "border-line bg-surface-1 hover:border-line-strong"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    s.done
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bg-indigo-600 text-white"
                        : "bg-surface-2 text-soft"
                  }`}
                >
                  {s.done ? <CheckCircle2 size={11} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-ink">
                    {s.label}
                  </span>
                  <span
                    className={`block truncate text-[10px] ${
                      s.done
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-soft"
                    }`}
                  >
                    {s.done ? s.doneLabel : "Pending"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Active-step card */}
      {!allDone && active && (
        <article className="overflow-hidden rounded-xl border border-indigo-300 bg-surface-1 shadow-[var(--shadow-card-md)] dark:border-indigo-700">
          <div className="h-1 bg-gradient-brand" />
          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="flex max-w-2xl items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-indigo-600 dark:text-indigo-300">
                <active.Icon size={22} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                  Step {activeIdx + 1} of {total}
                </p>
                <h2 className="mt-0.5 text-xl font-semibold text-ink">
                  {active.label}
                </h2>
                <p className="mt-2 text-sm text-muted">{active.pitch}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={active.cta.href}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {active.cta.label}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </article>
      )}

      {allDone && (
        <article className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-6 dark:border-emerald-600 dark:bg-emerald-950/30">
          <div className="flex items-center gap-4">
            <Hoot mood="happy" size={64} />
            <div>
              <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
                You&apos;re set up.
              </h2>
              <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
                Programme initialised. Head to the dashboard for your
                day-to-day console.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Open dashboard
            <ArrowRight size={14} />
          </Link>
        </article>
      )}

      <footer className="flex items-center justify-between text-xs text-soft">
        <span>
          Hoot is here whenever you need help — your progress is saved as you go.
        </span>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md border border-line bg-surface-1 px-3 py-1.5 text-xs text-muted hover:text-ink"
        >
          Remind me later
        </button>
      </footer>
    </div>
  );
}
