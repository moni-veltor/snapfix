"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { DEFAULT_ROLES } from "@/lib/default-roles";

const RoleSchema = z.object({
  abbreviation: z.string().min(1).max(40),
  title: z.string().min(1).max(120),
  responsibility: z.string().max(500).optional().nullable(),
  isSMF: z.string().optional(),
  isExecutive: z.string().optional(),
  deputyOfRoleId: z.string().optional().nullable(),
  defaultHolderId: z.string().optional().nullable(),
});

function checkbox(v: FormDataEntryValue | null) {
  return v === "on" || v === "true";
}

function nullableId(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" || s === "none" ? null : s;
}

/** Create a new role at the bottom of the catalogue. */
export async function createRoleAction(formData: FormData): Promise<void> {
  const me = await requireOrgRole("OWNER", "ADMIN");

  const parsed = RoleSchema.parse({
    abbreviation: formData.get("abbreviation"),
    title: formData.get("title"),
    responsibility: formData.get("responsibility") ?? null,
    isSMF: formData.get("isSMF") ?? undefined,
    isExecutive: formData.get("isExecutive") ?? undefined,
    deputyOfRoleId: nullableId(formData.get("deputyOfRoleId")),
    defaultHolderId: nullableId(formData.get("defaultHolderId")),
  });

  const max = await prisma.organizationRole.aggregate({
    where: { orgId: me.orgId },
    _max: { orderIdx: true },
  });
  const nextIdx = (max._max.orderIdx ?? 0) + 1;

  await prisma.organizationRole.create({
    data: {
      orgId: me.orgId,
      abbreviation: parsed.abbreviation,
      title: parsed.title,
      responsibility: parsed.responsibility ?? null,
      isSMF: checkbox(formData.get("isSMF")),
      isExecutive: checkbox(formData.get("isExecutive")),
      deputyOfRoleId: parsed.deputyOfRoleId,
      defaultHolderId: parsed.defaultHolderId,
      orderIdx: nextIdx,
    },
  });

  revalidatePath("/org/roles");
}

export async function updateRoleAction(formData: FormData): Promise<void> {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const roleId = String(formData.get("roleId") ?? "");
  if (!roleId) return;

  const role = await prisma.organizationRole.findFirst({
    where: { id: roleId, orgId: me.orgId },
    select: { id: true },
  });
  if (!role) return;

  const parsed = RoleSchema.parse({
    abbreviation: formData.get("abbreviation"),
    title: formData.get("title"),
    responsibility: formData.get("responsibility") ?? null,
    isSMF: formData.get("isSMF") ?? undefined,
    isExecutive: formData.get("isExecutive") ?? undefined,
    deputyOfRoleId: nullableId(formData.get("deputyOfRoleId")),
    defaultHolderId: nullableId(formData.get("defaultHolderId")),
  });

  await prisma.organizationRole.update({
    where: { id: roleId },
    data: {
      abbreviation: parsed.abbreviation,
      title: parsed.title,
      responsibility: parsed.responsibility ?? null,
      isSMF: checkbox(formData.get("isSMF")),
      isExecutive: checkbox(formData.get("isExecutive")),
      deputyOfRoleId: parsed.deputyOfRoleId,
      defaultHolderId: parsed.defaultHolderId,
    },
  });

  revalidatePath("/org/roles");
}

export async function deleteRoleAction(formData: FormData): Promise<void> {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const roleId = String(formData.get("roleId") ?? "");
  if (!roleId) return;

  const role = await prisma.organizationRole.findFirst({
    where: { id: roleId, orgId: me.orgId },
    select: { id: true, seats: { select: { id: true }, take: 1 } },
  });
  if (!role) return;

  // Refuse if this role is in use by a live exercise seat.
  if (role.seats.length > 0) {
    redirect("/org/roles?error=role-in-use");
  }

  await prisma.organizationRole.delete({ where: { id: roleId } });
  revalidatePath("/org/roles");
}

export async function moveRoleAction(formData: FormData): Promise<void> {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const roleId = String(formData.get("roleId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!roleId || (direction !== "up" && direction !== "down")) return;

  const roles = await prisma.organizationRole.findMany({
    where: { orgId: me.orgId },
    orderBy: { orderIdx: "asc" },
    select: { id: true, orderIdx: true },
  });
  const idx = roles.findIndex((r) => r.id === roleId);
  if (idx === -1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= roles.length) return;

  const a = roles[idx];
  const b = roles[swapIdx];

  // Normalise to dense order first so sequential swaps stay stable.
  await prisma.$transaction([
    prisma.organizationRole.update({
      where: { id: a.id },
      data: { orderIdx: b.orderIdx },
    }),
    prisma.organizationRole.update({
      where: { id: b.id },
      data: { orderIdx: a.orderIdx },
    }),
  ]);

  revalidatePath("/org/roles");
}

/**
 * Apply the canonical default catalogue — adds any roles by abbreviation not
 * already present. Won't remove existing roles or overwrite edited fields.
 * Safe to run multiple times.
 */
export async function applyDefaultRolesAction(): Promise<void> {
  const me = await requireOrgRole("OWNER", "ADMIN");

  const existing = await prisma.organizationRole.findMany({
    where: { orgId: me.orgId },
    select: { abbreviation: true },
  });
  const existingAbbrs = new Set(existing.map((r) => r.abbreviation));

  const max = await prisma.organizationRole.aggregate({
    where: { orgId: me.orgId },
    _max: { orderIdx: true },
  });
  let nextIdx = (max._max.orderIdx ?? 0) + 1;

  for (const role of DEFAULT_ROLES) {
    if (existingAbbrs.has(role.abbreviation)) continue;
    await prisma.organizationRole.create({
      data: {
        orgId: me.orgId,
        abbreviation: role.abbreviation,
        title: role.title,
        responsibility: role.responsibility,
        isSMF: role.isSMF,
        isExecutive: role.isExecutive,
        orderIdx: nextIdx++,
      },
    });
  }

  // Second pass: now that all default roles exist, wire up the deputy chain
  // for any newly inserted rows (skips rows the admin had already created).
  const all = await prisma.organizationRole.findMany({
    where: { orgId: me.orgId },
    select: { id: true, abbreviation: true, deputyOfRoleId: true },
  });
  const byAbbr = new Map(all.map((r) => [r.abbreviation, r]));
  for (const role of DEFAULT_ROLES) {
    if (!role.deputyOf) continue;
    const row = byAbbr.get(role.abbreviation);
    const dep = byAbbr.get(role.deputyOf);
    if (row && dep && !row.deputyOfRoleId) {
      await prisma.organizationRole.update({
        where: { id: row.id },
        data: { deputyOfRoleId: dep.id },
      });
    }
  }

  revalidatePath("/org/roles");
}
