import Link from "next/link";
import { Lock, Server, Database, KeyRound, Eye, ScrollText, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "Security — SnapFix",
  description:
    "How SnapFix protects your data: infrastructure posture, authentication, encryption, access control, audit logging, and our roadmap toward SOC 2.",
};

const NOW = [
  {
    icon: Server,
    title: "Hosted on UK-region infrastructure",
    body:
      "Application servers on Vercel (London region, lhr1). Database hosted on Neon in eu-west-2 (London). No data leaves the UK during normal operation.",
  },
  {
    icon: Database,
    title: "Encryption at rest and in transit",
    body:
      "TLS 1.2+ on every public endpoint. Database storage encrypted at rest by the cloud provider. Document blobs (Vercel Blob) encrypted at rest.",
  },
  {
    icon: KeyRound,
    title: "Authentication & password hygiene",
    body:
      "NextAuth credentials provider with bcrypt-hashed passwords (12 rounds). Sessions are JWT-based and signed. Email-based invitation flow with single-use, time-bound tokens.",
  },
  {
    icon: Lock,
    title: "Multi-tenant isolation",
    body:
      "Every business object carries an orgId; every database query is org-scoped at the API boundary. Role-based access (OWNER / ADMIN / MEMBER) gates write operations.",
  },
  {
    icon: Eye,
    title: "Audit log on material actions",
    body:
      "Scenario creation, exercise lifecycle transitions, member invitations and role changes, IBS approvals and incident decisions write to a per-org audit log retained for the life of the tenant.",
  },
  {
    icon: ScrollText,
    title: "Data minimisation by design",
    body:
      "We don't collect customer-personal data from your firm — exercises are run with your team members and synthetic scenarios. The platform doesn't need (or want) to know about your actual customers.",
  },
];

const ROADMAP = [
  { state: "in-flight", label: "SOC 2 Type 1 readiness (Q3 2026)", detail: "Tracking via Drata; controls library in place." },
  { state: "in-flight", label: "Vendor sub-processor register (Q2 2026)", detail: "Public list of all sub-processors with regions." },
  { state: "planned", label: "Single sign-on (SAML / OIDC) on Enterprise (Q3 2026)", detail: "Currently NextAuth credentials only." },
  { state: "planned", label: "Customer-managed encryption keys (Q4 2026)", detail: "For Enterprise plans with BYOK requirements." },
  { state: "planned", label: "Annual penetration test (Q3 2026)", detail: "External firm, report shareable under NDA." },
];

export default function SecurityPage() {
  return (
    <div className="bg-night-hero">
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Security</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Honest about where we are, transparent about where we're going
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-slate-300">
          SnapFix is a young platform built by people who've sat through enough supplier risk
          reviews to know what banks need. Here's our posture today — and the roadmap, dated.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-12">
        <h2 className="text-xl font-semibold text-white">Today</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Concrete controls, in production today. No future tense.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {NOW.map((n) => (
            <li
              key={n.title}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
            >
              <n.icon size={20} className="text-emerald-300" />
              <div className="mt-2 text-sm font-semibold text-white">{n.title}</div>
              <p className="mt-1 text-sm text-slate-400">{n.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-12">
        <h2 className="text-xl font-semibold text-white">Roadmap</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          What we're working on, and when. We won't claim certifications we don't have — but we
          will tell you when they'll land.
        </p>
        <ul className="mt-6 space-y-2">
          {ROADMAP.map((r) => (
            <li
              key={r.label}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm"
            >
              <div className="flex items-center gap-2">
                {r.state === "in-flight" ? (
                  <Clock size={16} className="text-amber-300" />
                ) : (
                  <CheckCircle2 size={16} className="text-slate-500" />
                )}
                <div>
                  <div className="font-semibold text-white">{r.label}</div>
                  <div className="text-xs text-slate-400">{r.detail}</div>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  r.state === "in-flight"
                    ? "bg-amber-500/15 text-amber-200"
                    : "bg-white/[0.05] text-slate-400"
                }`}
              >
                {r.state === "in-flight" ? "In flight" : "Planned"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-6 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Reporting a vulnerability</h3>
            <p className="mt-1 text-xs text-slate-400">
              Email <a href="mailto:security@snapfix.app" className="underline">security@snapfix.app</a>.
              We'll acknowledge within one working day.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Supplier-risk reviews</h3>
            <p className="mt-1 text-xs text-slate-400">
              For procurement questionnaires (SIG-Lite, BoE / FCA outsourcing forms), use the{" "}
              <Link href="/contact" className="underline">contact form</Link> and mention "supplier review".
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Legal & DPA</h3>
            <p className="mt-1 text-xs text-slate-400">
              <Link href="/legal/dpa" className="underline">Standard DPA</Link>,{" "}
              <Link href="/legal/privacy" className="underline">privacy notice</Link>,{" "}
              <Link href="/legal/terms" className="underline">terms</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
