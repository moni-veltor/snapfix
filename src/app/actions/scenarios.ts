"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";

const ScenarioInput = z.object({
  title: z.string().min(1).max(200),
  background: z.string().min(1),
  agenda: z.string().optional(),
  dDayDate: z.string().min(1),
  durationMin: z.coerce.number().int().min(15).max(60 * 24),
});

export async function createScenarioAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const parsed = ScenarioInput.parse({
    title: formData.get("title"),
    background: formData.get("background"),
    agenda: formData.get("agenda") || undefined,
    dDayDate: formData.get("dDayDate"),
    durationMin: formData.get("durationMin"),
  });
  const scenario = await prisma.scenario.create({
    data: {
      ...parsed,
      dDayDate: new Date(parsed.dDayDate),
      orgId: user.orgId,
      createdById: user.id,
    },
  });
  redirect(`/scenarios/${scenario.id}`);
}

const IBSInput = z.object({
  scenarioId: z.string(),
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  impactToleranceMin: z.coerce.number().int().min(0),
  impactMetrics: z.string().optional(),
  criticality: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export async function addIBSAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const data = IBSInput.parse(Object.fromEntries(formData));
  await prisma.importantBusinessService.create({ data });
  revalidatePath(`/scenarios/${data.scenarioId}`);
}

export async function deleteIBSAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  const scenarioId = String(formData.get("scenarioId"));
  await prisma.importantBusinessService.delete({ where: { id } });
  revalidatePath(`/scenarios/${scenarioId}`);
}

const EventInput = z.object({
  scenarioId: z.string(),
  eventNo: z.coerce.number().int().min(1),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  isScheduled: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(true),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  expectedActions: z.string().optional(),
  objectives: z.string().optional(),
});

export async function addEventAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const raw = EventInput.parse(Object.fromEntries(formData));
  const splitLines = (s?: string) =>
    (s ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  await prisma.event.create({
    data: {
      scenarioId: raw.scenarioId,
      eventNo: raw.eventNo,
      scheduledTime: raw.scheduledTime,
      isScheduled: raw.isScheduled,
      title: raw.title,
      description: raw.description,
      expectedActions: splitLines(raw.expectedActions),
      objectives: splitLines(raw.objectives),
    },
  });
  revalidatePath(`/scenarios/${raw.scenarioId}`);
}

export async function deleteEventAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  const scenarioId = String(formData.get("scenarioId"));
  await prisma.event.delete({ where: { id } });
  revalidatePath(`/scenarios/${scenarioId}`);
}

const InjectInput = z.object({
  scenarioId: z.string(),
  eventId: z.string().optional(),
  injectNo: z.coerce.number().int().min(1),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  isScheduled: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(true),
  summary: z.string().min(1).max(300),
  description: z.string().min(1),
  relation: z.string().optional(),
});

export async function addInjectAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const data = InjectInput.parse(Object.fromEntries(formData));
  await prisma.inject.create({
    data: { ...data, eventId: data.eventId || null },
  });
  revalidatePath(`/scenarios/${data.scenarioId}`);
}

export async function deleteInjectAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  const scenarioId = String(formData.get("scenarioId"));
  await prisma.inject.delete({ where: { id } });
  revalidatePath(`/scenarios/${scenarioId}`);
}
