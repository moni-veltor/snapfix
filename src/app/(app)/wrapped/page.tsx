import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgressRing, Sparkline, Donut } from "@/components/ui/charts";
import Hoot from "@/components/fun/Hoot";

export default async function WrappedPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/sign-in");
  const orgId = session.user.orgId;

  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);

  const [
    exercises,
    actionItems,
    actionItemsClosed,
    drTests,
    ibsCount,
    vendorCount,
    rolesCount,
  ] = await Promise.all([
    prisma.exercise.findMany({
      where: { orgId, createdAt: { gte: startOfYear } },
      include: {
        scenario: {
          select: {
            title: true,
            coversPeople: true,
            coversProperty: true,
            coversTechnology: true,
            coversDataAvailability: true,
            coversDataIntegrity: true,
            coversThirdParty: true,
          },
        },
      },
    }),
    prisma.exerciseActionItem.count({
      where: { orgId, createdAt: { gte: startOfYear } },
    }),
    prisma.exerciseActionItem.count({
      where: { orgId, status: "DONE", createdAt: { gte: startOfYear } },
    }),
    prisma.dRTest.findMany({
      where: { system: { orgId }, testedAt: { gte: startOfYear } },
      orderBy: { testedAt: "asc" },
    }),
    prisma.organizationIBS.count({ where: { orgId } }),
    prisma.vendor.count({ where: { orgId } }),
    prisma.organizationRole.count({ where: { orgId } }),
  ]);

  const harmsCovered = [
    exercises.some((e) => e.scenario.coversPeople),
    exercises.some((e) => e.scenario.coversProperty),
    exercises.some((e) => e.scenario.coversTechnology),
    exercises.some((e) => e.scenario.coversDataAvailability),
    exercises.some((e) => e.scenario.coversDataIntegrity),
    exercises.some((e) => e.scenario.coversThirdParty),
  ].filter(Boolean).length;

  const drPassRate =
    drTests.length === 0
      ? 0
      : Math.round(
          (drTests.filter((t) => t.outcome === "PASS").length / drTests.length) * 100,
        );

  // Monthly cadence buckets — exercises started per month
  const monthly = Array.from({ length: 12 }, () => 0);
  for (const e of exercises) {
    if (!e.startedAt) continue;
    const m = e.startedAt.getMonth();
    monthly[m] += 1;
  }

  const topScenario = [...exercises]
    .reduce<Record<string, number>>((acc, e) => {
      const t = e.scenario.title;
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
  const topScenarioTitle =
    Object.entries(topScenario).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const closureRate =
    actionItems === 0 ? 0 : Math.round((actionItemsClosed / actionItems) * 100);

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border-2 border-indigo-400 bg-gradient-brand p-8 text-white shadow-[var(--shadow-card-glow)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative flex items-center gap-6">
          <Hoot mood="happy" size={96} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
              Year in review
            </p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight">
              Resilience Wrapped {year}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/85">
              How your operational-resilience programme actually performed this year.
              No spin, just the numbers.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigStat
          label="Exercises run"
          value={exercises.length}
          accent={`Top scenario: ${topScenarioTitle}`}
        />
        <BigStat
          label="DR tests logged"
          value={drTests.length}
          accent={`${drPassRate}% pass rate`}
        />
        <BigStat
          label="Action items closed"
          value={actionItemsClosed}
          accent={`${closureRate}% of opened`}
        />
        <BigStat
          label="IBS register"
          value={ibsCount}
          accent={`${rolesCount} IMT roles · ${vendorCount} vendors`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <article className="rounded-xl border border-line bg-surface-1 p-5">
          <header>
            <h3 className="text-sm font-semibold text-ink">Cadence — exercises per month</h3>
            <p className="mt-0.5 text-xs text-muted">
              Monthly drumbeat over the calendar year.
            </p>
          </header>
          <div className="mt-4">
            <Sparkline
              values={monthly}
              width={620}
              height={64}
              color="var(--accent)"
              className="w-full"
            />
          </div>
          <ul className="mt-2 grid grid-cols-12 gap-1 text-center text-[10px] text-soft">
            {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </article>

        <article className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface-1 p-5">
          <ProgressRing
            value={Math.round((harmsCovered / 6) * 100)}
            label={`${harmsCovered}`}
            sublabel="of 6 harms"
            size={140}
            thickness={12}
          />
          <p className="max-w-[160px] text-center text-[11px] text-muted">
            Harm types you stress-tested at least once this year.
          </p>
        </article>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FlavourCard
          title="Most-tested harm"
          body={mostTestedHarm(exercises) ?? "—"}
        />
        <FlavourCard
          title="Quietest month"
          body={quietestMonth(monthly)}
        />
        <FlavourCard
          title="Action-item closure rate"
          body={`${closureRate}%`}
          extra={
            <div className="mt-3">
              <Donut value={closureRate} size={56} thickness={6} />
            </div>
          }
        />
      </section>

      <p className="text-[11px] text-soft">
        Want last year too? Hoot only goes back as far as the data — earlier years come
        online once you&apos;ve been running exercises a while.
      </p>
    </div>
  );
}

function BigStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-soft">
        {label}
      </div>
      <div className="mt-1 text-4xl font-bold tracking-tight text-ink">{value}</div>
      {accent && (
        <div className="mt-1 truncate text-[11px] text-muted" title={accent}>
          {accent}
        </div>
      )}
    </div>
  );
}

function FlavourCard({
  title,
  body,
  extra,
}: {
  title: string;
  body: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-soft">
        {title}
      </div>
      <div className="mt-1 text-lg font-semibold text-ink">{body}</div>
      {extra}
    </div>
  );
}

type ScenarioCoverage = {
  title: string;
  coversPeople: boolean;
  coversProperty: boolean;
  coversTechnology: boolean;
  coversDataAvailability: boolean;
  coversDataIntegrity: boolean;
  coversThirdParty: boolean;
};

function mostTestedHarm(
  exercises: { scenario: ScenarioCoverage }[],
): string | null {
  const counts: Record<string, number> = {
    People: 0,
    Property: 0,
    Technology: 0,
    "Data availability": 0,
    "Data integrity": 0,
    "Third party": 0,
  };
  for (const e of exercises) {
    if (e.scenario.coversPeople) counts.People++;
    if (e.scenario.coversProperty) counts.Property++;
    if (e.scenario.coversTechnology) counts.Technology++;
    if (e.scenario.coversDataAvailability) counts["Data availability"]++;
    if (e.scenario.coversDataIntegrity) counts["Data integrity"]++;
    if (e.scenario.coversThirdParty) counts["Third party"]++;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] === 0) return null;
  return `${top[0]} · ${top[1]}× tested`;
}

function quietestMonth(monthly: number[]): string {
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let min = Infinity;
  let idx = 0;
  for (let i = 0; i < monthly.length; i++) {
    if (monthly[i] < min) {
      min = monthly[i];
      idx = i;
    }
  }
  return `${names[idx]} · ${min} exercise${min === 1 ? "" : "s"}`;
}
