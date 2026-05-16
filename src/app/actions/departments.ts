"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

function optStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  abbreviation: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
  leadId: z.string().optional(),
});

export async function createDepartmentAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const parsed = CreateSchema.safeParse({
    name: formData.get("name"),
    abbreviation: formData.get("abbreviation") ?? undefined,
    description: formData.get("description") ?? undefined,
    parentId: formData.get("parentId") ?? undefined,
    leadId: formData.get("leadId") ?? undefined,
  });
  if (!parsed.success) return;
  const data = parsed.data;

  // Verify parent and lead belong to this org if specified.
  if (data.parentId) {
    const parent = await prisma.department.findFirst({
      where: { id: data.parentId, orgId: me.orgId },
      select: { id: true },
    });
    if (!parent) return;
  }
  if (data.leadId) {
    const lead = await prisma.user.findFirst({
      where: { id: data.leadId, orgId: me.orgId },
      select: { id: true },
    });
    if (!lead) return;
  }

  // Compute next orderIdx within the same parent scope.
  const maxIdx = await prisma.department.findFirst({
    where: { orgId: me.orgId, parentId: data.parentId ?? null },
    orderBy: { orderIdx: "desc" },
    select: { orderIdx: true },
  });

  const created = await prisma.department.create({
    data: {
      orgId: me.orgId,
      name: data.name,
      abbreviation: optStr(formData.get("abbreviation")),
      description: optStr(formData.get("description")),
      parentId: data.parentId || null,
      leadId: data.leadId || null,
      orderIdx: (maxIdx?.orderIdx ?? -1) + 1,
    },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "department.created",
    targetType: "department",
    targetId: created.id,
    summary: `Created department ${created.name}`,
  });

  revalidatePath("/org/departments");
  revalidatePath("/org");
}

const UpdateSchema = CreateSchema.extend({
  id: z.string().min(1),
});

export async function updateDepartmentAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const parsed = UpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    abbreviation: formData.get("abbreviation") ?? undefined,
    description: formData.get("description") ?? undefined,
    parentId: formData.get("parentId") ?? undefined,
    leadId: formData.get("leadId") ?? undefined,
  });
  if (!parsed.success) return;
  const { id, name, parentId, leadId } = parsed.data;

  // Verify ownership before update
  const dept = await prisma.department.findFirst({
    where: { id, orgId: me.orgId },
    select: { id: true },
  });
  if (!dept) return;

  // Prevent self-parent / cycles (basic check — for full cycle detection we
  // walk the parent chain; for v1 we just forbid setting yourself as parent).
  if (parentId && parentId === id) return;

  await prisma.department.update({
    where: { id },
    data: {
      name,
      abbreviation: optStr(formData.get("abbreviation")),
      description: optStr(formData.get("description")),
      parentId: parentId || null,
      leadId: leadId || null,
    },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "department.updated",
    targetType: "department",
    targetId: id,
    summary: `Updated department ${name}`,
  });

  revalidatePath("/org/departments");
  revalidatePath("/org");
}

export async function deleteDepartmentAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id") ?? "");
  const dept = await prisma.department.findFirst({
    where: { id, orgId: me.orgId },
    select: { id: true, name: true, _count: { select: { children: true, members: true } } },
  });
  if (!dept) return;
  // Refuse delete if it has children — admin must restructure first.
  if (dept._count.children > 0) return;

  await prisma.department.delete({ where: { id } });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "department.deleted",
    targetType: "department",
    targetId: id,
    summary: `Deleted department ${dept.name}`,
  });

  revalidatePath("/org/departments");
  revalidatePath("/org");
}

const AssignMemberSchema = z.object({
  userId: z.string().min(1),
  departmentId: z.string().optional(), // empty / undefined = unassign
});

export async function assignMemberToDepartmentAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const parsed = AssignMemberSchema.safeParse({
    userId: formData.get("userId"),
    departmentId: formData.get("departmentId") ?? undefined,
  });
  if (!parsed.success) return;

  const target = await prisma.user.findFirst({
    where: { id: parsed.data.userId, orgId: me.orgId },
    select: { id: true, name: true, email: true, departmentId: true },
  });
  if (!target) return;

  let deptName: string | null = null;
  if (parsed.data.departmentId) {
    const d = await prisma.department.findFirst({
      where: { id: parsed.data.departmentId, orgId: me.orgId },
      select: { id: true, name: true },
    });
    if (!d) return;
    deptName = d.name;
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { departmentId: parsed.data.departmentId || null },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "member.department_changed",
    targetType: "user",
    targetId: target.id,
    summary: deptName
      ? `${target.name ?? target.email} → department: ${deptName}`
      : `${target.name ?? target.email} → unassigned from department`,
  });

  revalidatePath(`/org/${target.id}`);
  revalidatePath("/org");
  revalidatePath("/org/departments");
}
