import Link from "next/link";

export const metadata = {
  title: "Changelog — SnapFix Resources",
  description: "What's shipped, what's next, what just changed in the SnapFix platform.",
};

type Entry = {
  date: string;
  title: string;
  body: string;
  tags?: string[];
};

const CHANGELOG: Entry[] = [
  {
    date: "2026-05-13",
    title: "Marketing site: Resources hub launched",
    body:
      "A new /resources hub with interactive guides (severity calculator, comms cascade visualizer, IMT invocation decision walker), a searchable glossary of 30+ terms, a regulator reference for PRA/FCA/BoE/ICO, and a templates section that generates IBS register CSV, sitrep markdown and AAR markdown right in the browser.",
    tags: ["Marketing", "Resources"],
  },
  {
    date: "2026-05-12",
    title: "Design system + dark war-room theme",
    body:
      "Three-color semantic palette (rose/amber/emerald), shared Pill/Section/Button/Countdown/PolicyHint primitives, two-column rail layout on /exercises/[id]/live, persistent dark-mode toggle in the sidebar.",
    tags: ["Design", "App"],
  },
  {
    date: "2026-05-12",
    title: "Policy-aligned incident management",
    body:
      "Six new feature epics mirroring Afin's IMP / ORP / BCP: incident invocation + 5-dimension severity, two-tier team mobilisation with deputy chain, structured decision log + sitreps + IMT meetings, regulator clocks (FCA/PRA 4h, ICO 72h, closure 2 business days), BCP activation as a joint CEO+CRO decision, critical-third-party register, five-criterion closure gate with Post-Incident Report and retrospective.",
    tags: ["App", "Schema"],
  },
  {
    date: "2026-05-12",
    title: "Live participant war-room workspace",
    body:
      "A unified /exercises/[id]/live page combining the addressed inbox, the live team feed, presence with last-seen indicators, the D-Day clock, and inline quick-capture for log entries and comms drafts. Auto-refreshes every 3s while an exercise is IN_PROGRESS.",
    tags: ["App"],
  },
  {
    date: "2026-05-10",
    title: "Multi-tenant Organization model",
    body:
      "Org-level IBS register, exercise lifecycle (PLANNING → READY → IN_PROGRESS → PAUSED → COMPLETED), role-based access (OWNER/ADMIN/MEMBER), invitation flow with Resend email, audit log, document library on Vercel Blob.",
    tags: ["Schema", "App"],
  },
  {
    date: "2026-05-09",
    title: "26-scenario library",
    body:
      "Full CMORG Dynamic Scenario Library (14 scenarios) plus 12 tier-specific scenarios for Tier 1 / Tier 2 / Tier 3 banks. Each scenario carries its MSEL events, addressed injects, debrief questions and the 6-box risk-coverage matrix.",
    tags: ["Content"],
  },
];

export default function ChangelogPage() {
  return (
    <div className="bg-night-hero">
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-8">
        <Link href="/resources" className="text-xs text-slate-400 hover:text-slate-200">
          ← Resources
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Changelog
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-300">
          What's shipped recently. Updated when material changes hit production.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <ol className="space-y-6 border-l border-white/10 pl-6">
          {CHANGELOG.map((e, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[31px] top-2 h-2.5 w-2.5 rounded-full bg-indigo-400 ring-4 ring-[color:var(--night-base)]" />
              <div className="text-xs text-slate-500">{e.date}</div>
              <h2 className="mt-1 text-lg font-semibold text-white">{e.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{e.body}</p>
              {e.tags && e.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {e.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
