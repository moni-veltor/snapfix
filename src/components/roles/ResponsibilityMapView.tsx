"use client";

import { useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  ShieldAlert,
} from "lucide-react";
import type { FirmTier } from "@/generated/prisma/enums";

export type MapRoleRow = {
  id: string;
  abbreviation: string;
  title: string;
  responsibility: string | null;
  isSMF: boolean;
  isExecutive: boolean;
  defaultHolderName: string | null;
  defaultHolderEmail: string | null;
};

/**
 * Responsibility area — a single accountability the firm needs covered
 * by a named seat (with a deputy ideally). Coverage is derived by
 * matching the role's abbreviation / title / responsibility text
 * against keyword patterns. No regulator-language references in the UI
 * per the project's no-doctrine-citations rule.
 */
type Area = {
  id: string;
  label: string;
  hint: string;
  /** Tiers where this area is considered material. */
  appliesTo: FirmTier[];
  /** Case-insensitive regex tested against role title + abbreviation + responsibility. */
  pattern: RegExp;
};

const AREAS: Area[] = [
  {
    id: "op-resilience",
    label: "Operational resilience",
    hint: "Who owns the resilience programme end-to-end.",
    appliesTo: ["TIER_1", "TIER_2", "TIER_3"],
    pattern: /resilien|operations|continuity|bcp/i,
  },
  {
    id: "ict-third-party",
    label: "ICT third-party risk",
    hint: "Accountable for vendor concentration, exit plans, sub-processors.",
    appliesTo: ["TIER_1", "TIER_2"],
    pattern: /vendor|third[- ]?party|outsourc|procurement|ict/i,
  },
  {
    id: "cyber-security",
    label: "Cyber security",
    hint: "CISO-equivalent; owns information-security policy + incidents.",
    appliesTo: ["TIER_1", "TIER_2", "TIER_3"],
    pattern: /ciso|cyber|security|infosec/i,
  },
  {
    id: "risk-function",
    label: "Risk function",
    hint: "Enterprise-wide risk oversight (CRO-equivalent).",
    appliesTo: ["TIER_1", "TIER_2"],
    pattern: /\bcro\b|chief risk|risk officer|risk function/i,
  },
  {
    id: "internal-audit",
    label: "Internal audit",
    hint: "Independent assurance, third line of defence.",
    appliesTo: ["TIER_1", "TIER_2"],
    pattern: /audit|3lod|third line/i,
  },
  {
    id: "aml-financial-crime",
    label: "AML / financial crime",
    hint: "Money-laundering reporting officer or equivalent.",
    appliesTo: ["TIER_1", "TIER_2", "TIER_3"],
    pattern: /mlro|aml|financial crime|sanctions|fincrime/i,
  },
  {
    id: "data-protection",
    label: "Data protection",
    hint: "DPO; owns lawful basis, breach notification, subject rights.",
    appliesTo: ["TIER_1", "TIER_2", "TIER_3"],
    pattern: /\bdpo\b|data protection|privacy/i,
  },
  {
    id: "compliance",
    label: "Compliance",
    hint: "Regulatory horizon-scanning + reporting cadence.",
    appliesTo: ["TIER_1", "TIER_2"],
    pattern: /compliance|regulatory/i,
  },
  {
    id: "technology",
    label: "Technology",
    hint: "Technical authority for infrastructure + system decisions.",
    appliesTo: ["TIER_1", "TIER_2", "TIER_3"],
    pattern: /\bcto\b|chief tech|head of tech|tech lead/i,
  },
  {
    id: "comms",
    label: "Customer + press communications",
    hint: "Public-facing comms in an incident; reputation risk owner.",
    appliesTo: ["TIER_1", "TIER_2", "TIER_3"],
    pattern: /comms|communication|press|pr lead|customer.{0,10}lead/i,
  },
  {
    id: "finance",
    label: "Finance",
    hint: "CFO / finance accountable for liquidity + capital impact.",
    appliesTo: ["TIER_1", "TIER_2", "TIER_3"],
    pattern: /\bcfo\b|chief financial|finance director|treasury/i,
  },
  {
    id: "people",
    label: "People + premises",
    hint: "HR + facilities; coordinates staff continuity + buildings.",
    appliesTo: ["TIER_1", "TIER_2"],
    pattern: /\bchro\b|\bcoo\b|chief people|chief operating|hr lead|facilities/i,
  },
];

type Coverage = {
  area: Area;
  applies: boolean;
  owners: MapRoleRow[];
};

/**
 * Tier-aware matrix of responsibility areas × seats. For each area we
 * derive whether ≥1 seat covers it by keyword-matching the role's text
 * fields. Gaps are highlighted; "Not material at your tier" rows are
 * collapsed visually so the matrix stays focused.
 */
export default function ResponsibilityMapView({
  roles,
  tier,
}: {
  roles: MapRoleRow[];
  tier: FirmTier | null;
}) {
  const coverage = useMemo(() => buildCoverage(roles, tier), [roles, tier]);
  const applicable = coverage.filter((c) => c.applies);
  const covered = applicable.filter((c) => c.owners.length > 0);
  const gaps = applicable.filter((c) => c.owners.length === 0);

  if (roles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
        Build your role catalogue first — the responsibility map matches against the
        title and responsibility text of your seats.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-line bg-surface-1 px-4 py-3 text-[11px] text-muted">
        Coverage is derived by matching keywords in each seat&apos;s abbreviation,
        title and responsibility text. Edit the seat in the Catalogue tab if a match
        looks wrong. Areas tagged &quot;not material at your tier&quot; are hidden.
      </div>

      <header className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Areas covered"
          value={covered.length}
          tone="ok"
        />
        <Stat
          label="Gaps at your tier"
          value={gaps.length}
          tone={gaps.length > 0 ? "critical" : "ok"}
        />
        <Stat
          label="Total areas tracked"
          value={applicable.length}
          tone="neutral"
        />
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {applicable.map((c) => (
          <li key={c.area.id}>
            <AreaCard coverage={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function buildCoverage(roles: MapRoleRow[], tier: FirmTier | null): Coverage[] {
  return AREAS.map((area) => {
    const applies = tier ? area.appliesTo.includes(tier) : true;
    const owners = roles.filter((r) => {
      const txt = `${r.abbreviation} ${r.title} ${r.responsibility ?? ""}`;
      return area.pattern.test(txt);
    });
    return { area, applies, owners };
  });
}

function AreaCard({ coverage: { area, owners } }: { coverage: Coverage }) {
  const tone: "ok" | "warn" | "critical" =
    owners.length === 0 ? "critical" : owners.some((o) => o.isSMF) ? "ok" : "warn";

  const ring =
    tone === "critical"
      ? "border-rose-300 dark:border-rose-700/60"
      : tone === "warn"
        ? "border-amber-300 dark:border-amber-700/60"
        : "border-emerald-300 dark:border-emerald-700/60";

  const bar =
    tone === "critical"
      ? "from-rose-500 to-rose-400"
      : tone === "warn"
        ? "from-amber-500 to-amber-400"
        : "from-emerald-500 to-emerald-400";

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border bg-surface-1 ${ring}`}
    >
      <div className={`h-1 bg-gradient-to-r ${bar}`} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header>
          <h3 className="text-sm font-semibold text-ink">{area.label}</h3>
          <p className="mt-0.5 text-[11px] text-muted">{area.hint}</p>
        </header>

        {owners.length === 0 ? (
          <div className="flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1 text-[11px] text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
            <AlertCircle size={11} />
            No seat covers this area.
          </div>
        ) : (
          <ul className="space-y-1 text-[12px]">
            {owners.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center gap-1.5">
                {r.isSMF ? (
                  <Crown size={10} className="text-amber-600 dark:text-amber-300" />
                ) : (
                  <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
                <span className="font-mono text-[10px] text-soft">{r.abbreviation}</span>
                <span className="truncate text-ink">{r.title}</span>
              </li>
            ))}
            {owners.length > 4 && (
              <li className="text-[10px] text-soft">+{owners.length - 4} more</li>
            )}
          </ul>
        )}

        {owners.length > 0 && !owners.some((o) => o.isSMF) && (
          <footer className="mt-auto flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[10px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <ShieldAlert size={10} />
            Covered, but not by an SMF-flagged seat.
          </footer>
        )}
        {owners.length > 0 && owners.some((o) => o.isSMF) && (
          <footer className="mt-auto flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={10} />
            Owned by an SMF accountable seat.
          </footer>
        )}
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "critical" | "neutral";
}) {
  const cls =
    tone === "critical"
      ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
        : tone === "ok"
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
          : "border-line bg-surface-1";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-soft">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
