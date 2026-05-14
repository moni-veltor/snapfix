"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { VendorTier } from "@/generated/prisma/enums";

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
  };

  if (base.id) {
    await prisma.vendor.updateMany({
      where: { id: base.id, orgId: me.orgId },
      data: payload,
    });
  } else {
    await prisma.vendor.create({ data: { ...payload, orgId: me.orgId } });
  }
  revalidatePath("/vendors");
  redirect("/vendors");
}

export async function deleteVendorAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  await prisma.vendor.deleteMany({ where: { id, orgId: me.orgId } });
  revalidatePath("/vendors");
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
