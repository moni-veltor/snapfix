import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Inbox,
  Radio,
  Target,
} from "lucide-react";

export const metadata = { title: "Font preview — SnapFix" };

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--preview-space",
  weight: ["400", "500", "600", "700"],
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--preview-jb",
  weight: ["400", "500", "600"],
});

type Pairing = {
  id: "general-sans" | "space-grotesk" | "switzer";
  label: string;
  one: string;
  recommendation: string;
  sansFamily: string;
  monoFamily: string;
  /** Optional Fontshare CSS link href for the sans. */
  fontshareHref?: string;
};

const PAIRINGS: Pairing[] = [
  {
    id: "general-sans",
    label: "General Sans + JetBrains Mono",
    one: "Recommended",
    recommendation:
      "Premium-fintech feel without retro-future tilt. Closest to Brex / Mercury energy at zero cost.",
    sansFamily: '"General Sans", system-ui, sans-serif',
    monoFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontshareHref:
      "https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk + JetBrains Mono",
    one: "Most character",
    recommendation:
      "Distinctive numerals and lowercase g/a/y. Strongest identity — slight 'editorial' tilt for an evidence-pack tool.",
    sansFamily: '"Space Grotesk", system-ui, sans-serif',
    monoFamily: '"JetBrains Mono", ui-monospace, monospace',
  },
  {
    id: "switzer",
    label: "Switzer + JetBrains Mono",
    one: "Most institutional",
    recommendation:
      "Neo-grotesque, precise, austere. Reads as 'Big-4-built fintech' — the safest pick for regulator-facing surfaces.",
    sansFamily: '"Switzer", system-ui, sans-serif',
    monoFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontshareHref:
      "https://api.fontshare.com/v2/css?f[]=switzer@200,300,400,500,600,700&display=swap",
  },
];

export default function FontPreviewPage() {
  return (
    <div className={`${spaceGrotesk.variable} ${jetbrains.variable} min-h-screen bg-slate-50`}>
      {/* Load Fontshare-hosted fonts that next/font can't fetch. */}
      {PAIRINGS.filter((p) => p.fontshareHref).map((p) => (
        <link key={p.id} rel="stylesheet" href={p.fontshareHref} />
      ))}
      {/* Bring Space Grotesk + JetBrains Mono in by their literal family
          names so the dashboard slice can switch font-family inline. */}
      <style>
        {`
          :root {
            --preview-space-grotesk: var(--preview-space), system-ui, sans-serif;
            --preview-jb-mono: var(--preview-jb), ui-monospace, monospace;
          }
          .pv-section h1 { letter-spacing: -0.02em; }
          .pv-section .num { font-feature-settings: "tnum" 1, "ss01" 1; }
        `}
      </style>

      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Internal · Design review
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Font pairing preview
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Same dashboard slice rendered three times. Open this on the same screen you&apos;ll use
          to ship SnapFix and pick the one that feels right at your normal reading distance.
        </p>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        {PAIRINGS.map((p, idx) => (
          <DashboardSlice key={p.id} pairing={p} index={idx + 1} />
        ))}
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-5 text-xs text-slate-500">
        <p>
          Switzer + General Sans are served via Fontshare CDN; Space Grotesk + JetBrains Mono via{" "}
          <code>next/font/google</code> on this page only. None of this is wired into the production
          design system yet.
        </p>
      </footer>
    </div>
  );
}

function DashboardSlice({ pairing, index }: { pairing: Pairing; index: number }) {
  const style: React.CSSProperties = {
    fontFamily:
      pairing.id === "space-grotesk"
        ? "var(--preview-space-grotesk)"
        : pairing.sansFamily,
  };
  const monoStyle: React.CSSProperties = {
    fontFamily: "var(--preview-jb-mono)",
  };

  return (
    <section
      className="pv-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      style={style}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Option {index} · {pairing.one}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">{pairing.label}</p>
        </div>
        <p className="max-w-md text-right text-xs text-slate-500">{pairing.recommendation}</p>
      </div>

      <div className="space-y-6 p-6">
        {/* Page hero */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 via-indigo-50 to-cyan-50 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700">
            Dashboard · Wednesday 16 May
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Three exercises in the next 14 days.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-700">
            One ransomware tabletop, one severe-weather walkthrough, and the quarterly cyber
            recovery drill. Your CRO has 12 outstanding action items from the last run.
          </p>
        </div>

        {/* Status bar */}
        <div className="grid gap-3 md:grid-cols-4">
          <StatusTile
            icon={<Inbox size={14} />}
            label="Open action items"
            value="12"
            sub="across last 3 exercises"
            monoStyle={monoStyle}
          />
          <StatusTile
            icon={<Flame size={14} className="text-rose-600" />}
            label="Overdue"
            value="3"
            sub="oldest 42 days"
            monoStyle={monoStyle}
            tone="critical"
          />
          <StatusTile
            icon={<Clock size={14} />}
            label="Next exercise in"
            value="3d"
            sub="14 May · 14:00 BST"
            monoStyle={monoStyle}
            tone="warn"
          />
          <StatusTile
            icon={<Target size={14} />}
            label="Last performance"
            value="78"
            sub="out of 100"
            monoStyle={monoStyle}
          />
        </div>

        {/* Live exercise widget */}
        <div className="overflow-hidden rounded-xl border border-rose-300 bg-rose-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Your exercise is live
              </p>
              <h2 className="mt-2 text-xl font-semibold text-rose-900">
                Q2 Tier-1 cyber recovery drill
              </h2>
              <p className="mt-1 text-sm text-rose-800">
                Ransomware — payments rails · You&apos;re playing <span className="font-semibold">CRO</span>
              </p>
              <p
                className="mt-2 text-xs text-rose-700"
                style={monoStyle}
              >
                D-Day 02:47 · Severity HIGH · Inject #14 of 28
              </p>
            </div>
            <button className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
              <Radio size={14} />
              Join the war room
            </button>
          </div>
        </div>

        {/* Action items table */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">My action items</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Action</th>
                  <th className="px-4 py-2 text-left font-semibold">Priority</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-right font-semibold">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <ActionRow
                  title="Confirm OOH phone for IMT roster"
                  priority="CRITICAL"
                  status="OPEN"
                  due="2026-05-18"
                  monoStyle={monoStyle}
                />
                <ActionRow
                  title="Draft FCA Principle 11 notification template"
                  priority="HIGH"
                  status="IN_PROGRESS"
                  due="2026-05-20"
                  monoStyle={monoStyle}
                />
                <ActionRow
                  title="Re-run severity classification training"
                  priority="MEDIUM"
                  status="OPEN"
                  due="2026-06-01"
                  monoStyle={monoStyle}
                />
                <ActionRow
                  title="Q1 PIR — submit to ERCC"
                  priority="HIGH"
                  status="DONE"
                  due="2026-04-30"
                  monoStyle={monoStyle}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Number-heavy callout */}
        <div className="grid gap-3 md:grid-cols-3">
          <NumberBlock
            label="Time to invoke"
            value="18"
            unit="min"
            sub="target ≤ 15 · 1 band slip"
            monoStyle={monoStyle}
            tone="warn"
          />
          <NumberBlock
            label="Regulator clock"
            value="03:17:42"
            unit="left"
            sub="FCA Principle 11 · 4h"
            monoStyle={monoStyle}
            tone="critical"
          />
          <NumberBlock
            label="Read coverage"
            value="92"
            unit="%"
            sub="addressed messages opened"
            monoStyle={monoStyle}
            tone="ok"
          />
        </div>

        {/* Alphabet specimen so you can see the actual character set */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-slate-700">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Specimen
          </p>
          <p className="mt-2 text-lg">
            The quick brown fox jumps over the lazy dog · 0123456789
          </p>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-semibold">Bold·Semibold·Medium·Regular</span> · Numerals
            distinct: 0 O · 1 l I · 6 8 9
          </p>
          <p className="mt-2 text-xs text-slate-500" style={monoStyle}>
            mono · 02:47 · D-Day · #INC-2026-014 · CRITICAL_ALERT
          </p>
        </div>
      </div>
    </section>
  );
}

function StatusTile({
  icon,
  label,
  value,
  sub,
  monoStyle,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  monoStyle: React.CSSProperties;
  tone?: "neutral" | "warn" | "critical";
}) {
  const valueColor =
    tone === "critical" ? "text-rose-600" : tone === "warn" ? "text-amber-700" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <div className={`num mt-1 text-3xl font-semibold ${valueColor}`} style={monoStyle}>
        {value}
      </div>
      <div className="text-[11px] text-slate-500">{sub}</div>
    </div>
  );
}

const PRIORITY_TONE: Record<string, string> = {
  CRITICAL: "bg-rose-100 text-rose-800",
  HIGH: "bg-amber-100 text-amber-800",
  MEDIUM: "bg-cyan-100 text-cyan-800",
};
const STATUS_TONE: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-cyan-100 text-cyan-800",
  DONE: "bg-emerald-100 text-emerald-800",
};

function ActionRow({
  title,
  priority,
  status,
  due,
  monoStyle,
}: {
  title: string;
  priority: string;
  status: string;
  due: string;
  monoStyle: React.CSSProperties;
}) {
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-4 py-2 text-slate-900">{title}</td>
      <td className="px-4 py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${PRIORITY_TONE[priority]}`}
        >
          {priority}
        </span>
      </td>
      <td className="px-4 py-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_TONE[status]}`}
        >
          {status === "DONE" && <CheckCircle2 size={10} />}
          {status === "OPEN" && <AlertTriangle size={10} />}
          {status.replace("_", " ")}
        </span>
      </td>
      <td className="px-4 py-2 text-right text-slate-700" style={monoStyle}>
        {due}
      </td>
    </tr>
  );
}

function NumberBlock({
  label,
  value,
  unit,
  sub,
  monoStyle,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  sub: string;
  monoStyle: React.CSSProperties;
  tone: "ok" | "warn" | "critical";
}) {
  const valueColor =
    tone === "critical"
      ? "text-rose-600"
      : tone === "warn"
        ? "text-amber-700"
        : "text-emerald-700";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`num mt-2 text-4xl font-semibold ${valueColor}`} style={monoStyle}>
        {value}
        <span className="ml-1 text-base font-medium text-slate-500">{unit}</span>
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}
