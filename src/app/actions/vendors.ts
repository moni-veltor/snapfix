"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { VendorTier } from "@/generated/prisma/enums";

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
  const data = UpsertVendor.parse(Object.fromEntries(formData));
  const payload = {
    name: data.name,
    description: data.description ?? null,
    serviceKind: data.serviceKind ?? null,
    tier: data.tier as VendorTier,
    contactName: data.contactName ?? null,
    contactEmail: data.contactEmail ?? null,
    contactPhone: data.contactPhone ?? null,
    statusUrl: data.statusUrl ?? null,
    notes: data.notes ?? null,
  };
  if (data.id) {
    await prisma.vendor.updateMany({
      where: { id: data.id, orgId: me.orgId },
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
