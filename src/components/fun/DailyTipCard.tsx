import Hoot from "./Hoot";
import { tipForToday } from "@/lib/daily-tips";

/**
 * Daily tip widget rendered server-side using day-of-year to pick. Drop
 * onto any page that has a moment of breathing room — Hoot delivers a
 * one-line bit of operational-resilience folk wisdom.
 */
export default function DailyTipCard({ date }: { date?: Date }) {
  const tip = tipForToday(date);
  return (
    <aside className="flex items-start gap-4 rounded-xl border border-line bg-gradient-brand-soft p-4">
      <Hoot size={56} mood="thinking" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-200">
          <span>Hoot says</span>
          <span className="rounded-full bg-white/40 px-1.5 py-0.5 text-[9px] text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100">
            {tip.topic}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink">{tip.body}</p>
      </div>
    </aside>
  );
}
