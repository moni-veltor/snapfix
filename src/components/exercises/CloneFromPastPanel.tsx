import Link from "next/link";
import { Copy, History, Sparkles } from "lucide-react";
import { cloneExerciseAction } from "@/app/actions/exercise-wizard";

type PastExercise = {
  id: string;
  title: string;
  status: string;
  plannedDate: Date | null;
  exerciseType: string;
  classification: string;
  regulatorMode: boolean;
  scenarioTitle: string;
  participantCount: number;
  overallScore: number | null;
};

type Props = {
  pastExercises: PastExercise[];
};

/**
 * Shown on /exercises/new step=1 as a sidebar/banner. Lets a user kick off
 * the wizard by cloning the design of a prior exercise instead of starting
 * blank. Useful when the same quarterly cyber drill is being scheduled
 * with the same scenario / similar roster.
 */
export default function CloneFromPastPanel({ pastExercises }: Props) {
  if (pastExercises.length === 0) return null;
  return (
    <section className="rounded-xl border border-line bg-surface-1 p-5">
      <header>
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <History size={14} className="text-indigo-600 dark:text-indigo-300" />
          Or clone the design of a past exercise
        </h2>
        <p className="mt-0.5 text-[11px] text-soft">
          Same scenario, similar roster, lessons baked in. Faster than starting blank.
        </p>
      </header>
      <ul className="mt-3 space-y-2">
        {pastExercises.map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-0 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-1.5 text-sm font-medium text-ink">
                {e.title}
                <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                  {e.status}
                </span>
                {e.regulatorMode && (
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
                    REGULATOR
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {e.scenarioTitle} · {e.exerciseType} · {e.participantCount} participants
                {e.plannedDate && <> · {e.plannedDate.toISOString().slice(0, 10)}</>}
                {e.overallScore !== null && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-semibold">
                      <Sparkles size={9} className="mr-0.5 inline" />
                      scored {e.overallScore}/100
                    </span>
                  </>
                )}
              </p>
            </div>
            <form action={cloneExerciseAction}>
              <input type="hidden" name="sourceExerciseId" value={e.id} />
              <input type="hidden" name="newTitle" value={`${e.title} (copy)`} />
              <button className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2.5 py-1.5 text-xs font-medium text-ink hover:border-line-strong hover:bg-surface-2">
                <Copy size={11} />
                Clone design
              </button>
            </form>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-soft">
        <Link href="/exercises" className="text-indigo-600 underline">
          See all past exercises &rarr;
        </Link>
      </p>
    </section>
  );
}
