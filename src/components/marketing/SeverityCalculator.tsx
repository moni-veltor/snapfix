"use client";

import { useState } from "react";

type Level = "HIGH" | "MEDIUM" | "LOW" | null;

type Dim = {
  key: string;
  label: string;
  thresholds: { HIGH: string; MEDIUM: string; LOW: string };
};

const DIMENSIONS: Dim[] = [
  {
    key: "financial",
    label: "Financial impact",
    thresholds: { HIGH: ">£2m loss", MEDIUM: ">£1m – £1.5m", LOW: ">£250k – £1m" },
  },
  {
    key: "customer",
    label: "Customer impact",
    thresholds: { HIGH: ">20% of customer base", MEDIUM: "≤20%", LOW: "≤10%" },
  },
  {
    key: "data",
    label: "Data impact",
    thresholds: {
      HIGH: ">1 in 4 sensitive records",
      MEDIUM: ">1 in 8 sensitive",
      LOW: ">1 in 16 sensitive · 1 in 4 non-sensitive",
    },
  },
  {
    key: "systems",
    label: "Systems impact",
    thresholds: {
      HIGH: "Tier 1 / mission-critical down",
      MEDIUM: "Tier 2 / business-critical down",
      LOW: "Tier 3 / operational down",
    },
  },
  {
    key: "reputational",
    label: "Reputational impact",
    thresholds: {
      HIGH: "Widespread media coverage",
      MEDIUM: "Significant, targeted media",
      LOW: "Some, limited coverage",
    },
  },
];

const RANK: Record<NonNullable<Level>, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export default function SeverityCalculator() {
  const [values, setValues] = useState<Record<string, Level>>({});
  const [consumerDuty, setConsumerDuty] = useState(false);
  const [cyber, setCyber] = useState(false);

  const dims = Object.values(values).filter(Boolean) as NonNullable<Level>[];
  let derived: Level = null;
  if (cyber) derived = "HIGH";
  else if (consumerDuty) derived = "HIGH";
  else if (dims.length > 0) {
    const maxRank = Math.max(...dims.map((d) => RANK[d]));
    derived = maxRank >= 3 ? "HIGH" : maxRank >= 2 ? "MEDIUM" : "LOW";
  }

  const reset = () => {
    setValues({});
    setConsumerDuty(false);
    setCyber(false);
  };

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-white">Live severity calculator</h3>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Reset
        </button>
      </div>

      <div className="grid gap-3">
        {DIMENSIONS.map((d) => (
          <div key={d.key}>
            <div className="text-xs font-semibold text-slate-200">{d.label}</div>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(["HIGH", "MEDIUM", "LOW"] as const).map((lvl) => {
                const active = values[d.key] === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() =>
                      setValues((prev) => ({ ...prev, [d.key]: active ? null : lvl }))
                    }
                    className={`rounded-md border px-2 py-2 text-left text-xs transition ${
                      active
                        ? LEVEL_ACTIVE[lvl]
                        : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <div className={`font-semibold ${active ? "" : LEVEL_HINT[lvl]}`}>{lvl}</div>
                    <div className="mt-0.5 text-[10px] opacity-80">{d.thresholds[lvl]}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-md bg-amber-500/[0.08] p-3 text-xs">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={consumerDuty}
            onChange={(e) => setConsumerDuty(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-slate-200">
            <strong>Consumer Duty trigger</strong> — incident affects customers' access to funds,
            ability to complete transactions, or rights. Promotes to <strong>High</strong>{" "}
            regardless of financial threshold (best practice
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={cyber}
            onChange={(e) => setCyber(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-slate-200">
            <strong>Cyber default rule</strong> — ransomware or data exfiltration defaults to{" "}
            <strong>High</strong> unless explicitly assessed otherwise (best practice
          </span>
        </label>
      </div>

      <Result derived={derived} cyber={cyber} consumerDuty={consumerDuty} />
    </div>
  );
}

function Result({
  derived,
  cyber,
  consumerDuty,
}: {
  derived: Level;
  cyber: boolean;
  consumerDuty: boolean;
}) {
  if (!derived) {
    return (
      <div className="rounded-md border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
        Pick at least one dimension to see the derived severity.
      </div>
    );
  }
  const cls = LEVEL_RESULT[derived];
  const reason = cyber
    ? "Cyber default rule forced this to High."
    : consumerDuty
      ? "Consumer Duty trigger forced this to High."
      : `Highest dimension score determined the overall severity.`;
  return (
    <div className={`rounded-md p-4 ${cls}`}>
      <div className="text-xs font-semibold uppercase tracking-wider">Derived severity</div>
      <div className="mt-1 text-3xl font-bold">{derived}</div>
      <p className="mt-2 text-xs opacity-90">{reason}</p>
      {derived === "HIGH" && (
        <p className="mt-2 rounded bg-white/10 p-2 text-[11px]">
          ⚠️ FCA + PRA notification clocks start ticking — 4 hours from IMT invocation.
        </p>
      )}
    </div>
  );
}

const LEVEL_ACTIVE: Record<NonNullable<Level>, string> = {
  HIGH: "border-rose-400 bg-rose-500/20 text-rose-100",
  MEDIUM: "border-amber-400 bg-amber-500/20 text-amber-100",
  LOW: "border-emerald-400 bg-emerald-500/20 text-emerald-100",
};

const LEVEL_HINT: Record<NonNullable<Level>, string> = {
  HIGH: "text-rose-300",
  MEDIUM: "text-amber-300",
  LOW: "text-emerald-300",
};

const LEVEL_RESULT: Record<NonNullable<Level>, string> = {
  HIGH: "bg-rose-500/20 text-rose-100 border border-rose-400/40",
  MEDIUM: "bg-amber-500/20 text-amber-100 border border-amber-400/40",
  LOW: "bg-emerald-500/20 text-emerald-100 border border-emerald-400/40",
};
