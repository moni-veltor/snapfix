import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  FilePen,
  FileSearch,
  HandshakeIcon,
  MessageSquare,
  Network,
  Phone,
  Sparkles,
  UserCircle2,
  Users,
  XCircle,
} from "lucide-react";

export const metadata = {
  title: "Consulting — SnapFix",
  description:
    "Annual scenario design, exercise facilitation, regulator-ready reporting, IBS coaching, and bespoke playbook builds for banks and fintechs.",
};

// ────────────────────────────────────────────────────────────────────────────
// TODO(team): replace the placeholder consultant entries below with real
// names, real bios, and real headshot URLs once the team page assets are
// ready. The page is laid out for 1–3 cards; add or remove as needed.
// ────────────────────────────────────────────────────────────────────────────
const TEAM = [
  {
    name: "Monica Velasquez",
    title: "Founder & Principal Consultant",
    bio: "Built SnapFix after a decade running operational-resilience programmes at UK challenger banks and fintechs. Specialises in turning regulator-facing documents into exercises your team will actually want to run.",
    specialism: "Operational resilience · IBS methodology · regulator engagement",
    photoUrl: null as string | null,
  },
];

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

// ────────────────────────────────────────────────────────────────────────────
// TODO(case-studies): these are illustrative engagement shapes — anonymised
// but credible. Replace with real engagements (still anonymised) once you've
// completed enough work to draw from. Each bullet should describe a *firm
// type + outcome* without identifying details.
// ────────────────────────────────────────────────────────────────────────────
const CASES = [
  {
    firmType: "Tier-2 UK challenger bank",
    engagement: "Quarterly exercise programme covering 12 IBSs",
    outcome:
      "Identified 7 action items the supervisor flagged at the next visit — all closed before the SS1/21 self-assessment was due.",
  },
  {
    firmType: "Tier-3 payments fintech",
    engagement: "IBS register overhaul + tolerance defensibility memo",
    outcome:
      "Cut a 47-IBS register down to 9 defensible ones with documented PRA tolerances — passed Section 166 review with no remediation actions.",
  },
  {
    firmType: "EU fintech under DORA",
    engagement: "Third-party concentration playbook + facilitated cyber exercise",
    outcome:
      "Surfaced two unmonitored 4th-party dependencies in the hyperscaler chain — used at the next supervisory dialogue as evidence of mature ICT-risk practice.",
  },
];

const PHASES = [
  {
    n: "01",
    icon: Phone,
    duration: "Week 0 · 30 min",
    title: "We pick up the phone",
    body:
      "First call is free. You describe your situation, we listen, we say what we can and can't help with. If we're not the right fit we'll tell you and recommend who is.",
  },
  {
    n: "02",
    icon: HandshakeIcon,
    duration: "Weeks 1–6 · scoped",
    title: "We propose a small first engagement",
    body:
      "Almost never an annual retainer to start. A scenario design, a single facilitated exercise, or an IBS register review — something concrete in 4–6 weeks.",
  },
  {
    n: "03",
    icon: MessageSquare,
    duration: "Quarter 2 onwards",
    title: "We deliver, then we discuss",
    body:
      "After the first piece of work, an honest conversation about what's working, what isn't, and what the next 12 months could look like. No long-term commitment until you've seen us work.",
  },
];

const FIT_GOOD = [
  "UK bank or building society (Tier 1, 2, or 3) with PRA / FCA supervision",
  "FCA-permitted fintech, e-money or payments firm",
  "EU credit institution, fintech, or FMI under DORA",
  "UK or EU FMI / payment scheme with BoE supervisory engagement",
  "Firm preparing for a Section 166 or supervisory deep-dive",
];

const FIT_NOT = [
  "Pure crypto businesses with no UK or EU regulated permission",
  "US-only payment processors with no European regulatory exposure",
  "Firms looking for a tick-box self-assessment without exercise work",
];

const FAQS = [
  {
    q: "What's the minimum engagement?",
    a: "Two days of consulting time, typically delivered as a single scenario design or a half-day IBS materiality workshop. We don't have a minimum retainer.",
  },
  {
    q: "How do you charge?",
    a: "Day-rate for one-off work. Monthly retainer for ongoing engagements (annual scenario programme, ongoing facilitation, IBS register stewardship). We don't quote fixed-bid because resilience scope drifts in ways that punish fixed-bid contracts — both ways. We quote in writing after the intro call.",
  },
  {
    q: "Will you sign an NDA before we start talking?",
    a: "Yes, gladly. Send us yours or we'll send ours. We have mutual NDAs with every active customer.",
  },
  {
    q: "Where do you work? Remote or on-site?",
    a: "Most workshops are hybrid — 1 day on-site for the kick-off and the live exercise, the rest of the work remote. We're UK-based (London) and travel for tier-1 engagements across the UK + EU.",
  },
  {
    q: "Do you sub-contract any of the work?",
    a: "No. The named consultant on the engagement letter is the consultant who does the work. We don't have a delivery layer between you and us.",
  },
  {
    q: "What's your insurance position?",
    a: "Professional indemnity cover at £2m per claim, public liability at £5m. Certificates available on request before contract signature.",
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-night-hero">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
          Consulting
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          The people behind the platform, in your team
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-slate-300">
          SnapFix is half platform, half practice. The platform is the operating system; the
          consulting is the implementation, the operating model, and the regulator-ready output.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact?interest=consulting"
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

      {/* Meet the team */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold text-white">Meet the team</h2>
          <p className="text-xs text-slate-400">
            One named consultant per engagement — never a delivery layer between you and the work.
          </p>
        </header>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((t) => (
            <li
              key={t.name}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-start gap-3">
                {t.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.photoUrl}
                    alt={`${t.name} headshot`}
                    className="h-12 w-12 shrink-0 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                    <UserCircle2 size={28} className="text-indigo-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-base font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-indigo-300">{t.title}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-300">{t.bio}</p>
              <p className="mt-3 text-[11px] text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-slate-400">
                  Specialism ·
                </span>{" "}
                {t.specialism}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* What we do */}
      <section id="services" className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-xl font-semibold text-white">What we do</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {SERVICES.map((s) => (
            <li
              key={s.title}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-6"
            >
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

      {/* Recent engagements */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold text-white">Recent engagements</h2>
          <p className="text-xs text-slate-400">Anonymised — every customer has an NDA</p>
        </header>
        <ul className="grid gap-3 md:grid-cols-3">
          {CASES.map((c) => (
            <li
              key={c.engagement}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                {c.firmType}
              </p>
              <p className="mt-1 text-sm font-medium text-white">{c.engagement}</p>
              <p className="mt-2 text-sm text-slate-400">{c.outcome}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How we work — 3-phase visual timeline */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-xl font-semibold text-white">How we work</h2>
        <p className="mt-1 text-sm text-slate-400">Three phases. No surprise commitments.</p>
        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {PHASES.map((p, idx) => (
            <li
              key={p.n}
              className="relative rounded-lg border border-white/10 bg-white/[0.03] p-5"
            >
              {/* connector arrow on desktop */}
              {idx < PHASES.length - 1 && (
                <ArrowRight
                  size={16}
                  className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 text-indigo-300/60 md:block"
                  aria-hidden
                />
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-2xl font-bold text-indigo-300/80">{p.n}</span>
                <p.icon size={18} className="text-indigo-300" />
              </div>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-200">
                <Clock size={10} aria-hidden />
                {p.duration}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">{p.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Is this for you? */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-xl font-semibold text-white">Is this for you?</h2>
        <p className="mt-1 text-sm text-slate-400">
          Saying no early is part of our value. Here&apos;s where we&apos;re strongest — and
          where you&apos;ll get better help elsewhere.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.05] p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <CheckCircle2 size={16} />
              Great fit if you&apos;re…
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {FIT_GOOD.map((line) => (
                <li key={line} className="flex gap-2">
                  <CheckCircle2
                    size={14}
                    className="mt-0.5 shrink-0 text-emerald-300"
                    aria-hidden
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-rose-400/20 bg-rose-500/[0.05] p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-200">
              <XCircle size={16} />
              Probably not the right fit if…
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {FIT_NOT.map((line) => (
                <li key={line} className="flex gap-2">
                  <XCircle
                    size={14}
                    className="mt-0.5 shrink-0 text-rose-300"
                    aria-hidden
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] text-slate-400">
              Not sure?{" "}
              <Link href="/contact?interest=consulting" className="text-rose-200 underline">
                Ask anyway
              </Link>
              {" "}— we&apos;ll tell you honestly and (where useful) introduce you to someone
              better suited.
            </p>
          </div>
        </div>
      </section>

      {/* Procurement FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <h2 className="text-xl font-semibold text-white">Procurement questions we always get</h2>
        <p className="mt-1 text-sm text-slate-400">
          If procurement is going to ask, the answer is probably here. Anything else — book the
          call.
        </p>
        <ul className="mt-6 space-y-2">
          {FAQS.map((f) => (
            <li key={f.q}>
              <details className="group rounded-lg border border-white/10 bg-white/[0.03] p-4 open:bg-white/[0.05]">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-white">
                  <span>{f.q}</span>
                  <span className="text-xs text-indigo-300 transition group-open:rotate-90" aria-hidden>
                    ›
                  </span>
                </summary>
                <p className="mt-2 text-sm text-slate-300">{f.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="rounded-lg border border-indigo-400/30 bg-indigo-500/[0.08] p-6 text-center">
          <p className="text-base text-white">
            <strong>Ready to talk?</strong> The first 30 minutes are free, no obligation.
          </p>
          <Link
            href="/contact?interest=consulting"
            className="mt-3 inline-block rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Book an intro call →
          </Link>
        </div>
      </section>
    </div>
  );
}
