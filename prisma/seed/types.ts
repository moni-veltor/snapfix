// Shared types and helpers for seeding scenario templates.

import type { PrismaClient } from "../../src/generated/prisma/client";

export type RiskCoverage = {
  people: boolean;
  property: boolean;
  technology: boolean;
  dataAvailability: boolean;
  dataIntegrity: boolean;
  thirdParty: boolean;
};

export type CaseStudy = {
  title: string;
  causation: string;
  impactScale: string;
  duration: string;
  sourceUrl?: string;
};

export type StressVariableGroup = {
  name: string;
  options: string[];
};

export type IBSDef = {
  code: string;
  name: string;
  description?: string;
  impactToleranceMin: number;
  impactMetrics?: string;
  criticality: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export type EventDef = {
  eventNo: number;
  scheduledTime: string; // HH:MM
  isScheduled?: boolean;
  title: string;
  description: string;
  expectedActions: string[];
  objectives: string[];
  senderRoleTitle?: string;
  toRoleTitles?: string[];
  ccRoleTitles?: string[];
};

export type InjectDef = {
  injectNo: number;
  scheduledTime: string;
  isScheduled?: boolean;
  /** "BUSINESS" = ops/customer/regulator pressure; "TECHNICAL" = monitoring
   *  / observability signals. Defaults to BUSINESS for back-compat. */
  kind?: "BUSINESS" | "TECHNICAL";
  summary: string;
  description: string;
  relation?: string;
  senderRoleTitle?: string;
  toRoleTitles?: string[];
  ccRoleTitles?: string[];
};

export type ScenarioTemplate = {
  // Slug used to upsert without depending on title equality.
  slug: string;
  title: string;
  category: string;
  srrRef?: string;
  tier?: "TIER_1" | "TIER_2" | "TIER_3"; // omit/undefined = applies to all tiers
  firmProfile?: string;
  background: string;
  agenda?: string;
  dDayDate: string; // ISO
  durationMin?: number;

  // DSL metadata
  cause: string;
  impactNarrative: string;
  characteristics: string[];
  assumptions: string[];
  compoundScenarioNotes?: string;
  takeaways?: string;
  stressVariables?: StressVariableGroup[];
  caseStudy?: CaseStudy;
  riskCoverage: RiskCoverage;

  // Optional exercise content
  ibsList?: IBSDef[];
  events?: EventDef[];
  injects?: InjectDef[];
  facilitatorQuestions?: { category: string; text: string }[];
  debriefQuestions?: { category: string; text: string }[];
};

export async function upsertTemplate(
  prisma: PrismaClient,
  t: ScenarioTemplate,
): Promise<string> {
  // We identify the template by (isTemplate=true, title) since slugs aren't in
  // the schema. If a template with the same title exists, replace its contents.
  const existing = await prisma.scenario.findFirst({
    where: { isTemplate: true, title: t.title, orgId: null },
    select: { id: true },
  });
  if (existing) {
    // Wipe dependents first
    await prisma.scenario.delete({ where: { id: existing.id } });
  }
  const scenario = await prisma.scenario.create({
    data: {
      isTemplate: true,
      orgId: null,
      title: t.title,
      category: t.category,
      srrRef: t.srrRef ?? null,
      tier: t.tier ?? null,
      firmProfile: t.firmProfile ?? null,
      background: t.background,
      agenda: t.agenda ?? null,
      dDayDate: new Date(t.dDayDate),
      durationMin: t.durationMin ?? 120,
      cause: t.cause,
      impactNarrative: t.impactNarrative,
      characteristics: t.characteristics,
      assumptions: t.assumptions,
      compoundScenarioNotes: t.compoundScenarioNotes ?? null,
      takeaways: t.takeaways ?? null,
      stressVariables: (t.stressVariables ?? null) as never,
      caseStudy: (t.caseStudy ?? null) as never,
      coversPeople: t.riskCoverage.people,
      coversProperty: t.riskCoverage.property,
      coversTechnology: t.riskCoverage.technology,
      coversDataAvailability: t.riskCoverage.dataAvailability,
      coversDataIntegrity: t.riskCoverage.dataIntegrity,
      coversThirdParty: t.riskCoverage.thirdParty,
    },
  });

  if (t.ibsList?.length) {
    await prisma.importantBusinessService.createMany({
      data: t.ibsList.map((i) => ({ ...i, scenarioId: scenario.id })),
    });
  }
  if (t.events?.length) {
    await prisma.event.createMany({
      data: t.events.map((e) => ({
        scenarioId: scenario.id,
        eventNo: e.eventNo,
        scheduledTime: e.scheduledTime,
        isScheduled: e.isScheduled ?? true,
        title: e.title,
        description: e.description,
        expectedActions: e.expectedActions,
        objectives: e.objectives,
        senderRoleTitle: e.senderRoleTitle ?? null,
        toRoleTitles: e.toRoleTitles ?? [],
        ccRoleTitles: e.ccRoleTitles ?? [],
      })),
    });
  }
  if (t.injects?.length) {
    await prisma.inject.createMany({
      data: t.injects.map((j) => ({
        scenarioId: scenario.id,
        injectNo: j.injectNo,
        scheduledTime: j.scheduledTime,
        isScheduled: j.isScheduled ?? true,
        kind: (j.kind ?? "BUSINESS") as "BUSINESS" | "TECHNICAL",
        summary: j.summary,
        description: j.description,
        relation: j.relation ?? null,
        senderRoleTitle: j.senderRoleTitle ?? null,
        toRoleTitles: j.toRoleTitles ?? [],
        ccRoleTitles: j.ccRoleTitles ?? [],
      })),
    });
  }
  if (t.facilitatorQuestions?.length) {
    await prisma.facilitatorQuestion.createMany({
      data: t.facilitatorQuestions.map((q, i) => ({
        ...q,
        scenarioId: scenario.id,
        orderIdx: i,
      })),
    });
  }
  if (t.debriefQuestions?.length) {
    await prisma.debriefQuestion.createMany({
      data: t.debriefQuestions.map((q, i) => ({
        ...q,
        scenarioId: scenario.id,
        orderIdx: i,
      })),
    });
  }
  return scenario.id;
}
