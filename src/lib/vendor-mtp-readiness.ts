import "server-only";
import type { VendorModel, VendorAssessmentModel } from "@/generated/prisma/models";

type Vendor = VendorModel;
type VendorAssessment = VendorAssessmentModel;

/**
 * Live MTP-readiness check for the FCA/PRA PS26/2 register + notification.
 *
 * A vendor is "register-ready" when every PS26/2-required field is populated
 * such that the firm could file the Annual MTP Register today without the
 * regulator bouncing the submission.
 *
 * Notification-readiness is the same set minus the 1 submission-header
 * (those are added at notification time).
 */

export type ReadinessCheck = {
  id: string;
  /** PS26/2 reference (e.g. "2.03"). */
  ref: string;
  label: string;
  ok: boolean;
};

export type VendorReadiness = {
  /** Each individual check, in PS26/2 order. */
  checks: ReadinessCheck[];
  /** Number of checks passing. */
  passed: number;
  /** Number of checks total. */
  total: number;
  /** True when every required check passes. */
  isRegisterReady: boolean;
};

type VendorWithAssessments = Vendor & { assessments: VendorAssessment[] };

export function evaluateVendorReadiness(vendor: VendorWithAssessments): VendorReadiness {
  const v = vendor;
  const hasAssessment = (kind: VendorAssessment["kind"]) =>
    v.assessments.some((a) => a.kind === kind);
  const supportsIBS = v.supportsCoreIBSElement !== null;

  const checks: ReadinessCheck[] = [
    // 2 Service-provider
    { id: "contract-ref", ref: "2.01", label: "Contract reference number", ok: notEmpty(v.contractRef) },
    { id: "legal-name", ref: "2.02", label: "Legal name of service provider", ok: notEmpty(v.legalName) },
    { id: "lei", ref: "2.03", label: "Legal Entity Identifier (LEI)", ok: isValidLei(v.legalEntityIdentifier) },
    { id: "outsourcing", ref: "2.04", label: "Outsourcing classification", ok: v.isOutsourcing !== null },
    { id: "service-type", ref: "2.05", label: "Type of service", ok: notEmpty(v.serviceTypeTaxonomy) },
    { id: "cloud", ref: "2.06", label: "Cloud deployment model", ok: v.cloudDeployment !== null },
    { id: "description", ref: "2.07", label: "Product / service description", ok: notEmpty(v.productServiceDescription) },
    { id: "supply-chain", ref: "2.08", label: "Supply-chain ranking", ok: v.supplyChainRanking !== null },
    { id: "contract-start", ref: "2.09", label: "Contract commencement date", ok: v.contractStartAt !== null },
    { id: "notice-vendor", ref: "2.12", label: "Notice period (vendor)", ok: v.noticePeriodVendorDays !== null },
    { id: "notice-firm", ref: "2.13", label: "Notice period (firm)", ok: v.noticePeriodFirmDays !== null },
    { id: "governing-law", ref: "2.14", label: "Governing law", ok: notEmpty(v.governingLaw) },

    // 3 Materiality + IBS
    { id: "materiality-reason", ref: "3.01", label: "Reason for materiality", ok: v.materialityReason !== null },
    { id: "materiality-date", ref: "3.02", label: "Materiality assessment date", ok: v.materialityAssessedAt !== null },
    { id: "function-category", ref: "3.03", label: "Function category", ok: v.functionCategory !== null },
    { id: "country-stored", ref: "3.13", label: "Country where data is stored", ok: notEmpty(v.countryDataStored) },
    { id: "country-delivered", ref: "3.14", label: "Country where service is delivered from", ok: notEmpty(v.countryServiceDeliveredFrom) },
    { id: "annual-value", ref: "3.15", label: "Annual contract value", ok: v.contractAnnualValueGBP !== null },

    // 4 Compliance + governance
    { id: "risk-assessment", ref: "4.01–02", label: "Risk assessment recorded", ok: hasAssessment("RISK") },
    { id: "audit", ref: "4.04–05", label: "Audit recorded", ok: hasAssessment("AUDIT") },
    { id: "financial-dd", ref: "4.06–07", label: "Financial due diligence recorded", ok: hasAssessment("FINANCIAL_DD") },
    { id: "cyber-dd", ref: "4.08–09", label: "Cyber due diligence recorded", ok: hasAssessment("CYBER_DD") },
    { id: "complies", ref: "4.10", label: "Compliance with FCA/PRA/FMI rules captured", ok: v.compliesWithRules !== null },
    { id: "smf-signoff", ref: "4.12", label: "SMF / accountable-person sign-off captured", ok: v.smfSignedOff !== null },
    { id: "governance-approved", ref: "4.14", label: "Governance approval date", ok: v.governanceApprovedAt !== null },

    // 5 Exit + substitutability
    { id: "substitutability", ref: "5.01", label: "Substitutability", ok: v.substitutability !== null },
    { id: "reintegration", ref: "5.02", label: "Reintegration ability", ok: v.reintegrationAbility !== null },
    { id: "impact-discontinue", ref: "5.03", label: "Impact of discontinuing", ok: v.impactOfDiscontinuing !== null },
  ];

  // The 6 impact-tolerance fields are only required when the vendor supports an IBS.
  if (supportsIBS && v.supportsCoreIBSElement) {
    checks.push(
      { id: "it-pra-safety", ref: "3.07", label: "Impact tolerance — PRA Safety & Soundness", ok: notEmpty(v.itPRASafetySoundness) },
      { id: "it-pra-fin", ref: "3.08", label: "Impact tolerance — PRA Financial Stability", ok: notEmpty(v.itPRAFinancialStability) },
      { id: "it-pra-ph", ref: "3.09", label: "Impact tolerance — PRA Policyholder Protection", ok: notEmpty(v.itPRAPolicyholderProtection) },
      { id: "it-fca-client", ref: "3.10", label: "Impact tolerance — FCA Client Harm", ok: notEmpty(v.itFCAClientHarm) },
      { id: "it-fca-market", ref: "3.11", label: "Impact tolerance — FCA Market Integrity", ok: notEmpty(v.itFCAMarketIntegrity) },
      { id: "it-fmi", ref: "3.12", label: "Impact tolerance — Bank as FMI Regulator", ok: notEmpty(v.itBankFMIRegulator) },
    );
  }

  const passed = checks.filter((c) => c.ok).length;
  return { checks, passed, total: checks.length, isRegisterReady: passed === checks.length };
}

function notEmpty(s: string | null | undefined): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

/** Valid LEI = 20 alphanumeric characters (letters uppercased per ISO 17442). */
function isValidLei(lei: string | null | undefined): boolean {
  if (!lei) return false;
  return /^[A-Z0-9]{20}$/.test(lei);
}
