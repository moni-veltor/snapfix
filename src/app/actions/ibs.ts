"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

const ImpactLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const Criticality = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

const stringList = (s?: string) =>
  (s ?? "").split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

const IBSInput = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(200),
  outcome: z.string().optional(),
  description: z.string().optional(),
  processType: z.string().optional(),
  processOwner: z.string().optional(),
  secondLineReviewer: z.string().optional(),
  reviewDueAt: z.string().optional(),
  customerJourneys: z.string().optional(),
  productsCovered: z.string().optional(),
  impactToleranceMin: z.coerce.number().int().min(0).max(60 * 24 * 365),
  fcaToleranceMin: z.coerce.number().int().min(0).optional().or(z.literal("")),
  praToleranceMin: z.coerce.number().int().min(0).optional().or(z.literal("")),
  toleranceRationale: z.string().optional(),
  criticality: z.enum(Criticality),
  technology: z.string().optional(),
  peopleNotes: z.string().optional(),
  facilities: z.string().optional(),
  thirdParties: z.string().optional(),
  information: z.string().optional(),
  processes: z.string().optional(),
  impactCustomerFinancial: z.enum(ImpactLevels).optional().or(z.literal("")),
  impactVulnerableCustomer: z.enum(ImpactLevels).optional().or(z.literal("")),
  impactLossOfLicense: z.enum(ImpactLevels).optional().or(z.literal("")),
  impactRegulatoryFine: z.enum(ImpactLevels).optional().or(z.literal("")),
  impactReputational: z.enum(ImpactLevels).optional().or(z.literal("")),
  impactLossOfCapital: z.enum(ImpactLevels).optional().or(z.literal("")),
  importanceAssessmentNotes: z.string().optional(),
  vulnerabilitiesNotes: z.string().optional(),
  testingNotes: z.string().optional(),
  coversPeople: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
  coversProperty: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
  coversTechnology: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
  coversDataAvailability: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
  coversDataIntegrity: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
  coversThirdParty: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
});

function mapData(parsed: z.infer<typeof IBSInput>) {
  const num = (v: number | "" | undefined) => (v === "" || v === undefined ? null : v);
  const lvl = (v: string | undefined | "") => (v === "" || v === undefined ? null : (v as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"));
  return {
    code: parsed.code,
    name: parsed.name,
    outcome: parsed.outcome ?? null,
    description: parsed.description ?? null,
    processType: parsed.processType ?? null,
    processOwner: parsed.processOwner ?? null,
    secondLineReviewer: parsed.secondLineReviewer ?? null,
    reviewDueAt: parsed.reviewDueAt ? new Date(parsed.reviewDueAt) : null,
    customerJourneys: stringList(parsed.customerJourneys),
    productsCovered: stringList(parsed.productsCovered),
    impactToleranceMin: parsed.impactToleranceMin,
    fcaToleranceMin: num(parsed.fcaToleranceMin as number | "" | undefined),
    praToleranceMin: num(parsed.praToleranceMin as number | "" | undefined),
    toleranceRationale: parsed.toleranceRationale ?? null,
    criticality: parsed.criticality,
    technology: stringList(parsed.technology),
    peopleNotes: parsed.peopleNotes ?? null,
    facilities: parsed.facilities ?? null,
    thirdParties: stringList(parsed.thirdParties),
    information: stringList(parsed.information),
    processes: stringList(parsed.processes),
    impactCustomerFinancial: lvl(parsed.impactCustomerFinancial),
    impactVulnerableCustomer: lvl(parsed.impactVulnerableCustomer),
    impactLossOfLicense: lvl(parsed.impactLossOfLicense),
    impactRegulatoryFine: lvl(parsed.impactRegulatoryFine),
    impactReputational: lvl(parsed.impactReputational),
    impactLossOfCapital: lvl(parsed.impactLossOfCapital),
    importanceAssessmentNotes: parsed.importanceAssessmentNotes ?? null,
    vulnerabilitiesNotes: parsed.vulnerabilitiesNotes ?? null,
    testingNotes: parsed.testingNotes ?? null,
    coversPeople: parsed.coversPeople,
    coversProperty: parsed.coversProperty,
    coversTechnology: parsed.coversTechnology,
    coversDataAvailability: parsed.coversDataAvailability,
    coversDataIntegrity: parsed.coversDataIntegrity,
    coversThirdParty: parsed.coversThirdParty,
  };
}

export async function createIBSAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const parsed = IBSInput.parse(Object.fromEntries(formData));
  const data = mapData(parsed);
  const ibs = await prisma.organizationIBS.create({
    data: { ...data, orgId: me.orgId, createdById: me.id },
  });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "ibs.created",
    targetType: "ibs",
    targetId: ibs.id,
    summary: `Created IBS ${ibs.code} — ${ibs.name}`,
  });
  redirect(`/ibs/${ibs.id}`);
}

export async function updateIBSAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  const parsed = IBSInput.parse(Object.fromEntries(formData));
  const data = mapData(parsed);
  const existing = await prisma.organizationIBS.findFirst({ where: { id, orgId: me.orgId } });
  if (!existing) redirect("/ibs");
  await prisma.organizationIBS.update({ where: { id }, data });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "ibs.updated",
    targetType: "ibs",
    targetId: id,
    summary: `Updated IBS ${parsed.code} — ${parsed.name}`,
  });
  revalidatePath(`/ibs/${id}`);
  revalidatePath("/ibs");
}

/**
 * Partial update used by the quick-edit drawer on the IBS register. Only
 * the fields present in formData are written, so the drawer can ship a
 * subset (name / criticality / status / tolerance / process owner / 6-box
 * harm flags) without re-asserting the entire IBSInput payload that the
 * full-page editor uses.
 */
export async function quickUpdateIBSAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  if (!id) return;

  const existing = await prisma.organizationIBS.findFirst({
    where: { id, orgId: me.orgId },
    select: { id: true, code: true, name: true },
  });
  if (!existing) return;

  const data: Record<string, unknown> = {};

  const name = formData.get("name");
  if (typeof name === "string" && name.trim().length > 0) data.name = name.trim();

  const criticality = formData.get("criticality");
  if (typeof criticality === "string" && criticality) data.criticality = criticality;

  const status = formData.get("status");
  if (typeof status === "string" && status) data.status = status;

  const tol = formData.get("impactToleranceMin");
  if (typeof tol === "string" && tol.trim()) {
    const n = Number(tol);
    if (Number.isFinite(n) && n >= 0) data.impactToleranceMin = Math.round(n);
  }

  const processOwner = formData.get("processOwner");
  if (typeof processOwner === "string") data.processOwner = processOwner.trim() || null;

  const description = formData.get("description");
  if (typeof description === "string") data.description = description.trim() || null;

  // 6-box harm toggles arrive as "on" when checked.
  for (const key of [
    "coversPeople",
    "coversProperty",
    "coversTechnology",
    "coversDataAvailability",
    "coversDataIntegrity",
    "coversThirdParty",
  ] as const) {
    data[key] = formData.get(key) === "on";
  }

  if (Object.keys(data).length === 0) return;

  await prisma.organizationIBS.update({ where: { id }, data });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "ibs.updated",
    targetType: "ibs",
    targetId: id,
    summary: `Quick-edited IBS ${existing.code}`,
  });
  revalidatePath("/ibs");
  revalidatePath(`/ibs/${id}`);
}

export async function approveIBSAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  const existing = await prisma.organizationIBS.findFirst({ where: { id, orgId: me.orgId } });
  if (!existing) return;
  await prisma.organizationIBS.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date() },
  });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "ibs.approved",
    targetType: "ibs",
    targetId: id,
    summary: `Approved IBS ${existing.code} — ${existing.name}`,
  });
  revalidatePath(`/ibs/${id}`);
  revalidatePath("/ibs");
}

export async function deprecateIBSAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  const existing = await prisma.organizationIBS.findFirst({ where: { id, orgId: me.orgId } });
  if (!existing) return;
  await prisma.organizationIBS.update({ where: { id }, data: { status: "DEPRECATED" } });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "ibs.deprecated",
    targetType: "ibs",
    targetId: id,
    summary: `Deprecated IBS ${existing.code} — ${existing.name}`,
  });
  revalidatePath(`/ibs/${id}`);
  revalidatePath("/ibs");
}

export async function deleteIBSAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  const existing = await prisma.organizationIBS.findFirst({ where: { id, orgId: me.orgId } });
  if (!existing) return;
  await prisma.organizationIBS.delete({ where: { id } });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "ibs.deleted",
    targetType: "ibs",
    targetId: id,
    summary: `Deleted IBS ${existing.code} — ${existing.name}`,
  });
  redirect("/ibs");
}

import { IBS_LIBRARY } from "@/lib/ibs-library";

/**
 * Add a pre-built IBS from the library into the org's register. Generates
 * the next IBS_NN code automatically so admins don't need to manage codes.
 */
export async function addLibraryIBSAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const slug = String(formData.get("slug") ?? "");
  const lib = IBS_LIBRARY.find((i) => i.slug === slug);
  if (!lib) return;

  // Generate the next sequential IBS_NN code for this org.
  const existing = await prisma.organizationIBS.findMany({
    where: { orgId: me.orgId },
    select: { code: true },
  });
  let maxN = 0;
  for (const e of existing) {
    const m = e.code.match(/^IBS_(\d+)$/i);
    if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
  }
  const nextCode = `IBS_${String(maxN + 1).padStart(2, "0")}`;

  // Avoid duplicate-by-name within the same org.
  const dup = await prisma.organizationIBS.findFirst({
    where: { orgId: me.orgId, name: lib.name },
    select: { id: true },
  });
  if (dup) {
    redirect(`/ibs/${dup.id}`);
  }

  const created = await prisma.organizationIBS.create({
    data: {
      orgId: me.orgId,
      code: nextCode,
      name: lib.name,
      outcome: lib.outcome,
      description: lib.description ?? null,
      impactToleranceMin: lib.toleranceMin,
      fcaToleranceMin: lib.fcaToleranceMin ?? null,
      praToleranceMin: lib.praToleranceMin ?? null,
      criticality: lib.criticality,
      customerJourneys: lib.customerJourneys ?? [],
      productsCovered: lib.productsCovered ?? [],
      technology: lib.technology ?? [],
      thirdParties: lib.thirdParties ?? [],
      information: lib.information ?? [],
      processes: lib.processes ?? [],
      coversPeople: lib.coversPeople ?? false,
      coversProperty: lib.coversProperty ?? false,
      coversTechnology: lib.coversTechnology ?? false,
      coversDataAvailability: lib.coversDataAvailability ?? false,
      coversDataIntegrity: lib.coversDataIntegrity ?? false,
      coversThirdParty: lib.coversThirdParty ?? false,
    },
  });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "ibs.added-from-library",
    targetType: "ibs",
    targetId: created.id,
    summary: `Added ${created.code} — ${created.name} from library (slug: ${slug})`,
  });
  revalidatePath("/ibs");
  redirect(`/ibs/${created.id}`);
}
