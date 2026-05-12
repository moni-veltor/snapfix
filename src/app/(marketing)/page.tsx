import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "SnapFix — Practise the disruptions that matter, before they happen",
  description:
    "SnapFix is operational-resilience consulting in technology, plus a SaaS platform of practical apps for banks. Start with the SnapFix Simulator — a CMORG-aligned exercise platform.",
};

export default async function MarketingHome() {
  const session = await auth();
  if (session?.user?.orgId) redirect("/dashboard");

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-gradient">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                Operational resilience platform
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Practise the disruptions
                <br />
                that matter,{" "}
                <span className="text-indigo-600">before they happen.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-slate-600">
                SnapFix is operational-resilience consulting for banks and a growing platform of
                practical apps. Start with the SnapFix Simulator — design CMORG-aligned scenarios,
                run live exercises with your incident-management team, and close the loop with
                regulator-grade reporting.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/sign-up"
                  className="rounded-md bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  Get started free
                </Link>
                <Link
                  href="/product/simulator"
                  className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-slate-400"
                >
                  See the Simulator →
                </Link>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                No card. Free for up to 5 members. CMORG library + 26 ready-made scenarios.
              </p>
            </div>
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* Logo strip — replace with real bank logos once we have permission */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-center text-xs uppercase tracking-wider text-slate-500">
            Built around the standards your regulator already expects
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 text-center text-sm text-slate-500 sm:grid-cols-5">
            {["CMORG DSL", "PRA / FCA SS1/21", "Bank of England", "ORCG", "Cross-market OR"].map(
              (s) => (
                <div key={s} className="rounded-md border border-slate-200 px-3 py-3 font-medium">
                  {s}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-dots">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              From scenario design to debrief, in one place.
            </h2>
            <p className="mt-4 text-slate-600">
              The Simulator is the first SnapFix app — a complete workspace for operational-
              resilience exercises, built around the CMORG Dynamic Scenario Library.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              title="26 ready-made scenarios"
              body="The full CMORG Dynamic Scenario Library — cyber, third-party, geopolitical, natural hazards, CNI — plus tier-specific scenarios for Tier 1, Tier 2 and Tier 3 firms."
            />
            <Feature
              title="Addressed events and injects"
              body="Every event and inject flows like a real email — From / To / Cc role titles. Each participant sees only what their role would actually receive."
            />
            <Feature
              title="Live D-Day clock"
              body="Run an exercise on a real or compressed clock (×60 for workshops). Schedule events to auto-release, or trigger them live as the facilitator."
            />
            <Feature
              title="Org IBS register"
              body="Capture your formal IBS register with FCA + PRA tolerances, third-party map, importance assessment, and audit-quality lifecycle."
            />
            <Feature
              title="Coverage analytics"
              body="See exactly which risks your scenario library covers and which you've never actually tested — six-box heatmap, untested-IBS list, CMORG category coverage."
            />
            <Feature
              title="Action-item tracker"
              body="Every AAR generates action items with owner, due date and status. Track them across exercises — never lose a follow-up again."
            />
          </div>
        </div>
      </section>

      {/* Tier-targeting */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Built for your tier.
              </h2>
              <p className="mt-4 text-slate-600">
                Operational resilience challenges look very different for a Tier 1 global universal
                bank, a Tier 2 digital challenger, and a Tier 3 BaaS-dependent fintech. SnapFix
                ships scenarios calibrated for each — your library auto-filters to the ones that
                apply to your firm.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <TierCard label="Tier 1" desc="Global universal / G-SIB" examples="HSBC · Barclays · JPM" />
                <TierCard label="Tier 2" desc="Digital challenger" examples="Starling · Monzo · Revolut" />
                <TierCard label="Tier 3" desc="New banks / fintechs" examples="GBB · Afin · BaaS-dependent" />
              </div>
            </div>
            <TiersVisual />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-700">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Ready to run your next exercise?
          </h2>
          <p className="mt-4 text-indigo-100">
            Free for teams of up to 5 — the full library, design tools, and exercise mode, no card.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-md bg-white px-5 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Get started free
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-white/30 px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function TierCard({ label, desc, examples }: { label: string; desc: string; examples: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-xs">
      <div className="font-semibold text-slate-900">{label}</div>
      <div className="text-slate-600">{desc}</div>
      <div className="mt-1 text-slate-500">{examples}</div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl shadow-indigo-100/40">
        <div className="flex items-center gap-1.5 border-b border-slate-200 px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs text-slate-500 font-mono">snapfix.app/exercises/.../facilitator</span>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Simulation 2 — OR</p>
              <h3 className="text-base font-semibold text-slate-900">Cyber Attack — Ransomware</h3>
            </div>
            <div className="rounded-md bg-slate-900 px-3 py-1.5 font-mono text-sm text-white">
              D-Day 10:15
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <EventCard from="CTO" to="Sn.TPM · TPM · ISM" status="Released" delta="08:00" title="Initial Cyber Intrusion" />
            <EventCard from="CTO" to="Sn.TPM · TPM · Comms Lead" status="Live now" delta="10:15" active title="Service Degradation" />
            <EventCard from="—" to="—" status="Scheduled" delta="11:00" title="Third-Party Provider Impact" muted />
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({
  from,
  to,
  status,
  delta,
  title,
  active,
  muted,
}: {
  from: string;
  to: string;
  status: string;
  delta: string;
  title: string;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 text-sm ${
        active
          ? "border-indigo-300 bg-indigo-50"
          : muted
            ? "border-slate-200 bg-slate-50 text-slate-500"
            : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-slate-500">{delta}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            active
              ? "bg-indigo-600 text-white"
              : muted
                ? "bg-slate-200 text-slate-600"
                : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {status}
        </span>
      </div>
      <div className="mt-1 font-medium">{title}</div>
      <div className="mt-1 text-xs text-slate-500">
        From: {from} · To: {to}
      </div>
    </div>
  );
}

function TiersVisual() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        { label: "Tier 1", scenarios: ["Multi-region trading", "Data leak (10M+)", "SWIFT disconnect", "T+1 failure"], color: "from-indigo-50 to-white" },
        { label: "Tier 2", scenarios: ["Card scheme outage", "Bank run (viral)", "App-store removal", "KYC partner fail"], color: "from-cyan-50 to-white" },
        { label: "Tier 3", scenarios: ["BaaS partner fail", "Acquisition surge", "Key-person loss", "Capital concern"], color: "from-slate-100 to-white" },
      ].map((t) => (
        <div
          key={t.label}
          className={`rounded-lg border border-slate-200 bg-gradient-to-b ${t.color} p-4`}
        >
          <div className="text-xs font-semibold text-slate-900">{t.label}</div>
          <ul className="mt-3 space-y-2 text-xs text-slate-700">
            {t.scenarios.map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
