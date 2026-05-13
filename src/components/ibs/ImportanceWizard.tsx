"use client";

import { useState } from "react";

type RatedLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Level = "" | RatedLevel;

type Dim = {
  key:
    | "impactCustomerFinancial"
    | "impactVulnerableCustomer"
    | "impactLossOfLicense"
    | "impactRegulatoryFine"
    | "impactReputational"
    | "impactLossOfCapital";
  label: string;
  why: string;
  thresholds: { CRITICAL: string; HIGH: string; MEDIUM: string; LOW: string };
};

const DIMENSIONS: Dim[] = [
  {
    key: "impactCustomerFinancial",
    label: "Customer financial loss",
    why:
      "Direct out-of-pocket loss to customers if the service is disrupted. Higher means more customer-visible harm.",
    thresholds: {
      CRITICAL: ">£10m cumulative customer loss",
      HIGH: ">£2m cumulative customer loss",
      MEDIUM: "£500k – £2m",
      LOW: "<£500k",
    },
  },
  {
    key: "impactVulnerableCustomer",
    label: "Vulnerable customer impact",
    why:
      "Disproportionate harm to customers in vulnerable circumstances. Consumer Duty makes this load-bearing — material vulnerable-customer impact promotes to High.",
    thresholds: {
      CRITICAL: "Severe harm to vulnerable customers (loss of access to funds/support)",
      HIGH: "Material disruption to vulnerable customers, including any safeguarding event",
      MEDIUM: "Vulnerable customers affected but with workarounds",
      LOW: "Minimal vulnerable-customer impact",
    },
  },
  {
    key: "impactLossOfLicense",
    label: "Loss of licence risk",
    why:
      "Could this disruption lead to regulatory enforcement, permission variation, or licence revocation? Affects firm viability.",
    thresholds: {
      CRITICAL: "Plausible Section 166 or licence variation in 12 months",
      HIGH: "Material regulatory action probable",
      MEDIUM: "Adverse supervisory commentary likely",
      LOW: "No regulatory enforcement risk anticipated",
    },
  },
  {
    key: "impactRegulatoryFine",
    label: "Regulatory fine risk",
    why:
      "Likely range of fines under PRA / FCA / ICO. Fine sizing depends on revenues, breach scope and prior conduct.",
    thresholds: {
      CRITICAL: ">£5m fine plausible",
      HIGH: ">£1m fine plausible",
      MEDIUM: "Fine probable but ≤ £1m",
      LOW: "Public censure only",
    },
  },
  {
    key: "impactReputational",
    label: "Reputational impact",
    why:
      "Media coverage, social-media velocity, peer commentary. Often the longest-lasting harm — fine money is recoverable, brand isn't.",
    thresholds: {
      CRITICAL: "Sustained national-press coverage; lasting brand damage",
      HIGH: "Widespread media; #SnapFixDown-type social trending",
      MEDIUM: "Targeted media; vocal customer-influencers",
      LOW: "Niche / trade press only",
    },
  },
  {
    key: "impactLossOfCapital",
    label: "Loss of capital risk",
    why:
      "Capital impact and proximity to regulatory minimum. Material capital erosion compounds every other risk dimension.",
    thresholds: {
      CRITICAL: "Capital impact pushes firm within 10% of regulatory minimum",
      HIGH: "Material capital impact",
      MEDIUM: "Capital impact within risk appetite",
      LOW: "No material capital impact",
    },
  },
];

const RANK: Record<RatedLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
const LEVEL_LABEL: Record<RatedLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

type Props = {
  existing?: Partial<Record<Dim["key"], Level | null>>;
};

export default function ImportanceWizard({ existing }: Props) {
  const [values, setValues] = useState<Record<Dim["key"], Level>>({
    impactCustomerFinancial: existing?.impactCustomerFinancial ?? "",
    impactVulnerableCustomer: existing?.impactVulnerableCustomer ?? "",
    impactLossOfLicense: existing?.impactLossOfLicense ?? "",
    impactRegulatoryFine: existing?.impactRegulatoryFine ?? "",
    impactReputational: existing?.impactReputational ?? "",
    impactLossOfCapital: existing?.impactLossOfCapital ?? "",
  });

  const set = (k: Dim["key"], v: Level) =>
    setValues((prev) => ({ ...prev, [k]: prev[k] === v ? "" : v }));

  const filled = Object.values(values).filter(Boolean).length;
  const highest = Object.values(values)
    .filter(Boolean)
    .reduce<number>((max, v) => Math.max(max, RANK[v as RatedLevel]), 0);
  const overall =
    highest === 4 ? "CRITICAL" : highest === 3 ? "HIGH" : highest === 2 ? "MEDIUM" : highest === 1 ? "LOW" : null;

  const completeness = Math.round((filled / DIMENSIONS.length) * 100);
  const defensibilityNotes: string[] = [];
  if (filled < DIMENSIONS.length)
    defensibilityNotes.push(
      `${DIMENSIONS.length - filled} of ${DIMENSIONS.length} dimensions not yet assessed.`,
    );
  if (values.impactVulnerableCustomer === "" || values.impactVulnerableCustomer === "LOW")
    defensibilityNotes.push(
      "Vulnerable-customer impact looks low or unassessed — Consumer Duty supervisors will probe this.",
    );
  if (overall === "CRITICAL" && filled < DIMENSIONS.length)
    defensibilityNotes.push(
      "Overall is Critical — make sure all six dimensions are explicitly assessed to defend the score.",
    );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        {DIMENSIONS.map((d) => (
          <div key={d.key} className="rounded-md border border-line bg-surface-1 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-sm font-semibold text-ink">{d.label}</h4>
              {values[d.key] && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${LEVEL_BADGE[values[d.key] as RatedLevel]}`}
                >
                  {LEVEL_LABEL[values[d.key] as RatedLevel]}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">{d.why}</p>
            <input type="hidden" name={d.key} value={values[d.key]} />
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((lvl) => {
                const active = values[d.key] === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => set(d.key, lvl)}
                    className={`rounded-md border px-2 py-2 text-left text-[11px] transition ${
                      active ? LEVEL_ACTIVE[lvl] : "border-line bg-surface-0 text-muted hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <div className={`font-semibold ${active ? "" : LEVEL_HINT[lvl]}`}>
                      {LEVEL_LABEL[lvl]}
                    </div>
                    <div className="mt-0.5 text-[10px] opacity-80">{d.thresholds[lvl]}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-md border border-line bg-surface-1 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Defensibility
          </h4>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted">Completeness</span>
              <span className="text-sm font-semibold text-ink">{completeness}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full transition-all ${completeness === 100 ? "bg-emerald-500" : completeness >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs text-muted">Overall importance</div>
            <div className="mt-1">
              {overall ? (
                <span
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-semibold ${LEVEL_BADGE[overall as RatedLevel]}`}
                >
                  {LEVEL_LABEL[overall as RatedLevel]}
                </span>
              ) : (
                <span className="text-sm text-soft">Not yet assessed</span>
              )}
              <p className="mt-1 text-[10px] text-soft">
                Highest of the six dimensions
              </p>
            </div>
          </div>
          {defensibilityNotes.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-[11px] text-muted">
              {defensibilityNotes.map((n, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-amber-500">·</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}
          {defensibilityNotes.length === 0 && filled === DIMENSIONS.length && (
            <p className="mt-4 rounded-md bg-emerald-500/10 px-2 py-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
              ✓ All six dimensions assessed. Tolerance defensibility solid.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

const LEVEL_BADGE: Record<RatedLevel, string> = {
  LOW: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  HIGH: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  CRITICAL: "bg-rose-600 text-white",
};

const LEVEL_ACTIVE: Record<RatedLevel, string> = {
  LOW: "border-emerald-400 bg-emerald-500/20 text-emerald-700 dark:text-emerald-100",
  MEDIUM: "border-amber-400 bg-amber-500/20 text-amber-700 dark:text-amber-100",
  HIGH: "border-rose-400 bg-rose-500/20 text-rose-700 dark:text-rose-100",
  CRITICAL: "border-rose-500 bg-rose-600/30 text-rose-800 dark:text-rose-100",
};

const LEVEL_HINT: Record<RatedLevel, string> = {
  LOW: "text-emerald-600 dark:text-emerald-400",
  MEDIUM: "text-amber-600 dark:text-amber-400",
  HIGH: "text-rose-600 dark:text-rose-400",
  CRITICAL: "text-rose-700 dark:text-rose-300",
};
