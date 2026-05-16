"use client";

import { Download } from "lucide-react";

export type DoraExportRow = {
  id: string;
  name: string;
  description: string | null;
  serviceKind: string | null;
  tier: string;
  isDoraCritical: boolean;
  doraIctTier: string | null;
  hyperscaler: string | null;
  region: string | null;
  assuranceKind: string | null;
  assuranceExpiryAt: Date | null;
  contractStartAt: Date | null;
  contractEndAt: Date | null;
  contractRenewalNoticeDays: number | null;
  contractAnnualValueGBP: number | null;
  exitPlanReviewedAt: Date | null;
  exitPlanRTOMin: number | null;
  /** JSON column on the model — accept anything; we coerce to a string list. */
  fourthParties: unknown;
  ibsLinks: Array<{ ibs: { code: string; name: string } }>;
};

function fourthPartiesList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  return [];
}

const HEADERS = [
  "vendor_id_snapfix",
  "vendor_name",
  "vendor_lei",
  "service_description",
  "service_kind",
  "function_supported_summary",
  "criticality_tier_internal",
  "is_dora_critical",
  "dora_ict_tier",
  "hyperscaler",
  "region",
  "assurance_kind",
  "assurance_expiry_iso",
  "contract_start_iso",
  "contract_end_iso",
  "notice_period_days",
  "annual_value_gbp",
  "exit_plan_reviewed_iso",
  "exit_plan_rto_min",
  "fourth_parties",
  "supported_ibs_codes",
  "supported_ibs_names",
] as const;

/**
 * One-click DORA Article 28 Register of Information CSV export. The
 * columns are a credible first-draft mapping of SnapFix vendor fields
 * onto the EBA ITS template structure — admins refine to their final
 * regulator submission.
 *
 * The export is generated entirely client-side from the data the
 * /vendors page already loaded; no extra server round-trip.
 */
export default function VendorDoraExportButton({
  vendors,
}: {
  vendors: DoraExportRow[];
}) {
  function exportCSV() {
    const rows = vendors.map((v) => ({
      vendor_id_snapfix: v.id,
      vendor_name: v.name,
      vendor_lei: "", // not modelled yet — admins paste in before submission
      service_description: v.description ?? "",
      service_kind: v.serviceKind ?? "",
      function_supported_summary: v.ibsLinks.map((l) => l.ibs.name).join("; "),
      criticality_tier_internal: v.tier,
      is_dora_critical: v.isDoraCritical ? "Y" : "N",
      dora_ict_tier: v.doraIctTier ?? "",
      hyperscaler: v.hyperscaler ?? "",
      region: v.region ?? "",
      assurance_kind: v.assuranceKind ?? "",
      assurance_expiry_iso: iso(v.assuranceExpiryAt),
      contract_start_iso: iso(v.contractStartAt),
      contract_end_iso: iso(v.contractEndAt),
      notice_period_days: v.contractRenewalNoticeDays ?? "",
      annual_value_gbp: v.contractAnnualValueGBP ?? "",
      exit_plan_reviewed_iso: iso(v.exitPlanReviewedAt),
      exit_plan_rto_min: v.exitPlanRTOMin ?? "",
      fourth_parties: fourthPartiesList(v.fourthParties).join("; "),
      supported_ibs_codes: v.ibsLinks.map((l) => l.ibs.code).join("; "),
      supported_ibs_names: v.ibsLinks.map((l) => l.ibs.name).join("; "),
    }));

    const csv = [HEADERS.join(","), ...rows.map((r) => HEADERS.map((h) => escape(r[h])).join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `snapfix-dora-roi-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCSV}
      disabled={vendors.length === 0}
      title="Export Register of Information aligned with DORA Article 28 ITS template. Refine LEI codes and any final fields before regulator submission."
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download size={14} strokeWidth={2.2} />
      DORA RoI export
    </button>
  );
}

function iso(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

function escape(value: string | number | boolean | undefined | null): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
