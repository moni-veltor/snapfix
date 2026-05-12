"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";

/**
 * Clone a system template into the caller's organisation. Copies the scenario
 * row plus all dependent rows (IBSs, events, injects, questions). Artefacts at
 * scenario level are not copied (they're scenario-author's intellectual
 * property and may not transfer cleanly); admins can re-upload.
 */
export async function cloneTemplateAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const templateId = String(formData.get("templateId"));

  const template = await prisma.scenario.findFirst({
    where: { id: templateId, isTemplate: true, orgId: null },
    include: {
      ibsList: true,
      events: true,
      injects: true,
      facilitatorQuestions: true,
      debriefQuestions: true,
    },
  });
  if (!template) redirect("/templates");

  const cloned = await prisma.scenario.create({
    data: {
      orgId: me.orgId,
      isTemplate: false,
      templateOriginId: template.id,
      title: template.title,
      background: template.background,
      agenda: template.agenda,
      dDayDate: template.dDayDate,
      durationMin: template.durationMin,
      createdById: me.id,
      category: template.category,
      srrRef: template.srrRef,
      cause: template.cause,
      impactNarrative: template.impactNarrative,
      characteristics: template.characteristics,
      assumptions: template.assumptions,
      compoundScenarioNotes: template.compoundScenarioNotes,
      takeaways: template.takeaways,
      stressVariables: template.stressVariables ?? undefined,
      caseStudy: template.caseStudy ?? undefined,
      coversPeople: template.coversPeople,
      coversProperty: template.coversProperty,
      coversTechnology: template.coversTechnology,
      coversDataAvailability: template.coversDataAvailability,
      coversDataIntegrity: template.coversDataIntegrity,
      coversThirdParty: template.coversThirdParty,
      ibsList: {
        create: template.ibsList.map((i) => ({
          code: i.code,
          name: i.name,
          description: i.description,
          impactToleranceMin: i.impactToleranceMin,
          impactMetrics: i.impactMetrics,
          criticality: i.criticality,
        })),
      },
      events: {
        create: template.events.map((e) => ({
          eventNo: e.eventNo,
          scheduledTime: e.scheduledTime,
          isScheduled: e.isScheduled,
          title: e.title,
          description: e.description,
          expectedActions: e.expectedActions,
          objectives: e.objectives,
          senderRoleTitle: e.senderRoleTitle,
          toRoleTitles: e.toRoleTitles,
          ccRoleTitles: e.ccRoleTitles,
        })),
      },
      injects: {
        create: template.injects.map((j) => ({
          injectNo: j.injectNo,
          scheduledTime: j.scheduledTime,
          isScheduled: j.isScheduled,
          summary: j.summary,
          description: j.description,
          relation: j.relation,
          senderRoleTitle: j.senderRoleTitle,
          toRoleTitles: j.toRoleTitles,
          ccRoleTitles: j.ccRoleTitles,
        })),
      },
      facilitatorQuestions: {
        create: template.facilitatorQuestions.map((q) => ({
          category: q.category,
          text: q.text,
          orderIdx: q.orderIdx,
        })),
      },
      debriefQuestions: {
        create: template.debriefQuestions.map((q) => ({
          category: q.category,
          text: q.text,
          orderIdx: q.orderIdx,
        })),
      },
    },
  });

  revalidatePath("/scenarios");
  redirect(`/scenarios/${cloned.id}`);
}
