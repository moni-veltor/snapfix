import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import AccessForm from "./AccessForm";

export const metadata: Metadata = {
  title: "SnapFix — Access required",
  description: "Private beta. Enter the access code to continue.",
  robots: { index: false, follow: false },
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const safeFrom = typeof from === "string" && from.startsWith("/") ? from : "/";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--night-base)] text-slate-200">
      {/* ─── Ambient aurora — three soft radial glows layered, pure CSS ─── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(60rem 40rem at 15% -10%, rgba(99,102,241,0.35), transparent 60%),
            radial-gradient(50rem 35rem at 95% 110%, rgba(34,211,238,0.22), transparent 55%),
            radial-gradient(45rem 30rem at 50% 50%, rgba(124,58,237,0.18), transparent 60%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ─── Minimal nav ────────────────────────────────────────────────── */}
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2.5">
          <Logo size={28} tone="light" />
          <span className="text-base font-semibold tracking-tight text-white">SnapFix</span>
        </div>
        <a
          href="mailto:hello@snapfix.app?subject=SnapFix%20access%20request"
          className="rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
        >
          Request access
        </a>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-3xl flex-col items-center justify-center px-6 pb-16 pt-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-300 shadow-[0_0_10px_2px_rgba(165,180,252,0.7)]" />
          Private beta
        </span>

        <h1
          className="mt-7 text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl"
          style={{ fontFamily: "var(--font-display-primary), system-ui, sans-serif" }}
        >
          Practise the
          <br />
          disruptions{" "}
          <span className="bg-gradient-to-br from-indigo-200 via-violet-200 to-cyan-200 bg-clip-text text-transparent">
            that matter.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-base text-slate-400 sm:text-lg">
          SnapFix is invite-only while we work with our first design partners.
          Enter the code you were given to continue — your sign-in still happens
          on the next screen.
        </p>

        <div className="mt-10 w-full max-w-md">
          <AccessForm from={safeFrom} />
        </div>

        <p className="mt-10 text-[11px] uppercase tracking-[0.2em] text-slate-600">
          Operational-resilience exercises · run real
        </p>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 pb-6 text-[11px] text-slate-600">
        <span>© {new Date().getFullYear()} SnapFix</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_1px_rgba(74,222,128,0.6)]" />
          All systems operational
        </span>
      </footer>
    </main>
  );
}
