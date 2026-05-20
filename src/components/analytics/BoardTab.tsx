import Link from "next/link";
import {
  Activity,
  Coins,
  Layers,
  Printer,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { scoreIncident } from "@/lib/scoring";
import { evaluateVendorReadiness } from "@/lib/vendor-mtp-readiness";
import { formatMoney } from "@/lib/exercise-cost";
import type { AnalyticsFilters, DateRange } from "@/lib/analytics-filters";
import BoardSparkline from "./BoardSparkline";
import MaturityStrip from "@/components/achievements/MaturityStrip";
import { loadMaturitySummary } from "@/lib/achievements/summary";

/**
 * Board view — one A4 page when printed. Five tiles + top-3 findings.
 * Every number has a trend arrow and a sparkline behind it.
 *
 * Designed so a CRO or COO can drop the printout into a Board pack
 * without reformatting.
 */
export default async function BoardTab({
  orgId,
  filters,
  range,
}: {
  orgId: string;
  filters: AnalyticsFilters;
  range: DateRange;
}) {
  const now = new Date();
  const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const windowFrom = range.from ?? yearAgo;

  const maturitySummary = await loadMaturitySummary(orgId);

  // ─── Recent completed exercises (for score trend + composite) ──────────
  const completedExercises = await prisma.exercise.findMany({
    where: {
      orgId,
      status: "COMPLETED",
      ...(filters.jurisdiction ? { jurisdiction: filters.jurisdiction as never } : {}),
      ...(filters.classification ? { classification: filters.classification as never } : {}),
      completedAt: { gte: windowFrom },
      ...(filters.ibsIds.length > 0
        ? { ibsLinks: { some: { ibsId: { in: filters.ibsIds } } } }
        : {}),
    },
    orderBy: { completedAt: "desc" },
    take: 12,
    select: {
      id: true,
      title: true,
      completedAt: true,
      actualCostMinor: true,
      estimatedCostMinor: true,
      incidents: {
        where: { invokedAt: { not: null } },
        orderBy: { invokedAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  const scoredExercises = await Promise.all(
    completedExercises.map(async (e) => {
      const incidentId = e.incidents[0]?.id;
      const score = incidentId ? await scoreIncident(incidentId) : null;
      return { exercise: e, score };
    }),
  );

  const scoreSeries = scoredExercises
    .filter((s) => s.score !== null)
    .reverse() // oldest → newest so the sparkline reads left-to-right
    .map((s, i) => ({ index: i, value: s.score!.overall, label: s.exercise.title }));

  const recent8 = scoreSeries.slice(-8);
  const composite =
    recent8.length === 0
      ? null
      : Math.round(recent8.reduce((sum, s) => sum + s.value, 0) / recent8.length);

  const prevComposite =
    scoreSeries.length >= 12
      ? Math.round(scoreSeries.slice(-12, -8).reduce((s, e) => s + e.value, 0) / 4)
      : null;
  const compositeDelta = composite !== null && prevComposite !== null ? composite - prevComposite : null;

  // ─── Programme spend per quarter (last 4 quarters) ────────────────────
  const fourQuartersAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  const spendExercises = await prisma.exercise.findMany({
    where: {
      orgId,
      completedAt: { gte: fourQuartersAgo },
      OR: [{ actualCostMinor: { not: null } }, { estimatedCostMinor: { not: null } }],
    },
    select: { completedAt: true, actualCostMinor: true, estimatedCostMinor: true },
  });
  const quarters = buildQuarterBuckets(now, 4);
  for (const ex of spendExercises) {
    if (!ex.completedAt) continue;
    const bucket = quarters.find((q) => ex.completedAt! >= q.from && ex.completedAt! < q.to);
    if (!bucket) continue;
    const value = ex.actualCostMinor ?? ex.estimatedCostMinor ?? 0;
    bucket.spendMinor += value;
  }
  const totalSpend = quarters.reduce((s, q) => s + q.spendMinor, 0);
  const currentQ = quarters[quarters.length - 1];
  const prevQ = quarters[quarters.length - 2];
  const spendDelta = prevQ && prevQ.spendMinor > 0
    ? Math.round(((currentQ.spendMinor - prevQ.spendMinor) / prevQ.spendMinor) * 100)
    : null;

  // ─── Coverage: % IBSs tested in last 12 months ────────────────────────
  const [ibsTotal, ibsTestedCount] = await Promise.all([
    prisma.organizationIBS.count({ where: { orgId } }),
    prisma.organizationIBS.count({
      where: {
        orgId,
        exerciseLinks: {
          some: { exercise: { completedAt: { gte: yearAgo } } },
        },
      },
    }),
  ]);
  const coveragePct = ibsTotal === 0 ? 0 : Math.round((ibsTestedCount / ibsTotal) * 100);

  // ─── Regulator readiness — MTP vendors ready + open notifications ────
  const [mtpVendors, openNotifs] = await Promise.all([
    prisma.vendor.findMany({
      where: { orgId, isMaterialThirdParty: true },
      include: { assessments: true },
    }),
    prisma.vendorMtpNotification.count({
      where: { vendor: { orgId }, status: { in: ["DRAFT", "SUBMITTED"] } },
    }),
  ]);
  const mtpReady = mtpVendors.filter((v) => evaluateVendorReadiness(v).isRegisterReady).length;
  const mtpReadyPct = mtpVendors.length === 0 ? 100 : Math.round((mtpReady / mtpVendors.length) * 100);

  // ─── Top 3 coaching findings across recent exercises ──────────────────
  const findingCounts = new Map<string, { count: number; level: string }>();
  for (const { score } of scoredExercises) {
    if (!score) continue;
    for (const c of score.coaching) {
      if (c.level === "good" || c.level === "ok") continue;
      const key = c.finding;
      const cur = findingCounts.get(key) ?? { count: 0, level: c.level };
      cur.count += 1;
      // Keep the worst level seen for this finding
      if (
        (c.level === "critical" && cur.level !== "critical") ||
        (c.level === "warn" && cur.level === "ok")
      ) {
        cur.level = c.level;
      }
      findingCounts.set(key, cur);
    }
  }
  const topFindings = Array.from(findingCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([finding, meta]) => ({ finding, count: meta.count, level: meta.level }));

  const currency = "GBP";

  return (
    <div className="space-y-6 print:space-y-3">
      {/* Print toolbar */}
      <div className="flex justify-end print:hidden">
        <BoardPrintButton />
      </div>

      {/* Header for the printed PDF */}
      <div className="hidden border-b border-line pb-2 print:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          SnapFix · Board pack
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Operational resilience — {range.label}
        </h1>
      </div>

      {/* ─── Maturity strip — same shape as Achievements page ───────────── */}
      <MaturityStrip
        maturity={maturitySummary.maturity}
        title="Resilience maturity"
        pitch="5-level ladder per topic. Lands cleanly on a printed page — the Board pack carries the same picture as Achievements."
      />

      {/* ─── 5-tile KPI strip ───────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile
          icon={Activity}
          label="Resilience health"
          value={composite !== null ? `${composite}/100` : "—"}
          delta={compositeDelta}
          deltaUnit="pts"
          tone={
            composite === null
              ? "neutral"
              : composite >= 80
                ? "ok"
                : composite >= 60
                  ? "warn"
                  : "critical"
          }
          sub="rolling average of last 8 exercise scores"
          sparkline={recent8.length > 1 ? recent8.map((s) => s.value) : null}
        />
        <KpiTile
          icon={Coins}
          label="Programme spend"
          value={totalSpend > 0 ? formatMoney(Math.round(totalSpend / 100), currency) : "—"}
          delta={spendDelta}
          deltaUnit="%"
          tone="neutral"
          sub={`last 12 months · ${quarters[quarters.length - 1].label} vs ${quarters[quarters.length - 2]?.label ?? "—"}`}
          sparkline={quarters.map((q) => q.spendMinor / 100)}
        />
        <KpiTile
          icon={Layers}
          label="IBS coverage"
          value={`${coveragePct}%`}
          tone={coveragePct >= 80 ? "ok" : coveragePct >= 50 ? "warn" : "critical"}
          sub={`${ibsTestedCount}/${ibsTotal} IBSs tested in last 12 months`}
        />
        <KpiTile
          icon={Target}
          label="Regulator readiness"
          value={mtpVendors.length === 0 ? "—" : `${mtpReadyPct}%`}
          tone={
            mtpVendors.length === 0
              ? "neutral"
              : mtpReadyPct === 100
                ? "ok"
                : mtpReadyPct >= 70
                  ? "warn"
                  : "critical"
          }
          sub={`${mtpReady}/${mtpVendors.length} MTP vendors register-ready · ${openNotifs} open notifications`}
        />
        <KpiTile
          icon={ShieldAlert}
          label="Open findings"
          value={String(topFindings.reduce((s, f) => s + f.count, 0))}
          tone={topFindings.length === 0 ? "ok" : topFindings.some((f) => f.level === "critical") ? "critical" : "warn"}
          sub="critical + warn coaching points · recent exercises"
        />
      </section>

      {/* ─── Top 3 risks surfaced ───────────────────────────────────────── */}
      <section className="rounded-xl border border-line bg-surface-1 p-5 print:break-inside-avoid">
        <header className="mb-3">
          <h2 className="text-sm font-semibold text-ink">Top 3 findings to discuss</h2>
          <p className="mt-0.5 text-[11px] text-soft">
            Most-cited weak spots across the last {scoredExercises.length} exercises in this window.
            Ordered by frequency.
          </p>
        </header>
        {topFindings.length === 0 ? (
          <p className="text-sm text-muted">
            No critical or warn-level findings in this window. Programme is clean.
          </p>
        ) : (
          <ol className="space-y-2">
            {topFindings.map((f, i) => (
              <li
                key={f.finding}
                className={`rounded-md border p-3 ${
                  f.level === "critical"
                    ? "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40"
                    : "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-ink">
                    {i + 1}. {f.finding}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      f.level === "critical"
                        ? "bg-rose-200 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100"
                        : "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100"
                    }`}
                  >
                    {f.level} · cited {f.count}×
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ─── Footnote ──────────────────────────────────────────────────── */}
      <p className="text-[10px] text-soft print:break-inside-avoid">
        Generated by SnapFix · {now.toISOString().slice(0, 10)} · scope: {range.label}
        {filters.ibsIds.length > 0 && ` · ${filters.ibsIds.length} IBS${filters.ibsIds.length === 1 ? "" : "s"} filtered`}
        {filters.jurisdiction && ` · jurisdiction ${filters.jurisdiction}`}
        {filters.classification && ` · classification ${filters.classification}`}
      </p>
      <p className="text-[11px] text-soft print:hidden">
        Want more depth?{" "}
        <Link href="/analytics?audience=executive" className="font-medium text-indigo-600 underline">
          Switch to Executive view
        </Link>{" "}
        for trends, regulator-clock performance, and the comms cascade picture.{" "}
        Need a one-page maturity statement for the Board pack?{" "}
        <Link
          href="/achievements/statement"
          className="font-medium text-indigo-600 underline"
        >
          Open the maturity statement
        </Link>
        .
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tile + sparkline + print button
// ────────────────────────────────────────────────────────────────────────────

function KpiTile({
  icon: Icon,
  label,
  value,
  delta,
  deltaUnit,
  sub,
  sparkline,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  delta?: number | null;
  deltaUnit?: string;
  sub?: string;
  sparkline?: number[] | null;
  tone?: "ok" | "warn" | "critical" | "neutral";
}) {
  const valueColor =
    tone === "ok"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-300"
        : tone === "critical"
          ? "text-rose-600 dark:text-rose-300"
          : "text-ink";
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface-1 p-4 print:break-inside-avoid">
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
          <Icon size={11} />
          {label}
        </div>
        <div className={`mt-1 font-display text-3xl font-bold ${valueColor}`}>{value}</div>
        {delta !== null && delta !== undefined && (
          <p
            className={`mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold ${
              delta > 0
                ? "text-emerald-700 dark:text-emerald-300"
                : delta < 0
                  ? "text-rose-700 dark:text-rose-300"
                  : "text-soft"
            }`}
          >
            {delta > 0 ? <TrendingUp size={11} /> : delta < 0 ? <TrendingDown size={11} /> : null}
            {delta > 0 ? "+" : ""}
            {delta}
            {deltaUnit}
          </p>
        )}
        {sub && <p className="mt-1 text-[11px] text-soft">{sub}</p>}
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-12 opacity-50 print:opacity-30">
          <BoardSparkline values={sparkline} tone={tone} />
        </div>
      )}
    </div>
  );
}

function BoardPrintButton() {
  return (
    <form action="javascript:window.print()">
      <button className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
        <Printer size={13} />
        Print Board pack
      </button>
    </form>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function buildQuarterBuckets(
  ref: Date,
  count: number,
): { label: string; from: Date; to: Date; spendMinor: number }[] {
  const buckets: { label: string; from: Date; to: Date; spendMinor: number }[] = [];
  const refQ = Math.floor(ref.getMonth() / 3);
  for (let i = count - 1; i >= 0; i--) {
    const totalQ = refQ - i;
    const yearOffset = Math.floor(totalQ / 4);
    const q = ((totalQ % 4) + 4) % 4;
    const year = ref.getFullYear() + yearOffset;
    const from = new Date(year, q * 3, 1);
    const to = new Date(year, (q + 1) * 3, 1);
    buckets.push({
      label: `Q${q + 1} ${String(year).slice(-2)}`,
      from,
      to,
      spendMinor: 0,
    });
  }
  return buckets;
}
