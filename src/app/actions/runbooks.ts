"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { RunbookCategory } from "@/generated/prisma/enums";
import {
  findLibraryRunbook,
  LIBRARY_RUNBOOKS,
  type LibraryRunbook,
} from "@/lib/library/runbooks";

function optStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s;
}

function parseCategory(v: FormDataEntryValue | null): RunbookCategory {
  const raw = typeof v === "string" ? v : "";
  const allowed = Object.values(RunbookCategory);
  return (allowed as string[]).includes(raw) ? (raw as RunbookCategory) : "OTHER";
}

export async function createRunbookAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const title = optStr(formData.get("title"));
  if (!title) return;
  const category = parseCategory(formData.get("category"));
  const description = optStr(formData.get("description"));
  const ownerRoleTitle = optStr(formData.get("ownerRoleTitle"));

  const runbook = await prisma.runbook.create({
    data: {
      orgId: me.orgId,
      title,
      category,
      description,
      ownerRoleTitle,
      createdById: me.id,
    },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.created",
    targetType: "Runbook",
    targetId: runbook.id,
    summary: `Created runbook "${runbook.title}"`,
    metadata: { category, runbookId: runbook.id },
  });

  revalidatePath("/runbooks");
  redirect(`/runbooks/${runbook.id}`);
}

export async function addRunbookFromLibraryAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const slug = optStr(formData.get("slug"));
  if (!slug) return;
  const lib = findLibraryRunbook(slug);
  if (!lib) return;

  const created = await cloneLibraryRunbookIntoOrg(lib, me.orgId, me.id);

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.cloned_from_library",
    targetType: "Runbook",
    targetId: created.id,
    summary: `Added "${lib.title}" from runbook library`,
    metadata: { slug, runbookId: created.id },
  });

  revalidatePath("/runbooks");
  redirect(`/runbooks/${created.id}`);
}

export async function archiveRunbookAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = optStr(formData.get("id"));
  if (!id) return;
  const runbook = await prisma.runbook.findFirst({ where: { id, orgId: me.orgId } });
  if (!runbook) return;
  await prisma.runbook.update({
    where: { id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.archived",
    targetType: "Runbook",
    targetId: id,
    summary: `Archived runbook "${runbook.title}"`,
  });
  revalidatePath("/runbooks");
}

export async function restoreRunbookAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = optStr(formData.get("id"));
  if (!id) return;
  await prisma.runbook.updateMany({
    where: { id, orgId: me.orgId },
    data: { status: "DRAFT", archivedAt: null },
  });
  revalidatePath("/runbooks");
}

export async function deleteRunbookAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = optStr(formData.get("id"));
  if (!id) return;
  const runbook = await prisma.runbook.findFirst({ where: { id, orgId: me.orgId } });
  if (!runbook) return;
  await prisma.runbook.delete({ where: { id } });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.deleted",
    targetType: "Runbook",
    targetId: id,
    summary: `Deleted runbook "${runbook.title}"`,
  });
  revalidatePath("/runbooks");
  redirect("/runbooks");
}

export async function seedAllLibraryRunbooksAction() {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const existing = await prisma.runbook.findMany({
    where: { orgId: me.orgId },
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((r) => r.title));

  for (const lib of LIBRARY_RUNBOOKS) {
    if (existingTitles.has(lib.title)) continue;
    await cloneLibraryRunbookIntoOrg(lib, me.orgId, me.id);
  }

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.library_seeded",
    targetType: "Runbook",
    targetId: me.orgId,
    summary: "Seeded all library runbooks",
  });
  revalidatePath("/runbooks");
}

async function cloneLibraryRunbookIntoOrg(
  lib: LibraryRunbook,
  orgId: string,
  userId: string,
) {
  const slugToOrderIdx = new Map<string, number>();
  lib.steps.forEach((s, i) => slugToOrderIdx.set(s.slug, i));

  const runbook = await prisma.runbook.create({
    data: {
      orgId,
      title: lib.title,
      description: lib.description,
      category: lib.category,
      ownerRoleTitle: lib.ownerRoleTitle,
      createdById: userId,
      status: "DRAFT",
      steps: {
        create: lib.steps.map((s, i) => ({
          orderIdx: i,
          title: s.title,
          description: s.description,
          kind: s.kind,
          ownerRoleTitle: s.ownerRoleTitle,
          estimatedMin: s.estimatedMin,
          successCriteria: s.successCriteria,
          blocksOrders:
            s.dependsOn
              ?.map((slug) => slugToOrderIdx.get(slug))
              .filter((n): n is number => typeof n === "number") ?? [],
          decisionTypeCode: s.decisionTypeCode,
          regulatorTrigger: s.regulatorTrigger ? s.regulatorTrigger : undefined,
          commsTemplate: s.commsTemplate ? s.commsTemplate : undefined,
        })),
      },
      ...(lib.trigger
        ? {
            trigger: {
              create: {
                severityAtLeast: lib.trigger.severityAtLeast ?? null,
                scenarioCategoryEquals: lib.trigger.scenarioCategoryEquals ?? null,
              },
            },
          }
        : {}),
    },
  });

  return runbook;
}
