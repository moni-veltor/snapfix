"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import {
  AssessmentKind,
  AssessmentOutcome,
  CloudDeployment,
  ComplianceStatus,
  FunctionCategory,
  ImpactDiscontinuation,
  MaterialityReason,
  ReintegrationAbility,
  Substitutability,
} from "@/generated/prisma/enums";

const Bool = z.preprocess((v) => {
  if (v === "true" || v === "on" || v === true) return true;
  if (v === "false" || v === false) return false;
  if (v === "" || v === null || v === undefined) return undefined;
  return v;
}, z.boolean().optional());

const OptDate = z.preprocess(
  (v) => (typeof v === "string" && v !== "" ? new Date(v) : undefined),
  z.date().optional(),
);

const OptStr = z.preprocess(
  (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined),
  z.string().max(2000).optional(),
);

const OptInt = z.preprocess(
  (v) => (typeof v === "string" && v !== "" ? parseInt(v, 10) : undefined),
  z.number().int().nonnegative().optional(),
);

const MtpFieldsSchema = z.object({
  vendorId: z.string(),

  // §2
  contractRef: OptStr,
  legalName: OptStr,
  legalEntityIdentifier: OptStr,
  isMaterialThirdParty: Bool,
  isOutsourcing: Bool,
  serviceTypeTaxonomy: OptStr,
  cloudDeployment: z.nativeEnum(CloudDeployment).optional(),
  productServiceDescription: OptStr,
  supplyChainRanking: OptInt,
  contractStartAt: OptDate,
  contractEndAt: OptDate,
  serviceCommencedAt: OptDate,
  noticePeriodVendorDays: OptInt,
  noticePeriodFirmDays: OptInt,
  governingLaw: OptStr,
  contractAnnualValueGBP: OptInt,

  // §3
  materialityReason: z.nativeEnum(MaterialityReason).optional(),
  materialityAssessedAt: OptDate,
  functionCategory: z.nativeEnum(FunctionCategory).optional(),
  supportsCoreIBSElement: Bool,
  itPRASafetySoundness: OptStr,
  itPRAFinancialStability: OptStr,
  itPRAPolicyholderProtection: OptStr,
  itFCAClientHarm: OptStr,
  itFCAMarketIntegrity: OptStr,
  itBankFMIRegulator: OptStr,
  countryDataStored: OptStr,
  countryServiceDeliveredFrom: OptStr,

  // §4
  compliesWithRules: z.nativeEnum(ComplianceStatus).optional(),
  assuranceSummary: OptStr,
  smfSignedOff: Bool,
  governanceCommittee: OptStr,
  governanceApprovedAt: OptDate,

  // §5
  substitutability: z.nativeEnum(Substitutability).optional(),
  reintegrationAbility: z.nativeEnum(ReintegrationAbility).optional(),
  impactOfDiscontinuing: z.nativeEnum(ImpactDiscontinuation).optional(),
});

/** Single upsert covering PS26/2 sections 2-5 + the MTP flag. */
export async function upsertVendorMtpFieldsAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  const data = MtpFieldsSchema.parse(raw);

  const vendor = await prisma.vendor.findFirst({
    where: { id: data.vendorId, orgId: me.orgId },
    select: { id: true },
  });
  if (!vendor) return;

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      contractRef: data.contractRef ?? null,
      legalName: data.legalName ?? null,
      legalEntityIdentifier: data.legalEntityIdentifier?.toUpperCase() ?? null,
      isMaterialThirdParty: data.isMaterialThirdParty ?? false,
      isOutsourcing: data.isOutsourcing ?? null,
      serviceTypeTaxonomy: data.serviceTypeTaxonomy ?? null,
      cloudDeployment: data.cloudDeployment ?? null,
      productServiceDescription: data.productServiceDescription ?? null,
      supplyChainRanking: data.supplyChainRanking ?? null,
      contractStartAt: data.contractStartAt ?? null,
      contractEndAt: data.contractEndAt ?? null,
      serviceCommencedAt: data.serviceCommencedAt ?? null,
      noticePeriodVendorDays: data.noticePeriodVendorDays ?? null,
      noticePeriodFirmDays: data.noticePeriodFirmDays ?? null,
      governingLaw: data.governingLaw ?? null,
      contractAnnualValueGBP: data.contractAnnualValueGBP ?? null,

      materialityReason: data.materialityReason ?? null,
      materialityAssessedAt: data.materialityAssessedAt ?? null,
      functionCategory: data.functionCategory ?? null,
      supportsCoreIBSElement: data.supportsCoreIBSElement ?? null,
      itPRASafetySoundness: data.itPRASafetySoundness ?? null,
      itPRAFinancialStability: data.itPRAFinancialStability ?? null,
      itPRAPolicyholderProtection: data.itPRAPolicyholderProtection ?? null,
      itFCAClientHarm: data.itFCAClientHarm ?? null,
      itFCAMarketIntegrity: data.itFCAMarketIntegrity ?? null,
      itBankFMIRegulator: data.itBankFMIRegulator ?? null,
      countryDataStored: data.countryDataStored ?? null,
      countryServiceDeliveredFrom: data.countryServiceDeliveredFrom ?? null,

      compliesWithRules: data.compliesWithRules ?? null,
      assuranceSummary: data.assuranceSummary ?? null,
      smfSignedOff: data.smfSignedOff ?? null,
      governanceCommittee: data.governanceCommittee ?? null,
      governanceApprovedAt: data.governanceApprovedAt ?? null,

      substitutability: data.substitutability ?? null,
      reintegrationAbility: data.reintegrationAbility ?? null,
      impactOfDiscontinuing: data.impactOfDiscontinuing ?? null,
    },
  });

  revalidatePath(`/vendors/${vendor.id}`);
  revalidatePath("/vendors");
}

const AssessmentSchema = z.object({
  vendorId: z.string(),
  kind: z.nativeEnum(AssessmentKind),
  assessedAt: z.preprocess((v) => (typeof v === "string" && v !== "" ? new Date(v) : v), z.date()),
  outcome: z.nativeEnum(AssessmentOutcome),
  commentary: OptStr,
});

export async function addVendorAssessmentAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const data = AssessmentSchema.parse(Object.fromEntries(formData));
  const vendor = await prisma.vendor.findFirst({
    where: { id: data.vendorId, orgId: me.orgId },
    select: { id: true },
  });
  if (!vendor) return;
  await prisma.vendorAssessment.create({
    data: {
      vendorId: vendor.id,
      kind: data.kind,
      assessedAt: data.assessedAt,
      outcome: data.outcome,
      commentary: data.commentary ?? null,
      recordedByUserId: me.id,
    },
  });
  revalidatePath(`/vendors/${vendor.id}`);
}

export async function removeVendorAssessmentAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const vendorId = String(formData.get("vendorId"));
  const id = String(formData.get("assessmentId"));
  await prisma.vendorAssessment.deleteMany({
    where: { id, vendor: { id: vendorId, orgId: me.orgId } },
  });
  revalidatePath(`/vendors/${vendorId}`);
}
