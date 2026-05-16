import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Radio,
  Target,
} from "lucide-react";
import { confirmReadinessAction } from "@/app/actions/org";

type ExerciseLite = {
  id: string;
  title: string;
  status: string;
  plannedDate: Date | null;
  startedAt: Date | null;
  scenarioTitle: string;
  roleTitle: string | null;
};

type Props = {
  /** Currently-live / paused exercise for this user — gets the loudest treatment. */
  liveExercise: ExerciseLite | null;
  /** Next upcoming exercise (planned > now), if any. */
  nextExercise: ExerciseLite | null;
  /** True if the user has not stamped lastReadinessCheckAt within the last 7d. */
  needsReadinessCheck: boolean;
  /** Days until nextExercise.plannedDate, if set. */
  daysUntilNext: number | null;
  /** Current user id — used for the "open my profile" link. */
  userId: string;
};

/**
 * Top-of-dashboard widget that answers "what's mine right now?" for a
 * participant. Three states, ordered by urgency:
 *
 *   1. LIVE  — you're in an exercise that's running right now. Pulsing
 *              rose pill + Join button.
 *   2. NEXT  — your next exercise is < 14 days out. Schedule card with
 *              readiness check if needed.
 *   3. QUIET — no exercises scheduled. Pointer to the schedule.
 */
export default function YourLiveExerciseWidget({
  liveExercise,
  nextExercise,
  needsReadinessCheck,
  daysUntilNext,
  userId,
}: Props) {
  if (liveExercise) {
    return (
      <section className="relative overflow-hidden rounded-xl border border-rose-300 bg-rose-50 p-5 shadow-[var(--shadow-card-md)] dark:border-rose-800/60 dark:bg-rose-950/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-rose-200/60 blur-3xl dark:bg-rose-900/30"
        />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_0_3px_rgba(244,63,94,0.18)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-90" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                Your exercise is live
              </p>
              <h2 className="mt-2 text-xl font-semibold text-rose-900 dark:text-rose-100">
                {liveExercise.title}
              </h2>
              <p className="mt-1 text-sm text-rose-800 dark:text-rose-200">
                {liveExercise.scenarioTitle}
                {liveExercise.roleTitle && (
                  <>
                    {" "}
                    · You&apos;re playing{" "}
                    <span className="font-medium">{liveExercise.roleTitle}</span>
                  </>
                )}
              </p>
            </div>
            <Link
              href={`/exercises/${liveExercise.id}/live`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-rose-500 hover:shadow-[var(--shadow-card-md)]"
            >
              <Radio size={14} />
              Join the war room
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (nextExercise) {
    const tone =
      daysUntilNext !== null && daysUntilNext <= 3
        ? "urgent"
        : daysUntilNext !== null && daysUntilNext <= 14
          ? "soon"
          : "later";

    return (
      <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-200">
              <CalendarClock size={10} />
              Your next exercise
            </p>
            <h2 className="mt-2 text-lg font-semibold text-ink">{nextExercise.title}</h2>
            <p className="mt-1 text-sm text-muted">
              {nextExercise.scenarioTitle}
              {nextExercise.roleTitle && (
                <>
                  {" "}
                  · You&apos;re playing{" "}
                  <span className="font-medium text-ink">{nextExercise.roleTitle}</span>
                </>
              )}
            </p>
            {nextExercise.plannedDate && (
              <p className="mt-2 flex items-center gap-1.5 text-xs">
                <Clock size={11} className="text-soft" />
                <span
                  className={`font-medium ${
                    tone === "urgent"
                      ? "text-rose-700 dark:text-rose-300"
                      : tone === "soon"
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-muted"
                  }`}
                >
                  {nextExercise.plannedDate.toISOString().slice(0, 10)}
                </span>
                {daysUntilNext !== null && (
                  <span className="text-soft">
                    — {daysUntilNext === 0 ? "today" : `in ${daysUntilNext}d`}
                  </span>
                )}
              </p>
            )}
          </div>
          <Link
            href={`/exercises/${nextExercise.id}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
          >
            Open
          </Link>
        </div>

        {needsReadinessCheck && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800/60 dark:bg-amber-950/30">
            <p className="flex items-start gap-1.5 font-semibold text-amber-900 dark:text-amber-100">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              Pre-exercise readiness check
            </p>
            <ul className="ml-5 mt-1 space-y-0.5 text-amber-800 dark:text-amber-200">
              <li>· Confirm your primary phone + out-of-hours number on your profile</li>
              <li>· Read the role briefing from the exercise overview</li>
              <li>· Test you can reach the comms channels for your role</li>
            </ul>
            <form action={confirmReadinessAction} className="mt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                <CheckCircle2 size={11} />
                Confirm I&apos;m ready
              </button>
              <Link
                href={`/org/${userId}`}
                className="ml-2 text-[11px] text-amber-800 hover:underline dark:text-amber-200"
              >
                Open my profile
              </Link>
            </form>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-dashed border-line bg-surface-1 p-5 text-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-indigo-600 dark:text-indigo-300">
          <Target size={16} />
        </span>
        <div>
          <h2 className="font-semibold text-ink">No exercises scheduled for you</h2>
          <p className="mt-1 text-xs text-muted">
            When a facilitator schedules an exercise you&apos;re part of, you&apos;ll see it here
            with a quick join link.{" "}
            <Link href="/exercises" className="text-ink underline">
              View all exercises
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
