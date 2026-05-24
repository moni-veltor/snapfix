"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";

const CreateInput = z.object({
  code: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, digits and hyphens only"),
  label: z.string().min(1).max(120),
  hint: z.string().max(200).optional(),
  approverRolesCsv: z.string().max(200).optional(),
  requiresDualControl: z.string().optional(),
});

export async function createOrgDecisionTypeAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const data = CreateInput.parse(Object.fromEntries(formData));

  const approverRoles =
    data.approverRolesCsv
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const requiresDualControl = data.requiresDualControl === "on";

  const existing = await prisma.orgDecisionType.findUnique({
    where: { orgId_code: { orgId: me.orgId, code: data.code } },
  });
  if (existing) {
    throw new Error(`A decision preset with code "${data.code}" already exists.`);
  }

  const maxSort = await prisma.orgDecisionType.aggregate({
    where: { orgId: me.orgId },
    _max: { sortOrder: true },
  });

  await prisma.orgDecisionType.create({
    data: {
      orgId: me.orgId,
      code: data.code,
      label: data.label,
      hint: data.hint ?? null,
      approverRoles,
      requiresDualControl,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 10,
    },
  });

  revalidatePath("/settings/decision-types");
}

const UpdateInput = z.object({
  id: z.string(),
  label: z.string().min(1).max(120),
  hint: z.string().max(200).optional(),
  approverRolesCsv: z.string().max(200).optional(),
  requiresDualControl: z.string().optional(),
});

export async function updateOrgDecisionTypeAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const data = UpdateInput.parse(Object.fromEntries(formData));

  const approverRoles =
    data.approverRolesCsv
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const requiresDualControl = data.requiresDualControl === "on";

  await prisma.orgDecisionType.updateMany({
    where: { id: data.id, orgId: me.orgId },
    data: {
      label: data.label,
      hint: data.hint ?? null,
      approverRoles,
      requiresDualControl,
    },
  });

  revalidatePath("/settings/decision-types");
}

export async function archiveOrgDecisionTypeAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  await prisma.orgDecisionType.updateMany({
    where: { id, orgId: me.orgId },
    data: { archived: true },
  });
  revalidatePath("/settings/decision-types");
}

export async function unarchiveOrgDecisionTypeAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  await prisma.orgDecisionType.updateMany({
    where: { id, orgId: me.orgId },
    data: { archived: false },
  });
  revalidatePath("/settings/decision-types");
}
