"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

const SettingsInput = z.object({
  name: z.string().min(1).max(120),
  tier: z.enum(["TIER_1", "TIER_2", "TIER_3"]).optional().or(z.literal("")),
});

export async function updateOrgSettingsAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const parsed = SettingsInput.parse({
    name: formData.get("name"),
    tier: formData.get("tier") || "",
  });
  const current = await prisma.organization.findUnique({ where: { id: me.orgId } });
  if (!current) return;

  const updates: { name?: string; tier?: "TIER_1" | "TIER_2" | "TIER_3" | null } = {};
  if (parsed.name !== current.name) updates.name = parsed.name;
  if (parsed.tier === "") {
    if (current.tier !== null) updates.tier = null;
  } else if (parsed.tier && parsed.tier !== current.tier) {
    updates.tier = parsed.tier;
  }
  if (Object.keys(updates).length === 0) return;

  await prisma.organization.update({ where: { id: me.orgId }, data: updates });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "settings.updated",
    targetType: "organization",
    targetId: me.orgId,
    summary: `Updated organisation settings`,
    metadata: updates as Record<string, unknown>,
  });
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB

export async function uploadOrgLogoAction(formData: FormData): Promise<void> {
  const me = await requireOrgRole("OWNER", "ADMIN");
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return;
  }
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > MAX_LOGO_BYTES) return;
  if (!/^image\/(png|jpe?g|svg\+xml|webp)$/.test(file.type)) return;
  const safeName = (file.name || "logo").replace(/[^\w.\-]+/g, "_");
  const pathname = `org/${me.orgId}/branding/${Date.now()}-${safeName}`;
  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || undefined,
    });
    // Best-effort: delete the old one
    const current = await prisma.organization.findUnique({ where: { id: me.orgId } });
    if (current?.logoBlobPath) {
      try {
        await del(current.logoBlobPath);
      } catch {
        /* ignore */
      }
    }
    await prisma.organization.update({
      where: { id: me.orgId },
      data: { logoBlobUrl: blob.url, logoBlobPath: blob.pathname },
    });
    await audit({
      orgId: me.orgId,
      actorId: me.id,
      action: "settings.updated",
      targetType: "organization",
      targetId: me.orgId,
      summary: `Updated organisation logo`,
    });
    revalidatePath("/settings");
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("[settings] logo upload failed:", err);
  }
}

export async function removeOrgLogoAction(_formData?: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const current = await prisma.organization.findUnique({ where: { id: me.orgId } });
  if (!current?.logoBlobUrl) return;
  if (current.logoBlobPath && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(current.logoBlobPath);
    } catch {
      /* ignore */
    }
  }
  await prisma.organization.update({
    where: { id: me.orgId },
    data: { logoBlobUrl: null, logoBlobPath: null },
  });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "settings.updated",
    targetType: "organization",
    targetId: me.orgId,
    summary: `Removed organisation logo`,
  });
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}
