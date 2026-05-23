import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CloudCog,
  FileSearch,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import { evaluateVendorReadiness } from "@/lib/vendor-mtp-readiness";
import {
  assessmentGaps,
  ASSESSMENT_KIND_LABEL,
  ASSESSMENT_OVERDUE_DAYS,
} from "@/lib/vendor-state";
import { hyperscalerConcentration, type VendorLite } from "@/lib/dora";

export const metadata = { title: "Vendors at risk — SnapFix" };

const TOP_N = 5;

export default async function VendorRiskPage() {
  const me = await requireOrgUser();

  const vendors = await prisma.vendor.findMany({
    where: { orgId: me.orgId },
    orderBy: { name: "asc" },
    include: { assessments: true, _count: { select: { ibsLinks: true } } },
  });

  const now = new Date();
  const nowMs = now.getTime();
  const totalVendors = vendors.length;

  // ── Section 1: Assurance (expired or expiring within 60d) ──────────────
  type AssuranceRow = {
    id: string;
    name: string;
    tier: string;
    assuranceKind: string | null;
    assuranceExpiryAt: Date | null;
    daysToExpiry: number;
  };
  const assuranceRows: AssuranceRow[] = [];
  for (const v of vendors) {
    if (!v.assuranceKind || v.assuranceKind === "NONE") {
      assuranceRows.push({
        id: v.id,
        name: v.name,
        tier: v.tier,
        assuranceKind: v.assuranceKind,
        assuranceExpiryAt: null,
        daysToExpiry: Number.NEGATIVE_INFINITY,
      });
      continue;
    }
    if (!v.assuranceExpiryAt) continue;
    const days = Math.floor((v.assuranceExpiryAt.getTime() - nowMs) / 86_400_000);
    if (days < 60) {
      assuranceRows.push({
        id: v.id,
        name: v.name,
        tier: v.tier,
        assuranceKind: v.assuranceKind,
        assuranceExpiryAt: v.assuranceExpiryAt,
        daysToExpiry: days,
      });
    }
  }
  assuranceRows.sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  // ── Section 2: Contracts (expiring within 90d or expired) ──────────────
  type ContractRow = {
    id: string;
    name: string;
    tier: string;
    contractEndAt: Date;
    daysToEnd: number;
    annualValueGBP: number | null;
  };
  const contractRows: ContractRow[] = [];
  for (const v of vendors) {
    if (!v.contractEndAt) continue;
    const days = Math.floor((v.contractEndAt.getTime() - nowMs) / 86_400_000);
    if (days < 90) {
      contractRows.push({
        id: v.id,
        name: v.name,
        tier: v.tier,
        contractEndAt: v.contractEndAt,
        daysToEnd: days,
        annualValueGBP: v.contractAnnualValueGBP,
      });
    }
  }
  contractRows.sort((a, b) => a.daysToEnd - b.daysToEnd);

  // ── Section 3: MTP register not ready ──────────────────────────────────
  type MtpRow = {
    id: string;
    name: string;
    passed: number;
    total: number;
    missing: string[];
  };
  const mtpRows: MtpRow[] = [];
  for (const v of vendors) {
    if (!v.isMaterialThirdParty) continue;
    const r = evaluateVendorReadiness(v);
    if (r.isRegisterReady) continue;
    mtpRows.push({
      id: v.id,
      name: v.name,
      passed: r.passed,
      total: r.total,
      missing: r.checks.filter((c) => !c.ok).slice(0, 3).map((c) => `${c.ref} ${c.label}`),
    });
  }
  mtpRows.sort((a, b) => a.passed / a.total - b.passed / b.total);

  // ── Section 4: Assessment overdue (MTP only) ───────────────────────────
  type AssessmentOverdueRow = {
    id: string;
    name: string;
    gaps: { kind: string; ageDays: number | null }[];
    worstAgeDays: number; // null treated as Infinity for sort
  };
  const assessmentRows: AssessmentOverdueRow[] = [];
  for (const v of vendors) {
    const gaps = assessmentGaps(
      v,
      v.assessments.map((a) => ({ kind: a.kind, assessedAt: a.assessedAt })),
      now,
    );
    if (gaps.length === 0) continue;
    const worst = gaps.reduce(
      (max, g) => Math.max(max, g.ageDays ?? Number.POSITIVE_INFINITY),
      0,
    );
    assessmentRows.push({
      id: v.id,
      name: v.name,
      gaps: gaps.map((g) => ({
        kind: ASSESSMENT_KIND_LABEL[g.kind],
        ageDays: g.ageDays,
      })),
      worstAgeDays: Number.isFinite(worst) ? worst : 9_999,
    });
  }
  assessmentRows.sort((a, b) => b.worstAgeDays - a.worstAgeDays);

  // ── Section 5: 4th-party concentration ─────────────────────────────────
  const vendorsLite: VendorLite[] = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    tier: v.tier,
    isDoraCritical: v.isDoraCritical,
    doraIctTier: v.doraIctTier,
    hyperscaler: v.hyperscaler,
    region: v.region,
    contractStartAt: v.contractStartAt,
    contractEndAt: v.contractEndAt,
    contractRenewalNoticeDays: v.contractRenewalNoticeDays,
    contractAnnualValueGBP: v.contractAnnualValueGBP,
    assuranceKind: v.assuranceKind,
    assuranceExpiryAt: v.assuranceExpiryAt,
    exitPlanReviewedAt: v.exitPlanReviewedAt,
    exitPlanRTOMin: v.exitPlanRTOMin,
    exitPlanNotes: v.exitPlanNotes,
    fourthParties: v.fourthParties,
    ibsLinkCount: v._count.ibsLinks,
  }));
  const hyperscalers = hyperscalerConcentration(vendorsLite);
  const topHs = hyperscalers[0] ?? null;
  const topHsPct =
    topHs && totalVendors > 0 ? Math.round((topHs.count / totalVendors) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Vendors"
        icon={ShieldAlert}
        title="Vendors at risk"
        pitch="Consolidated risk roll-up · top items per lens"
        actions={
          <Link
            href="/vendors"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
          >
            <ArrowLeft size={14} />
            Back to vendors
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RiskTile
          label="Assurance"
          value={assuranceRows.length}
          sub="expired or expiring ≤60d"
          tone={assuranceRows.length > 0 ? "critical" : "ok"}
        />
        <RiskTile
          label="Contracts"
          value={contractRows.length}
          sub="ending in ≤90d"
          tone={contractRows.length > 0 ? "warn" : "ok"}
        />
        <RiskTile
          label="MTP register"
          value={mtpRows.length}
          sub="not yet register-ready"
          tone={mtpRows.length > 0 ? "warn" : "ok"}
        />
        <RiskTile
          label="Assessments"
          value={assessmentRows.length}
          sub={`older than ${ASSESSMENT_OVERDUE_DAYS}d or missing`}
          tone={assessmentRows.length > 0 ? "warn" : "ok"}
        />
      </section>

      <RiskSection
        icon={ShieldCheck}
        title="Assurance expiring soon"
        blurb="Vendors whose assurance has expired or expires within 60 days. Missing-assurance rows sort first."
        rows={assuranceRows.slice(0, TOP_N)}
        totalCount={assuranceRows.length}
        openAllHref="/vendors"
        emptyLabel="No assurance gaps in the next 60 days."
        render={(r) => (
          <>
            <td className="px-3 py-2">
              <Link
                href={`/vendors/${r.id}`}
                className="font-medium text-ink hover:text-indigo-600 hover:underline"
              >
                {r.name}
              </Link>
              <div className="text-[10px] text-soft">{r.tier.replace("_", " ")}</div>
            </td>
            <td className="px-3 py-2 text-xs text-muted">
              {r.assuranceKind && r.assuranceKind !== "NONE" ? r.assuranceKind : "—"}
            </td>
            <td className="px-3 py-2 text-right">
              {!r.assuranceKind || r.assuranceKind === "NONE" ? (
                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                  Missing
                </span>
              ) : r.daysToExpiry < 0 ? (
                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                  Expired {Math.abs(r.daysToExpiry)}d ago
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  {r.daysToExpiry}d
                </span>
              )}
            </td>
          </>
        )}
        headers={["Vendor", "Type", "Status"]}
      />

      <RiskSection
        icon={CalendarClock}
        title="Contracts ending soon"
        blurb="Vendor contracts ending within 90 days. Expired contracts sort first."
        rows={contractRows.slice(0, TOP_N)}
        totalCount={contractRows.length}
        openAllHref="/vendors/contracts"
        emptyLabel="No contracts ending in the next 90 days."
        render={(r) => (
          <>
            <td className="px-3 py-2">
              <Link
                href={`/vendors/${r.id}`}
                className="font-medium text-ink hover:text-indigo-600 hover:underline"
              >
                {r.name}
              </Link>
              <div className="text-[10px] text-soft">{r.tier.replace("_", " ")}</div>
            </td>
            <td className="px-3 py-2 text-xs text-muted">
              {r.contractEndAt.toISOString().slice(0, 10)}
            </td>
            <td className="px-3 py-2 text-right">
              {r.daysToEnd < 0 ? (
                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                  Expired {Math.abs(r.daysToEnd)}d ago
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  {r.daysToEnd}d
                </span>
              )}
            </td>
          </>
        )}
        headers={["Vendor", "End date", "Time left"]}
      />

      <RiskSection
        icon={FileSearch}
        title="MTP register not ready"
        blurb="Material Third Parties with mandatory Annex 3 fields missing. Lowest-readiness sort first."
        rows={mtpRows.slice(0, TOP_N)}
        totalCount={mtpRows.length}
        openAllHref="/vendors/register?status=notready"
        emptyLabel="Every Material Third Party is register-ready."
        render={(r) => (
          <>
            <td className="px-3 py-2">
              <Link
                href={`/vendors/${r.id}`}
                className="font-medium text-ink hover:text-indigo-600 hover:underline"
              >
                {r.name}
              </Link>
              <div className="text-[10px] text-soft">
                Missing: {r.missing.join("; ")}
                {r.total - r.passed > r.missing.length ? "…" : ""}
              </div>
            </td>
            <td className="px-3 py-2 text-right font-mono text-xs">
              {r.passed}/{r.total}
            </td>
            <td className="px-3 py-2 text-right">
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                {Math.round((r.passed / r.total) * 100)}%
              </span>
            </td>
          </>
        )}
        headers={["Vendor", "Score", "Ready"]}
      />

      <RiskSection
        icon={AlertTriangle}
        title="Assessments overdue"
        blurb={`MTPs with required assessments (Risk · Audit · Financial DD · Cyber DD) older than ${ASSESSMENT_OVERDUE_DAYS} days or never recorded.`}
        rows={assessmentRows.slice(0, TOP_N)}
        totalCount={assessmentRows.length}
        openAllHref="/vendors"
        emptyLabel="All MTP assessments are fresh."
        render={(r) => (
          <>
            <td className="px-3 py-2">
              <Link
                href={`/vendors/${r.id}`}
                className="font-medium text-ink hover:text-indigo-600 hover:underline"
              >
                {r.name}
              </Link>
            </td>
            <td className="px-3 py-2 text-xs text-muted">
              {r.gaps
                .map((g) => `${g.kind}${g.ageDays == null ? " (never)" : ` (${g.ageDays}d)`}`)
                .join(", ")}
            </td>
            <td className="px-3 py-2 text-right">
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                {r.gaps.length} gap{r.gaps.length === 1 ? "" : "s"}
              </span>
            </td>
          </>
        )}
        headers={["Vendor", "Gaps", ""]}
      />

      <section className="rounded-xl border border-line bg-surface-1 p-5">
        <header className="flex items-center gap-2">
          <CloudCog size={14} className="text-indigo-600 dark:text-indigo-300" />
          <h3 className="text-sm font-semibold text-ink">4th-party concentration</h3>
        </header>
        {hyperscalers.length === 0 ? (
          <p className="mt-2 text-[12px] text-soft">
            No hyperscaler recorded against any vendor yet.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {topHs && (
              <p
                className={`rounded-md px-3 py-2 text-[12px] ${
                  topHsPct >= 40
                    ? "bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
                    : topHsPct >= 25
                      ? "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                      : "bg-surface-2 text-muted"
                }`}
              >
                <span className="font-semibold">{topHs.hyperscaler}</span> is the dominant 4th-party
                — <span className="font-semibold">{topHs.count}</span> vendors (
                <span className="font-mono">{topHsPct}%</span> of the register).
                {topHsPct >= 40 && " High concentration — consider fragmentation."}
                {topHsPct >= 25 && topHsPct < 40 && " Moderate concentration — monitor."}
              </p>
            )}
            <ul className="space-y-1">
              {hyperscalers.map((h) => {
                const pct = totalVendors > 0 ? Math.round((h.count / totalVendors) * 100) : 0;
                return (
                  <li
                    key={h.hyperscaler}
                    className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface-0 px-2.5 py-1.5 text-[12px]"
                  >
                    <span className="font-medium text-ink">{h.hyperscaler}</span>
                    <div className="flex items-center gap-2 text-soft">
                      <span className="font-mono">{h.count} vendors</span>
                      <span>·</span>
                      <span>{pct}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function RiskTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub: string;
  tone: "ok" | "warn" | "critical";
}) {
  const colour =
    tone === "critical"
      ? "text-rose-600 dark:text-rose-300"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-300"
        : "text-emerald-700 dark:text-emerald-300";
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold ${colour}`}>{value}</div>
      <div className="text-[10px] text-soft">{sub}</div>
    </div>
  );
}

function RiskSection<R>({
  icon: Icon,
  title,
  blurb,
  rows,
  totalCount,
  openAllHref,
  emptyLabel,
  headers,
  render,
}: {
  icon: typeof ShieldCheck;
  title: string;
  blurb: string;
  rows: R[];
  totalCount: number;
  openAllHref: string;
  emptyLabel: string;
  headers: string[];
  render: (row: R) => React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface-1">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-4">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Icon size={14} className="text-indigo-600 dark:text-indigo-300" />
            {title}
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-soft">
              {totalCount}
            </span>
          </h3>
          <p className="mt-0.5 text-[11px] text-soft">{blurb}</p>
        </div>
        {totalCount > rows.length && (
          <Link
            href={openAllHref}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-surface-2"
          >
            See all {totalCount}
            <ArrowRight size={11} />
          </Link>
        )}
      </header>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-soft">{emptyLabel}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className={`px-3 py-2 ${h === "" ? "" : "text-left"}`}
                  style={
                    h === headers[headers.length - 1] && h !== headers[0] ? { textAlign: "right" } : undefined
                  }
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, i) => (
              <tr key={i}>{render(row)}</tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
