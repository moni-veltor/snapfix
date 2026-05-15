"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { SYSTEM_LIBRARY } from "@/lib/tech-system-library";
import type {
  DRTestOutcome,
  TechFailoverKind,
  TechSystemKind,
  TechSystemTier,
} from "@/generated/prisma/enums";

function optStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s;
}
function optInt(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}
function optDate(v: FormDataEntryValue | null): Date | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

const SYSTEM_KINDS: TechSystemKind[] = [
  "APPLICATION",
  "INFRASTRUCTURE",
  "DATABASE",
  "NETWORK",
  "AUTH",
  "OBSERVABILITY",
  "OTHER",
];
const SYSTEM_TIERS: TechSystemTier[] = ["CRITICAL", "ESSENTIAL", "IMPORTANT", "ROUTINE"];
const FAILOVER_KINDS: TechFailoverKind[] = [
  "ACTIVE_ACTIVE",
  "ACTIVE_PASSIVE",
  "WARM_STANDBY",
  "COLD_RESTORE",
  "NONE",
];
const DR_OUTCOMES: DRTestOutcome[] = ["PASS", "PARTIAL", "FAIL"];

export async function upsertTechSystemAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const kindRaw = String(formData.get("kind") ?? "APPLICATION");
  const tierRaw = String(formData.get("tier") ?? "IMPORTANT");
  const failoverRaw = String(formData.get("failoverKind") ?? "NONE");

  const data = {
    name,
    kind: (SYSTEM_KINDS.includes(kindRaw as TechSystemKind) ? kindRaw : "OTHER") as TechSystemKind,
    tier: (SYSTEM_TIERS.includes(tierRaw as TechSystemTier) ? tierRaw : "IMPORTANT") as TechSystemTier,
    description: optStr(formData.get("description")),
    owner: optStr(formData.get("owner")),
    rtoMin: optInt(formData.get("rtoMin")),
    rpoMin: optInt(formData.get("rpoMin")),
    mtpdMin: optInt(formData.get("mtpdMin")),
    primaryRegion: optStr(formData.get("primaryRegion")),
    failoverRegion: optStr(formData.get("failoverRegion")),
    failoverKind: (FAILOVER_KINDS.includes(failoverRaw as TechFailoverKind)
      ? failoverRaw
      : "NONE") as TechFailoverKind,
    backupFrequency: optStr(formData.get("backupFrequency")),
    backupRetentionDays: optInt(formData.get("backupRetentionDays")),
    lastBackupValidatedAt: optDate(formData.get("lastBackupValidatedAt")),
    notes: optStr(formData.get("notes")),
  };

  if (id) {
    await prisma.techSystem.updateMany({
      where: { id, orgId: me.orgId },
      data,
    });
  } else {
    await prisma.techSystem.create({
      data: { ...data, orgId: me.orgId },
    });
  }

  revalidatePath("/tech-recovery");
}

export async function deleteTechSystemAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.techSystem.deleteMany({ where: { id, orgId: me.orgId } });
  revalidatePath("/tech-recovery");
}

export async function logDRTestAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const systemId = String(formData.get("systemId") ?? "");
  const testedAt = optDate(formData.get("testedAt")) ?? new Date();
  const outcomeRaw = String(formData.get("outcome") ?? "PASS");
  const outcome = (DR_OUTCOMES.includes(outcomeRaw as DRTestOutcome)
    ? outcomeRaw
    : "PASS") as DRTestOutcome;

  // verify the system belongs to my org before logging
  const sys = await prisma.techSystem.findFirst({
    where: { id: systemId, orgId: me.orgId },
    select: { id: true },
  });
  if (!sys) return;

  await prisma.dRTest.create({
    data: {
      systemId,
      testedAt,
      outcome,
      rtoActualMin: optInt(formData.get("rtoActualMin")),
      rpoActualMin: optInt(formData.get("rpoActualMin")),
      participants: optStr(formData.get("participants")),
      notes: optStr(formData.get("notes")),
    },
  });

  revalidatePath("/tech-recovery");
}

/**
 * One-click add a system from the curated library. De-dupes by name within
 * the org (also enforced by the model's @@unique([orgId, name])). Seeds
 * objectives, failover topology and suggested regions so the admin can
 * tune from a sensible starting point.
 */
export async function addLibrarySystemAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const slug = String(formData.get("slug") ?? "");
  const lib = SYSTEM_LIBRARY.find((s) => s.slug === slug);
  if (!lib) return;

  const dup = await prisma.techSystem.findFirst({
    where: { orgId: me.orgId, name: lib.name },
    select: { id: true },
  });
  if (dup) {
    revalidatePath("/tech-recovery");
    redirect("/tech-recovery");
  }

  const created = await prisma.techSystem.create({
    data: {
      orgId: me.orgId,
      name: lib.name,
      kind: lib.kind,
      tier: lib.suggestedTier,
      description: lib.description,
      rtoMin: lib.rtoMin,
      rpoMin: lib.rpoMin,
      mtpdMin: lib.mtpdMin,
      failoverKind: lib.suggestedFailoverKind,
      primaryRegion: lib.primaryRegion ?? null,
      failoverRegion: lib.failoverRegion ?? null,
      backupFrequency: lib.backupFrequency ?? null,
      backupRetentionDays: lib.backupRetentionDays ?? null,
    },
  });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "system.added-from-library",
    targetType: "tech-system",
    targetId: created.id,
    summary: `Added system ${created.name} from library (${lib.kind})`,
  });
  revalidatePath("/tech-recovery");
  revalidatePath("/tech-recovery/library");
  redirect("/tech-recovery");
}
