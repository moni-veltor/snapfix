// Severity helpers — Afin IMP §6.2.1 + ORP App.1.
// Five-dimension matrix → overall severity, with Consumer Duty (PS22/3) and
// cyber-default-High overrides.

import type { SeverityLevel } from "@/generated/prisma/enums";

const RANK: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };

export type FiveDim = {
  financial?: SeverityLevel | "HIGH" | "MEDIUM" | "LOW";
  customer?: SeverityLevel | "HIGH" | "MEDIUM" | "LOW";
  dataImpact?: SeverityLevel | "HIGH" | "MEDIUM" | "LOW";
  systems?: SeverityLevel | "HIGH" | "MEDIUM" | "LOW";
  reputational?: SeverityLevel | "HIGH" | "MEDIUM" | "LOW";
  consumerDutyTrigger?: boolean;
};

/**
 * Overall severity = the highest of the five dimensions, with Consumer Duty
 * acting as an aggravating factor that promotes to High regardless of the
 * underlying financial threshold (IMP §6.2.4).
 */
export function deriveOverallSeverity(input: FiveDim): SeverityLevel | null {
  const dims = [
    input.financial,
    input.customer,
    input.dataImpact,
    input.systems,
    input.reputational,
  ].filter(Boolean) as string[];

  if (input.consumerDutyTrigger) return "HIGH" as SeverityLevel;
  if (dims.length === 0) return null;

  const maxRank = Math.max(...dims.map((d) => RANK[d] ?? 0));
  if (maxRank >= 3) return "HIGH" as SeverityLevel;
  if (maxRank >= 2) return "MEDIUM" as SeverityLevel;
  return "LOW" as SeverityLevel;
}

/**
 * Cyber default rule (BCPlans §6.3.8): ransomware / data exfiltration default
 * to High unless explicitly assessed otherwise.
 */
export function autoPromoteSeverityForCyber(
  derived: SeverityLevel | null,
  cyberDefaultHigh: boolean,
): SeverityLevel | null {
  if (!cyberDefaultHigh) return derived;
  return "HIGH" as SeverityLevel;
}

export const SEVERITY_DIMENSION_LABELS: Record<keyof FiveDim, string> = {
  financial: "Financial impact",
  customer: "Customer impact",
  dataImpact: "Data impact",
  systems: "Systems impact",
  reputational: "Reputational impact",
  consumerDutyTrigger: "Consumer Duty trigger",
};

/**
 * Per-dimension threshold guidance the UI shows alongside each H/M/L radio.
 * Sourced from ORP Appendix 1 (Afin policy).
 */
export const SEVERITY_THRESHOLDS = {
  financial: {
    HIGH: ">£2m",
    MEDIUM: ">£1m – £1.5m",
    LOW: ">£250k – £1m",
  },
  customer: {
    HIGH: ">20% customer base",
    MEDIUM: "≤20%",
    LOW: "≤10%",
  },
  dataImpact: {
    HIGH: ">1 in 4 sensitive records",
    MEDIUM: ">1 in 8 sensitive",
    LOW: ">1 in 16 sensitive or >1 in 4 non-sensitive",
  },
  systems: {
    HIGH: "Tier 1 / mission-critical down or unstable",
    MEDIUM: "Tier 2 / business-critical down",
    LOW: "Tier 3 / business-operational down",
  },
  reputational: {
    HIGH: "Extensive, widespread media coverage",
    MEDIUM: "Significant, targeted media",
    LOW: "Some, limited",
  },
} as const;
