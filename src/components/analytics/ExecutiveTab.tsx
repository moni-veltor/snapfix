import Link from "next/link";
import { Activity, Clock, FileText, Megaphone, Layers, AlertOctagon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { scoreIncident } from "@/lib/scoring";
import type { AnalyticsFilters, DateRange } from "@/lib/analytics-filters";
import { TrendLine, ToneBars } from "./AnalyticsCharts";

/**
 * Executive view (ERCC / BRCC + Comms).
 *
 * Targets the C-suite operator who owns the resilience programme but isn't
 * in every IMT: monthly trend lines, regulator-clock performance, BCP
 * picture, comms cascade compliance, and the untested-IBS bench.
 */
export default async function ExecutiveTab({
  orgId,
  filters,
  range,
}: {
  orgId: string;
  filters: AnalyticsFilters;
  range: DateRange;
}) {
  const now = new Date();
  const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const windowFrom = range.from ?? yearAgo;

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

  const completedExercises = await prisma.exercise.findMany({
    where: exerciseWhere,
    orderBy: { completedAt: "asc" },
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

  const scored = await Promise.all(
    completedExercises.map(async (e) => {
      const incidentId = e.incidents[0]?.id;
      const score = incidentId ? await scoreIncident(incidentId) : null;
      return { exercise: e, score };
    }),
  );

  // ─── Performance trend by month ──────────────────────────────────────────
  const monthBuckets = buildMonthBuckets(now, 12);
  for (const { exercise, score } of scored) {
    if (!exercise.completedAt || !score) continue;
    const bucket = monthBuckets.find(
      (b) => exercise.completedAt! >= b.from && exercise.completedAt! < b.to,
    );
    if (!bucket) continue;
    bucket.scoreSum += score.overall;
    bucket.scoreCount += 1;
    if (score.metrics.runbookCompletionPct !== null) {
      bucket.runbookSum += score.metrics.runbookCompletionPct;
      bucket.runbookCount += 1;
    }
  }
  const trendData = monthBuckets.map((b) => ({
    label: b.label,
    value: b.scoreCount === 0 ? 0 : Math.round(b.scoreSum / b.scoreCount),
  }));
  const runbookTrendData = monthBuckets.map((b) => ({
    label: b.label,
    value: b.runbookCount === 0 ? 0 : Math.round(b.runbookSum / b.runbookCount),
  }));
  const hasRunbookData = runbookTrendData.some((d) => d.value > 0);

  // ─── Exercise tempo by quarter ──────────────────────────────────────────
  const quarterBuckets = buildQuarterBuckets(now, 4);
  for (const { exercise } of scored) {
    if (!exercise.completedAt) continue;
    const bucket = quarterBuckets.find(
      (b) => exercise.completedAt! >= b.from && exercise.completedAt! < b.to,
    );
    if (!bucket) continue;
    bucket.count += 1;
  }
  // Cadence target: ≥ 1 per quarter is OK, ≥ 2 is good, 0 is critical.
  const tempoData = quarterBuckets.map((b) => ({
    label: b.label,
    value: b.count,
    tone: (b.count === 0 ? "critical" : b.count === 1 ? "warn" : "ok") as
      | "ok"
      | "warn"
      | "critical",
  }));

  // ─── Regulator-clock performance ────────────────────────────────────────
  const regulatorNotifs = await prisma.regulatorNotification.findMany({
    where: { incident: { exercise: exerciseWhere } },
    select: { regulator: true, status: true, dueAt: true, sentAt: true },
  });
  const regGroups = new Map<string, { sent: number; breached: number; waived: number; pending: number }>();
  for (const n of regulatorNotifs) {
    const key = n.regulator;
    const cur = regGroups.get(key) ?? { sent: 0, breached: 0, waived: 0, pending: 0 };
    if (n.status === "SENT") cur.sent += 1;
    else if (n.status === "WAIVED") cur.waived += 1;
    else if (n.status === "BREACHED" || n.dueAt < now) cur.breached += 1;
    else cur.pending += 1;
    regGroups.set(key, cur);
  }
  const regClockBars = Array.from(regGroups.entries()).map(([reg, v]) => {
    const total = v.sent + v.breached + v.waived;
    const onTime = total === 0 ? 0 : Math.round((v.sent / total) * 100);
    return {
      label: reg,
      value: onTime,
      tone: (total === 0 ? "neutral" : onTime >= 90 ? "ok" : onTime >= 70 ? "warn" : "critical") as
        | "ok"
        | "warn"
        | "critical"
        | "neutral",
      meta: v,
    };
  });

  // ─── BCP + PIR ────────────────────────────────────────────────────────────
  const exerciseIds = completedExercises.map((e) => e.id);
  const [bcpCount, pirRows] = await Promise.all([
    prisma.bCPActivation.count({
      where: { incident: { exerciseId: { in: exerciseIds } } },
    }),
    prisma.postIncidentReport.findMany({
      where: { incident: { exerciseId: { in: exerciseIds } } },
      select: { submittedAt: true, dueAt: true },
    }),
  ]);
  const pirOnTime = pirRows.filter((p) => p.submittedAt && p.submittedAt <= p.dueAt).length;
  const pirSubmitted = pirRows.filter((p) => p.submittedAt).length;
  const pirRate = pirRows.length === 0 ? null : Math.round((pirSubmitted / pirRows.length) * 100);

  // ─── Comms cascade compliance ────────────────────────────────────────────
  const comms = await prisma.communicationDraft.findMany({
    where: { exerciseId: { in: exerciseIds } },
    select: { status: true, stakeholder: true, sentAt: true, approvedAt: true, createdAt: true },
  });
  const commsTotal = comms.length;
  const commsRejected = comms.filter((c) => c.status === "REJECTED").length;
  const commsSent = comms.filter((c) => c.status === "SENT" || c.sentAt).length;
  const commsApproved = comms.filter((c) => c.approvedAt).length;
  const commsCompliance =
    commsTotal === 0 ? null : Math.round(((commsTotal - commsRejected) / commsTotal) * 100);

  // ─── Top untested IBSs ────────────────────────────────────────────────────
  const untestedIBS = await prisma.organizationIBS.findMany({
    where: {
      orgId,
      ...(filters.ibsIds.length > 0 ? { id: { in: filters.ibsIds } } : {}),
      exerciseLinks: {
        none: { exercise: { completedAt: { gte: windowFrom } } },
      },
    },
    orderBy: { criticality: "desc" },
    take: 8,
    select: { id: true, code: true, name: true, criticality: true },
  });

  return (
    <div className="space-y-6">
      {/* ─── KPI strip ───────────────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniTile
          icon={Activity}
          label="Avg score"
          value={
            scored.filter((s) => s.score).length === 0
              ? "—"
              : `${Math.round(
                  scored.reduce((sum, s) => sum + (s.score?.overall ?? 0), 0) /
                    Math.max(1, scored.filter((s) => s.score).length),
                )}/100`
          }
          sub={`${scored.filter((s) => s.score).length} scored exercises`}
        />
        <MiniTile
          icon={AlertOctagon}
          label="BCP activations"
          value={String(bcpCount)}
          sub={range.label.toLowerCase()}
        />
        <MiniTile
          icon={FileText}
          label="PIR submission"
          value={pirRate === null ? "—" : `${pirRate}%`}
          sub={
            pirRows.length === 0
              ? "no PIRs due"
              : `${pirOnTime}/${pirRows.length} on time · ${pirSubmitted}/${pirRows.length} submitted`
          }
          tone={pirRate === null ? "neutral" : pirRate === 100 ? "ok" : pirRate >= 70 ? "warn" : "critical"}
        />
        <MiniTile
          icon={Megaphone}
          label="Comms compliance"
          value={commsCompliance === null ? "—" : `${commsCompliance}%`}
          sub={
            commsTotal === 0
              ? "no comms drafted"
              : `${commsApproved}/${commsTotal} approved · ${commsSent} sent · ${commsRejected} rejected`
          }
          tone={
            commsCompliance === null
              ? "neutral"
              : commsCompliance >= 90
                ? "ok"
                : commsCompliance >= 70
                  ? "warn"
                  : "critical"
          }
        />
      </section>

      {/* ─── Performance trend ──────────────────────────────────────────── */}
      <Section
        title="Performance trend"
        subtitle={`Average exercise score by month · ${range.label.toLowerCase()}. Dashed line = 75 (good-practice floor).`}
      >
        {trendData.every((d) => d.value === 0) ? (
          <EmptyHint message="No scored exercises in this window. Run an exercise to populate the trend." />
        ) : (
          <TrendLine data={trendData} yDomain={[0, 100]} yLabel="score" threshold={75} />
        )}
      </Section>

      {/* ─── Runbook completion trend ──────────────────────────────────── */}
      <Section
        title="Runbook completion trend"
        subtitle="Average runbook completion % by month across exercises that activated a runbook. Dashed line = 80 (good-practice floor)."
      >
        {!hasRunbookData ? (
          <EmptyHint message="No runbooks were activated against exercises in this window. Publish runbooks and let severity classification auto-fire them." />
        ) : (
          <TrendLine data={runbookTrendData} yDomain={[0, 100]} yLabel="completion %" threshold={80} />
        )}
      </Section>

      {/* ─── Exercise tempo ─────────────────────────────────────────────── */}
      <Section
        title="Exercise tempo"
        subtitle="Exercises completed per quarter. The regulator expects a regular cadence; an empty quarter is a finding."
      >
        <ToneBars data={tempoData} yLabel="exercises" />
      </Section>

      {/* ─── Regulator-clock performance ─────────────────────────────────── */}
      <Section
        title="Regulator-clock performance"
        subtitle="Percentage of notifications sent before the SLA expired. Waivers count as resolved; pending notifications are excluded."
      >
        {regClockBars.length === 0 ? (
          <EmptyHint message="No regulator notifications fired in this window." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
            <table className="w-full text-sm">
              <thead className="bg-surface-0 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">Regulator</th>
                  <th className="p-3 text-right">Sent on time</th>
                  <th className="p-3 text-right">Breached</th>
                  <th className="p-3 text-right">Waived</th>
                  <th className="p-3 text-right">Pending</th>
                  <th className="p-3 text-right">On-time %</th>
                </tr>
              </thead>
              <tbody>
                {regClockBars.map((r) => (
                  <tr key={r.label} className="border-t border-line">
                    <td className="p-3 font-medium">{r.label}</td>
                    <td className="p-3 text-right">{r.meta.sent}</td>
                    <td className="p-3 text-right">
                      {r.meta.breached > 0 ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
                          {r.meta.breached}
                        </span>
                      ) : (
                        <span className="text-soft">0</span>
                      )}
                    </td>
                    <td className="p-3 text-right">{r.meta.waived}</td>
                    <td className="p-3 text-right">{r.meta.pending}</td>
                    <td
                      className={`p-3 text-right font-mono font-semibold ${
                        r.tone === "ok"
                          ? "text-emerald-700 dark:text-emerald-300"
                          : r.tone === "warn"
                            ? "text-amber-700 dark:text-amber-300"
                            : r.tone === "critical"
                              ? "text-rose-700 dark:text-rose-300"
                              : "text-soft"
                      }`}
                    >
                      {r.meta.sent + r.meta.breached + r.meta.waived === 0 ? "—" : `${r.value}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ─── Top untested IBSs ──────────────────────────────────────────── */}
      <Section
        title="Top untested IBSs"
        subtitle="Highest-criticality services that have not been exercised in this window. These are the gaps a regulator will surface first."
      >
        {untestedIBS.length === 0 ? (
          <EmptyHint message="Every IBS in this filter has been exercised in the window. Healthy coverage." />
        ) : (
          <ul className="space-y-1.5">
            {untestedIBS.map((ibs) => (
              <li
                key={ibs.id}
                className="flex items-center justify-between rounded-md border border-line bg-surface-1 px-3 py-2 text-sm"
              >
                <Link href={`/ibs/${ibs.id}`} className="font-medium hover:underline">
                  <span className="font-mono text-xs text-muted">{ibs.code}</span> · {ibs.name}
                </Link>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    ibs.criticality === "CRITICAL" || ibs.criticality === "HIGH"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                  }`}
                >
                  <Layers size={10} className="mr-1 inline" />
                  {ibs.criticality}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <p className="text-[11px] text-soft">
        Need the one-page Board summary?{" "}
        <Link href="/analytics?audience=board" className="font-medium text-indigo-600 underline">
          Switch to Board view
        </Link>
        . Need to drill into individual control failures?{" "}
        <Link href="/analytics?audience=risk" className="font-medium text-indigo-600 underline">
          Switch to Risk view
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
      <div className="rounded-xl border border-line bg-surface-1 p-4">{children}</div>
    </section>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-line-strong bg-surface-0 p-4 text-sm text-soft">
      <Clock size={14} />
      {message}
    </div>
  );
}

function buildMonthBuckets(
  ref: Date,
  count: number,
): {
  label: string;
  from: Date;
  to: Date;
  scoreSum: number;
  scoreCount: number;
  runbookSum: number;
  runbookCount: number;
}[] {
  const buckets: {
    label: string;
    from: Date;
    to: Date;
    scoreSum: number;
    scoreCount: number;
    runbookSum: number;
    runbookCount: number;
  }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const from = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    const to = new Date(ref.getFullYear(), ref.getMonth() - i + 1, 1);
    buckets.push({
      label: from.toLocaleString("en-GB", { month: "short" }),
      from,
      to,
      scoreSum: 0,
      scoreCount: 0,
      runbookSum: 0,
      runbookCount: 0,
    });
  }
  return buckets;
}

function buildQuarterBuckets(
  ref: Date,
  count: number,
): { label: string; from: Date; to: Date; count: number }[] {
  const buckets: { label: string; from: Date; to: Date; count: number }[] = [];
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
      count: 0,
    });
  }
  return buckets;
}
