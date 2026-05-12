"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

const ActionItemInput = z.object({
  exerciseId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  ownerUserId: z.string().optional(),
  ownerText: z.string().optional(),
  dueAt: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

export async function createActionItemAction(formData: FormData) {
  const me = await requireOrgUser();
  const parsed = ActionItemInput.parse(Object.fromEntries(formData));
  // Verify exercise belongs to org
  const exercise = await prisma.exercise.findFirst({
    where: { id: parsed.exerciseId, orgId: me.orgId },
    select: { id: true, orgId: true, title: true },
  });
  if (!exercise) return;
  const item = await prisma.exerciseActionItem.create({
    data: {
      exerciseId: exercise.id,
      orgId: exercise.orgId,
      title: parsed.title,
      description: parsed.description ?? null,
      ownerUserId: parsed.ownerUserId || null,
      ownerText: parsed.ownerText ?? null,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
      priority: parsed.priority,
      createdById: me.id,
    },
  });
  await audit({
    orgId: exercise.orgId,
    actorId: me.id,
    action: "action_item.created",
    targetType: "action_item",
    targetId: item.id,
    summary: `Added action item: ${parsed.title} (exercise: ${exercise.title})`,
  });
  revalidatePath(`/exercises/${exercise.id}/debrief`);
  revalidatePath("/action-items");
}

export async function updateActionItemStatusAction(formData: FormData) {
  const me = await requireOrgUser();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as
    | "OPEN" | "IN_PROGRESS" | "DONE" | "WONT_FIX" | "BLOCKED";
  const item = await prisma.exerciseActionItem.findFirst({
    where: { id, orgId: me.orgId },
  });
  if (!item) return;
  const closing = (status === "DONE" || status === "WONT_FIX") && item.closedAt === null;
  await prisma.exerciseActionItem.update({
    where: { id },
    data: { status, closedAt: closing ? new Date() : item.closedAt },
  });
  await audit({
    orgId: item.orgId,
    actorId: me.id,
    action: status === "DONE" || status === "WONT_FIX" ? "action_item.closed" : "action_item.updated",
    targetType: "action_item",
    targetId: id,
    summary: `Action item "${item.title}" → ${status}`,
  });
  revalidatePath(`/exercises/${item.exerciseId}/debrief`);
  revalidatePath("/action-items");
}

export async function deleteActionItemAction(formData: FormData) {
  const me = await requireOrgUser();
  const id = String(formData.get("id"));
  const item = await prisma.exerciseActionItem.findFirst({
    where: { id, orgId: me.orgId },
  });
  if (!item) return;
  await prisma.exerciseActionItem.delete({ where: { id } });
  await audit({
    orgId: item.orgId,
    actorId: me.id,
    action: "action_item.updated",
    targetType: "action_item",
    targetId: id,
    summary: `Deleted action item "${item.title}"`,
  });
  revalidatePath(`/exercises/${item.exerciseId}/debrief`);
  revalidatePath("/action-items");
}
