import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CloudCog,
  Download,
  ShieldCheck,
} from "lucide-react";
import { Bar, ProgressRing } from "@/components/ui/charts";
import {
  type VendorLite,
  aggregateExitReadiness,
  assuranceStatus,
  contractStatus,
  hyperscalerConcentration,
  tierDistribution,
  weakExitPlans,
} from "@/lib/dora";

type Props = {
  vendors: VendorLite[];
};

/**
 * Top-of-page strip for the vendors register. Five panels:
 *   1) Concentration view — tier distribution + hyperscaler concentration
 *   2) Exit readiness — aggregate score + the worst offenders
 *   3) Assurance freshness — SOC 2 / ISAE3402 expiring soon
 *   4) Contract calendar — what renews when
 *   5) DORA register CSV export
 */
export default function DORAInsights({ vendors }: Props) {
  if (vendors.length === 0) return null;

  const now = new Date();
  const distribution = tierDistribution(vendors);
  const hs = hyperscalerConcentration(vendors);
  const readiness = aggregateExitReadiness(vendors, now);
  const weak = weakExitPlans(vendors, now).slice(0, 4);

  const assuranceBuckets = {
    ok: vendors.filter((v) => assuranceStatus(v, now) === "ok").length,
    expiring: vendors.filter((v) => assuranceStatus(v, now) === "expiring").length,
    expired: vendors.filter((v) => assuranceStatus(v, now) === "expired").length,
    missing: vendors.filter((v) => assuranceStatus(v, now) === "missing").length,
  };

  const upcomingRenewals = vendors
    .map((v) => ({ v, ...contractStatus(v, now) }))
    .filter((row) => row.status === "renewing" || row.status === "expiring")
    .sort((a, b) => (a.daysToEnd ?? 9e6) - (b.daysToEnd ?? 9e6))
    .slice(0, 5);

  const expired = vendors
    .map((v) => ({ v, ...contractStatus(v, now) }))
    .filter((r) => r.status === "expired");

  const topHyperscaler = hs[0];

  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <ConcentrationPanel
          distribution={distribution}
          hyperscalers={hs}
          totalVendors={vendors.length}
          topHyperscaler={topHyperscaler ?? null}
        />
        <ExitReadinessPanel readiness={readiness} weak={weak} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
        <AssurancePanel buckets={assuranceBuckets} />
        <ContractCalendarPanel
          upcoming={upcomingRenewals}
          expiredCount={expired.length}
        />
        <ExportPanel />
      </div>
    </section>
  );
}

function ConcentrationPanel({
  distribution,
  hyperscalers,
  totalVendors,
  topHyperscaler,
}: {
  distribution: { tier1: number; tier2: number; tier3: number };
  hyperscalers: { hyperscaler: string; count: number }[];
  totalVendors: number;
  topHyperscaler: { hyperscaler: string; count: number } | null;
}) {
  const t1Pct = totalVendors ? Math.round((distribution.tier1 / totalVendors) * 100) : 0;

  return (
    <article className="rounded-xl border border-line bg-surface-1 p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Concentration</h3>
          <p className="mt-0.5 text-xs text-muted">
            Tier mix and 4th-party clustering across the register.
          </p>
        </div>
        <CloudCog size={14} className="text-soft" />
      </header>

      <div className="mt-4">
        <Bar
          segments={[
            { label: "Tier 1", value: distribution.tier1, color: "#ef4444" },
            { label: "Tier 2", value: distribution.tier2, color: "#f59e0b" },
            { label: "Tier 3", value: distribution.tier3, color: "#06b6d4" },
          ]}
          height={12}
        />
        <p className="mt-2 text-[11px] text-soft">
          Tier 1 makes up <span className="font-semibold text-ink">{t1Pct}%</span> of the
          register · {totalVendors} vendor{totalVendors === 1 ? "" : "s"} total.
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-surface-0 p-3">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-soft">
          <span>Hyperscaler clusters</span>
          <span>4th-party concentration</span>
        </div>
        {hyperscalers.length === 0 ? (
          <p className="mt-2 text-xs text-muted">
            No hyperscaler tagged yet — capture it on each vendor to see concentration here.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {hyperscalers.map((h) => {
              const pct = Math.round((h.count / totalVendors) * 100);
              const isHigh = pct >= 30;
              return (
                <li
                  key={h.hyperscaler}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-ink">{h.hyperscaler}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-muted">{h.count} vendors</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                        isHigh
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                      }`}
                    >
                      {pct}%
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {topHyperscaler && topHyperscaler.count >= 3 && (
          <p className="mt-2 flex items-start gap-1 rounded-md bg-rose-50 p-2 text-[11px] text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            <span>
              <span className="font-semibold">{topHyperscaler.count}</span> vendors all run on{" "}
              <span className="font-semibold">{topHyperscaler.hyperscaler}</span>. Test the
              hyperscaler-outage scenario before the regulator asks.
            </span>
          </p>
        )}
      </div>
    </article>
  );
}

function ExitReadinessPanel({
  readiness,
  weak,
}: {
  readiness: number;
  weak: { vendor: VendorLite; score: number }[];
}) {
  return (
    <article className="rounded-xl border border-line bg-surface-1 p-5">
      <header>
        <h3 className="text-sm font-semibold text-ink">Exit-plan readiness</h3>
        <p className="mt-0.5 text-xs text-muted">
          Composite score across DORA-critical and tier-1 vendors.
        </p>
      </header>

      <div className="mt-4 flex items-center gap-4">
        <ProgressRing
          value={readiness}
          label={String(readiness)}
          sublabel="readiness"
          size={120}
          thickness={10}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
            Weakest exit plans
          </p>
          {weak.length === 0 ? (
            <p className="mt-2 text-xs text-muted">
              All critical vendors have a healthy exit-plan score (≥ 60). Good shape.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {weak.map((row) => (
                <li
                  key={row.vendor.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface-0 px-2 py-1.5 text-xs"
                >
                  <span className="truncate text-ink">{row.vendor.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                      row.score < 30
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                    }`}
                  >
                    {row.score}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

function AssurancePanel({
  buckets,
}: {
  buckets: { ok: number; expiring: number; expired: number; missing: number };
}) {
  return (
    <article className="rounded-xl border border-line bg-surface-1 p-5">
      <header className="flex items-center gap-2">
        <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-300" />
        <div>
          <h3 className="text-sm font-semibold text-ink">Assurance</h3>
          <p className="mt-0.5 text-xs text-muted">
            SOC 2 / ISAE3402 / ISO 27001 freshness.
          </p>
        </div>
      </header>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
        <Tile color="emerald" label="OK" value={buckets.ok} />
        <Tile color="amber" label="Expiring" value={buckets.expiring} />
        <Tile color="rose" label="Expired" value={buckets.expired} />
        <Tile color="slate" label="Missing" value={buckets.missing} />
      </div>
    </article>
  );
}

function ContractCalendarPanel({
  upcoming,
  expiredCount,
}: {
  upcoming: { v: VendorLite; daysToEnd: number | null; status: string }[];
  expiredCount: number;
}) {
  return (
    <article className="rounded-xl border border-line bg-surface-1 p-5">
      <header className="flex items-center gap-2">
        <Calendar size={14} className="text-indigo-600 dark:text-indigo-300" />
        <div>
          <h3 className="text-sm font-semibold text-ink">Contract calendar</h3>
          <p className="mt-0.5 text-xs text-muted">
            What renews soon · what already expired.
          </p>
        </div>
      </header>
      {upcoming.length === 0 && expiredCount === 0 ? (
        <p className="mt-3 text-xs text-muted">
          No contract dates captured yet. Add contract start / end on each vendor to populate
          the calendar.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {upcoming.map((row) => (
            <li
              key={row.v.id}
              className="flex items-center justify-between rounded-md border border-line bg-surface-0 px-2 py-1.5 text-xs"
            >
              <span className="truncate text-ink">{row.v.name}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                  (row.daysToEnd ?? 9e6) < 30
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                }`}
              >
                {row.daysToEnd}d
              </span>
            </li>
          ))}
          {expiredCount > 0 && (
            <li className="rounded-md bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
              <span className="font-semibold">{expiredCount}</span> contract
              {expiredCount === 1 ? "" : "s"} already past end date — review status.
            </li>
          )}
        </ul>
      )}
    </article>
  );
}

function ExportPanel() {
  return (
    <article className="rounded-xl border border-line bg-surface-1 p-5">
      <header>
        <h3 className="text-sm font-semibold text-ink">DORA register</h3>
        <p className="mt-0.5 text-xs text-muted">Register of Information export.</p>
      </header>
      <Link
        href="/api/vendors/dora-register"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong hover:bg-surface-2"
      >
        <Download size={12} />
        Download CSV
      </Link>
    </article>
  );
}

function Tile({
  color,
  label,
  value,
}: {
  color: "emerald" | "amber" | "rose" | "slate";
  label: string;
  value: number;
}) {
  const cls = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200",
    amber:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
    rose: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200",
    slate:
      "border-line bg-surface-0 text-muted",
  }[color];
  return (
    <div className={`rounded-md border p-2 ${cls}`}>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
}
