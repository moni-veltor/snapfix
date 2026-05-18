"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import {
  IBSResourceCriticality,
  IBSResourceKind,
} from "@/generated/prisma/enums";

async function loadIBS(ibsId: string) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const ibs = await prisma.organizationIBS.findFirst({
    where: { id: ibsId, orgId: me.orgId },
    select: { id: true },
  });
  return ibs ? { me, ibs } : null;
}

const Add = z.object({
  ibsId: z.string(),
  kind: z.nativeEnum(IBSResourceKind),
  label: z.string().min(1).max(160),
  criticality: z.nativeEnum(IBSResourceCriticality).optional(),
  vendorId: z.string().optional(),
  techSystemId: z.string().optional(),
  departmentId: z.string().optional(),
  note: z.string().max(500).optional(),
});

export async function addIBSResourceAction(formData: FormData) {
  const ctx = await loadIBS(String(formData.get("ibsId")));
  if (!ctx) return;
  const raw = Object.fromEntries(formData);
  const data = Add.parse({
    ...raw,
    vendorId: raw.vendorId === "" ? undefined : raw.vendorId,
    techSystemId: raw.techSystemId === "" ? undefined : raw.techSystemId,
    departmentId: raw.departmentId === "" ? undefined : raw.departmentId,
  });

  // Enforce at-most-one entity link
  const linkCount = [data.vendorId, data.techSystemId, data.departmentId].filter(Boolean).length;
  if (linkCount > 1) return;

  // Verify linked entity belongs to org
  if (data.vendorId) {
    const v = await prisma.vendor.findFirst({
      where: { id: data.vendorId, orgId: ctx.me.orgId },
      select: { id: true },
    });
    if (!v) return;
  }
  if (data.techSystemId) {
    const s = await prisma.techSystem.findFirst({
      where: { id: data.techSystemId, orgId: ctx.me.orgId },
      select: { id: true },
    });
    if (!s) return;
  }
  if (data.departmentId) {
    const d = await prisma.department.findFirst({
      where: { id: data.departmentId, orgId: ctx.me.orgId },
      select: { id: true },
    });
    if (!d) return;
  }

  const maxOrder = await prisma.iBSResource.aggregate({
    where: { ibsId: data.ibsId, kind: data.kind },
    _max: { orderIdx: true },
  });

  await prisma.iBSResource.create({
    data: {
      ibsId: data.ibsId,
      kind: data.kind,
      label: data.label,
      criticality: data.criticality ?? "SUPPORTING",
      vendorId: data.vendorId ?? null,
      techSystemId: data.techSystemId ?? null,
      departmentId: data.departmentId ?? null,
      note: data.note ?? null,
      orderIdx: (maxOrder._max.orderIdx ?? -1) + 1,
    },
  });

  revalidatePath(`/ibs/${data.ibsId}`);
}

const Update = z.object({
  ibsId: z.string(),
  resourceId: z.string(),
  label: z.string().min(1).max(160).optional(),
  criticality: z.nativeEnum(IBSResourceCriticality).optional(),
  kind: z.nativeEnum(IBSResourceKind).optional(),
  note: z.string().max(500).optional(),
});

export async function updateIBSResourceAction(formData: FormData) {
  const data = Update.parse(Object.fromEntries(formData));
  const ctx = await loadIBS(data.ibsId);
  if (!ctx) return;
  await prisma.iBSResource.updateMany({
    where: { id: data.resourceId, ibsId: data.ibsId },
    data: {
      ...(data.label !== undefined ? { label: data.label } : {}),
      ...(data.criticality !== undefined ? { criticality: data.criticality } : {}),
      ...(data.kind !== undefined ? { kind: data.kind } : {}),
      ...(data.note !== undefined ? { note: data.note } : {}),
    },
  });
  revalidatePath(`/ibs/${data.ibsId}`);
}

export async function removeIBSResourceAction(formData: FormData) {
  const ibsId = String(formData.get("ibsId"));
  const resourceId = String(formData.get("resourceId"));
  const ctx = await loadIBS(ibsId);
  if (!ctx) return;
  await prisma.iBSResource.deleteMany({
    where: { id: resourceId, ibsId },
  });
  revalidatePath(`/ibs/${ibsId}`);
}

/**
 * Idempotent fan-out: if this IBS has any of the legacy string-array fields
 * populated AND zero IBSResource rows yet, fan out the strings into rows.
 * Runs lazily on first render of the new editor so existing data isn't lost.
 */
export async function fanOutLegacyResourcesAction(ibsId: string): Promise<void> {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const ibs = await prisma.organizationIBS.findFirst({
    where: { id: ibsId, orgId: me.orgId },
    select: {
      id: true,
      technology: true,
      thirdParties: true,
      information: true,
      processes: true,
      peopleNotes: true,
      facilities: true,
      _count: { select: { resources: true } },
    },
  });
  if (!ibs) return;
  if (ibs._count.resources > 0) return; // already migrated

  const rows: { kind: IBSResourceKind; label: string; orderIdx: number }[] = [];
  let order = 0;
  const push = (kind: IBSResourceKind, items: string[]) => {
    for (const raw of items) {
      const label = raw.trim();
      if (!label) continue;
      rows.push({ kind, label, orderIdx: order++ });
    }
  };

  push("TECHNOLOGY", ibs.technology);
  push("THIRD_PARTY", ibs.thirdParties);
  push("INFORMATION", ibs.information);
  push("PROCESS", ibs.processes);
  if (ibs.peopleNotes) {
    // peopleNotes is single free-text; split on newlines for multi-line entries
    push("PEOPLE", ibs.peopleNotes.split(/\n+/));
  }
  if (ibs.facilities) {
    push("FACILITY", ibs.facilities.split(/\n+/));
  }

  if (rows.length === 0) return;

  await prisma.iBSResource.createMany({
    data: rows.map((r) => ({
      ibsId: ibs.id,
      kind: r.kind,
      label: r.label,
      orderIdx: r.orderIdx,
    })),
  });
}
