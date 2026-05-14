/**
 * DORA / ICT-third-party derived metrics. The Vendor model captures raw
 * fields; this module derives the analytical views the dashboard needs —
 * concentration, exit-plan readiness, assurance freshness, contract churn.
 */

import type { VendorTier } from "@/generated/prisma/enums";

export type VendorLite = {
  id: string;
  name: string;
  tier: VendorTier;
  isDoraCritical: boolean;
  doraIctTier: VendorTier | null;
  hyperscaler: string | null;
  region: string | null;
  contractStartAt: Date | null;
  contractEndAt: Date | null;
  contractRenewalNoticeDays: number | null;
  contractAnnualValueGBP: number | null;
  assuranceKind: string | null;
  assuranceExpiryAt: Date | null;
  exitPlanReviewedAt: Date | null;
  exitPlanRTOMin: number | null;
  exitPlanNotes: string | null;
  fourthParties: unknown;
  ibsLinkCount: number;
};

export const TIER_LABEL: Record<VendorTier, string> = {
  TIER_1: "Tier 1",
  TIER_2: "Tier 2",
  TIER_3: "Tier 3",
};

/** Bucket counts per tier — used by the concentration Bar. */
export function tierDistribution(vendors: Pick<VendorLite, "tier">[]): {
  tier1: number;
  tier2: number;
  tier3: number;
} {
  return {
    tier1: vendors.filter((v) => v.tier === "TIER_1").length,
    tier2: vendors.filter((v) => v.tier === "TIER_2").length,
    tier3: vendors.filter((v) => v.tier === "TIER_3").length,
  };
}

/** Hyperscaler concentration — many of your tier-1 vendors all running on
 *  the same hyperscaler is the regulator's #1 4th-party concern. */
export function hyperscalerConcentration(vendors: VendorLite[]): {
  hyperscaler: string;
  count: number;
  vendorIds: string[];
}[] {
  const byHs = new Map<string, { count: number; vendorIds: string[] }>();
  for (const v of vendors) {
    if (!v.hyperscaler) continue;
    const cur = byHs.get(v.hyperscaler) ?? { count: 0, vendorIds: [] };
    cur.count += 1;
    cur.vendorIds.push(v.id);
    byHs.set(v.hyperscaler, cur);
  }
  return Array.from(byHs.entries())
    .map(([hyperscaler, x]) => ({ hyperscaler, ...x }))
    .sort((a, b) => b.count - a.count);
}

/** Region concentration — same idea but on the geography axis. */
export function regionConcentration(vendors: VendorLite[]): {
  region: string;
  count: number;
}[] {
  const byRegion = new Map<string, number>();
  for (const v of vendors) {
    if (!v.region) continue;
    byRegion.set(v.region, (byRegion.get(v.region) ?? 0) + 1);
  }
  return Array.from(byRegion.entries())
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);
}

/** Exit-plan readiness score, 0-100. */
export function exitPlanScore(v: VendorLite, now: Date = new Date()): number {
  let score = 0;
  if (v.exitPlanNotes && v.exitPlanNotes.trim().length > 40) score += 35;
  else if (v.exitPlanNotes && v.exitPlanNotes.trim().length > 0) score += 15;
  if (v.exitPlanRTOMin !== null) score += 25;
  if (v.exitPlanReviewedAt) {
    const monthsAgo = (now.getTime() - v.exitPlanReviewedAt.getTime()) / (30 * 86_400_000);
    if (monthsAgo <= 12) score += 40;
    else if (monthsAgo <= 24) score += 20;
    else score += 5;
  }
  return Math.min(100, score);
}

export function assuranceStatus(
  v: VendorLite,
  now: Date = new Date(),
): "ok" | "expiring" | "expired" | "missing" {
  if (!v.assuranceKind || v.assuranceKind === "NONE") return "missing";
  if (!v.assuranceExpiryAt) return "expiring";
  const daysToExpiry = (v.assuranceExpiryAt.getTime() - now.getTime()) / 86_400_000;
  if (daysToExpiry < 0) return "expired";
  if (daysToExpiry < 60) return "expiring";
  return "ok";
}

export type ContractStatus = "active" | "renewing" | "expiring" | "expired" | "unknown";

export function contractStatus(
  v: VendorLite,
  now: Date = new Date(),
): { status: ContractStatus; daysToEnd: number | null } {
  if (!v.contractEndAt) return { status: "unknown", daysToEnd: null };
  const daysToEnd = Math.floor((v.contractEndAt.getTime() - now.getTime()) / 86_400_000);
  if (daysToEnd < 0) return { status: "expired", daysToEnd };
  const noticeWindow = v.contractRenewalNoticeDays ?? 90;
  if (daysToEnd <= noticeWindow) return { status: "renewing", daysToEnd };
  if (daysToEnd <= 365) return { status: "expiring", daysToEnd };
  return { status: "active", daysToEnd };
}

/** Critical vendors with weak exit plans — the alert list the CTO actually reads. */
export function weakExitPlans(vendors: VendorLite[], now: Date = new Date()) {
  return vendors
    .filter((v) => v.isDoraCritical || v.tier === "TIER_1")
    .map((v) => ({ vendor: v, score: exitPlanScore(v, now) }))
    .filter((row) => row.score < 60)
    .sort((a, b) => a.score - b.score);
}

/** Aggregate readiness % across critical vendors — single number for the strip. */
export function aggregateExitReadiness(vendors: VendorLite[], now: Date = new Date()): number {
  const critical = vendors.filter((v) => v.isDoraCritical || v.tier === "TIER_1");
  if (critical.length === 0) return 0;
  const sum = critical.reduce((acc, v) => acc + exitPlanScore(v, now), 0);
  return Math.round(sum / critical.length);
}

/** CSV row for the DORA Register of Information export. */
export function vendorToCsvRow(v: VendorLite): string[] {
  const fourth = Array.isArray(v.fourthParties)
    ? v.fourthParties
        .map((fp) => {
          if (typeof fp === "object" && fp !== null) {
            const o = fp as Record<string, unknown>;
            return [o.name, o.role, o.hyperscaler, o.region].filter(Boolean).join(" / ");
          }
          return String(fp);
        })
        .join(" | ")
    : "";
  return [
    v.name,
    v.tier,
    v.isDoraCritical ? "Critical" : "Standard",
    v.doraIctTier ?? "",
    v.hyperscaler ?? "",
    v.region ?? "",
    v.contractStartAt ? v.contractStartAt.toISOString().slice(0, 10) : "",
    v.contractEndAt ? v.contractEndAt.toISOString().slice(0, 10) : "",
    v.contractAnnualValueGBP != null ? String(v.contractAnnualValueGBP) : "",
    v.assuranceKind ?? "",
    v.assuranceExpiryAt ? v.assuranceExpiryAt.toISOString().slice(0, 10) : "",
    v.exitPlanReviewedAt ? v.exitPlanReviewedAt.toISOString().slice(0, 10) : "",
    v.exitPlanRTOMin != null ? String(v.exitPlanRTOMin) : "",
    String(exitPlanScore(v)),
    String(v.ibsLinkCount),
    fourth,
  ];
}

export const CSV_HEADERS = [
  "Vendor",
  "Commercial tier",
  "DORA criticality",
  "DORA ICT tier",
  "Hyperscaler",
  "Region",
  "Contract start",
  "Contract end",
  "Annual value (GBP)",
  "Assurance",
  "Assurance expiry",
  "Exit plan reviewed",
  "Exit RTO (min)",
  "Exit-plan score",
  "IBS links",
  "4th parties",
];
