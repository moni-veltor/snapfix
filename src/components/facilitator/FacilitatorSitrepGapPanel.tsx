import { AlertOctagon, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export type SitrepGapRow = {
  businessUnit: string;
  /** Minutes since this BU's most recent sitrep, null if never. */
  minutesSinceLast: number | null;
  /** D-Day HH:MM the BU promised the next update at, if any. */
  promisedNextUpdate: string | null;
  /** Minutes overdue against the promised next update — null if no promise
   *  or promise hasn't lapsed. */
  promiseOverdueMin: number | null;
};

/**
 * Facilitator-side roll-up of sitrep cadence per business unit. Sits
 * inline on /exercises/[id]/facilitator so the chair can see at a
 * glance which BUs are silent and chase them directly — instead of
 * hunting the live feed for the absence of a sitrep.
 *
 * Tiers (same thresholds as SitrepCadenceBanner on the participant
 * side, so the two views can't disagree):
 *   - OK       — last sitrep ≤ 30 min ago
 *   - WARNING  — 30–60 min, or promise lapsed by < 15 min
 *   - CRITICAL — > 60 min or promise lapsed by ≥ 15 min, or never filed
 *
 * Sorted critical-first.
 */
export default function FacilitatorSitrepGapPanel({
  rows,
  incidentInvoked,
}: {
  rows: SitrepGapRow[];
  /** When false, the panel renders a neutral "no incident yet" line
   *  rather than the cadence detail. */
  incidentInvoked: boolean;
}) {
  if (!incidentInvoked) {
    return (
      <section className="rounded-xl border border-line bg-surface-1 p-4 text-sm text-soft">
        <p>Sitrep cadence kicks in once the IMT is invoked.</p>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-line bg-surface-1 p-4 text-sm text-soft">
        <p>No business units have filed a sitrep yet for this incident.</p>
      </section>
    );
  }

  const tiered = rows.map((r) => ({ ...r, tier: tierFor(r) }));
  tiered.sort((a, b) => rank(a.tier) - rank(b.tier));

  const criticalCount = tiered.filter((r) => r.tier === "CRITICAL").length;
  const warnCount = tiered.filter((r) => r.tier === "WARNING").length;

  return (
    <section className="rounded-xl border border-line bg-surface-1">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Clock size={14} className="text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
          Sitrep cadence by BU
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-soft">
            {rows.length}
          </span>
        </h3>
        <div className="flex items-center gap-1.5 text-[10px]">
          {criticalCount > 0 && (
            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {criticalCount} chase now
            </span>
          )}
          {warnCount > 0 && (
            <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 font-semibold text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
              {warnCount} ageing
            </span>
          )}
        </div>
      </header>
      <ul className="divide-y divide-line">
        {tiered.map((r) => (
          <li
            key={r.businessUnit}
            className="flex flex-wrap items-center gap-2 px-4 py-2 text-[12px]"
          >
            <TierIcon tier={r.tier} />
            <span className="min-w-0 flex-1 truncate font-medium text-ink">
              {r.businessUnit}
            </span>
            <span className="text-soft">
              {r.minutesSinceLast === null
                ? "no sitrep yet"
                : `last sitrep ${r.minutesSinceLast}m ago`}
            </span>
            {r.promisedNextUpdate && (
              <span
                className={
                  r.promiseOverdueMin != null && r.promiseOverdueMin > 0
                    ? "font-semibold text-rose-700 dark:text-rose-300"
                    : "text-soft"
                }
              >
                · promised {r.promisedNextUpdate}
                {r.promiseOverdueMin != null && r.promiseOverdueMin > 0
                  ? ` (${r.promiseOverdueMin}m overdue)`
                  : ""}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

type Tier = "OK" | "WARNING" | "CRITICAL";

function tierFor(r: SitrepGapRow): Tier {
  if (r.minutesSinceLast === null) return "CRITICAL";
  if (r.promiseOverdueMin != null && r.promiseOverdueMin >= 15) return "CRITICAL";
  if (r.minutesSinceLast > 60) return "CRITICAL";
  if (r.minutesSinceLast > 30) return "WARNING";
  if (r.promiseOverdueMin != null && r.promiseOverdueMin > 0) return "WARNING";
  return "OK";
}

function rank(t: Tier): number {
  if (t === "CRITICAL") return 0;
  if (t === "WARNING") return 1;
  return 2;
}

function TierIcon({ tier }: { tier: Tier }) {
  if (tier === "CRITICAL")
    return (
      <AlertOctagon
        size={13}
        className="shrink-0 text-rose-700 dark:text-rose-300"
        aria-label="Critical"
      />
    );
  if (tier === "WARNING")
    return (
      <AlertTriangle
        size={13}
        className="shrink-0 text-cyan-700 dark:text-cyan-300"
        aria-label="Warning"
      />
    );
  return (
    <CheckCircle2
      size={13}
      className="shrink-0 text-emerald-700 dark:text-emerald-300"
      aria-label="OK"
    />
  );
}
