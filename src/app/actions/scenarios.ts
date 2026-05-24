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
  // Optional CMORG framing — populated by the rich wizard, omitted by the
  // legacy form. The action accepts both.
  category: z.string().optional(),
  tier: z.enum(["TIER_1", "TIER_2", "TIER_3"]).optional(),
  characteristics: z.string().optional(), // newline-separated
  assumptions: z.string().optional(), // newline-separated
  takeaways: z.string().optional(),
});

function splitLines(s?: string): string[] {
  if (!s) return [];
  return s
    .split(/[\n,]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function coerceBool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}

const ProgrammeSchema = z.object({
  id: z.string().min(1),
  programmeYear: z.coerce.number().int().min(2000).max(2100).optional().or(z.nan()),
  programmeQuarter: z.coerce.number().int().min(1).max(4).optional().or(z.nan()),
  regulatoryReq: z.string().max(500).optional(),
  mandatoryUntil: z.string().optional(),
});

function nanToNull(v: number | undefined): number | null {
  if (v === undefined) return null;
  if (Number.isNaN(v)) return null;
  return v;
}

/**
 * Update a scenario's annual-programme slot. Used by the /scenarios/programme
 * view to drag a scenario into a specific year + quarter, tag it with a
 * regulatory commitment, or set a mandatory-by date.
 */
export async function updateScenarioProgrammeAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const parsed = ProgrammeSchema.safeParse({
    id: formData.get("id"),
    programmeYear: formData.get("programmeYear") || undefined,
    programmeQuarter: formData.get("programmeQuarter") || undefined,
    regulatoryReq: formData.get("regulatoryReq") || undefined,
    mandatoryUntil: formData.get("mandatoryUntil") || undefined,
  });
  if (!parsed.success) return;
  const { id } = parsed.data;

  const scenario = await prisma.scenario.findFirst({
    where: { id, orgId: user.orgId },
    select: { id: true },
  });
  if (!scenario) return;

  await prisma.scenario.update({
    where: { id },
    data: {
      programmeYear: nanToNull(parsed.data.programmeYear),
      programmeQuarter: nanToNull(parsed.data.programmeQuarter),
      regulatoryReq: parsed.data.regulatoryReq?.trim() || null,
      mandatoryUntil: parsed.data.mandatoryUntil
        ? new Date(parsed.data.mandatoryUntil)
        : null,
    },
  });

  revalidatePath(`/scenarios/${id}`);
  revalidatePath("/scenarios/programme");
}

export async function createScenarioAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const parsed = ScenarioInput.parse({
    title: formData.get("title"),
    background: formData.get("background"),
    agenda: formData.get("agenda") || undefined,
    dDayDate: formData.get("dDayDate"),
    durationMin: formData.get("durationMin"),
    category: formData.get("category") || undefined,
    tier: formData.get("tier") || undefined,
    characteristics: formData.get("characteristics") || undefined,
    assumptions: formData.get("assumptions") || undefined,
    takeaways: formData.get("takeaways") || undefined,
  });
  const scenario = await prisma.scenario.create({
    data: {
      title: parsed.title,
      background: parsed.background,
      agenda: parsed.agenda ?? null,
      dDayDate: new Date(parsed.dDayDate),
      durationMin: parsed.durationMin,
      orgId: user.orgId,
      createdById: user.id,
      category: parsed.category ?? null,
      tier: parsed.tier ?? null,
      characteristics: splitLines(parsed.characteristics),
      assumptions: splitLines(parsed.assumptions),
      takeaways: parsed.takeaways ?? null,
      coversPeople: coerceBool(formData.get("coversPeople")),
      coversProperty: coerceBool(formData.get("coversProperty")),
      coversTechnology: coerceBool(formData.get("coversTechnology")),
      coversDataAvailability: coerceBool(formData.get("coversDataAvailability")),
      coversDataIntegrity: coerceBool(formData.get("coversDataIntegrity")),
      coversThirdParty: coerceBool(formData.get("coversThirdParty")),
    },
  });
  redirect(`/scenarios/${scenario.id}`);
}

const AddIBSInput = z.object({
  scenarioId: z.string().min(1),
  organizationIBSId: z.string().min(1),
});

/**
 * Add an IBS to a scenario by selecting an approved entry from the org's
 * formal IBS register. Freeform entry is no longer permitted — every scenario
 * IBS must trace back to an OrganizationIBS so exercises test the firm's real
 * IBSs rather than design-time fictions.
 *
 * The picker copies the register entry's code/name/description/tolerance/
 * criticality at attach-time so subsequent edits to the register don't silently
 * mutate historical scenarios. The link is the integrity anchor; the copied
 * fields are the design-time snapshot.
 */
export async function addIBSAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const { scenarioId, organizationIBSId } = AddIBSInput.parse(
    Object.fromEntries(formData),
  );

  const scenario = await prisma.scenario.findFirst({
    where: { id: scenarioId, orgId: user.orgId },
    select: { id: true, title: true },
  });
  if (!scenario) return { error: "Scenario not found." } as const;

  const ibs = await prisma.organizationIBS.findFirst({
    where: { id: organizationIBSId, orgId: user.orgId, status: "APPROVED" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      impactToleranceMin: true,
      criticality: true,
    },
  });
  if (!ibs) {
    return { error: "That IBS isn't in your approved register." } as const;
  }

  const existing = await prisma.importantBusinessService.findFirst({
    where: { scenarioId, OR: [{ organizationIBSId: ibs.id }, { code: ibs.code }] },
    select: { id: true },
  });
  if (existing) {
    return { error: "That IBS is already attached to this scenario." } as const;
  }

  const created = await prisma.importantBusinessService.create({
    data: {
      scenarioId,
      organizationIBSId: ibs.id,
      code: ibs.code,
      name: ibs.name,
      description: ibs.description,
      impactToleranceMin: ibs.impactToleranceMin,
      criticality: ibs.criticality,
    },
    select: { id: true },
  });

  await audit({
    orgId: user.orgId,
    actorId: user.id,
    action: "scenario.ibs.added",
    targetType: "scenario",
    targetId: scenarioId,
    summary: `Attached IBS ${ibs.code} (${ibs.name}) to scenario "${scenario.title}"`,
    metadata: { organizationIBSId: ibs.id, scenarioIBSId: created.id },
  });

  revalidatePath(`/scenarios/${scenarioId}`);
}

const LinkIBSInput = z.object({
  scenarioIBSId: z.string().min(1),
  organizationIBSId: z.string().min(1),
});

/**
 * Bind an existing (legacy / library-cloned) scenario IBS row to an entry in
 * the org's approved register. Preserves the row's id so all EventIBS pivot
 * rows survive — only the descriptive fields are overwritten by the register's
 * snapshot. The exercise readiness blocker clears once every scenario IBS has
 * a non-null organizationIBSId.
 */
export async function linkIBSToRegisterAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const { scenarioIBSId, organizationIBSId } = LinkIBSInput.parse(
    Object.fromEntries(formData),
  );

  const scenarioIBS = await prisma.importantBusinessService.findFirst({
    where: { id: scenarioIBSId, scenario: { orgId: user.orgId } },
    select: { id: true, scenarioId: true, scenario: { select: { title: true } } },
  });
  if (!scenarioIBS) return { error: "Scenario IBS not found." } as const;

  const ibs = await prisma.organizationIBS.findFirst({
    where: { id: organizationIBSId, orgId: user.orgId, status: "APPROVED" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      impactToleranceMin: true,
      criticality: true,
    },
  });
  if (!ibs) {
    return { error: "That IBS isn't in your approved register." } as const;
  }

  // Guard the (scenarioId, code) unique — another row in this scenario may
  // already use the register entry's code.
  const collision = await prisma.importantBusinessService.findFirst({
    where: {
      scenarioId: scenarioIBS.scenarioId,
      code: ibs.code,
      NOT: { id: scenarioIBS.id },
    },
    select: { id: true },
  });
  if (collision) {
    return {
      error: `Another IBS on this scenario already uses code ${ibs.code}. Remove or relink it first.`,
    } as const;
  }

  await prisma.importantBusinessService.update({
    where: { id: scenarioIBS.id },
    data: {
      organizationIBSId: ibs.id,
      code: ibs.code,
      name: ibs.name,
      description: ibs.description,
      impactToleranceMin: ibs.impactToleranceMin,
      criticality: ibs.criticality,
    },
  });

  await audit({
    orgId: user.orgId,
    actorId: user.id,
    action: "scenario.ibs.linked",
    targetType: "scenario",
    targetId: scenarioIBS.scenarioId,
    summary: `Linked scenario IBS to register entry ${ibs.code} (${ibs.name}) on "${scenarioIBS.scenario.title}"`,
    metadata: { organizationIBSId: ibs.id, scenarioIBSId: scenarioIBS.id },
  });

  revalidatePath(`/scenarios/${scenarioIBS.scenarioId}`);
}

export async function deleteIBSAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  const scenarioId = String(formData.get("scenarioId"));

  const existing = await prisma.importantBusinessService.findFirst({
    where: { id, scenario: { orgId: user.orgId } },
    select: { code: true, name: true, scenario: { select: { title: true } } },
  });
  if (!existing) return;

  await prisma.importantBusinessService.delete({ where: { id } });

  await audit({
    orgId: user.orgId,
    actorId: user.id,
    action: "scenario.ibs.removed",
    targetType: "scenario",
    targetId: scenarioId,
    summary: `Removed IBS ${existing.code} (${existing.name}) from scenario "${existing.scenario.title}"`,
  });

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
  redirect(`/scenarios/${created.id}`);
}
