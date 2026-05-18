import "server-only";
import ExcelJS from "exceljs";
import type { VendorModel, VendorAssessmentModel } from "@/generated/prisma/models";
import {
  ASSESSMENT_OUTCOME_LABEL,
  CLOUD_DEPLOYMENT_LABEL,
  COMPLIANCE_LABEL,
  IMPACT_DISCONTINUE_LABEL,
  MATERIALITY_REASON_LABEL,
  MTP_SUBMISSION_TYPE_LABEL,
  REINTEGRATION_LABEL,
  SUBSTITUTABILITY_LABEL,
} from "@/lib/ps26-taxonomy";

/**
 * Generators for the two FCA/PRA PS26/2 Annex 3 XLSX deliverables.
 *
 * We don't load and mutate the official template — too brittle when the
 * regulator publishes a new revision (and bundling 145KB of template into
 * the build is wasteful). Instead we generate a fresh workbook with the
 * three sheets the regulator processor expects:
 *   - Submission Header
 *   - Formatted data
 *   - Field Descriptions
 * Column order matches the official template (§2.01 → §5.03).
 */

type Vendor = VendorModel & { assessments: VendorAssessmentModel[] };

type SubmissionHeader = {
  reportingDate: Date;
  submissionId: number;
  submissionType: string; // pre-resolved label
  firmName: string;
  frn: string;
  groupHoldingFrn: string | null;
  renewalChangeNarrative?: string | null;
};

/** Annual register — one workbook listing every MTP vendor as a row. */
export async function generateRegisterXlsx(input: {
  header: SubmissionHeader;
  vendors: Vendor[];
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SnapFix";
  wb.created = new Date();

  // Sheet 1 — Submission Header
  const sh = wb.addWorksheet("Submission Header (Register)");
  sh.columns = [
    { header: "ID", width: 6 },
    { header: "Data Fields", width: 50 },
    { header: "Value", width: 60 },
  ];
  appendHeaderRows(sh, input.header, "Annual Material Third Party Register");

  // Sheet 2 — Formatted data: one row per MTP vendor
  const data = wb.addWorksheet("Formatted data (Register)");
  data.columns = REGISTER_COLUMNS.map((c) => ({ header: c.label, key: c.id, width: c.width }));
  // Header rows: row 1 blank, row 2 the §-id, row 3 the label. Match the
  // official template structure so the regulator's loader doesn't trip.
  data.spliceRows(1, 0, [], REGISTER_COLUMNS.map((c) => c.refId), REGISTER_COLUMNS.map((c) => c.label));
  for (const v of input.vendors) {
    data.addRow(buildVendorRow(v));
  }

  // Sheet 3 — Field Descriptions (informational, mirrors the template)
  const fd = wb.addWorksheet("Field Descrip (Register)");
  fd.columns = [
    { header: "", width: 4 },
    { header: "ID", width: 8 },
    { header: "Data Fields", width: 45 },
    { header: "Register Requirement", width: 30 },
    { header: "Description", width: 80 },
  ];
  for (const c of REGISTER_COLUMNS) {
    fd.addRow(["", c.refId, c.label, c.requirement, c.description]);
  }

  const arr = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  return Buffer.from(arr);
}

/** Per-event notification — same data shape, different submission header + type. */
export async function generateNotificationXlsx(input: {
  header: SubmissionHeader;
  vendor: Vendor;
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SnapFix";
  wb.created = new Date();

  const sh = wb.addWorksheet("Submission Header(Notification)");
  sh.columns = [
    { header: "ID", width: 6 },
    { header: "Data Fields", width: 50 },
    { header: "Value", width: 60 },
  ];
  appendHeaderRows(sh, input.header, input.header.submissionType);

  const data = wb.addWorksheet("Formatted data (Notification)");
  data.columns = REGISTER_COLUMNS.map((c) => ({ header: c.label, key: c.id, width: c.width }));
  data.spliceRows(1, 0, [], REGISTER_COLUMNS.map((c) => c.refId), REGISTER_COLUMNS.map((c) => c.label));
  data.addRow(buildVendorRow(input.vendor));

  const fd = wb.addWorksheet("Field Descrip (Notification)");
  fd.columns = [
    { header: "", width: 4 },
    { header: "ID", width: 8 },
    { header: "Data Fields", width: 45 },
    { header: "Notification Requirement", width: 30 },
    { header: "Description", width: 80 },
  ];
  for (const c of REGISTER_COLUMNS) {
    fd.addRow(["", c.refId, c.label, c.requirement, c.description]);
  }

  const arr = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  return Buffer.from(arr);
}

function appendHeaderRows(
  sh: ExcelJS.Worksheet,
  h: SubmissionHeader,
  submissionTypeLabel: string,
) {
  sh.addRow(["1.01", "Reporting date", h.reportingDate.toISOString().slice(0, 10)]);
  sh.addRow(["1.02", "Submission ID", h.submissionId]);
  sh.addRow(["1.03", "Submission type", submissionTypeLabel]);
  sh.addRow(["1.04", "Firm name", h.firmName]);
  sh.addRow(["1.05", "FRN", h.frn]);
  sh.addRow(["1.06", "FRN of group holding company (if applicable)", h.groupHoldingFrn ?? "N/A"]);
  if (h.renewalChangeNarrative) {
    sh.addRow(["1.07", "If contract renewal, please provide details of significant changes made (if any)", h.renewalChangeNarrative]);
  }
}

function buildVendorRow(v: Vendor): Record<string, unknown> {
  const latest = (kind: VendorAssessmentModel["kind"]) =>
    [...v.assessments].filter((a) => a.kind === kind).sort((a, b) => b.assessedAt.getTime() - a.assessedAt.getTime())[0] ?? null;

  const risk = latest("RISK");
  const audit = latest("AUDIT");
  const finDD = latest("FINANCIAL_DD");
  const cyberDD = latest("CYBER_DD");

  return {
    "2.01": v.contractRef ?? "",
    "2.02": v.legalName ?? v.name,
    "2.03": v.legalEntityIdentifier ?? "",
    "2.04": v.isOutsourcing === null ? "" : v.isOutsourcing ? "Outsourcing" : "Non-outsourcing",
    "2.05": v.serviceTypeTaxonomy ?? "",
    "2.06": v.cloudDeployment ? CLOUD_DEPLOYMENT_LABEL[v.cloudDeployment] : "",
    "2.07": v.productServiceDescription ?? "",
    "2.08": v.supplyChainRanking ?? "",
    "2.09": iso(v.contractStartAt),
    "2.10": iso(v.serviceCommencedAt),
    "2.11": iso(v.contractEndAt),
    "2.12": v.noticePeriodVendorDays ?? "",
    "2.13": v.noticePeriodFirmDays ?? "",
    "2.14": v.governingLaw ?? "",
    "3.01": v.materialityReason ? MATERIALITY_REASON_LABEL[v.materialityReason] : "",
    "3.02": iso(v.materialityAssessedAt),
    "3.03": v.functionCategory ?? "",
    "3.04": v.supportsCoreIBSElement === null ? "" : v.supportsCoreIBSElement ? "Yes" : "No",
    "3.05": "", // free-text IBS names — populated by caller-supplied augment later
    "3.06": v.supportsCoreIBSElement === null ? "" : v.supportsCoreIBSElement ? "Core" : "Non-core",
    "3.07": v.itPRASafetySoundness ?? "",
    "3.08": v.itPRAFinancialStability ?? "",
    "3.09": v.itPRAPolicyholderProtection ?? "",
    "3.10": v.itFCAClientHarm ?? "",
    "3.11": v.itFCAMarketIntegrity ?? "",
    "3.12": v.itBankFMIRegulator ?? "",
    "3.13": v.countryDataStored ?? "",
    "3.14": v.countryServiceDeliveredFrom ?? "",
    "3.15": v.contractAnnualValueGBP ?? "",
    "4.01": iso(risk?.assessedAt),
    "4.02": risk ? ASSESSMENT_OUTCOME_LABEL[risk.outcome] : "",
    "4.03": risk?.commentary ?? "",
    "4.04": iso(audit?.assessedAt),
    "4.05": audit ? ASSESSMENT_OUTCOME_LABEL[audit.outcome] : "",
    "4.06": iso(finDD?.assessedAt),
    "4.07": finDD ? ASSESSMENT_OUTCOME_LABEL[finDD.outcome] : "",
    "4.08": iso(cyberDD?.assessedAt),
    "4.09": cyberDD ? ASSESSMENT_OUTCOME_LABEL[cyberDD.outcome] : "",
    "4.10": v.compliesWithRules ? COMPLIANCE_LABEL[v.compliesWithRules] : "",
    "4.11": v.assuranceSummary ?? "",
    "4.12": v.smfSignedOff === null ? "" : v.smfSignedOff ? "Yes" : "No",
    "4.13": v.governanceCommittee ?? "",
    "4.14": iso(v.governanceApprovedAt),
    "5.01": v.substitutability ? SUBSTITUTABILITY_LABEL[v.substitutability] : "",
    "5.02": v.reintegrationAbility ? REINTEGRATION_LABEL[v.reintegrationAbility] : "",
    "5.03": v.impactOfDiscontinuing ? IMPACT_DISCONTINUE_LABEL[v.impactOfDiscontinuing] : "",
  };
}

function iso(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

/** Resolve a submission-type enum to the label PS26/2 expects. */
export function submissionTypeLabel(t: string): string {
  return MTP_SUBMISSION_TYPE_LABEL[t] ?? t;
}

type ColDef = {
  id: string;
  refId: string;
  label: string;
  width: number;
  requirement: string;
  description: string;
};

/** Canonical column order matching PS26/2 Annex 3 Formatted-data sheet. */
const REGISTER_COLUMNS: ColDef[] = [
  { id: "2.01", refId: "2.01", label: "Contractual Arrangement Reference Number", width: 28, requirement: "Required", description: "Firm's internal reference for the contractual arrangement" },
  { id: "2.02", refId: "2.02", label: "Legal name of service provider", width: 30, requirement: "Required", description: "As stated in the contract" },
  { id: "2.03", refId: "2.03", label: "Legal Entity Identifier", width: 24, requirement: "Required", description: "LEI — 20 alphanumeric chars" },
  { id: "2.04", refId: "2.04", label: "Is the MTP contractual arrangement outsourcing or non-outsourcing?", width: 18, requirement: "Required", description: "Outsourcing / Non-outsourcing" },
  { id: "2.05", refId: "2.05", label: "Type of Service Provided", width: 32, requirement: "Required", description: "Taxonomy dropdown" },
  { id: "2.06", refId: "2.06", label: "Cloud deployment model", width: 18, requirement: "Required", description: "Public / Private / Hybrid / Non-cloud" },
  { id: "2.07", refId: "2.07", label: "Short description of product/service provided", width: 40, requirement: "Required", description: "Short text" },
  { id: "2.08", refId: "2.08", label: "Supply Chain Ranking", width: 14, requirement: "Required", description: "Non-negative integer" },
  { id: "2.09", refId: "2.09", label: "Date of commencement of the contractual arrangement", width: 16, requirement: "Required", description: "YYYY-MM-DD" },
  { id: "2.10", refId: "2.10", label: "Date of service commencement", width: 16, requirement: "Optional", description: "YYYY-MM-DD" },
  { id: "2.11", refId: "2.11", label: "Next contract renewal date or end date", width: 16, requirement: "Required", description: "YYYY-MM-DD" },
  { id: "2.12", refId: "2.12", label: "Notice period for the service provider", width: 14, requirement: "Required", description: "Integer days" },
  { id: "2.13", refId: "2.13", label: "Notice period for the firm", width: 14, requirement: "Required", description: "Integer days" },
  { id: "2.14", refId: "2.14", label: "The governing law of the contractual arrangement", width: 18, requirement: "Required", description: "Country dropdown" },
  { id: "3.01", refId: "3.01", label: "Reason for materiality", width: 36, requirement: "Required", description: "Taxonomy dropdown" },
  { id: "3.02", refId: "3.02", label: "Date of the most recent materiality assessment", width: 16, requirement: "Required", description: "YYYY-MM-DD" },
  { id: "3.03", refId: "3.03", label: "Function Category", width: 36, requirement: "Required", description: "Taxonomy dropdown" },
  { id: "3.04", refId: "3.04", label: "Does the contractual arrangement support an Important Business Service?", width: 18, requirement: "Required", description: "Yes / No" },
  { id: "3.05", refId: "3.05", label: "If yes, which Important Business Service does the contractual arrangement support", width: 30, requirement: "Required conditional", description: "Short text" },
  { id: "3.06", refId: "3.06", label: "Does the service provider support a core element of the IBS?", width: 18, requirement: "Required conditional", description: "Core / Non-core" },
  { id: "3.07", refId: "3.07", label: "Impact Tolerance - PRA Safety and Soundness", width: 24, requirement: "Required", description: "Short text" },
  { id: "3.08", refId: "3.08", label: "Impact Tolerance - PRA Financial Stability", width: 24, requirement: "Required", description: "Short text" },
  { id: "3.09", refId: "3.09", label: "Impact Tolerance - PRA Policyholder Protection", width: 24, requirement: "Required", description: "Short text" },
  { id: "3.10", refId: "3.10", label: "Impact Tolerance - FCA - Client harm", width: 24, requirement: "Required", description: "Short text" },
  { id: "3.11", refId: "3.11", label: "Impact Tolerance - FCA - Market integrity", width: 24, requirement: "Required", description: "Short text" },
  { id: "3.12", refId: "3.12", label: "Impact Tolerance - Bank as FMI Regulator", width: 24, requirement: "Required", description: "Short text" },
  { id: "3.13", refId: "3.13", label: "Country where the data is stored", width: 18, requirement: "Required", description: "Country dropdown" },
  { id: "3.14", refId: "3.14", label: "Country where the service is delivered from", width: 18, requirement: "Required", description: "Country dropdown" },
  { id: "3.15", refId: "3.15", label: "Annual Contract Value", width: 16, requirement: "Required", description: "Number (GBP)" },
  { id: "4.01", refId: "4.01", label: "Date of the most recent risk assessment", width: 16, requirement: "Required", description: "YYYY-MM-DD" },
  { id: "4.02", refId: "4.02", label: "Outcome of the most recent risk assessment", width: 18, requirement: "Required", description: "Satisfactory / Non-satisfactory / Ongoing / N/A" },
  { id: "4.03", refId: "4.03", label: "Commentary box for risk assessment", width: 30, requirement: "Optional", description: "Short text" },
  { id: "4.04", refId: "4.04", label: "Date of the most recent audit", width: 16, requirement: "Required", description: "YYYY-MM-DD" },
  { id: "4.05", refId: "4.05", label: "Outcome of the most recent audit", width: 18, requirement: "Required", description: "Satisfactory / Non-satisfactory / Ongoing / N/A" },
  { id: "4.06", refId: "4.06", label: "Date of financial due diligence", width: 16, requirement: "Required", description: "YYYY-MM-DD" },
  { id: "4.07", refId: "4.07", label: "Outcome of financial due diligence", width: 18, requirement: "Required", description: "Satisfactory / Non-satisfactory / Ongoing / N/A" },
  { id: "4.08", refId: "4.08", label: "Date of cyber risk due diligence", width: 16, requirement: "Required", description: "YYYY-MM-DD" },
  { id: "4.09", refId: "4.09", label: "Outcome of cyber risk due diligence", width: 18, requirement: "Required", description: "Satisfactory / Non-satisfactory / Ongoing / N/A" },
  { id: "4.10", refId: "4.10", label: "Does the contractual arrangement comply with the relevant rules and requirements?", width: 18, requirement: "Required", description: "Yes / No / Ongoing" },
  { id: "4.11", refId: "4.11", label: "Please summarise how the assurance is obtained and any gaps identified", width: 30, requirement: "Required conditional", description: "Short text" },
  { id: "4.12", refId: "4.12", label: "Has this contractual arrangement been reviewed and signed off by an SMF holder?", width: 18, requirement: "Required", description: "Yes / No" },
  { id: "4.13", refId: "4.13", label: "If not, which governance committee reviewed it?", width: 22, requirement: "Required conditional", description: "Short text" },
  { id: "4.14", refId: "4.14", label: "Date of Governance Approval", width: 16, requirement: "Required", description: "YYYY-MM-DD" },
  { id: "5.01", refId: "5.01", label: "Substitutability of the service provider", width: 22, requirement: "Required", description: "Easily substitutable / Highly complex / Not substitutable" },
  { id: "5.02", refId: "5.02", label: "Ability of reintegration of the service", width: 18, requirement: "Required", description: "Easy / Difficult / Impossible" },
  { id: "5.03", refId: "5.03", label: "Impact of discontinuing the contractual arrangement", width: 18, requirement: "Required", description: "Low / Medium / High" },
];
