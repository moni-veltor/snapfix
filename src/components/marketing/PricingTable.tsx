"use client";

import { useState } from "react";
import Link from "next/link";

type Plan = {
  key: "free" | "starter" | "growth" | "enterprise";
  name: string;
  monthly: number | null;
  annual: number | null;
  cadenceLabel: string;
  description: string;
  highlight?: boolean;
  cta: string;
  href: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    key: "free",
    name: "Free",
    monthly: 0,
    annual: 0,
    cadenceLabel: "forever",
    description: "Try the full Simulator with a small team.",
    features: [
      "Up to 5 members",
      "2 exercises per year",
      "5 custom scenarios",
      "Full CMORG Library access",
      "Inbox + addressed events",
    ],
    cta: "Get started free",
    href: "/sign-up",
  },
  {
    key: "starter",
    name: "Starter",
    monthly: 99,
    annual: 79,
    cadenceLabel: "per month",
    description: "Run a quarterly resilience programme with the right team.",
    features: [
      "Up to 25 members",
      "12 exercises per year",
      "Unlimited custom scenarios",
      "Org IBS register",
      "Action-item tracker",
      "Audit log",
      "AAR export (PDF / DOCX)",
    ],
    cta: "Start 14-day trial",
    href: "/contact?plan=starter",
  },
  {
    key: "growth",
    name: "Growth",
    monthly: 299,
    annual: 239,
    cadenceLabel: "per month",
    highlight: true,
    description: "For Tier 2 and ambitious Tier 3 firms — the full platform.",
    features: [
      "Up to 100 members",
      "Unlimited exercises",
      "Coverage analytics + heatmap",
      "Calendar view",
      "Priority email support",
      "Onboarding session",
      "Custom branding (logo)",
    ],
    cta: "Start 14-day trial",
    href: "/contact?plan=growth",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthly: null,
    annual: null,
    cadenceLabel: "",
    description: "For Tier 1 banks and regulated FMIs. We work to your standards.",
    features: [
      "Unlimited members",
      "Unlimited everything",
      "SSO / SAML",
      "DPA + bespoke security review",
      "Dedicated Customer Success",
      "Consulting bundle (annual review, scenario design)",
      "SLA-backed support",
    ],
    cta: "Talk to sales",
    href: "/contact?plan=enterprise",
  },
];

type Group = {
  category: string;
  rows: { label: string; values: Record<Plan["key"], string | boolean> }[];
};

const MATRIX: Group[] = [
  {
    category: "Usage",
    rows: [
      { label: "Members", values: { free: "5", starter: "25", growth: "100", enterprise: "Unlimited" } },
      {
        label: "Exercises per year",
        values: { free: "2", starter: "12", growth: "Unlimited", enterprise: "Unlimited" },
      },
      {
        label: "Custom scenarios",
        values: { free: "5", starter: "Unlimited", growth: "Unlimited", enterprise: "Unlimited" },
      },
    ],
  },
  {
    category: "Resilience",
    rows: [
      { label: "CMORG Library (14 scenarios)", values: { free: true, starter: true, growth: true, enterprise: true } },
      { label: "Tier-specific scenarios (12)", values: { free: true, starter: true, growth: true, enterprise: true } },
      { label: "Addressed inbox + comms cascade", values: { free: true, starter: true, growth: true, enterprise: true } },
      { label: "Severity matrix + closure gate", values: { free: true, starter: true, growth: true, enterprise: true } },
      { label: "Regulator clocks (FCA / PRA / ICO)", values: { free: true, starter: true, growth: true, enterprise: true } },
      { label: "IBS register (org-level)", values: { free: false, starter: true, growth: true, enterprise: true } },
      { label: "Critical third-party vendor register", values: { free: false, starter: true, growth: true, enterprise: true } },
      { label: "Coverage analytics + heatmap", values: { free: false, starter: false, growth: true, enterprise: true } },
      { label: "Action-item tracker", values: { free: false, starter: true, growth: true, enterprise: true } },
    ],
  },
  {
    category: "Reporting",
    rows: [
      { label: "After-Action Report", values: { free: true, starter: true, growth: true, enterprise: true } },
      { label: "Post-Incident Report (8-section)", values: { free: false, starter: true, growth: true, enterprise: true } },
      { label: "AAR/PIR export (PDF / DOCX)", values: { free: false, starter: true, growth: true, enterprise: true } },
      { label: "Audit log", values: { free: false, starter: true, growth: true, enterprise: true } },
    ],
  },
  {
    category: "Security & access",
    rows: [
      { label: "Role-based access (OWNER / ADMIN / MEMBER)", values: { free: true, starter: true, growth: true, enterprise: true } },
      { label: "Custom branding (logo)", values: { free: false, starter: false, growth: true, enterprise: true } },
      { label: "SSO / SAML", values: { free: false, starter: false, growth: false, enterprise: true } },
      { label: "DPA + bespoke security review", values: { free: false, starter: false, growth: false, enterprise: true } },
      { label: "UK data residency", values: { free: true, starter: true, growth: true, enterprise: true } },
    ],
  },
  {
    category: "Support & services",
    rows: [
      { label: "Email support", values: { free: "Community", starter: "Standard", growth: "Priority", enterprise: "Priority + phone" } },
      { label: "Onboarding session", values: { free: false, starter: false, growth: true, enterprise: true } },
      { label: "Dedicated Customer Success", values: { free: false, starter: false, growth: false, enterprise: true } },
      { label: "Consulting bundle (scenario design, facilitation)", values: { free: false, starter: false, growth: false, enterprise: true } },
      { label: "SLA-backed support", values: { free: false, starter: false, growth: false, enterprise: true } },
    ],
  },
];

export default function PricingTable() {
  const [cadence, setCadence] = useState<"monthly" | "annual">("annual");

  return (
    <div className="space-y-12">
      <div className="mx-auto flex max-w-md items-center rounded-full border border-white/10 bg-white/[0.04] p-1">
        {(["monthly", "annual"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCadence(c)}
            className={`flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              cadence === c ? "bg-indigo-500 text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            {c === "monthly" ? "Monthly" : "Annual"}
            {c === "annual" && (
              <span className="ml-2 rounded-full bg-emerald-500/30 px-1.5 py-0.5 text-[10px] text-emerald-100">
                –20%
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => (
          <div
            key={p.key}
            className={`relative flex flex-col rounded-xl border p-6 ${
              p.highlight
                ? "border-indigo-400/60 bg-[color:var(--night-surface-elev)] shadow-[0_0_48px_-12px_rgba(99,102,241,0.4)]"
                : "border-white/[0.08] bg-[color:var(--night-surface)]"
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-6 rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-medium text-white">
                Most popular
              </span>
            )}
            <div>
              <h2 className="text-base font-semibold text-white">{p.name}</h2>
              <p className="mt-1 min-h-[2.5rem] text-sm text-slate-400">{p.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                {p.monthly === null ? (
                  <span className="text-3xl font-semibold text-white">Custom</span>
                ) : (
                  <>
                    <span className="text-3xl font-semibold text-white">
                      £{cadence === "annual" ? p.annual : p.monthly}
                    </span>
                    {p.cadenceLabel && (
                      <span className="text-sm text-slate-500">/ {p.cadenceLabel}</span>
                    )}
                  </>
                )}
              </div>
              {cadence === "annual" && p.monthly !== null && p.monthly > 0 && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Billed annually at £{(p.annual ?? 0) * 12}/yr · save £{(p.monthly - (p.annual ?? 0)) * 12}/yr
                </p>
              )}
            </div>
            <ul className="mt-6 flex-1 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
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
                  <span className="text-slate-300">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={p.href}
              className={`mt-6 block rounded-md px-4 py-2 text-center text-sm font-medium ${
                p.highlight
                  ? "bg-indigo-500 text-white hover:bg-indigo-400"
                  : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
              }`}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Compare plans</h2>
        <p className="mt-2 text-sm text-slate-400">
          Everything in every tier, side by side.
        </p>
        <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-300">&nbsp;</th>
                {PLANS.map((p) => (
                  <th
                    key={p.key}
                    className={`px-4 py-3 text-left font-semibold ${
                      p.highlight ? "text-indigo-200" : "text-white"
                    }`}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((g) => (
                <>
                  <tr key={g.category} className="bg-white/[0.02]">
                    <th
                      colSpan={5}
                      className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {g.category}
                    </th>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label} className="border-t border-white/5">
                      <td className="px-4 py-2 text-slate-300">{r.label}</td>
                      {PLANS.map((p) => (
                        <td key={p.key} className="px-4 py-2">
                          <Cell value={r.values[p.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M16.704 5.296a1 1 0 010 1.408l-7.5 7.5a1 1 0 01-1.408 0l-3.5-3.5a1 1 0 011.408-1.408L8.5 12.092l6.796-6.796a1 1 0 011.408 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (value === false) {
    return <span className="text-muted">—</span>;
  }
  return <span className="text-slate-300">{value}</span>;
}
