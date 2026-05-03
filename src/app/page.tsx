import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();
  const [scenarioCount, runCount] = await Promise.all([
    prisma.scenario.count().catch(() => 0),
    prisma.exerciseRun.count().catch(() => 0),
  ]);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Operational Resilience Exercise Simulator
        </h1>
        <p className="max-w-2xl text-slate-600">
          Design CMORG-aligned event-based scenarios, run live functional exercises with multiple
          participants, capture decisions and communications against a D-Day clock, and produce
          After-Action Reports that feed back into your operational resilience programme.
        </p>
        <div className="flex gap-3 pt-2">
          {session?.user ? (
            <>
              <Link
                href="/scenarios"
                className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                Browse scenarios
              </Link>
              <Link
                href="/runs"
                className="rounded-md border border-slate-300 px-4 py-2 hover:bg-white"
              >
                View runs
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md border border-slate-300 px-4 py-2 hover:bg-white"
              >
                Create an account
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <Stat label="Scenarios" value={scenarioCount} />
        <Stat label="Exercise runs" value={runCount} />
        <Stat label="Framework" value="CMORG" small />
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card
          title="1. Design"
          body="Author scenarios as a Master Scenario Events List (MSEL): Important Business Services and impact tolerances, scheduled events, injects, attached artefacts, and facilitator/debrief question banks."
        />
        <Card
          title="2. Run"
          body="Start a live run on a D-Day clock. Events and injects fire on schedule (or facilitator-triggered). Multiple participants log decisions, capture responses per inject, and draft communications."
        />
        <Card
          title="3. Debrief"
          body="Capture debrief answers, see which Important Business Services breached their impact tolerance, and assemble an After-Action Report covering strengths, gaps, and follow-up actions."
        />
      </section>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={small ? "mt-1 text-xl font-semibold" : "mt-1 text-3xl font-semibold"}>
        {value}
      </div>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}
