"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import {
  CloudDeployment,
  ComplianceStatus,
  FunctionCategory,
  ImpactDiscontinuation,
  MaterialityReason,
  ReintegrationAbility,
  Substitutability,
  VendorTier,
} from "@/generated/prisma/enums";
import { audit } from "@/lib/audit";
import { VENDOR_LIBRARY } from "@/lib/vendor-library";

function optDate(v: FormDataEntryValue | null): Date | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function optInt(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function optStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s;
}

function optEnum<T extends string>(v: FormDataEntryValue | null, allowed: readonly T[]): T | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  return (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

function optBool(v: FormDataEntryValue | null): boolean | null {
  if (v === "true" || v === "on") return true;
  if (v === "false") return false;
  return null;
}

/**
 * Extract MTP register fields (sections 2–5) from the FormData. Returns
 * an empty object when the form didn't render the MTP section, so
 * upsertVendorAction can spread it into the payload unconditionally.
 * We detect MTP presence by the unique-to-MTP `contractRef` field.
 */
function mtpFieldsFromFormData(formData: FormData) {
  if (!formData.has("contractRef")) return {};
  return {
    contractRef: optStr(formData.get("contractRef")),
    legalName: optStr(formData.get("legalName")),
    legalEntityIdentifier:
      optStr(formData.get("legalEntityIdentifier"))?.toUpperCase() ?? null,
    isMaterialThirdParty: formData.get("isMaterialThirdParty") === "on",
    isOutsourcing: optBool(formData.get("isOutsourcing")),
    serviceTypeTaxonomy: optStr(formData.get("serviceTypeTaxonomy")),
    cloudDeployment: optEnum(
      formData.get("cloudDeployment"),
      Object.values(CloudDeployment) as readonly (keyof typeof CloudDeployment)[],
    ),
    productServiceDescription: optStr(formData.get("productServiceDescription")),
    supplyChainRanking: optInt(formData.get("supplyChainRanking")),
    serviceCommencedAt: optDate(formData.get("serviceCommencedAt")),
    noticePeriodVendorDays: optInt(formData.get("noticePeriodVendorDays")),
    noticePeriodFirmDays: optInt(formData.get("noticePeriodFirmDays")),
    governingLaw: optStr(formData.get("governingLaw")),
    materialityReason: optEnum(
      formData.get("materialityReason"),
      Object.values(MaterialityReason) as readonly (keyof typeof MaterialityReason)[],
    ),
    materialityAssessedAt: optDate(formData.get("materialityAssessedAt")),
    functionCategory: optEnum(
      formData.get("functionCategory"),
      Object.values(FunctionCategory) as readonly (keyof typeof FunctionCategory)[],
    ),
    supportsCoreIBSElement: optBool(formData.get("supportsCoreIBSElement")),
    itPRASafetySoundness: optStr(formData.get("itPRASafetySoundness")),
    itPRAFinancialStability: optStr(formData.get("itPRAFinancialStability")),
    itPRAPolicyholderProtection: optStr(formData.get("itPRAPolicyholderProtection")),
    itFCAClientHarm: optStr(formData.get("itFCAClientHarm")),
    itFCAMarketIntegrity: optStr(formData.get("itFCAMarketIntegrity")),
    itBankFMIRegulator: optStr(formData.get("itBankFMIRegulator")),
    countryDataStored: optStr(formData.get("countryDataStored")),
    countryServiceDeliveredFrom: optStr(formData.get("countryServiceDeliveredFrom")),
    compliesWithRules: optEnum(
      formData.get("compliesWithRules"),
      Object.values(ComplianceStatus) as readonly (keyof typeof ComplianceStatus)[],
    ),
    assuranceSummary: optStr(formData.get("assuranceSummary")),
    smfSignedOff: optBool(formData.get("smfSignedOff")),
    governanceCommittee: optStr(formData.get("governanceCommittee")),
    governanceApprovedAt: optDate(formData.get("governanceApprovedAt")),
    substitutability: optEnum(
      formData.get("substitutability"),
      Object.values(Substitutability) as readonly (keyof typeof Substitutability)[],
    ),
    reintegrationAbility: optEnum(
      formData.get("reintegrationAbility"),
      Object.values(ReintegrationAbility) as readonly (keyof typeof ReintegrationAbility)[],
    ),
    impactOfDiscontinuing: optEnum(
      formData.get("impactOfDiscontinuing"),
      Object.values(ImpactDiscontinuation) as readonly (keyof typeof ImpactDiscontinuation)[],
    ),
  };
}

const UpsertVendor = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  serviceKind: z.string().optional(),
  tier: z.enum(["TIER_1", "TIER_2", "TIER_3"]),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  statusUrl: z.string().optional(),
  notes: z.string().optional(),
});

export async function upsertVendorAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const base = UpsertVendor.parse({
    id: formData.get("id") ?? undefined,
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    serviceKind: formData.get("serviceKind") ?? undefined,
    tier: formData.get("tier"),
    contactName: formData.get("contactName") ?? undefined,
    contactEmail: formData.get("contactEmail") ?? undefined,
    contactPhone: formData.get("contactPhone") ?? undefined,
    statusUrl: formData.get("statusUrl") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });

  const doraIctTierRaw = formData.get("doraIctTier");
  const doraIctTier =
    typeof doraIctTierRaw === "string" && doraIctTierRaw !== "" && doraIctTierRaw !== "none"
      ? (doraIctTierRaw as VendorTier)
      : null;

  const payload = {
    name: base.name,
    description: optStr(base.description ?? null),
    serviceKind: optStr(base.serviceKind ?? null),
    tier: base.tier as VendorTier,
    contactName: optStr(base.contactName ?? null),
    contactEmail: optStr(base.contactEmail ?? null),
    contactPhone: optStr(base.contactPhone ?? null),
    statusUrl: optStr(base.statusUrl ?? null),
    notes: optStr(base.notes ?? null),
    isDoraCritical: formData.get("isDoraCritical") === "on",
    doraIctTier,
    hyperscaler: optStr(formData.get("hyperscaler")),
    region: optStr(formData.get("region")),
    contractStartAt: optDate(formData.get("contractStartAt")),
    contractEndAt: optDate(formData.get("contractEndAt")),
    contractRenewalNoticeDays: optInt(formData.get("contractRenewalNoticeDays")),
    contractAnnualValueGBP: optInt(formData.get("contractAnnualValueGBP")),
    assuranceKind: optStr(formData.get("assuranceKind")),
    assuranceExpiryAt: optDate(formData.get("assuranceExpiryAt")),
    exitPlanReviewedAt: optDate(formData.get("exitPlanReviewedAt")),
    exitPlanRTOMin: optInt(formData.get("exitPlanRTOMin")),
    exitPlanNotes: optStr(formData.get("exitPlanNotes")),
    ...mtpFieldsFromFormData(formData),
  };

  let id: string;
  if (base.id) {
    await prisma.vendor.updateMany({
      where: { id: base.id, orgId: me.orgId },
      data: payload,
    });
    id = base.id;
  } else {
    const created = await prisma.vendor.create({
      data: { ...payload, orgId: me.orgId },
    });
    id = created.id;
  }
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
  return { id };
}

export async function deleteVendorAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  await prisma.vendor.deleteMany({ where: { id, orgId: me.orgId } });
  revalidatePath("/vendors");
}

/**
 * Lazy loader for the aggregate edit drawer. Returns everything the
 * detail page renders — full vendor scalars, assessments, ibsLinks,
 * notifications and live MTP readiness — so a single click can open
 * the full editing surface without overfetching every row up front.
 */
export async function getVendorEditBundle(id: string) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const vendor = await prisma.vendor.findFirst({
    where: { id, orgId: me.orgId },
    include: {
      assessments: { orderBy: [{ kind: "asc" }, { assessedAt: "desc" }] },
      ibsLinks: {
        include: { ibs: { select: { id: true, name: true, criticality: true } } },
      },
      notifications: { orderBy: { submissionId: "desc" } },
    },
  });
  if (!vendor) return null;
  const { evaluateVendorReadiness } = await import("@/lib/vendor-mtp-readiness");
  const readiness = evaluateVendorReadiness(vendor);
  return { vendor, readiness };
}

const LinkSchema = z.object({
  vendorId: z.string(),
  ibsId: z.string(),
});

export async function linkVendorToIBSAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const data = LinkSchema.parse(Object.fromEntries(formData));
  const vendor = await prisma.vendor.findFirst({
    where: { id: data.vendorId, orgId: me.orgId },
  });
  const ibs = await prisma.organizationIBS.findFirst({
    where: { id: data.ibsId, orgId: me.orgId },
  });
  if (!vendor || !ibs) return;
  await prisma.vendorIBSLink.upsert({
    where: { vendorId_ibsId: { vendorId: data.vendorId, ibsId: data.ibsId } },
    create: { vendorId: data.vendorId, ibsId: data.ibsId },
    update: {},
  });
  revalidatePath("/vendors");
}

export async function unlinkVendorFromIBSAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const vendorId = String(formData.get("vendorId"));
  const ibsId = String(formData.get("ibsId"));
  await prisma.vendorIBSLink.deleteMany({
    where: { vendorId, ibsId, vendor: { orgId: me.orgId } },
  });
  revalidatePath("/vendors");
}

/**
 * One-click add a vendor from the curated library. De-dupes by name within
 * the org — if the vendor already exists we just bounce back to /vendors so
 * the admin can see it. Audit captured so the org switcher / log can show
 * who seeded which providers.
 */
export async function addLibraryVendorAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const slug = String(formData.get("slug") ?? "");
  const lib = VENDOR_LIBRARY.find((v) => v.slug === slug);
  if (!lib) return;

  const dup = await prisma.vendor.findFirst({
    where: { orgId: me.orgId, name: lib.name },
    select: { id: true },
  });
  if (dup) {
    revalidatePath("/vendors");
    redirect("/vendors");
  }

  const created = await prisma.vendor.create({
    data: {
      orgId: me.orgId,
      name: lib.name,
      description: lib.description,
      serviceKind: lib.serviceKind,
      tier: lib.suggestedTier,
      isDoraCritical: lib.isDoraCritical,
      hyperscaler: lib.hyperscaler ?? null,
      region: lib.region ?? null,
      assuranceKind: lib.assuranceKind ?? null,
      statusUrl: lib.statusUrl ?? null,
    },
  });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "vendor.added-from-library",
    targetType: "vendor",
    targetId: created.id,
    summary: `Added vendor ${created.name} from library (${lib.category})`,
  });
  revalidatePath("/vendors");
  redirect("/vendors");
}
