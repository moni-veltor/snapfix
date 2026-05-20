import Link from "next/link";
import { prisma } from "@/lib/prisma";
import IBSCoverageHeatmap from "@/components/analytics/IBSCoverageHeatmap";
import type { AnalyticsFilters, DateRange } from "@/lib/analytics-filters";
import type { FrozenRunbook } from "@/lib/runbook-activation";

/**
 * Programme tab — the original analytics page content, scoped to the
 * filter bar's selections (date range, jurisdiction, classification, IBSs).
 * Targets the programme manager / 2nd-line auditor audience: coverage gaps
 * the regulator will ask about.
 */
export default async function ProgrammeTab({
  orgId,
  filters,
  range,
}: {
  orgId: string;
  filters: AnalyticsFilters;
  range: DateRange;
}) {
  // ─── Filter clauses (server-side, applied to every query) ──────────────
  const exerciseWhere = {
    orgId,
    status: { in: ["IN_PROGRESS" as const, "PAUSED" as const, "COMPLETED" as const] },
    ...(range.from ? { startedAt: { gte: range.from } } : {}),
    ...(filters.jurisdiction ? { jurisdiction: filters.jurisdiction as never } : {}),
    ...(filters.classification ? { classification: filters.classification as never } : {}),
  };
  const ibsWhere = {
    orgId,
    ...(filters.ibsIds.length > 0 ? { id: { in: filters.ibsIds } } : {}),
  };

  const [scenarios, exercises, ibsRegister, runbookCoverageRows] = await Promise.all([
    prisma.scenario.findMany({
      where: { orgId, isTemplate: false },
      select: {
        id: true,
        title: true,
        category: true,
        coversPeople: true,
        coversProperty: true,
        coversTechnology: true,
        coversDataAvailability: true,
        coversDataIntegrity: true,
        coversThirdParty: true,
      },
    }),
    prisma.exercise.findMany({
      where: exerciseWhere,
      include: {
        scenario: {
          select: {
            category: true,
            coversPeople: true,
            coversProperty: true,
            coversTechnology: true,
            coversDataAvailability: true,
            coversDataIntegrity: true,
            coversThirdParty: true,
          },
        },
        ibsLinks: { include: { ibs: true } },
      },
    }),
    prisma.organizationIBS.findMany({
      where: ibsWhere,
      include: {
        _count: { select: { exerciseLinks: true } },
        exerciseLinks: {
          where: range.from ? { exercise: { startedAt: { gte: range.from } } } : undefined,
          include: {
            exercise: {
              select: {
                scenario: {
                  select: {
                    coversPeople: true,
                    coversProperty: true,
                    coversTechnology: true,
                    coversDataAvailability: true,
                    coversDataIntegrity: true,
                    coversThirdParty: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.runbook.findMany({
      where: { orgId, status: { not: "ARCHIVED" } },
      orderBy: [{ status: "asc" }, { category: "asc" }, { title: "asc" }],
      include: {
        _count: { select: { steps: true } },
        executions: {
          where: range.from
            ? { startedAt: { gte: range.from }, incident: { exercise: exerciseWhere } }
            : { incident: { exercise: exerciseWhere } },
          select: {
            id: true,
            status: true,
            runbookJson: true,
            stepExecutions: { select: { status: true } },
          },
        },
      },
    }),
  ]);

  const heatmapRows = ibsRegister.map((ibs) => {
    const counts = {
      people: 0,
      property: 0,
      technology: 0,
      dataAvailability: 0,
      dataIntegrity: 0,
      thirdParty: 0,
    };
    for (const link of ibs.exerciseLinks) {
      const s = link.exercise.scenario;
      if (s.coversPeople) counts.people++;
      if (s.coversProperty) counts.property++;
      if (s.coversTechnology) counts.technology++;
      if (s.coversDataAvailability) counts.dataAvailability++;
      if (s.coversDataIntegrity) counts.dataIntegrity++;
      if (s.coversThirdParty) counts.thirdParty++;
    }
    return {
      id: ibs.id,
      code: ibs.code,
      name: ibs.name,
      criticality: ibs.criticality,
      ...counts,
    };
  });

  const exec = { people: 0, property: 0, technology: 0, dataAvailability: 0, dataIntegrity: 0, thirdParty: 0 };
  for (const ex of exercises) {
    if (ex.scenario.coversPeople) exec.people++;
    if (ex.scenario.coversProperty) exec.property++;
    if (ex.scenario.coversTechnology) exec.technology++;
    if (ex.scenario.coversDataAvailability) exec.dataAvailability++;
    if (ex.scenario.coversDataIntegrity) exec.dataIntegrity++;
    if (ex.scenario.coversThirdParty) exec.thirdParty++;
  }

  const lib = { people: 0, property: 0, technology: 0, dataAvailability: 0, dataIntegrity: 0, thirdParty: 0 };
  for (const s of scenarios) {
    if (s.coversPeople) lib.people++;
    if (s.coversProperty) lib.property++;
    if (s.coversTechnology) lib.technology++;
    if (s.coversDataAvailability) lib.dataAvailability++;
    if (s.coversDataIntegrity) lib.dataIntegrity++;
    if (s.coversThirdParty) lib.thirdParty++;
  }

  const cats = new Map<string, { lib: number; exec: number }>();
  for (const s of scenarios) {
    const k = s.category ?? "Other";
    const v = cats.get(k) ?? { lib: 0, exec: 0 };
    v.lib += 1;
    cats.set(k, v);
  }
  for (const ex of exercises) {
    const k = ex.scenario.category ?? "Other";
    const v = cats.get(k) ?? { lib: 0, exec: 0 };
    v.exec += 1;
    cats.set(k, v);
  }
  const sortedCats = Array.from(cats.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const untestedIBS = ibsRegister.filter((i) => i._count.exerciseLinks === 0);

  // ─── Runbook coverage ──────────────────────────────────────────────────
  type RunbookCoverageRow = {
    id: string;
    title: string;
    category: string;
    status: string;
    totalSteps: number;
    executionsCount: number;
    stepsTerminal: number;
    stepsTotal: number;
    completionPct: number | null;
    stepsExercised: number;
  };
  const runbookCoverage: RunbookCoverageRow[] = runbookCoverageRows.map((r) => {
    let stepsTerminal = 0;
    let stepsTotal = 0;
    const exercisedOrders = new Set<number>();
    for (const ex of r.executions) {
      const frozen = ex.runbookJson as unknown as FrozenRunbook;
      stepsTotal += ex.stepExecutions.length;
      for (let i = 0; i < ex.stepExecutions.length; i++) {
        const se = ex.stepExecutions[i];
        if (se.status === "COMPLETE" || se.status === "SKIPPED") stepsTerminal += 1;
      }
      // Anything that wasn't PENDING is "exercised" for coverage purposes.
      for (const step of frozen.steps) {
        const matching = ex.stepExecutions[step.orderIdx];
        if (matching && matching.status !== "PENDING" && matching.status !== "BLOCKED") {
          exercisedOrders.add(step.orderIdx);
        }
      }
    }
    return {
      id: r.id,
      title: r.title,
      category: r.category,
      status: r.status,
      totalSteps: r._count.steps,
      executionsCount: r.executions.length,
      stepsTerminal,
      stepsTotal,
      completionPct:
        stepsTotal === 0 ? null : Math.round((stepsTerminal / stepsTotal) * 100),
      stepsExercised: exercisedOrders.size,
    };
  });
  runbookCoverage.sort((a, b) => {
    // Untested first, then by lowest completion %.
    if (a.executionsCount === 0 && b.executionsCount !== 0) return -1;
    if (a.executionsCount !== 0 && b.executionsCount === 0) return 1;
    return (a.completionPct ?? 0) - (b.completionPct ?? 0);
  });

  return (
    <div className="space-y-8">
      <Section
        title="IBS × risk-dimension coverage"
        subtitle={`Per IBS, how many exercises ${range.label.toLowerCase()} have tested it against each of the six risk dimensions. Empty cells are gaps a regulator will ask about.`}
      >
        <IBSCoverageHeatmap rows={heatmapRows} />
      </Section>

      <Section
        title="6-box risk coverage"
        subtitle={`Library = scenarios you've added · Tested = exercises with that risk-box covered (${range.label.toLowerCase()})`}
      >
        <div className="overflow-hidden rounded-md border border-line bg-surface-1">
          <table className="w-full text-sm">
            <thead className="bg-surface-0 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3">Risk box</th>
                <th className="p-3">In library</th>
                <th className="p-3">Tested</th>
                <th className="p-3">Gap</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["People", lib.people, exec.people],
                ["Property", lib.property, exec.property],
                ["Technology", lib.technology, exec.technology],
                ["Data availability", lib.dataAvailability, exec.dataAvailability],
                ["Data integrity", lib.dataIntegrity, exec.dataIntegrity],
                ["Third party", lib.thirdParty, exec.thirdParty],
              ].map(([label, l, e]) => {
                const gap = (l as number) > 0 && (e as number) === 0;
                return (
                  <tr key={label as string} className="border-t border-line">
                    <td className="p-3 font-medium">{label}</td>
                    <td className="p-3">{l}</td>
                    <td className="p-3">{e}</td>
                    <td className="p-3">
                      {gap ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-800">
                          Untested
                        </span>
                      ) : (e as number) > 0 ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                          Covered
                        </span>
                      ) : (
                        <span className="text-xs text-soft">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Category coverage"
        subtitle="Scenarios per category, vs. exercises run in the selected window"
      >
        <div className="overflow-hidden rounded-md border border-line bg-surface-1">
          <table className="w-full text-sm">
            <thead className="bg-surface-0 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Scenarios</th>
                <th className="p-3">Exercises</th>
              </tr>
            </thead>
            <tbody>
              {sortedCats.map(([c, v]) => (
                <tr key={c} className="border-t border-line">
                  <td className="p-3 font-medium">{c}</td>
                  <td className="p-3">{v.lib}</td>
                  <td className="p-3">
                    {v.exec}
                    {v.lib > 0 && v.exec === 0 && (
                      <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-800">
                        Untested
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Runbook coverage"
        subtitle={`Per published runbook, how often it activated ${range.label.toLowerCase()} and the % of steps that reached COMPLETE or SKIPPED. Steps that never fired are coverage gaps a regulator can challenge.`}
      >
        {runbookCoverage.length === 0 ? (
          <p className="rounded-md border border-dashed border-line-strong bg-surface-1 p-6 text-sm text-muted">
            No runbooks in your registry yet.{" "}
            <Link href="/runbooks" className="underline">
              Browse the library
            </Link>{" "}
            to seed your first one.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-line bg-surface-1">
            <table className="w-full text-sm">
              <thead className="bg-surface-0 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">Runbook</th>
                  <th className="p-3 text-right">Activations</th>
                  <th className="p-3 text-right">Steps exercised</th>
                  <th className="p-3 text-right">Completion</th>
                </tr>
              </thead>
              <tbody>
                {runbookCoverage.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="p-3">
                      <Link href={`/runbooks/${r.id}`} className="font-medium hover:underline">
                        {r.title}
                      </Link>
                      <p className="text-[11px] text-soft">
                        {r.category.replace(/_/g, " ")} · {r.status.toLowerCase()} · {r.totalSteps} step{r.totalSteps === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td className="p-3 text-right font-mono">
                      {r.executionsCount === 0 ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-800">
                          0
                        </span>
                      ) : (
                        r.executionsCount
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-xs">
                      {r.stepsExercised}/{r.totalSteps}
                    </td>
                    <td className="p-3 text-right">
                      {r.completionPct === null ? (
                        <span className="text-soft">—</span>
                      ) : (
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-xs font-semibold ${
                            r.completionPct >= 80
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : r.completionPct >= 60
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
                          }`}
                        >
                          {r.completionPct}%
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

      <Section
        title="IBS test history"
        subtitle="Which IBSs in your register have been exercised in the selected window?"
      >
        {ibsRegister.length === 0 ? (
          <p className="rounded-md border border-dashed border-line-strong bg-surface-1 p-6 text-sm text-muted">
            No IBSs match the current filter.{" "}
            <Link href="/ibs/new" className="underline">
              Add your first one
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted">
              {untestedIBS.length} of {ibsRegister.length} IBS have never been exercise-tested
              in this window.
            </p>
            <ul className="space-y-1 text-sm">
              {ibsRegister.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between rounded border border-line bg-surface-1 px-3 py-2"
                >
                  <div>
                    <Link className="font-medium hover:underline" href={`/ibs/${i.id}`}>
                      <span className="font-mono text-xs text-muted">{i.code}</span> · {i.name}
                    </Link>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      i._count.exerciseLinks === 0
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {i._count.exerciseLinks} tested
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
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
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      <div className="mt-2">{children}</div>
    </section>
  );
}
