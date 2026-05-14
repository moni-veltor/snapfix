import Link from "next/link";
import { BookOpen, FileText, ScrollText, Landmark, Sparkles, History, Compass } from "lucide-react";

export const metadata = {
  title: "Resources — SnapFix",
  description:
    "Guides, interactive tools, templates and a glossary for operational resilience teams. CMORG, PRA SS1/21, FCA SYSC 15A and BoE explained.",
};

const GUIDES = [
  {
    href: "/resources/guides/severity",
    title: "Classify incident severity in 60 seconds",
    pitch:
      "Walk through the five-dimension matrix (Financial · Customer · Data · Systems · Reputational) with the Consumer Duty and cyber-default-High overrides. Live calculator embedded.",
    badge: "Interactive",
    icon: Sparkles,
  },
  {
    href: "/resources/guides/invocation",
    title: "Should I invoke the IMT? A decision walker",
    pitch:
      "The hardest call in a real incident: stand up the IMT or wait. Step through the five trigger questions the IMP uses and get a recommendation with citations.",
    badge: "Interactive",
    icon: Compass,
  },
  {
    href: "/resources/guides/comms-cascade",
    title: "The communications cascade, visualised",
    pitch:
      "Employees BEFORE customers. Customers WITH third parties. Media WITH customers. See the order that policy requires and why getting it wrong escalates an incident.",
    badge: "Interactive",
    icon: BookOpen,
  },
  {
    href: "/resources/guides/cmorg",
    title: "CMORG Dynamic Scenario Library, decoded",
    pitch:
      "What the 14 CMORG scenarios are, what their MSEL events look like, and how to clone one into a usable in-house exercise.",
    icon: BookOpen,
  },
  {
    href: "/resources/guides/ibs",
    title: "Important Business Services — a methodology",
    pitch:
      "The six-dimension importance assessment, mapping resource dependencies, setting impact tolerances that won't embarrass you in a regulatory visit.",
    icon: BookOpen,
  },
  {
    href: "/resources/guides/ss121",
    title: "PRA SS1/21 readiness checklist",
    pitch:
      "Twelve questions the PRA expects you to answer before a supervisory visit. With evidence prompts you can drop into your control library.",
    icon: BookOpen,
  },
];

const HUBS = [
  {
    href: "/resources/glossary",
    icon: ScrollText,
    title: "Glossary",
    pitch: "60+ resilience terms — IMT, IRT, IBS, RTO, RPO, MTPD, CMORG and the rest — searchable.",
  },
  {
    href: "/resources/regulators",
    icon: Landmark,
    title: "Regulator reference",
    pitch:
      "PRA, FCA, BoE, ICO — what each one expects from you, with deep links into the original guidance.",
  },
  {
    href: "/resources/templates",
    icon: FileText,
    title: "Templates",
    pitch:
      "Generate an IBS register starter, a sitrep, an AAR scaffold — all in-browser, downloadable.",
  },
  {
    href: "/resources/changelog",
    icon: History,
    title: "Changelog",
    pitch: "What's shipped, what's next, what just changed in the platform.",
  },
];

export default function ResourcesHubPage() {
  return (
    <div className="bg-night-hero">
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
          Resources
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Operational resilience, made tangible
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-slate-300">
          Interactive guides, generators, and a reference library — written by the people who built
          the SnapFix simulator. No gating, no email walls.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HUBS.map((h) => (
            <Link
              key={h.href}
              href={h.href}
              className="group rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-indigo-400/40 hover:bg-white/[0.06]"
            >
              <h.icon size={20} className="text-indigo-300" />
              <div className="mt-2 text-sm font-semibold text-white group-hover:text-indigo-200">
                {h.title}
              </div>
              <p className="mt-1 text-xs text-slate-400">{h.pitch}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-white">Guides</h2>
          <span className="text-xs text-slate-400">
            {GUIDES.filter((g) => g.badge === "Interactive").length} interactive ·{" "}
            {GUIDES.length} total
          </span>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="group block h-full rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:border-indigo-400/40 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <g.icon size={20} className="text-indigo-300" />
                  {g.badge && (
                    <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-indigo-200">
                      {g.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold text-white group-hover:text-indigo-200">
                  {g.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400">{g.pitch}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
