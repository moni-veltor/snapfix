import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();

  if (session?.user && !session.user.orgId) {
    redirect("/onboarding");
  }

  if (session?.user?.orgId) {
    const [scenarioCount, runCount, memberCount] = await Promise.all([
      prisma.scenario.count({ where: { orgId: session.user.orgId } }),
      prisma.exerciseRun.count({ where: { orgId: session.user.orgId } }),
      prisma.user.count({ where: { orgId: session.user.orgId } }),
    ]);
    const canManageOrg = session.user.orgRole === "OWNER" || session.user.orgRole === "ADMIN";
    return (
      <div className="space-y-10">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome, {session.user.name ?? session.user.email}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Plan, run and learn from operational resilience exercises.
          </p>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          <Stat href="/scenarios" label="Scenarios" value={scenarioCount} />
          <Stat href="/runs" label="Exercise runs" value={runCount} />
          <Stat href={canManageOrg ? "/org" : undefined} label="Members" value={memberCount} />
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          <Card
            title="1. Design"
            body="Author scenarios — Important Business Services, MSEL events, injects, and question banks."
          />
          <Card
            title="2. Run"
            body="Start a live run on a D-Day clock. Multiple participants capture responses and decisions."
          />
          <Card
            title="3. Debrief"
            body="Capture debrief answers, assemble an After-Action Report, and feed lessons back into your programme."
          />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          SnapFix — Operational Resilience
        </h1>
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
          <Link href="/sign-in" className="rounded-md border border-slate-300 px-4 py-2 hover:bg-white">
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}
