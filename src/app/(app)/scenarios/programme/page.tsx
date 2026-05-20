import Link from "next/link";
import { ArrowLeft, CalendarRange, Flag, Sparkles } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import { updateScenarioProgrammeAction } from "@/app/actions/scenarios";

export const metadata = { title: "Scenario programme — SnapFix" };

const QUARTERS: { id: number; label: string }[] = [
  { id: 1, label: "Q1" },
  { id: 2, label: "Q2" },
  { id: 3, label: "Q3" },
  { id: 4, label: "Q4" },
];

export default async function ScenarioProgrammePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const sp = await searchParams;
  const thisYear = new Date().getUTCFullYear();
  const year = sp.year ? parseInt(sp.year, 10) : thisYear;

  const scenarios = await prisma.scenario.findMany({
    where: { orgId: me.orgId, isTemplate: false },
    orderBy: [{ programmeQuarter: "asc" }, { title: "asc" }],
    include: {
      _count: {
        select: { exercises: true, events: true, injects: true },
      },
    },
  });

  const inThisYear = scenarios.filter((s) => s.programmeYear === year);
  const unscheduled = scenarios.filter((s) => !s.programmeYear);
  const otherYears = scenarios
    .filter((s) => s.programmeYear && s.programmeYear !== year)
    .map((s) => s.programmeYear!) as number[];
  const yearSet = Array.from(new Set([year - 1, year, year + 1, ...otherYears])).sort();

  // Buckets by quarter for this year
  const byQuarter = new Map<number | null, typeof scenarios>();
  for (const s of inThisYear) {
    const q = s.programmeQuarter ?? null;
    const arr = byQuarter.get(q) ?? [];
    arr.push(s);
    byQuarter.set(q, arr);
  }
  const unassignedQuarter = byQuarter.get(null) ?? [];

  // Regulator-mandated scenarios
  const mandated = scenarios.filter((s) => s.regulatoryReq);

  return (
    <div className="space-y-6">
      <Link
        href="/scenarios"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        Back to scenarios
      </Link>

      <PageHero
        eyebrow="Programme"
        icon={CalendarRange}
        title={`Scenario programme · ${year}`}
        pitch={`${inThisYear.length} slotted · ${unscheduled.length} open · ${mandated.length} mandated`}
        actions={
          <div className="flex items-center gap-1">
            {yearSet.map((y) => (
              <Link
                key={y}
                href={`/scenarios/programme?year=${y}`}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                  y === year
                    ? "bg-slate-900 text-white dark:bg-indigo-500"
                    : "border border-line bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        }
      />

      {/* Quarterly grid */}
      <section className="grid gap-3 lg:grid-cols-4">
        {QUARTERS.map((q) => {
          const items = byQuarter.get(q.id) ?? [];
          return (
            <article
              key={q.id}
              className="rounded-xl border border-line bg-surface-1 p-3"
            >
              <header className="mb-2 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-ink">{q.label}</h2>
                <span className="text-[10px] uppercase tracking-wider text-soft">
                  {items.length} scenario{items.length === 1 ? "" : "s"}
                </span>
              </header>
              {items.length === 0 ? (
                <p className="rounded-md border border-dashed border-line bg-surface-0 p-3 text-center text-[11px] text-soft">
                  Empty quarter
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {items.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/scenarios/${s.id}`}
                        className="block rounded-md border border-line bg-surface-0 p-2 text-xs hover:border-line-strong hover:bg-surface-2"
                      >
                        <div className="truncate font-medium text-ink">{s.title}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-soft">
                          {s.regulatoryReq && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-1.5 py-0.5 font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                              <Flag size={8} />
                              Mandatory
                            </span>
                          )}
                          <span>{s._count.exercises} run{s._count.exercises === 1 ? "" : "s"}</span>
                          <span>· {s._count.events}e {s._count.injects}i</span>
                        </div>
                        {s.regulatoryReq && (
                          <p className="mt-1 line-clamp-2 text-[10px] text-muted">
                            {s.regulatoryReq}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>

      {/* Quarter-unassigned (this year) */}
      {unassignedQuarter.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">
            In {year} but no quarter set
          </h2>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {unassignedQuarter.map((s) => (
              <li
                key={s.id}
                className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs dark:border-amber-800/60 dark:bg-amber-950/30"
              >
                <Link
                  href={`/scenarios/${s.id}`}
                  className="font-medium text-ink hover:underline"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Unscheduled */}
      {unscheduled.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">
            <Sparkles size={12} className="mr-1 inline" />
            Not on any annual programme
            <span className="ml-2 text-[11px] font-normal text-soft">
              {unscheduled.length}
            </span>
          </h2>
          <p className="text-[11px] text-muted">
            Drag-and-drop is not wired yet — use the form below per scenario, or edit
            the scenario directly to set year + quarter.
          </p>
          {canManage && (
            <ul className="space-y-2">
              {unscheduled.map((s) => (
                <li
                  key={s.id}
                  className="rounded-md border border-line bg-surface-1 p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/scenarios/${s.id}`}
                      className="min-w-0 flex-1 truncate font-medium text-ink hover:underline"
                    >
                      {s.title}
                    </Link>
                  </div>
                  <form
                    action={updateScenarioProgrammeAction}
                    className="mt-2 flex flex-wrap items-end gap-2"
                  >
                    <input type="hidden" name="id" value={s.id} />
                    <label className="text-xs">
                      <span className="text-soft">Year</span>
                      <input
                        type="number"
                        name="programmeYear"
                        min={2000}
                        max={2100}
                        defaultValue={year}
                        className="mt-1 w-20 rounded-md border border-line-strong bg-surface-0 px-2 py-1 text-sm"
                      />
                    </label>
                    <label className="text-xs">
                      <span className="text-soft">Quarter</span>
                      <select
                        name="programmeQuarter"
                        defaultValue=""
                        className="mt-1 rounded-md border border-line-strong bg-surface-0 px-2 py-1 text-sm"
                      >
                        <option value="">—</option>
                        {QUARTERS.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex-1 text-xs">
                      <span className="text-soft">Regulatory commitment (optional)</span>
                      <input
                        name="regulatoryReq"
                        placeholder="e.g. FCA SS1/21 annual cyber exercise"
                        className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-2 py-1 text-sm"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                      Slot
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Mandatory commitments */}
      {mandated.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">
            <Flag size={12} className="mr-1 inline text-rose-600 dark:text-rose-300" />
            Regulator-mandated scenarios
          </h2>
          <p className="text-[11px] text-muted">
            Scenarios tagged with a specific regulatory commitment. Track these to
            ensure they&apos;re slotted into the right quarter.
          </p>
          <ul className="space-y-1.5">
            {mandated.map((s) => (
              <li
                key={s.id}
                className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm dark:border-rose-800/60 dark:bg-rose-950/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/scenarios/${s.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {s.title}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-muted">{s.regulatoryReq}</p>
                  </div>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {s.programmeYear ? `${s.programmeYear} Q${s.programmeQuarter ?? "?"}` : "Unscheduled"}
                  </span>
                </div>
                {s.mandatoryUntil && (
                  <p className="mt-1 text-[10px] text-soft">
                    Must be exercised by {s.mandatoryUntil.toISOString().slice(0, 10)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
