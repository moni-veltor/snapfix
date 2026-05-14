import type { Highlight } from "@/lib/highlight-reel";

type Props = {
  highlights: Highlight[];
};

const TONE: Record<Highlight["tone"], string> = {
  ok: "border-emerald-400 bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40",
  warn: "border-amber-400 bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40",
  critical: "border-rose-400 bg-rose-100 dark:border-rose-700 dark:bg-rose-950/40",
  info: "border-indigo-400 bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950/40",
};

const TONE_DOT: Record<Highlight["tone"], string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  critical: "bg-rose-500",
  info: "bg-indigo-500",
};

/**
 * Post-exercise highlight reel — the key moments of the run as a vertical
 * timeline. Auto-derived from the same data the scoring engine uses, so it
 * always reflects what actually happened.
 */
export default function HighlightReel({ highlights }: Props) {
  if (highlights.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line bg-surface-1 p-6 text-center text-xs text-muted">
        Run an exercise to see its key moments captured here.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface-1 p-6 shadow-[var(--shadow-card)]">
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          Highlight reel
        </p>
        <span className="text-xs text-muted">{highlights.length} key moments</span>
      </div>
      <h2 className="mb-5 text-base font-semibold text-ink">How the exercise played out</h2>
      <ol className="relative space-y-3 border-l border-line pl-6">
        {highlights.map((h) => (
          <li key={h.id} className="relative">
            <span
              className={`absolute -left-[27px] top-2 h-3 w-3 rounded-full ring-4 ring-surface-1 ${TONE_DOT[h.tone]}`}
            />
            <div
              className={`rounded-md border p-3 text-sm ${TONE[h.tone]}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-ink">{h.text}</span>
                <span className="font-mono text-[11px] text-muted">
                  {h.at.toISOString().slice(11, 16)}
                </span>
              </div>
              {h.detail && (
                <p className="mt-1 text-xs text-muted">{h.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
