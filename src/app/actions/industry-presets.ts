"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { presetById, type Preset } from "@/lib/industry-presets";

/**
 * Apply an industry preset to the current org. Non-destructive:
 *  - Roles by abbreviation are skipped if already present
 *  - IBSs by code are skipped if already present
 *  - Vendors by name are skipped if already present
 *  - Tech systems by name are skipped if already present
 * Returns a summary that can be shown to the admin.
 */
export async function applyIndustryPresetAction(formData: FormData): Promise<void> {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("presetId") ?? "");
  const preset = presetById(id);
  if (!preset) return;

  await applyPreset(me.orgId, preset);

  revalidatePath("/dashboard");
  revalidatePath("/org/roles");
  revalidatePath("/ibs");
  revalidatePath("/vendors");
  revalidatePath("/tech-recovery");
  redirect("/settings/presets?applied=" + preset.id);
}

async function applyPreset(orgId: string, preset: Preset) {
  // Roles — by abbreviation
  const existingRoles = await prisma.organizationRole.findMany({
    where: { orgId },
    select: { abbreviation: true },
  });
  const existingAbbrs = new Set(existingRoles.map((r) => r.abbreviation));
  const maxOrder = await prisma.organizationRole.aggregate({
    where: { orgId },
    _max: { orderIdx: true },
  });
  let nextOrder = (maxOrder._max.orderIdx ?? 0) + 1;
  for (const r of preset.roles) {
    if (existingAbbrs.has(r.abbreviation)) continue;
    await prisma.organizationRole.create({
      data: {
        orgId,
        abbreviation: r.abbreviation,
        title: r.title,
        responsibility: r.responsibility,
        isSMF: r.isSMF,
        isExecutive: r.isExecutive,
        orderIdx: nextOrder++,
      },
    });
  }
  // Second pass: wire deputy chain for newly created roles
  const all = await prisma.organizationRole.findMany({
    where: { orgId },
    select: { id: true, abbreviation: true, deputyOfRoleId: true },
  });
  const byAbbr = new Map(all.map((r) => [r.abbreviation, r]));
  for (const r of preset.roles) {
    if (!r.deputyOf) continue;
    const row = byAbbr.get(r.abbreviation);
    const dep = byAbbr.get(r.deputyOf);
    if (row && dep && !row.deputyOfRoleId) {
      await prisma.organizationRole.update({
        where: { id: row.id },
        data: { deputyOfRoleId: dep.id },
      });
    }
  }

  // IBSs — by code
  const existingIBS = await prisma.organizationIBS.findMany({
    where: { orgId },
    select: { code: true },
  });
  const existingIBSCodes = new Set(existingIBS.map((i) => i.code));
  for (const ibs of preset.ibs) {
    if (existingIBSCodes.has(ibs.code)) continue;
    await prisma.organizationIBS.create({
      data: {
        orgId,
        code: ibs.code,
        name: ibs.name,
        outcome: ibs.outcome,
        impactToleranceMin: ibs.toleranceMin,
        fcaToleranceMin: ibs.fcaToleranceMin ?? null,
        praToleranceMin: ibs.praToleranceMin ?? null,
        criticality: ibs.criticality,
        coversPeople: ibs.coversPeople ?? false,
        coversProperty: ibs.coversProperty ?? false,
        coversTechnology: ibs.coversTechnology ?? false,
        coversDataAvailability: ibs.coversDataAvailability ?? false,
        coversDataIntegrity: ibs.coversDataIntegrity ?? false,
        coversThirdParty: ibs.coversThirdParty ?? false,
        technology: ibs.technology ?? [],
        thirdParties: ibs.thirdParties ?? [],
      },
    });
  }

  // Vendors — by name
  const existingVendors = await prisma.vendor.findMany({
    where: { orgId },
    select: { name: true },
  });
  const existingVendorNames = new Set(existingVendors.map((v) => v.name));
  for (const v of preset.vendors) {
    if (existingVendorNames.has(v.name)) continue;
    await prisma.vendor.create({
      data: {
        orgId,
        name: v.name,
        description: v.description ?? null,
        serviceKind: v.serviceKind ?? null,
        tier: v.tier,
        isDoraCritical: v.isDoraCritical ?? false,
        hyperscaler: v.hyperscaler ?? null,
        region: v.region ?? null,
        assuranceKind: v.assuranceKind ?? null,
      },
    });
  }

  // Tech systems — by name
  const existingSystems = await prisma.techSystem.findMany({
    where: { orgId },
    select: { name: true },
  });
  const existingSystemNames = new Set(existingSystems.map((s) => s.name));
  for (const s of preset.techSystems) {
    if (existingSystemNames.has(s.name)) continue;
    await prisma.techSystem.create({
      data: {
        orgId,
        name: s.name,
        kind: s.kind,
        tier: s.tier,
        description: s.description ?? null,
        rtoMin: s.rtoMin ?? null,
        rpoMin: s.rpoMin ?? null,
        mtpdMin: s.mtpdMin ?? null,
        primaryRegion: s.primaryRegion ?? null,
        failoverRegion: s.failoverRegion ?? null,
        failoverKind: s.failoverKind ?? "NONE",
      },
    });
  }
}
