import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();

  if (session?.user && !session.user.orgId) {
    redirect("/onboarding");
  }

  if (!session?.user?.orgId) {
    return <LandingPage />;
  }

  const canManage = session.user.orgRole === "OWNER" || session.user.orgRole === "ADMIN";
  return (
    <Dashboard
      userName={session.user.name ?? session.user.email}
      orgId={session.user.orgId}
      canManage={canManage}
    />
  );
}

async function Dashboard({
  userName,
  orgId,
  canManage,
}: {
  userName: string;
  orgId: string;
  canManage: boolean;
}) {
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [
    upcoming,
    inProgress,
    pendingInvites,
    openActionItems,
    overdueActionItems,
    ibsCount,
    untestedIBS,
    recentAudit,
    coverage,
    scenarioCount,
    exerciseCount,
    memberCount,
  ] = await Promise.all([
    prisma.exercise.findMany({
      where: {
        orgId,
        status: { in: ["PLANNING", "READY"] },
        plannedDate: { gte: now, lte: in90Days },
      },
      orderBy: { plannedDate: "asc" },
      take: 5,
      include: { scenario: { select: { title: true } } },
    }),
    prisma.exercise.findMany({
      where: { orgId, status: { in: ["IN_PROGRESS", "PAUSED"] } },
      orderBy: { startedAt: "desc" },
      include: { scenario: { select: { title: true } } },
    }),
    canManage
      ? prisma.invitation.count({
          where: { orgId, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
        })
      : Promise.resolve(0),
    prisma.exerciseActionItem.count({
      where: { orgId, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } },
    }),
    prisma.exerciseActionItem.count({
      where: {
        orgId,
        status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
        dueAt: { lt: now },
      },
    }),
    prisma.organizationIBS.count({ where: { orgId } }),
    prisma.organizationIBS.count({
      where: { orgId, exerciseLinks: { none: {} } },
    }),
    canManage
      ? prisma.auditLogEntry.findMany({
          where: { orgId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { actor: { select: { name: true, email: true } } },
        })
      : Promise.resolve([] as { id: string; createdAt: Date; summary: string; actor: { name: string | null; email: string } | null }[]),
    prisma.exercise.findMany({
      where: { orgId, status: { in: ["IN_PROGRESS", "PAUSED", "COMPLETED"] } },
      include: {
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
    }),
    prisma.scenario.count({ where: { orgId, isTemplate: false } }),
    prisma.exercise.count({ where: { orgId } }),
    prisma.user.count({ where: { orgId } }),
  ]);

  // Onboarding flags — for fresh admins we show a guided checklist instead of
  // the analytics-heavy dashboard.
  const isFreshOrg =
    canManage && scenarioCount === 0 && exerciseCount === 0 && memberCount <= 1 && ibsCount === 0;

  const tested = {
    people: coverage.filter((e) => e.scenario.coversPeople).length,
    property: coverage.filter((e) => e.scenario.coversProperty).length,
    technology: coverage.filter((e) => e.scenario.coversTechnology).length,
    dataAvailability: coverage.filter((e) => e.scenario.coversDataAvailability).length,
    dataIntegrity: coverage.filter((e) => e.scenario.coversDataIntegrity).length,
    thirdParty: coverage.filter((e) => e.scenario.coversThirdParty).length,
  };

  if (isFreshOrg) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome, {userName}</h1>
          <p className="mt-1 text-sm text-muted">
            Let's get your operational-resilience programme set up. Four steps and you're ready to run your first exercise.
          </p>
        </header>
        <OnboardingChecklist
          steps={[
            {
              done: scenarioCount > 0,
              title: "Clone a scenario from the library",
              body: "26 ready-made scenarios in the CMORG Dynamic Scenario Library. Pick one suited to your firm's tier.",
              href: "/templates",
              cta: "Open library",
            },
            {
              done: ibsCount > 0,
              title: "Capture your IBS register",
              body: "Add your firm's Important Business Services with FCA and PRA tolerances. Required for coverage analytics.",
              href: "/ibs/new",
              cta: "Add an IBS",
            },
            {
              done: memberCount > 1,
              title: "Invite your team",
              body: "Add the people who'll participate in exercises — CTO, ISM, CRO, comms lead, etc.",
              href: "/org",
              cta: "Invite teammates",
            },
            {
              done: exerciseCount > 0,
              title: "Plan your first exercise",
              body: "Pick a scenario, set a date, assemble the team. The platform handles the rest.",
              href: "/exercises/new",
              cta: "Plan an exercise",
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {userName}</h1>
        <p className="mt-1 text-sm text-muted">Operational resilience dashboard.</p>
      </header>

      {inProgress.length > 0 && (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">
            {inProgress.length} exercise{inProgress.length === 1 ? "" : "s"} live now
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {inProgress.map((e) => (
              <li key={e.id}>
                <Link href={`/exercises/${e.id}`} className="font-medium underline">
                  {e.title}
                </Link>{" "}
                <span className="text-amber-800">· {e.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard href="/calendar" label="Upcoming (90d)" value={upcoming.length} />
        <StatCard
          href="/action-items"
          label="Open action items"
          value={openActionItems}
          accent={overdueActionItems > 0 ? `${overdueActionItems} overdue` : undefined}
          accentTone={overdueActionItems > 0 ? "danger" : undefined}
        />
        <StatCard
          href="/ibs"
          label="IBS register"
          value={ibsCount}
          accent={untestedIBS > 0 ? `${untestedIBS} untested` : ibsCount > 0 ? "all tested" : undefined}
          accentTone={untestedIBS > 0 ? "warn" : ibsCount > 0 ? "ok" : undefined}
        />
        <StatCard
          href={canManage ? "/org" : undefined}
          label="Pending invites"
          value={pendingInvites}
        />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Panel title="Upcoming exercises" href="/calendar">
          {upcoming.length === 0 ? (
            <Empty body="No upcoming exercises in the next 90 days." />
          ) : (
            <ul className="space-y-2 text-sm">
              {upcoming.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded border border-line px-3 py-2"
                >
                  <div>
                    <Link href={`/exercises/${e.id}`} className="font-medium hover:underline">
                      {e.title}
                    </Link>
                    <div className="text-xs text-muted">
                      {e.scenario.title}
                      {e.plannedDate && (
                        <> ·{" "}
                          {e.plannedDate.toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </>
                      )}
                    </div>
                  </div>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">{e.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Risk-coverage tested (exercises)" href="/analytics">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            {[
              ["People", tested.people],
              ["Property", tested.property],
              ["Technology", tested.technology],
              ["Data avail.", tested.dataAvailability],
              ["Data integ.", tested.dataIntegrity],
              ["3rd party", tested.thirdParty],
            ].map(([label, n]) => (
              <div
                key={label as string}
                className={`rounded-md border p-3 text-center ${
                  (n as number) > 0
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                <div className="font-medium">{label}</div>
                <div className="mt-1">{n as number} exercises</div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {canManage && recentAudit.length > 0 && (
        <Panel title="Recent activity" href="/audit">
          <ul className="space-y-1 text-xs">
            {recentAudit.map((e) => (
              <li key={e.id} className="rounded border border-line px-3 py-2">
                <span className="font-mono text-muted">
                  {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </span>{" "}
                <span className="text-slate-800">{e.summary}</span>{" "}
                <span className="text-muted">
                  · {e.actor?.name ?? e.actor?.email ?? "system"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function StatCard({
  href,
  label,
  value,
  accent,
  accentTone,
}: {
  href?: string;
  label: string;
  value: number | string;
  accent?: string;
  accentTone?: "ok" | "warn" | "danger";
}) {
  const inner = (
    <div className="rounded-md border border-line bg-surface-1 p-4 hover:border-line-strong">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {accent && (
        <div
          className={`mt-1 text-xs ${
            accentTone === "danger"
              ? "text-rose-700"
              : accentTone === "warn"
                ? "text-amber-700"
                : accentTone === "ok"
                  ? "text-emerald-700"
                  : "text-muted"
          }`}
        >
          {accent}
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-md border border-line bg-surface-1 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-muted hover:underline">
            View all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ body }: { body: string }) {
  return (
    <p className="rounded border border-dashed border-line-strong bg-surface-0 p-4 text-center text-xs text-muted">
      {body}
    </p>
  );
}

function OnboardingChecklist({
  steps,
}: {
  steps: { done: boolean; title: string; body: string; href: string; cta: string }[];
}) {
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-line bg-surface-1 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Onboarding</div>
            <div className="mt-1 text-xs text-muted">
              {completed} of {total} complete
            </div>
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <ul className="space-y-2">
        {steps.map((s, i) => (
          <li
            key={i}
            className={`flex items-start justify-between gap-4 rounded-md border p-4 ${
              s.done ? "border-emerald-200 bg-emerald-50/40" : "border-line bg-surface-1"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  s.done
                    ? "bg-emerald-500 text-white"
                    : "border border-line-strong text-soft"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </div>
              <div className="space-y-1">
                <div
                  className={`text-sm font-medium ${
                    s.done ? "text-muted line-through" : "text-slate-900"
                  }`}
                >
                  {s.title}
                </div>
                <p className="text-xs text-slate-600">{s.body}</p>
              </div>
            </div>
            {!s.done && (
              <Link
                href={s.href}
                className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
              >
                {s.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function LandingPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">SnapFix — Operational Resilience</h1>
        <p className="max-w-2xl text-slate-600">
          Plan, run, and learn from operational resilience exercises. Design CMORG-aligned scenarios,
          run live functional exercises with your incident management team, capture decisions and
          communications against a D-Day clock, and produce after-action reports that feed back into
          your operational resilience programme.
        </p>
        <div className="flex gap-3 pt-2">
          <Link href="/sign-up" className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
            Create an organisation
          </Link>
          <Link href="/sign-in" className="rounded-md border border-line-strong px-4 py-2 hover:bg-surface-1">
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
