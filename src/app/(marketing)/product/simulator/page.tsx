import Link from "next/link";

export const metadata = {
  title: "SnapFix Simulator — Operational Resilience Exercises",
  description:
    "The SnapFix Simulator turns the CMORG Dynamic Scenario Library into a working platform: design scenarios, run exercises with an addressed inbox, capture decisions, and produce regulator-ready reports.",
};

export default function SimulatorProductPage() {
  return (
    <div className="text-slate-200">
      {/* Hero */}
      <section className="bg-night-hero">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="text-sm uppercase tracking-wider text-indigo-300">
            Product · SnapFix Simulator
          </span>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            The operational-resilience exercise platform, built around CMORG.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Design CMORG-aligned scenarios with full Master Scenario Events Lists and addressed
            injects. Run exercises on a D-Day clock. Capture decisions, communications, and action
            items in one place. Close every exercise with a regulator-grade After-Action Report.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="rounded-md bg-indigo-500 px-5 py-3 text-sm font-medium text-white shadow-[0_0_32px_-4px_rgba(99,102,241,0.6)] hover:bg-indigo-400"
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white hover:bg-white/[0.08]"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="bg-night-dots">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-white">Capabilities</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <Capability
              title="Scenario Library"
              body="The full CMORG Dynamic Scenario Library (March 2025) — 14 sector-standard scenarios across Cyber, Non-Cyber, Physical, Geopolitical, Natural Hazards, CNI and Third Party. Plus 12 tier-specific scenarios calibrated for Tier 1, Tier 2 and Tier 3 firms."
              bullets={[
                "26 ready-made scenarios on day one",
                "Six-box risk-coverage matrix per scenario",
                "Real-world case studies (Maersk NotPetya, AWS us-east-1, SVB, Synapse, …)",
                "Stress variables to dial up severity",
              ]}
            />
            <Capability
              title="Scenario Design"
              body="Author your own scenarios with the same structured rigour. MSEL events with expected actions, objectives and addressing. Injects with full From / To / Cc. Attach AWS alerts, email PDFs, briefing docs."
              bullets={[
                "Clone any CMORG template into your org",
                "Edit MSEL events and injects with full addressing",
                "Attach artefacts via Vercel Blob",
                "Question banks for facilitator and debrief",
              ]}
            />
            <Capability
              title="Exercise Planning"
              body="Plan exercises from any scenario. Pre-build teams (Incident Mgmt, Tech Recovery, Comms, Customer Ops, Exec Observers). Assemble your roster with role titles. Readiness checklist before you go live."
              bullets={[
                "Five default teams, customisable",
                "Per-exercise role titles (CTO, Sn.TPM, ISM…)",
                "Readiness gating before transition to Ready",
                "Calendar view across the year",
              ]}
            />
            <Capability
              title="Live Exercise"
              body="Run the exercise on a real D-Day clock or compressed (×5, ×15, ×60). Events and injects auto-release on schedule, or the facilitator triggers them live."
              bullets={[
                "D-Day clock with speed multiplier",
                "Auto and manual event/inject release",
                "Per-participant inbox with addressing",
                "Multi-participant capture in real time",
              ]}
            />
            <Capability
              title="Addressed Inbox"
              body="Every event and inject flows like a real email. Each participant only sees what their role would receive in real life — TO or CC. Read/unread tracking."
              bullets={[
                "From / To / Cc resolves to participant role titles",
                "TO vs CC visually distinguished",
                "Attachments surface inline",
                "Response form for capture per inject",
              ]}
            />
            <Capability
              title="IBS Register"
              body="Capture your formal Important Business Service register inside the platform. Mirrors the methodology document: governance, customer journeys, FCA and PRA tolerances, full resource map, six-dimension importance assessment."
              bullets={[
                "Process owner + 2nd-line reviewer",
                "FCA + PRA impact tolerances",
                "Six-dimension importance matrix",
                "Cross-exercise test history",
              ]}
            />
            <Capability
              title="Reporting"
              body="After-Action Report with summary, strengths, gaps and actions. Action-item tracker keeps follow-ups visible long after the exercise. Audit log captures every meaningful action."
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
                "Per-org tier drives library filtering",
                "Member directory and pending invitations",
                "Settings + audit log for admins",
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-night-hero">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            See the Simulator in action.
          </h2>
          <p className="mt-3 text-slate-300">
            Free to try with up to 5 members. The full Library is included.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-md bg-indigo-500 px-5 py-3 text-sm font-medium text-white shadow-[0_0_32px_-4px_rgba(99,102,241,0.6)] hover:bg-indigo-400"
            >
              Get started free
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-white/15 px-5 py-3 text-sm font-medium text-white hover:bg-white/[0.08]"
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
    <div className="card-night p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.704 5.296a1 1 0 010 1.408l-7.5 7.5a1 1 0 01-1.408 0l-3.5-3.5a1 1 0 011.408-1.408L8.5 12.092l6.796-6.796a1 1 0 011.408 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-slate-300">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
