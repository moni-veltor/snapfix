import Link from "next/link";
import { LEVEL_LABEL, type TopicMaturity, type AchievementLevel } from "@/lib/achievements/types";

const LEVELS: AchievementLevel[] = [1, 2, 3, 4, 5];

/**
 * Compact maturity dashboard for analytics surfaces + Board pack. One tile
 * per topic with the 5-segment level bar — same shape as the Achievements
 * page maturity tiles, but read-only and link-anchored to /achievements.
 *
 * Print-friendly: uses print:break-inside-avoid so it lands cleanly in the
 * downloadable Board pack.
 */
export default function MaturityStrip({
  maturity,
  title = "Resilience maturity",
  pitch = "5-level maturity ladder per topic — Awareness · Documented · Tested · Measured · Optimised. Click into Achievements for the per-rule breakdown.",
}: {
  maturity: TopicMaturity[];
  title?: string;
  pitch?: string;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface-1 p-5 print:break-inside-avoid">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-[11px] text-soft">{pitch}</p>
        </div>
        <Link
          href="/achievements"
          className="text-[11px] font-medium text-indigo-600 underline dark:text-indigo-300 print:hidden"
        >
          Open Achievements →
        </Link>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {maturity.map((m) => (
          <li key={m.topic}>
            <Tile maturity={m} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Tile({ maturity: m }: { maturity: TopicMaturity }) {
  const total = LEVELS.reduce((n, l) => n + m.totalByLevel[l], 0);
  const unlocked = LEVELS.reduce((n, l) => n + m.unlockedByLevel[l], 0);
  return (
    <article className="flex h-full flex-col rounded-lg border border-line bg-surface-0 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-soft">
          {m.topicLabel}
        </span>
        <span className="font-mono text-[10px] text-soft">
          {unlocked}/{total}
        </span>
      </div>
      <p className="mt-1 font-display text-2xl font-bold text-ink">
        {m.level === 0 ? "—" : `L${m.level}`}
      </p>
      <p className="text-[11px] text-soft">
        {m.level === 0 ? "Awakening" : LEVEL_LABEL[m.level as AchievementLevel]}
      </p>
      <div className="mt-3 flex gap-1">
        {LEVELS.map((l) => {
          const filled = m.unlockedByLevel[l] === m.totalByLevel[l] && m.totalByLevel[l] > 0;
          const partial = m.unlockedByLevel[l] > 0 && !filled;
          return (
            <div
              key={l}
              title={`L${l} ${LEVEL_LABEL[l]} — ${m.unlockedByLevel[l]}/${m.totalByLevel[l]}`}
              className={`h-1.5 flex-1 rounded-full ${
                filled
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : partial
                    ? "bg-amber-400"
                    : "bg-surface-2"
              }`}
            />
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-soft">
        {m.level < 5
          ? `${Math.round(m.progressInLevel * 100)}% into L${(m.level + 1) as AchievementLevel}`
          : "Optimised"}
      </p>
    </article>
  );
}
