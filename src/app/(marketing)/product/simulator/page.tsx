import Link from "next/link";

export const metadata = {
  title: "SnapFix Simulator — Operational Resilience Exercises",
  description:
    "The SnapFix Simulator turns the CMORG Dynamic Scenario Library into a working platform: design scenarios, run exercises with an addressed inbox, capture decisions, and produce regulator-ready reports.",
};

export default function SimulatorProductPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-brand-gradient">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="text-sm uppercase tracking-wider text-indigo-700">
            Product · SnapFix Simulator
          </span>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            The operational-resilience exercise platform, built around CMORG.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            Design CMORG-aligned scenarios with full Master Scenario Events Lists and addressed
            injects. Run exercises on a D-Day clock. Capture decisions, communications, and
            action items in one place. Close every exercise with a regulator-grade After-Action
            Report.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="rounded-md bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="bg-dots">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            Capabilities
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <Capability
              title="Scenario Library"
              body="The full CMORG Dynamic Scenario Library (March 2025) — 14 sector-standard scenarios across Cyber, Non-Cyber, Physical, Geopolitical, Natural Hazards, CNI and Third Party. Plus 12 tier-specific scenarios calibrated for Tier 1 (HSBC-scale), Tier 2 (Starling-scale), and Tier 3 (BaaS-dependent fintechs)."
              bullets={[
                "26 ready-made scenarios on day one",
                "Six-box risk-coverage matrix per scenario",
                "Real-world case studies (Maersk NotPetya, AWS us-east-1, SVB, Synapse, etc.)",
                "Stress variables to dial up severity",
              ]}
            />
            <Capability
              title="Scenario Design"
              body="Author your own scenarios with the same structured rigour. MSEL events with expected actions, objectives and addressing. Injects with full From / To / Cc. Attach AWS alerts, email PDFs, briefing docs."
              bullets={[
                "Clone any CMORG template into your org",
                "Edit MSEL events and injects with full addressing",
                "Attach artefacts (alerts, emails, runbooks) via Vercel Blob",
                "Question banks for facilitator and debrief",
              ]}
            />
            <Capability
              title="Exercise Planning"
              body="Plan exercises from any scenario. Pre-build teams (Incident Mgmt, Tech Recovery, Comms, Customer Ops, Exec Observers). Assemble your roster from existing members with role titles and exercise roles. Readiness checklist before you go live."
              bullets={[
                "Five default teams, customisable",
                "Per-exercise role titles (CTO, Sn.TPM, ISM…)",
                "Readiness gating before transition to Ready",
                "Calendar view across the year",
              ]}
            />
            <Capability
              title="Live Exercise"
              body="Run the exercise on a real D-Day clock or compressed (×5, ×15, ×60 — fit a 9-hour scenario into a 90-minute workshop). Events and injects auto-release on schedule, or the facilitator triggers them live."
              bullets={[
                "D-Day clock with speed multiplier",
                "Auto and manual event/inject release",
                "Per-participant inbox with addressing",
                "Multi-participant capture in real time",
              ]}
            />
            <Capability
              title="Addressed Inbox"
              body="Every event and inject flows like a real email. Each participant only sees what their role would receive in real life — TO or CC. Read/unread tracking. Mirrors the workflow your IBS document already describes."
              bullets={[
                "From / To / Cc resolves to participant role titles",
                "TO vs CC visually distinguished",
                "Attachments surface inline",
                "Response form for capture per inject",
              ]}
            />
            <Capability
              title="IBS Register"
              body="Capture your formal Important Business Service register inside the platform. Mirrors the methodology document: governance, customer journeys, FCA and PRA tolerances, full resource map (tech, people, 3rd parties, info, processes), six-dimension importance assessment, vulnerabilities and testing notes. Lifecycle: Draft → Approved → Deprecated."
              bullets={[
                "Process owner + 2nd-line reviewer",
                "FCA + PRA impact tolerances",
                "Six-dimension importance matrix",
                "Cross-exercise test history",
              ]}
            />
            <Capability
              title="Reporting"
              body="After-Action Report with summary, strengths, gaps and actions. Action-item tracker keeps follow-ups visible long after the exercise. Audit log captures every meaningful action for regulator-ready accountability."
              bullets={[
                "AAR fields + auto-aggregated artefacts",
                "Action-item tracker with owner / due date / status",
                "Audit log: who did what, when",
                "Coverage analytics: what you've tested vs. what you haven't",
              ]}
            />
            <Capability
              title="Organisation Management"
              body="Multi-tenant by design. Email-based invitations via Resend. Three roles: OWNER, ADMIN, MEMBER. Per-exercise role assignments for facilitators, leads, participants and observers."
              bullets={[
                "Email invitations with branded templates",
                "Per-org tier (Tier 1 / 2 / 3) drives library filtering",
                "Member directory and pending invitations",
                "Settings + audit log for admins",
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-700">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            See the Simulator in action.
          </h2>
          <p className="mt-3 text-indigo-100">
            Free to try with up to 5 members. The full Library is included.
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

function Capability({
  title,
  body,
  bullets,
}: {
  title: string;
  body: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.704 5.296a1 1 0 010 1.408l-7.5 7.5a1 1 0 01-1.408 0l-3.5-3.5a1 1 0 011.408-1.408L8.5 12.092l6.796-6.796a1 1 0 011.408 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-slate-700">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
