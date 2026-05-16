"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { libraryScenarioBySlug } from "@/lib/library/scenarios";

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
  senderRoleTitle: z.string().optional(),
  toRoleTitles: z.string().optional(),
  ccRoleTitles: z.string().optional(),
});

/** Comma- or newline-separated → trimmed, deduped string list. */
function splitRoles(raw?: string): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)) {
    if (!seen.has(r.toLowerCase())) {
      seen.add(r.toLowerCase());
      out.push(r);
    }
  }
  return out;
}

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
      senderRoleTitle: raw.senderRoleTitle?.trim() || null,
      toRoleTitles: splitRoles(raw.toRoleTitles),
      ccRoleTitles: splitRoles(raw.ccRoleTitles),
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
  senderRoleTitle: z.string().optional(),
  toRoleTitles: z.string().optional(),
  ccRoleTitles: z.string().optional(),
});

export async function addInjectAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const data = InjectInput.parse(Object.fromEntries(formData));
  await prisma.inject.create({
    data: {
      scenarioId: data.scenarioId,
      eventId: data.eventId || null,
      injectNo: data.injectNo,
      scheduledTime: data.scheduledTime,
      isScheduled: data.isScheduled,
      summary: data.summary,
      description: data.description,
      relation: data.relation ?? null,
      senderRoleTitle: data.senderRoleTitle?.trim() || null,
      toRoleTitles: splitRoles(data.toRoleTitles),
      ccRoleTitles: splitRoles(data.ccRoleTitles),
    },
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

/**
 * Clone a TS-backed library scenario shell into the org's register.
 * Creates the Scenario row with the shell's framing + risk-coverage flags,
 * materialises any seedEvents as Event rows, and redirects the user to
 * the new scenario so they can start authoring the MSEL.
 *
 * Scheduled dDayDate defaults to 14 days out — the facilitator changes
 * it on the scenario edit page once they pick an exercise date.
 */
export async function addLibraryScenarioAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const slug = String(formData.get("slug") ?? "");
  const lib = libraryScenarioBySlug(slug);
  if (!lib) return;

  const dDay = new Date();
  dDay.setUTCDate(dDay.getUTCDate() + 14);

  const created = await prisma.scenario.create({
    data: {
      orgId: me.orgId,
      createdById: me.id,
      title: lib.title,
      background: lib.background,
      dDayDate: dDay,
      durationMin: lib.durationMin ?? 120,
      category: lib.category,
      tier: lib.tier ?? null,
      srrRef: lib.srrRef ?? null,
      characteristics: lib.characteristics ?? [],
      assumptions: lib.assumptions ?? [],
      takeaways: lib.takeaways ?? null,
      caseStudy: lib.caseStudy ? (lib.caseStudy as never) : undefined,
      coversPeople: lib.coversPeople ?? false,
      coversProperty: lib.coversProperty ?? false,
      coversTechnology: lib.coversTechnology ?? false,
      coversDataAvailability: lib.coversDataAvailability ?? false,
      coversDataIntegrity: lib.coversDataIntegrity ?? false,
      coversThirdParty: lib.coversThirdParty ?? false,
      isTemplate: false,
      events: lib.seedEvents?.length
        ? {
            create: lib.seedEvents.map((e) => ({
              eventNo: e.eventNo,
              scheduledTime: e.scheduledTime,
              title: e.title,
              description: e.description,
              expectedActions: e.expectedActions ?? [],
              objectives: e.objectives ?? [],
            })),
          }
        : undefined,
    },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "scenario.added-from-library",
    targetType: "scenario",
    targetId: created.id,
    summary: `Cloned scenario "${created.title}" from library (slug: ${slug})`,
  });
  revalidatePath("/scenarios");
  revalidatePath("/scenarios/library");
  redirect(`/scenarios/${created.id}`);
}
