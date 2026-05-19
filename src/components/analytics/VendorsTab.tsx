import Link from "next/link";
import { Cloud, Compass, FileSpreadsheet, Layers, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { evaluateVendorReadiness } from "@/lib/vendor-mtp-readiness";
import type { AnalyticsFilters, DateRange } from "@/lib/analytics-filters";
import { ToneBars } from "./AnalyticsCharts";

/**
 * Vendors view — third-party concentration + MTP-register health.
 *
 * Designed so the regulator question "what is your concentration risk?"
 * has a single screen as the answer:
 *   · hyperscaler × region heatmap (4th-party concentration too)
 *   · MTP register-readiness gauge
 *   · exit-plan freshness (last reviewed, declared RTO)
 *   · annual concentration brief export
 */
export default async function VendorsTab({
  orgId,
  range,
}: {
  orgId: string;
  // Vendors view is intentionally org-wide; the FilterBar's date/IBS filters
  // don't constrain the third-party register itself.
  filters: AnalyticsFilters;
  range: DateRange;
}) {
  const now = new Date();

  // ─── Load vendors with everything we need for this view ─────────────────
  const vendors = await prisma.vendor.findMany({
    where: { orgId },
    orderBy: [{ isMaterialThirdParty: "desc" }, { tier: "asc" }, { name: "asc" }],
    include: {
      assessments: { orderBy: { assessedAt: "desc" } },
      _count: { select: { ibsLinks: true } },
    },
  });

  const mtpVendors = vendors.filter((v) => v.isMaterialThirdParty);
  const doraVendors = vendors.filter((v) => v.isDoraCritical);

  // ─── Hyperscaler × region heatmap ────────────────────────────────────────
  type HeatCell = {
    hyperscaler: string;
    region: string;
    vendors: string[];
    mtpCount: number;
  };
  const cellMap = new Map<string, HeatCell>();
  const hyperscalers = new Set<string>();
  const regions = new Set<string>();
  for (const v of vendors) {
    if (!v.hyperscaler) continue;
    const region = v.region ?? "—";
    const key = `${v.hyperscaler}::${region}`;
    hyperscalers.add(v.hyperscaler);
    regions.add(region);
    const cell = cellMap.get(key) ?? { hyperscaler: v.hyperscaler, region, vendors: [], mtpCount: 0 };
    cell.vendors.push(v.name);
    if (v.isMaterialThirdParty) cell.mtpCount += 1;
    cellMap.set(key, cell);
  }
  const hyperList = Array.from(hyperscalers).sort();
  const regionList = Array.from(regions).sort();
  const maxCellSize = Math.max(0, ...Array.from(cellMap.values()).map((c) => c.vendors.length));

  // ─── Tier mix bars ──────────────────────────────────────────────────────
  const tierCounts = new Map<string, number>();
  for (const v of vendors) tierCounts.set(v.tier, (tierCounts.get(v.tier) ?? 0) + 1);
  const tierData = ["TIER_1", "TIER_2", "TIER_3"].map((t) => ({
    label: t.replace("_", " "),
    value: tierCounts.get(t) ?? 0,
    tone: (t === "TIER_1" ? "critical" : t === "TIER_2" ? "warn" : "ok") as
      | "ok"
      | "warn"
      | "critical",
  }));

  // ─── Register-readiness ──────────────────────────────────────────────────
  const readinessRows = mtpVendors.map((v) => {
    const r = evaluateVendorReadiness(v);
    return {
      id: v.id,
      name: v.name,
      legalName: v.legalName,
      contractRef: v.contractRef,
      pct: r.total === 0 ? 0 : Math.round((r.passed / r.total) * 100),
      passed: r.passed,
      total: r.total,
      isReady: r.isRegisterReady,
      missing: r.checks.filter((c) => !c.ok).slice(0, 3).map((c) => c.label),
    };
  });
  readinessRows.sort((a, b) => a.pct - b.pct);
  const readyCount = readinessRows.filter((r) => r.isReady).length;
  const readyPct = readinessRows.length === 0 ? 100 : Math.round((readyCount / readinessRows.length) * 100);

  // ─── Exit-plan freshness ────────────────────────────────────────────────
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  type ExitRow = {
    id: string;
    name: string;
    tier: string;
    lastReviewedAt: Date | null;
    daysSinceReview: number | null;
    rtoMin: number | null;
    status: "current" | "stale" | "missing";
  };
  const exitRows: ExitRow[] = mtpVendors.map((v) => {
    const lastReviewedAt = v.exitPlanReviewedAt;
    const daysSinceReview = lastReviewedAt
      ? Math.floor((now.getTime() - lastReviewedAt.getTime()) / (24 * 60 * 60 * 1000))
      : null;
    const status: ExitRow["status"] = !lastReviewedAt
      ? "missing"
      : lastReviewedAt < oneYearAgo
        ? "stale"
        : "current";
    return {
      id: v.id,
      name: v.name,
      tier: v.tier,
      lastReviewedAt,
      daysSinceReview,
      rtoMin: v.exitPlanRTOMin,
      status,
    };
  });
  exitRows.sort((a, b) => {
    const rank = { missing: 0, stale: 1, current: 2 } as const;
    return rank[a.status] - rank[b.status];
  });
  const exitMissing = exitRows.filter((e) => e.status === "missing").length;
  const exitStale = exitRows.filter((e) => e.status === "stale").length;

  // ─── Latest annual register snapshot (for the export panel) ──────────────
  const latestSnapshot = await prisma.vendorRegisterSnapshot.findFirst({
    where: { orgId },
    orderBy: { reportingDate: "desc" },
    select: {
      id: true,
      reportingDate: true,
      submissionId: true,
      xlsxBlobUrl: true,
      vendorSnapshots: true,
    },
  });
  const snapshotVendorCount = Array.isArray(latestSnapshot?.vendorSnapshots)
    ? (latestSnapshot!.vendorSnapshots as unknown[]).length
    : 0;

  return (
    <div className="space-y-6">
      {/* ─── KPI strip ──────────────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniTile
          icon={Layers}
          label="Material third parties"
          value={String(mtpVendors.length)}
          sub={`${doraVendors.length} DORA-critical · ${vendors.length} total vendors`}
        />
        <MiniTile
          icon={Target}
          label="Register-ready"
          value={mtpVendors.length === 0 ? "—" : `${readyPct}%`}
          sub={
            mtpVendors.length === 0
              ? "no MTP vendors yet"
              : `${readyCount}/${mtpVendors.length} pass every regulator check`
          }
          tone={
            mtpVendors.length === 0
              ? "neutral"
              : readyPct === 100
                ? "ok"
                : readyPct >= 70
                  ? "warn"
                  : "critical"
          }
        />
        <MiniTile
          icon={Compass}
          label="Exit-plan freshness"
          value={
            mtpVendors.length === 0
              ? "—"
              : `${exitRows.filter((e) => e.status === "current").length}/${mtpVendors.length}`
          }
          sub={
            mtpVendors.length === 0
              ? "no MTP vendors yet"
              : `${exitMissing} missing · ${exitStale} > 12 months old`
          }
          tone={
            mtpVendors.length === 0
              ? "neutral"
              : exitMissing + exitStale === 0
                ? "ok"
                : exitMissing > 0
                  ? "critical"
                  : "warn"
          }
        />
        <MiniTile
          icon={Cloud}
          label="Hyperscaler footprint"
          value={String(hyperList.length)}
          sub={`${cellMap.size} hyperscaler×region pairs · max cell = ${maxCellSize} vendor${maxCellSize === 1 ? "" : "s"}`}
        />
      </section>

      {/* ─── Hyperscaler × region heatmap ──────────────────────────────── */}
      <Section
        title="Hyperscaler × region concentration"
        subtitle="Each cell = vendors hosted on a hyperscaler in a region. Darker = more vendors in the same cell — that's the regulator's concentration question."
      >
        {hyperList.length === 0 ? (
          <EmptyHint message="No vendors have a hyperscaler set. Tag vendors with hyperscaler + region on the vendor edit page to populate this view." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface-1">
            <table className="w-full text-xs">
              <thead className="bg-surface-0 text-left uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-2 font-medium">Hyperscaler ↓ · Region →</th>
                  {regionList.map((r) => (
                    <th key={r} className="p-2 text-center font-medium">
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hyperList.map((h) => (
                  <tr key={h} className="border-t border-line">
                    <td className="p-2 font-semibold text-ink">{h}</td>
                    {regionList.map((r) => {
                      const cell = cellMap.get(`${h}::${r}`);
                      const size = cell?.vendors.length ?? 0;
                      const intensity = maxCellSize === 0 ? 0 : size / maxCellSize;
                      const bg =
                        size === 0
                          ? ""
                          : intensity >= 0.7
                            ? "bg-rose-200 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100"
                            : intensity >= 0.4
                              ? "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100"
                              : "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100";
                      return (
                        <td
                          key={r}
                          className={`relative p-2 text-center align-top ${bg}`}
                          title={cell ? cell.vendors.join(", ") : ""}
                        >
                          {size === 0 ? (
                            <span className="text-soft">—</span>
                          ) : (
                            <>
                              <span className="font-mono text-sm font-bold">{size}</span>
                              {cell && cell.mtpCount > 0 && (
                                <span className="ml-1 text-[10px] font-semibold">
                                  ({cell.mtpCount} MTP)
                                </span>
                              )}
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ─── Tier mix ─────────────────────────────────────────────────── */}
      <Section
        title="Tier mix"
        subtitle="How many vendors sit in each criticality tier. A regulator-readable picture of the supplier population."
      >
        <ToneBars data={tierData} yLabel="vendors" />
      </Section>

      {/* ─── MTP register readiness ──────────────────────────────────── */}
      <Section
        title="MTP register readiness"
        subtitle="Per-MTP-vendor score against every regulator field. Sorted lowest first — these are the rows that will block your next register filing."
      >
        {readinessRows.length === 0 ? (
          <EmptyHint message="No vendors are flagged Material Third Party. Mark vendors as MTP from the vendor edit page." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
            <table className="w-full text-sm">
              <thead className="bg-surface-0 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Top gaps</th>
                  <th className="p-3 text-right">Score</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {readinessRows.map((r) => (
                  <tr key={r.id} className="border-t border-line align-top">
                    <td className="p-3">
                      <Link href={`/vendors/${r.id}`} className="font-medium hover:underline">
                        {r.name}
                      </Link>
                      {r.contractRef && (
                        <p className="text-[11px] text-soft">ref {r.contractRef}</p>
                      )}
                    </td>
                    <td className="p-3 text-[11px] text-soft">
                      {r.missing.length === 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-300">complete</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {r.missing.map((m) => (
                            <li key={m}>· {m}</li>
                          ))}
                          {r.total - r.passed > 3 && (
                            <li className="text-muted">+ {r.total - r.passed - 3} more</li>
                          )}
                        </ul>
                      )}
                    </td>
                    <td
                      className={`p-3 text-right font-mono font-semibold ${
                        r.pct === 100
                          ? "text-emerald-700 dark:text-emerald-300"
                          : r.pct >= 70
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {r.pct}%
                      <span className="ml-1 text-[10px] font-normal text-soft">
                        {r.passed}/{r.total}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {r.isReady ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                          Ready
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
                          Gaps
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ─── Exit-plan freshness ─────────────────────────────────────── */}
      <Section
        title="Exit-plan freshness"
        subtitle="When the exit plan for each MTP vendor was last reviewed, and the declared switch-over RTO. Anything older than 12 months is stale."
      >
        {exitRows.length === 0 ? (
          <EmptyHint message="No MTP vendors yet — nothing to evaluate." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
            <table className="w-full text-sm">
              <thead className="bg-surface-0 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Last reviewed</th>
                  <th className="p-3 text-right">Exit RTO</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {exitRows.map((e) => (
                  <tr key={e.id} className="border-t border-line">
                    <td className="p-3 font-medium">
                      <Link href={`/vendors/${e.id}`} className="hover:underline">
                        {e.name}
                      </Link>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-muted">
                      {e.tier.replace("_", " ")}
                    </td>
                    <td className="p-3 text-xs">
                      {e.lastReviewedAt ? (
                        <span className="font-mono">
                          {e.lastReviewedAt.toISOString().slice(0, 10)}
                          <span className="ml-1 text-soft">· {e.daysSinceReview}d ago</span>
                        </span>
                      ) : (
                        <span className="text-soft">never</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {e.rtoMin === null ? <span className="text-soft">—</span> : `${e.rtoMin}m`}
                    </td>
                    <td className="p-3 text-right">
                      {e.status === "current" ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                          Current
                        </span>
                      ) : e.status === "stale" ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          Stale
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
                          Missing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ─── Concentration brief export ──────────────────────────────── */}
      <Section
        title="Annual concentration brief"
        subtitle="Snapshot the full MTP register for the regulator. Each generated brief is immutable and lives in the audit log."
      >
        <div className="rounded-xl border border-line bg-surface-1 p-5">
          {latestSnapshot ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  Latest snapshot #{latestSnapshot.submissionId} ·{" "}
                  {latestSnapshot.reportingDate.toISOString().slice(0, 10)}
                </p>
                <p className="mt-0.5 text-[11px] text-soft">
                  {snapshotVendorCount} vendor{snapshotVendorCount === 1 ? "" : "s"} frozen ·{" "}
                  filed via /vendors/register
                </p>
              </div>
              <div className="flex gap-2">
                {latestSnapshot.xlsxBlobUrl && (
                  <a
                    href={latestSnapshot.xlsxBlobUrl}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2"
                  >
                    <FileSpreadsheet size={14} />
                    Download last snapshot
                  </a>
                )}
                <Link
                  href="/vendors/register"
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Generate new snapshot
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                No register snapshot has been generated yet for{" "}
                <span className="font-medium text-ink">{range.label.toLowerCase()}</span>.
              </p>
              <Link
                href="/vendors/register"
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                <FileSpreadsheet size={14} />
                Generate first snapshot
              </Link>
            </div>
          )}
        </div>
      </Section>

      <p className="text-[11px] text-soft">
        Looking for cyber-DD freshness instead?{" "}
        <Link href="/analytics?audience=risk" className="font-medium text-indigo-600 underline">
          Switch to Risk view
        </Link>
        . Need the one-page Board summary?{" "}
        <Link href="/analytics?audience=board" className="font-medium text-indigo-600 underline">
          Switch to Board view
        </Link>
        .
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Internals
// ────────────────────────────────────────────────────────────────────────────

function MiniTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub?: string;
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
    <div className="rounded-xl border border-line bg-surface-1 p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
        <Icon size={11} />
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-bold ${valueColor}`}>{value}</div>
      {sub && <p className="mt-1 text-[11px] text-soft">{sub}</p>}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-[11px] text-soft">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-4 text-sm text-soft">
      {message}
    </div>
  );
}
