import Link from "next/link";
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { scoreIncident } from "@/lib/scoring";
import { evaluateToleranceBreaches } from "@/lib/rto-rpo-check";
import type { AnalyticsFilters, DateRange } from "@/lib/analytics-filters";

/**
 * Risk view (1LoD / 2LoD / 3LoD).
 *
 * Targets the risk owner / internal audit reviewer who has to defend the
 * programme. Surfaces *what's actually failing* — top failed controls,
 * tolerance breaches, decisions without rationale, overdue cyber DD.
 */
export default async function RiskTab({
  orgId,
  filters,
  range,
}: {
  orgId: string;
  filters: AnalyticsFilters;
  range: DateRange;
}) {
  const now = new Date();
  const windowFrom = range.from ?? new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const exerciseWhere = {
    orgId,
    status: "COMPLETED" as const,
    completedAt: { gte: windowFrom },
    ...(filters.jurisdiction ? { jurisdiction: filters.jurisdiction as never } : {}),
    ...(filters.classification ? { classification: filters.classification as never } : {}),
    ...(filters.ibsIds.length > 0
      ? { ibsLinks: { some: { ibsId: { in: filters.ibsIds } } } }
      : {}),
  };

  const exercises = await prisma.exercise.findMany({
    where: exerciseWhere,
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      title: true,
      completedAt: true,
      incidents: {
        where: { invokedAt: { not: null } },
        orderBy: { invokedAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  // ─── Aggregate coaching findings across exercises ────────────────────────
  const scoredAll = await Promise.all(
    exercises.map(async (e) => {
      const incidentId = e.incidents[0]?.id;
      if (!incidentId) return { exercise: e, score: null as null | Awaited<ReturnType<typeof scoreIncident>> };
      const score = await scoreIncident(incidentId);
      return { exercise: e, score };
    }),
  );

  type FailedControl = {
    id: string;
    finding: string;
    critical: number;
    warn: number;
    total: number;
    sampleRecommendation?: string;
  };
  const controlMap = new Map<string, FailedControl>();
  for (const { score } of scoredAll) {
    if (!score) continue;
    for (const c of score.coaching) {
      if (c.level !== "critical" && c.level !== "warn") continue;
      const cur =
        controlMap.get(c.id) ??
        ({
          id: c.id,
          finding: stripFindingNumbers(c.finding),
          critical: 0,
          warn: 0,
          total: 0,
          sampleRecommendation: c.recommendation,
        } satisfies FailedControl);
      if (c.level === "critical") cur.critical += 1;
      else cur.warn += 1;
      cur.total += 1;
      if (!cur.sampleRecommendation && c.recommendation) cur.sampleRecommendation = c.recommendation;
      controlMap.set(c.id, cur);
    }
  }
  const failedControls = Array.from(controlMap.values()).sort((a, b) => {
    const aw = a.critical * 2 + a.warn;
    const bw = b.critical * 2 + b.warn;
    return bw - aw;
  }).slice(0, 10);

  // ─── Tolerance breach register ──────────────────────────────────────────
  type BreachRow = {
    exerciseId: string;
    exerciseTitle: string;
    completedAt: Date | null;
    ibsName: string;
    toleranceMin: number;
    actualMin: number | null;
    breachedBy: number | null;
  };
  const breachRows: BreachRow[] = [];
  for (const { exercise } of scoredAll) {
    const incidentId = exercise.incidents[0]?.id;
    if (!incidentId) continue;
    const breaches = await evaluateToleranceBreaches(incidentId);
    for (const b of breaches) {
      if (!b.isBreached) continue;
      breachRows.push({
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        completedAt: exercise.completedAt,
        ibsName: b.ibsName,
        toleranceMin: b.toleranceMin,
        actualMin: b.actualMin,
        breachedBy: b.breachedBy,
      });
    }
  }
  breachRows.sort((a, b) => (b.breachedBy ?? 0) - (a.breachedBy ?? 0));

  // ─── Decision-with-rationale rate ───────────────────────────────────────
  const exerciseIds = exercises.map((e) => e.id);
  const decisions = await prisma.decisionRecord.findMany({
    where: { incident: { exerciseId: { in: exerciseIds } } },
    select: { rationale: true, approvedAt: true, decisionType: true },
  });
  const totalDecisions = decisions.length;
  const withRationale = decisions.filter((d) => d.rationale && d.rationale.trim().length >= 10).length;
  const approved = decisions.filter((d) => d.approvedAt).length;
  const rationalePct = totalDecisions === 0 ? null : Math.round((withRationale / totalDecisions) * 100);
  const approvedPct = totalDecisions === 0 ? null : Math.round((approved / totalDecisions) * 100);

  // ─── Cyber DD overdue (MTP vendors) ─────────────────────────────────────
  const mtpVendors = await prisma.vendor.findMany({
    where: { orgId, isMaterialThirdParty: true },
    select: {
      id: true,
      name: true,
      assessments: {
        where: { kind: "CYBER_DD" },
        orderBy: { assessedAt: "desc" },
        take: 1,
        select: { assessedAt: true, outcome: true },
      },
    },
  });
  type CyberRow = {
    vendorId: string;
    vendorName: string;
    lastAssessedAt: Date | null;
    lastOutcome: string | null;
    daysSince: number | null;
    isOverdue: boolean;
  };
  const cyberRows: CyberRow[] = mtpVendors.map((v) => {
    const last = v.assessments[0];
    const daysSince = last
      ? Math.floor((now.getTime() - last.assessedAt.getTime()) / (24 * 60 * 60 * 1000))
      : null;
    return {
      vendorId: v.id,
      vendorName: v.name,
      lastAssessedAt: last?.assessedAt ?? null,
      lastOutcome: last?.outcome ?? null,
      daysSince,
      isOverdue: !last || last.assessedAt < oneYearAgo,
    };
  });
  cyberRows.sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue));
  const overdueCount = cyberRows.filter((c) => c.isOverdue).length;

  return (
    <div className="space-y-6">
      {/* ─── KPI strip ───────────────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniTile
          icon={ShieldAlert}
          label="Failed controls"
          value={String(failedControls.length)}
          sub={`distinct controls cited ${failedControls.reduce((s, c) => s + c.total, 0)}× across ${scoredAll.filter((s) => s.score).length} exercises`}
          tone={failedControls.some((c) => c.critical > 0) ? "critical" : failedControls.length > 0 ? "warn" : "ok"}
        />
        <MiniTile
          icon={AlertTriangle}
          label="Tolerance breaches"
          value={String(breachRows.length)}
          sub={breachRows.length === 0 ? "no IBS missed its impact tolerance" : `${new Set(breachRows.map((b) => b.ibsName)).size} IBSs affected`}
          tone={breachRows.length === 0 ? "ok" : "critical"}
        />
        <MiniTile
          icon={CheckCircle2}
          label="Decisions with rationale"
          value={rationalePct === null ? "—" : `${rationalePct}%`}
          sub={
            totalDecisions === 0
              ? "no decisions logged"
              : `${withRationale}/${totalDecisions} captured · ${approvedPct}% approved`
          }
          tone={
            rationalePct === null
              ? "neutral"
              : rationalePct >= 80
                ? "ok"
                : rationalePct >= 60
                  ? "warn"
                  : "critical"
          }
        />
        <MiniTile
          icon={ShieldOff}
          label="Cyber DD overdue"
          value={`${overdueCount}/${mtpVendors.length}`}
          sub={
            mtpVendors.length === 0
              ? "no MTP vendors yet"
              : `MTP vendors past 12-month review`
          }
          tone={
            mtpVendors.length === 0
              ? "neutral"
              : overdueCount === 0
                ? "ok"
                : overdueCount <= 2
                  ? "warn"
                  : "critical"
          }
        />
      </section>

      {/* ─── Top failed controls ────────────────────────────────────────── */}
      <Section
        title="Top failed controls"
        subtitle="Findings ordered by weighted severity. Critical findings count double. The recommendation column is taken from the most recent occurrence — use it as the starting point for remediation."
      >
        {failedControls.length === 0 ? (
          <EmptyHint
            icon={CheckCircle2}
            message="No failed controls in this window. Either no exercises have completed or the programme is clean."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
            <table className="w-full text-sm">
              <thead className="bg-surface-0 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Control / finding</th>
                  <th className="p-3 text-right">Critical</th>
                  <th className="p-3 text-right">Warn</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {failedControls.map((c, i) => (
                  <tr key={c.id} className="border-t border-line align-top">
                    <td className="p-3 font-mono text-xs text-muted">{i + 1}</td>
                    <td className="p-3">
                      <div className="font-medium text-ink">{c.finding}</div>
                      {c.sampleRecommendation && (
                        <p className="mt-1 text-[11px] text-soft">→ {c.sampleRecommendation}</p>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {c.critical > 0 ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
                          {c.critical}
                        </span>
                      ) : (
                        <span className="text-soft">0</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {c.warn > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          {c.warn}
                        </span>
                      ) : (
                        <span className="text-soft">0</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-ink">{c.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ─── Tolerance-breach register ──────────────────────────────────── */}
      <Section
        title="Tolerance-breach register"
        subtitle="Every IBS whose actual recovery time exceeded its declared impact tolerance. Each row is regulator-notifiable evidence."
      >
        {breachRows.length === 0 ? (
          <EmptyHint icon={CheckCircle2} message="No tolerance breaches recorded in this window." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
            <table className="w-full text-sm">
              <thead className="bg-surface-0 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">IBS</th>
                  <th className="p-3">Exercise</th>
                  <th className="p-3 text-right">Tolerance</th>
                  <th className="p-3 text-right">Actual</th>
                  <th className="p-3 text-right">Over by</th>
                </tr>
              </thead>
              <tbody>
                {breachRows.map((r, i) => (
                  <tr key={`${r.exerciseId}-${i}`} className="border-t border-line">
                    <td className="p-3 font-medium">{r.ibsName}</td>
                    <td className="p-3">
                      <Link
                        href={`/exercises/${r.exerciseId}`}
                        className="text-indigo-600 hover:underline dark:text-indigo-300"
                      >
                        {r.exerciseTitle}
                      </Link>
                      {r.completedAt && (
                        <span className="ml-2 text-[11px] text-soft">
                          {r.completedAt.toISOString().slice(0, 10)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">{r.toleranceMin}m</td>
                    <td className="p-3 text-right font-mono">{r.actualMin ?? "—"}m</td>
                    <td className="p-3 text-right">
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 font-mono text-xs font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
                        +{r.breachedBy}m
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ─── Cyber DD ───────────────────────────────────────────────────── */}
      <Section
        title="Cyber due-diligence cycle"
        subtitle="MTP vendors and the freshness of their last cyber DD assessment. Anything older than 12 months is overdue."
      >
        {cyberRows.length === 0 ? (
          <EmptyHint
            icon={ShieldOff}
            message="No vendors flagged Material Third Party. Mark vendors as MTP from the Vendors register to track their DD cycle here."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
            <table className="w-full text-sm">
              <thead className="bg-surface-0 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Last cyber DD</th>
                  <th className="p-3">Outcome</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {cyberRows.map((c) => (
                  <tr key={c.vendorId} className="border-t border-line">
                    <td className="p-3 font-medium">
                      <Link href={`/vendors/${c.vendorId}`} className="hover:underline">
                        {c.vendorName}
                      </Link>
                    </td>
                    <td className="p-3">
                      {c.lastAssessedAt ? (
                        <span className="font-mono text-xs">
                          {c.lastAssessedAt.toISOString().slice(0, 10)}
                          <span className="ml-1 text-soft">· {c.daysSince}d ago</span>
                        </span>
                      ) : (
                        <span className="text-soft">never</span>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      {c.lastOutcome ? (
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold uppercase tracking-wider ${
                            c.lastOutcome === "SATISFACTORY"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : c.lastOutcome === "NON_SATISFACTORY"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                          }`}
                        >
                          {c.lastOutcome.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-soft">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {c.isOverdue ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
                          Overdue
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                          Current
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

      <p className="text-[11px] text-soft">
        Vendor concentration and exit-plan freshness live in the{" "}
        <Link href="/analytics?audience=vendors" className="font-medium text-indigo-600 underline">
          Vendors view
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

function EmptyHint({
  message,
  icon: Icon = AlertTriangle,
}: {
  message: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface-1 p-4 text-sm text-soft">
      <Icon size={14} />
      {message}
    </div>
  );
}

/**
 * Coaching findings include exercise-specific numbers ("IMT invoked 17
 * minutes after first signal"). For aggregate reporting we strip the
 * numerics so identical control failures bucket together.
 */
function stripFindingNumbers(finding: string): string {
  return finding
    .replace(/\b\d+\s*(?:minutes?|min|mins?)\b/gi, "N minutes")
    .replace(/^Only\s+\d+\s+/i, "Only N ")
    .replace(/\b\d+%\b/g, "N%")
    .replace(/\b\d+\b/g, (m) => (m.length > 3 ? m : "N"));
}
