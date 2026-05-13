import Link from "next/link";
import { Compass, FileSearch, Users, FilePen, Network, Sparkles } from "lucide-react";

export const metadata = {
  title: "Consulting — SnapFix",
  description:
    "Annual scenario design, exercise facilitation, regulator-ready reporting, IBS coaching, and bespoke playbook builds for banks and fintechs.",
};

const SERVICES = [
  {
    icon: Compass,
    title: "Annual scenario design & review",
    pitch:
      "A dedicated consultant builds your year of scenarios. CMORG-aligned where you need it, bespoke where your business model demands. We deliver MSEL, briefing packs, facilitator guides, and a debrief framework.",
    deliverables: [
      "12-month scenario calendar mapped to your IBS register",
      "MSEL events + injects for each exercise (typically 3–6 per year)",
      "Facilitator scripts and observer rubrics",
      "Post-exercise reporting templates",
    ],
    duration: "Annual retainer, 3–8 days per quarter",
  },
  {
    icon: Users,
    title: "Exercise facilitation",
    pitch:
      "We run the exercise. You play. A senior facilitator drives the timeline, injects, debrief, and produces the post-exercise report — leaving your team free to actually practise.",
    deliverables: [
      "Senior facilitator on the day (1 or 2-day formats)",
      "Pre-exercise dry-run with your IM lead",
      "Live D-Day clock and inject management via the SnapFix platform",
      "Same-week debrief report with action items",
    ],
    duration: "Per-exercise; typically 4–6 days of effort",
  },
  {
    icon: FilePen,
    title: "Regulator-ready reporting",
    pitch:
      "We help you build the artefacts a supervisor will actually want to see. Self-assessment documents, scenario test reports, IBS register reviews, and the response narrative for a Section 166.",
    deliverables: [
      "Annual self-assessment draft",
      "Per-exercise post-exercise report (regulator-shareable format)",
      "IBS tolerance defensibility memo",
      "Section 166 response narrative if requested",
    ],
    duration: "Engagement-based, 5–15 days",
  },
  {
    icon: FileSearch,
    title: "IBS register coaching",
    pitch:
      "Most firms over-list (everything's important) or under-list (only the obvious customer-facing services). We work with your COO / CRO to right-size the register, set tolerances that survive scrutiny, and document the rationale.",
    deliverables: [
      "IBS materiality workshop with your senior team",
      "Right-sized IBS register with rationale per entry",
      "Tolerance-setting methodology document",
      "Six-dimension importance scoring complete",
    ],
    duration: "4–8 weeks, mostly part-time",
  },
  {
    icon: Network,
    title: "Bespoke playbook design",
    pitch:
      "For cyber, third-party failure, financial crime, regulatory investigation — a playbook isn't a document, it's a workflow. We design the playbook AND the platform configuration that makes it executable.",
    deliverables: [
      "Cyber / ransomware / data exfiltration playbook",
      "Third-party failure playbook with vendor-specific runbooks",
      "Financial crime / FATF playbook",
      "Regulatory investigation response playbook",
    ],
    duration: "Per playbook, 2–4 weeks",
  },
  {
    icon: Sparkles,
    title: "Platform implementation",
    pitch:
      "If you're using SnapFix at Enterprise tier, we configure it for you. IBS register import, scenario clones, role assignments, comms cascade configuration, audit log setup.",
    deliverables: [
      "IBS register import + validation",
      "CMORG scenarios cloned + bound to your roles",
      "Comms cascade approval matrix configured",
      "Two onboarding workshops for your team",
    ],
    duration: "2–4 weeks, included with Enterprise plan",
  },
];

const APPROACH = [
  {
    n: "01",
    title: "We pick up the phone",
    body:
      "First call is free, 30 minutes. You describe your situation, we listen, we say what we can and can't help with. If we're not the right fit we'll tell you and recommend who is.",
  },
  {
    n: "02",
    title: "We propose a small first engagement",
    body:
      "Almost never an annual retainer to start. A scenario design, a single facilitated exercise, or an IBS register review — something concrete in 4–6 weeks.",
  },
  {
    n: "03",
    title: "We deliver, then we discuss",
    body:
      "After the first piece of work, we have an honest conversation about what's working, what isn't, and what the next 12 months could look like. No long-term commitment until you've seen us work.",
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-night-hero">
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Consulting</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          The people behind the platform, in your team
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-slate-300">
          SnapFix is half platform, half practice. The platform is the operating system; the
          consulting is the implementation, the operating model, and the regulator-ready output.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact?topic=consulting"
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Book a 30-min intro call
          </Link>
          <Link
            href="#services"
            className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.04]"
          >
            See what we do →
          </Link>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-xl font-semibold text-white">What we do</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {SERVICES.map((s) => (
            <li key={s.title} className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <s.icon size={22} className="text-indigo-300" />
              <h3 className="mt-3 text-base font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.pitch}</p>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Deliverables
              </div>
              <ul className="mt-1 space-y-0.5 text-xs text-slate-300">
                {s.deliverables.map((d) => (
                  <li key={d} className="flex gap-2">
                    <span className="text-indigo-300">·</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-[10px] uppercase tracking-wider text-slate-500">
                Typical effort
              </div>
              <div className="text-xs text-slate-400">{s.duration}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="text-xl font-semibold text-white">How we work</h2>
        <ol className="mt-6 space-y-3">
          {APPROACH.map((a) => (
            <li key={a.n} className="flex gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <div className="text-2xl font-bold text-indigo-300">{a.n}</div>
              <div>
                <h3 className="text-sm font-semibold text-white">{a.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{a.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8 rounded-lg border border-indigo-400/30 bg-indigo-500/[0.08] p-6 text-center">
          <p className="text-base text-white">
            <strong>Ready to talk?</strong> The first 30 minutes are free, no obligation.
          </p>
          <Link
            href="/contact?topic=consulting"
            className="mt-3 inline-block rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Book an intro call →
          </Link>
        </div>
      </section>
    </div>
  );
}
