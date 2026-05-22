"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { RunbookCategory, RunbookStepKind } from "@/generated/prisma/enums";
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
  await resolveLibraryEscalations(me.orgId);

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
  await resolveLibraryEscalations(me.orgId);

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

function optInt(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function parseStepKind(v: FormDataEntryValue | null): RunbookStepKind {
  const raw = typeof v === "string" ? v : "";
  const allowed = Object.values(RunbookStepKind);
  return (allowed as string[]).includes(raw) ? (raw as RunbookStepKind) : "ACTION";
}

async function requireOwnedRunbook(runbookId: string, orgId: string) {
  const runbook = await prisma.runbook.findFirst({
    where: { id: runbookId, orgId },
    select: { id: true, title: true, status: true },
  });
  if (!runbook) throw new Error("Runbook not found");
  return runbook;
}

export async function updateRunbookMetadataAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = optStr(formData.get("id"));
  if (!id) return;
  const runbook = await requireOwnedRunbook(id, me.orgId);
  const title = optStr(formData.get("title")) ?? runbook.title;
  const description = optStr(formData.get("description"));
  const ownerRoleTitle = optStr(formData.get("ownerRoleTitle"));
  const category = parseCategory(formData.get("category"));

  await prisma.runbook.update({
    where: { id },
    data: { title, description, ownerRoleTitle, category },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.updated",
    targetType: "Runbook",
    targetId: id,
    summary: `Updated runbook "${title}"`,
  });
  revalidatePath(`/runbooks/${id}`);
  revalidatePath("/runbooks");
}

export async function addRunbookStepAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const runbookId = optStr(formData.get("runbookId"));
  if (!runbookId) return;
  await requireOwnedRunbook(runbookId, me.orgId);

  const lastStep = await prisma.runbookStep.findFirst({
    where: { runbookId },
    orderBy: { orderIdx: "desc" },
    select: { orderIdx: true },
  });
  const orderIdx = (lastStep?.orderIdx ?? -1) + 1;

  await prisma.runbookStep.create({
    data: {
      runbookId,
      orderIdx,
      title: "New step",
      kind: "ACTION",
      blocksOrders: [],
    },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.step.added",
    targetType: "Runbook",
    targetId: runbookId,
    summary: `Added step #${orderIdx + 1}`,
  });
  revalidatePath(`/runbooks/${runbookId}`);
}

export async function updateRunbookStepAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const stepId = optStr(formData.get("stepId"));
  if (!stepId) return;

  const step = await prisma.runbookStep.findUnique({
    where: { id: stepId },
    select: { id: true, runbookId: true, runbook: { select: { orgId: true } } },
  });
  if (!step || step.runbook.orgId !== me.orgId) return;

  const title = optStr(formData.get("title")) ?? "Untitled";
  const description = optStr(formData.get("description"));
  const kind = parseStepKind(formData.get("kind"));
  const ownerRoleTitle = optStr(formData.get("ownerRoleTitle"));
  const estimatedMin = optInt(formData.get("estimatedMin"));
  const successCriteria = optStr(formData.get("successCriteria"));

  const blocksOrdersRaw = formData.getAll("blocksOrders");
  const blocksOrders = blocksOrdersRaw
    .map((v) => (typeof v === "string" ? Number.parseInt(v, 10) : NaN))
    .filter((n) => Number.isFinite(n));

  // Kind-specific fields
  const decisionTypeCode =
    kind === "DECISION" ? optStr(formData.get("decisionTypeCode")) : null;

  let regulatorTrigger: { regulator: string; slaHours: number; trigger: string } | null = null;
  if (kind === "NOTIFICATION") {
    const regulator = optStr(formData.get("regulator"));
    const slaHours = optInt(formData.get("slaHours"));
    const triggerSource =
      optStr(formData.get("regTriggerSource")) ?? "POST_INVOCATION";
    if (regulator && slaHours !== null) {
      regulatorTrigger = { regulator, slaHours, trigger: triggerSource };
    }
  }

  let commsTemplate: { stakeholder: string; subject: string; bodyTemplate: string } | null = null;
  if (kind === "COMMS") {
    const stakeholder = optStr(formData.get("commsStakeholder"));
    const subject = optStr(formData.get("commsSubject"));
    const bodyTemplate = optStr(formData.get("commsBody"));
    if (stakeholder && subject && bodyTemplate) {
      commsTemplate = { stakeholder, subject, bodyTemplate };
    }
  }

  await prisma.runbookStep.update({
    where: { id: stepId },
    data: {
      title,
      description,
      kind,
      ownerRoleTitle,
      estimatedMin,
      successCriteria,
      blocksOrders,
      decisionTypeCode,
      regulatorTrigger: regulatorTrigger ?? undefined,
      commsTemplate: commsTemplate ?? undefined,
    },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.step.updated",
    targetType: "RunbookStep",
    targetId: stepId,
    summary: `Updated step "${title}"`,
  });
  revalidatePath(`/runbooks/${step.runbookId}`);
}

export async function deleteRunbookStepAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const stepId = optStr(formData.get("stepId"));
  if (!stepId) return;
  const step = await prisma.runbookStep.findUnique({
    where: { id: stepId },
    select: { id: true, runbookId: true, runbook: { select: { orgId: true } } },
  });
  if (!step || step.runbook.orgId !== me.orgId) return;

  await prisma.runbookStep.delete({ where: { id: stepId } });

  // Re-sequence remaining steps to keep orderIdx dense.
  const remaining = await prisma.runbookStep.findMany({
    where: { runbookId: step.runbookId },
    orderBy: { orderIdx: "asc" },
    select: { id: true, orderIdx: true },
  });
  await Promise.all(
    remaining.map((s, i) =>
      s.orderIdx === i
        ? Promise.resolve()
        : prisma.runbookStep.update({ where: { id: s.id }, data: { orderIdx: i } }),
    ),
  );

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.step.deleted",
    targetType: "RunbookStep",
    targetId: stepId,
    summary: "Deleted runbook step",
  });
  revalidatePath(`/runbooks/${step.runbookId}`);
}

export async function moveRunbookStepAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const stepId = optStr(formData.get("stepId"));
  const direction = optStr(formData.get("direction"));
  if (!stepId || (direction !== "up" && direction !== "down")) return;

  const step = await prisma.runbookStep.findUnique({
    where: { id: stepId },
    select: { id: true, orderIdx: true, runbookId: true, runbook: { select: { orgId: true } } },
  });
  if (!step || step.runbook.orgId !== me.orgId) return;

  const siblings = await prisma.runbookStep.findMany({
    where: { runbookId: step.runbookId },
    orderBy: { orderIdx: "asc" },
    select: { id: true, orderIdx: true },
  });
  const ids = siblings.map((s) => s.id);
  const i = ids.indexOf(stepId);
  const target = direction === "up" ? i - 1 : i + 1;
  if (target < 0 || target >= ids.length) return;

  // Swap orderIdx values. Two-stage write avoids the @@unique([runbookId, orderIdx]) collision.
  const a = siblings[i];
  const b = siblings[target];
  const TEMP = -1 - i;
  await prisma.runbookStep.update({ where: { id: a.id }, data: { orderIdx: TEMP } });
  await prisma.runbookStep.update({ where: { id: b.id }, data: { orderIdx: a.orderIdx } });
  await prisma.runbookStep.update({ where: { id: a.id }, data: { orderIdx: b.orderIdx } });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.step.reordered",
    targetType: "Runbook",
    targetId: step.runbookId,
    summary: `Moved step ${direction}`,
  });
  revalidatePath(`/runbooks/${step.runbookId}`);
}

export async function setRunbookIBSLinksAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const runbookId = optStr(formData.get("runbookId"));
  if (!runbookId) return;
  await requireOwnedRunbook(runbookId, me.orgId);

  const ibsIds = formData
    .getAll("ibsIds")
    .filter((v): v is string => typeof v === "string");
  // Filter to IBSs in this org to avoid cross-tenant linking.
  const validIBS = await prisma.organizationIBS.findMany({
    where: { orgId: me.orgId, id: { in: ibsIds } },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.runbookIBSLink.deleteMany({ where: { runbookId } }),
    prisma.runbookIBSLink.createMany({
      data: validIBS.map((i) => ({ runbookId, ibsId: i.id })),
    }),
  ]);

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.ibs.linked",
    targetType: "Runbook",
    targetId: runbookId,
    summary: `Linked ${validIBS.length} IBS${validIBS.length === 1 ? "" : "s"}`,
  });
  revalidatePath(`/runbooks/${runbookId}`);
}

export async function setRunbookScenarioLinksAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const runbookId = optStr(formData.get("runbookId"));
  if (!runbookId) return;
  await requireOwnedRunbook(runbookId, me.orgId);

  const scenarioIds = formData
    .getAll("scenarioIds")
    .filter((v): v is string => typeof v === "string");
  const validScenarios = await prisma.scenario.findMany({
    where: { orgId: me.orgId, id: { in: scenarioIds } },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.runbookScenarioLink.deleteMany({ where: { runbookId } }),
    prisma.runbookScenarioLink.createMany({
      data: validScenarios.map((s) => ({ runbookId, scenarioId: s.id })),
    }),
  ]);

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.scenarios.linked",
    targetType: "Runbook",
    targetId: runbookId,
    summary: `Linked ${validScenarios.length} scenario${validScenarios.length === 1 ? "" : "s"}`,
  });
  revalidatePath(`/runbooks/${runbookId}`);
}

export async function setRunbookTriggerAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const runbookId = optStr(formData.get("runbookId"));
  if (!runbookId) return;
  await requireOwnedRunbook(runbookId, me.orgId);

  const severityAtLeast = optStr(formData.get("severityAtLeast"));
  const scenarioCategoryEquals = optStr(formData.get("scenarioCategoryEquals"));

  if (!severityAtLeast && !scenarioCategoryEquals) {
    await prisma.runbookTriggerCondition.deleteMany({ where: { runbookId } });
  } else {
    await prisma.runbookTriggerCondition.upsert({
      where: { runbookId },
      create: { runbookId, severityAtLeast, scenarioCategoryEquals },
      update: { severityAtLeast, scenarioCategoryEquals },
    });
  }

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.trigger.updated",
    targetType: "Runbook",
    targetId: runbookId,
    summary: severityAtLeast
      ? `Auto-activate ≥ ${severityAtLeast}${scenarioCategoryEquals ? ` · category ${scenarioCategoryEquals}` : ""}`
      : "Manual activation",
  });
  revalidatePath(`/runbooks/${runbookId}`);
}

export async function publishRunbookAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = optStr(formData.get("id"));
  if (!id) return;
  const runbook = await prisma.runbook.findFirst({
    where: { id, orgId: me.orgId },
    select: { id: true, title: true, status: true, version: true, _count: { select: { steps: true } } },
  });
  if (!runbook) return;
  if (runbook._count.steps === 0) return; // can't publish a stepless runbook

  const nextVersion = runbook.status === "PUBLISHED" ? runbook.version + 1 : runbook.version;
  await prisma.runbook.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date(), version: nextVersion },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.published",
    targetType: "Runbook",
    targetId: id,
    summary: `Published "${runbook.title}" v${nextVersion}`,
    metadata: { version: nextVersion },
  });
  revalidatePath(`/runbooks/${id}`);
  revalidatePath("/runbooks");
}

export async function unpublishRunbookAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = optStr(formData.get("id"));
  if (!id) return;
  const runbook = await prisma.runbook.findFirst({
    where: { id, orgId: me.orgId },
    select: { id: true },
  });
  if (!runbook) return;
  await prisma.runbook.update({
    where: { id },
    data: { status: "DRAFT" },
  });
  revalidatePath(`/runbooks/${id}`);
  revalidatePath("/runbooks");
}

/**
 * One-click "drill this runbook" — spins up a lightweight WALKTHROUGH
 * exercise in DRY_RUN mode whose scenario is auto-generated and linked
 * back to this runbook. The facilitator lands on the exercise page and
 * can walk the steps with the team without dragging the multi-step
 * exercise wizard or polluting production evidence.
 *
 * Design notes:
 *   • mode=DRY_RUN → purged after 30d, no regulator evidence, no annual count
 *   • exerciseType=WALKTHROUGH → lowest-realism, talk-through format
 *   • durationMin = sum of step estimates (falls back to 60)
 *   • RunbookScenarioLink ties the runbook to the ephemeral scenario so
 *     the auto-activation logic fires the runbook in this drill
 *   • lastDrilledAt stamped on the runbook for the freshness chip
 */
export async function drillRunbookAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = optStr(formData.get("id"));
  if (!id) return;

  const runbook = await prisma.runbook.findFirst({
    where: { id, orgId: me.orgId, status: { not: "ARCHIVED" } },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      steps: { select: { estimatedMin: true } },
    },
  });
  if (!runbook) return;

  const totalEstimated = runbook.steps.reduce(
    (sum, s) => sum + (s.estimatedMin ?? 0),
    0,
  );
  const drillDurationMin = totalEstimated > 0 ? Math.max(totalEstimated, 30) : 60;

  // Ephemeral scenario for the drill. Not flagged as a template — lives
  // alongside the exercise so the drill is self-contained and disposable.
  const scenarioBackground = [
    `Walk-through drill of the "${runbook.title}" runbook.`,
    runbook.description ?? "",
    `Use this drill to walk through the steps, surface unknowns, and capture follow-ups against the runbook itself rather than against a hypothetical incident.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const now = new Date();
  const exercise = await prisma.$transaction(async (tx) => {
    const scenario = await tx.scenario.create({
      data: {
        orgId: me.orgId,
        title: `Drill: ${runbook.title}`,
        background: scenarioBackground,
        dDayDate: now,
        durationMin: drillDurationMin,
        createdById: me.id,
        category: runbook.category.replace(/_/g, " "),
      },
      select: { id: true },
    });

    await tx.runbookScenarioLink.create({
      data: { runbookId: runbook.id, scenarioId: scenario.id },
    });

    const ex = await tx.exercise.create({
      data: {
        orgId: me.orgId,
        scenarioId: scenario.id,
        facilitatorId: me.id,
        title: `Drill: ${runbook.title}`,
        description: `Walk-through drill of the "${runbook.title}" runbook.`,
        exerciseType: "WALKTHROUGH",
        mode: "DRY_RUN",
        durationMin: drillDurationMin,
        plannedDate: now,
        objectives: [`Walk every step of "${runbook.title}" and capture follow-ups.`],
      },
      select: { id: true },
    });

    await tx.runbook.update({
      where: { id: runbook.id },
      data: { lastDrilledAt: now },
    });

    return ex;
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.drilled",
    targetType: "Runbook",
    targetId: runbook.id,
    summary: `Started drill of "${runbook.title}"`,
    metadata: { exerciseId: exercise.id },
  });

  revalidatePath(`/runbooks/${runbook.id}`);
  revalidatePath("/runbooks");
  redirect(`/exercises/${exercise.id}`);
}

export async function addRunbookEscalationAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const sourceId = optStr(formData.get("sourceId"));
  const targetId = optStr(formData.get("targetId"));
  if (!sourceId || !targetId || sourceId === targetId) return;
  const sevRaw = optStr(formData.get("severityAtLeast"));
  const allowedSev = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
  const severityAtLeast = sevRaw && allowedSev.has(sevRaw) ? sevRaw : null;
  const rationale = optStr(formData.get("rationale"));

  // Confirm both runbooks belong to the caller's org before linking.
  const [source, target] = await Promise.all([
    prisma.runbook.findFirst({
      where: { id: sourceId, orgId: me.orgId },
      select: { id: true, title: true },
    }),
    prisma.runbook.findFirst({
      where: { id: targetId, orgId: me.orgId },
      select: { id: true, title: true },
    }),
  ]);
  if (!source || !target) return;

  await prisma.runbookEscalation.upsert({
    where: { sourceRunbookId_targetRunbookId: { sourceRunbookId: sourceId, targetRunbookId: targetId } },
    update: { severityAtLeast, rationale },
    create: { sourceRunbookId: sourceId, targetRunbookId: targetId, severityAtLeast, rationale },
  });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.escalation.added",
    targetType: "Runbook",
    targetId: source.id,
    summary: `Linked "${source.title}" → "${target.title}"`,
    metadata: { targetRunbookId: target.id, severityAtLeast },
  });
  revalidatePath(`/runbooks/${sourceId}`);
  revalidatePath(`/runbooks/${targetId}`);
}

export async function removeRunbookEscalationAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const escalationId = optStr(formData.get("id"));
  if (!escalationId) return;
  const link = await prisma.runbookEscalation.findUnique({
    where: { id: escalationId },
    select: {
      id: true,
      sourceRunbookId: true,
      targetRunbookId: true,
      source: { select: { orgId: true, title: true } },
      target: { select: { title: true } },
    },
  });
  if (!link || link.source.orgId !== me.orgId) return;

  await prisma.runbookEscalation.delete({ where: { id: link.id } });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.escalation.removed",
    targetType: "Runbook",
    targetId: link.sourceRunbookId,
    summary: `Removed link "${link.source.title}" → "${link.target.title}"`,
  });
  revalidatePath(`/runbooks/${link.sourceRunbookId}`);
  revalidatePath(`/runbooks/${link.targetRunbookId}`);
}

export async function markRunbookReviewedAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = optStr(formData.get("id"));
  if (!id) return;
  const runbook = await prisma.runbook.findFirst({
    where: { id, orgId: me.orgId },
    select: { id: true, title: true },
  });
  if (!runbook) return;
  await prisma.runbook.update({
    where: { id },
    data: { lastReviewedAt: new Date(), lastReviewedById: me.id },
  });
  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "runbook.reviewed",
    targetType: "Runbook",
    targetId: id,
    summary: `Marked "${runbook.title}" reviewed`,
  });
  revalidatePath(`/runbooks/${id}`);
  revalidatePath("/runbooks");
}

/**
 * Resolve all library-declared escalation chains into RunbookEscalation
 * rows for the given org. Idempotent: runs after every clone (single or
 * bulk) so chains backfill in both directions as more templates land in
 * the org. Library entries are matched to org runbooks by title.
 */
async function resolveLibraryEscalations(orgId: string) {
  const orgRunbooks = await prisma.runbook.findMany({
    where: { orgId },
    select: { id: true, title: true },
  });
  const titleToOrgId = new Map<string, string>();
  for (const r of orgRunbooks) titleToOrgId.set(r.title, r.id);

  // Library-slug → library-title so we can resolve targetSlug to a title
  // and then to an org runbook id.
  const slugToTitle = new Map<string, string>();
  for (const lib of LIBRARY_RUNBOOKS) slugToTitle.set(lib.slug, lib.title);

  const toCreate: { sourceRunbookId: string; targetRunbookId: string; severityAtLeast: string | null; rationale: string | null; orderIdx: number }[] = [];
  for (const lib of LIBRARY_RUNBOOKS) {
    if (!lib.escalates || lib.escalates.length === 0) continue;
    const sourceId = titleToOrgId.get(lib.title);
    if (!sourceId) continue;
    lib.escalates.forEach((esc, idx) => {
      const targetTitle = slugToTitle.get(esc.targetSlug);
      if (!targetTitle) return;
      const targetId = titleToOrgId.get(targetTitle);
      if (!targetId || targetId === sourceId) return;
      toCreate.push({
        sourceRunbookId: sourceId,
        targetRunbookId: targetId,
        severityAtLeast: esc.severityAtLeast ?? null,
        rationale: esc.rationale ?? null,
        orderIdx: idx,
      });
    });
  }
  if (toCreate.length === 0) return;
  await prisma.runbookEscalation.createMany({
    data: toCreate,
    skipDuplicates: true,
  });
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
