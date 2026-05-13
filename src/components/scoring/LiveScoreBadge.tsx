import Link from "next/link";

type Props = {
  exerciseId: string;
  score: number;
  criticalCount: number;
  warnCount: number;
};

/**
 * A compact running-performance pill shown on the live workspace header.
 * Clicking links to the debrief page where the full performance card lives.
 */
export default function LiveScoreBadge({ exerciseId, score, criticalCount, warnCount }: Props) {
  const tone =
    score >= 80
      ? "border-emerald-400 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-200"
      : score >= 60
        ? "border-amber-400 bg-amber-500/10 text-amber-700 dark:border-amber-500/40 dark:text-amber-200"
        : "border-rose-400 bg-rose-500/10 text-rose-700 dark:border-rose-500/40 dark:text-rose-200";

  return (
    <Link
      href={`/exercises/${exerciseId}/debrief`}
      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition hover:opacity-90 ${tone}`}
      title="Live performance score — click for the full breakdown"
    >
      <span className="font-mono text-base font-bold">{score}</span>
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wider">score</span>
        {(criticalCount > 0 || warnCount > 0) && (
          <span className="text-[10px] opacity-80">
            {criticalCount > 0 && `${criticalCount} critical`}
            {criticalCount > 0 && warnCount > 0 && " · "}
            {warnCount > 0 && `${warnCount} watch`}
          </span>
        )}
      </span>
    </Link>
  );
}
