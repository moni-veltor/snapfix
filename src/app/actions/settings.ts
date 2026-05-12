"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/slug";

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

  // If name changed, keep slug intact (slugs are immutable to avoid breaking links).
  // If tier changed, update.
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
  // Force slug stays the same; just revalidate paths.
  // Use a derived slug just to keep slugify referenced if needed later.
  void slugify;
  revalidatePath("/settings");
  revalidatePath("/");
}
