import Link from "next/link";
import { ArrowLeft, FileStack, Sparkles } from "lucide-react";
import { submitStep2ScenarioAction, type WizardBasics } from "@/app/actions/exercise-wizard";

type ScenarioOption = {
  id: string;
  title: string;
  category: string | null;
  durationMin: number;
  isTemplate: boolean;
  _count: { events: number; injects: number; ibsList: number };
};

type Props = {
  scenarios: ScenarioOption[];
  /** Step 1 fields forwarded via URL params so we can persist them when the
   *  Exercise is created at submit. */
  basics: Partial<WizardBasics>;
  /** Step 1 query string to use on the back-link, preserving user choices. */
  backHref: string;
};

/**
 * Minimal Step 2 — primary-scenario picker. Commit C will enrich this with
 * chained scenarios, IBS aggregation, objectives, difficulty review and the
 * DORA threshold preview banner. For now it captures just enough to create
 * the Exercise row at the end of this step.
 */
export default function StepScenarioMinimal({ scenarios, basics, backHref }: Props) {
  if (scenarios.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-line bg-surface-1 p-6 text-sm">
        <p className="font-semibold text-ink">No scenarios in this org yet</p>
        <p className="mt-1 text-muted">
          You need at least one scenario before you can plan an exercise.{" "}
          <Link href="/scenarios/new" className="font-medium text-indigo-600 underline">
            Create one
          </Link>{" "}
          or{" "}
          <Link href="/scenarios/library" className="font-medium text-indigo-600 underline">
            clone from the library
          </Link>
          .
        </p>
      </section>
    );
  }

  return (
    <form action={submitStep2ScenarioAction} className="space-y-6">
      {/* Forward every Step 1 field so the action can build the Exercise. */}
      {Object.entries(basics).map(([k, v]) =>
        v === undefined || v === "" ? null : (
          <input key={k} type="hidden" name={k} value={String(v)} />
        ),
      )}

      <section className="rounded-xl border border-line bg-surface-1 p-5">
        <header className="mb-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <FileStack size={14} className="text-indigo-600 dark:text-indigo-300" />
            Pick the primary scenario
          </h2>
          <p className="mt-1 text-[11px] text-soft">
            One radio = one scenario. In the next commit you&apos;ll be able to chain additional scenarios
            (cyber → vendor escalation → recovery) but for now pick the one that anchors the run.
          </p>
        </header>

        <ul className="space-y-2">
          {scenarios.map((s) => (
            <li key={s.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-0 p-3 transition-all hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20">
                <input
                  type="radio"
                  name="scenarioId"
                  value={s.id}
                  required
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-ink">{s.title}</p>
                    {s.isTemplate && (
                      <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
                        Template
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                    {s.category && (
                      <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                        {s.category}
                      </span>
                    )}
                    <span>{s.durationMin} min default</span>
                    <span>· {s._count.injects} injects</span>
                    <span>· {s._count.events} events</span>
                    <span>· {s._count.ibsList} IBSs touched</span>
                  </div>
                </div>
              </label>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-[11px] text-soft">
          <Sparkles size={11} className="mr-1 inline" />
          Can&apos;t find what you need?{" "}
          <Link href="/scenarios/new" className="font-medium text-indigo-600 underline">
            Create a new scenario
          </Link>{" "}
          or{" "}
          <Link href="/scenarios/library" className="font-medium text-indigo-600 underline">
            clone one from the library
          </Link>{" "}
          first, then come back.
        </p>
      </section>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
        >
          <ArrowLeft size={14} />
          Back to Basics
        </Link>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-indigo-500"
        >
          Create draft & continue →
        </button>
      </div>
    </form>
  );
}
