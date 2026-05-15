import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cloneTemplateAction } from "@/app/actions/templates";
import ToastForm from "@/components/ui/ToastForm";
import SubmitButton from "@/components/ui/SubmitButton";
import TemplateDetailViewer from "@/components/templates/TemplateDetailViewer";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireOrgUser();
  const { id } = await params;
  const template = await prisma.scenario.findFirst({
    where: { id, isTemplate: true, orgId: null },
    include: {
      ibsList: { orderBy: { code: "asc" } },
      events: { orderBy: { eventNo: "asc" } },
      injects: { orderBy: { injectNo: "asc" } },
      facilitatorQuestions: { orderBy: { orderIdx: "asc" } },
      debriefQuestions: { orderBy: { orderIdx: "asc" } },
    },
  });
  if (!template) notFound();
  const canClone = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const caseStudy = (template.caseStudy ?? null) as
    | { title?: string; causation?: string; impactScale?: string; duration?: string; sourceUrl?: string }
    | null;
  const stressVariables = (template.stressVariables ?? null) as
    | { name: string; options: string[] }[]
    | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/templates"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
        >
          <ArrowLeft size={12} />
          Back to library
        </Link>
        {canClone && (
          <ToastForm
            action={cloneTemplateAction}
            toast={{
              loading: "Cloning into your org…",
              success: "Cloned — open it from /scenarios",
              error: "Couldn't clone this scenario",
            }}
          >
            <input type="hidden" name="templateId" value={template.id} />
            <SubmitButton size="lg" pendingLabel="Cloning…">
              Clone into my org
            </SubmitButton>
          </ToastForm>
        )}
      </div>

      <TemplateDetailViewer
        template={{
          id: template.id,
          title: template.title,
          category: template.category,
          tier: template.tier,
          srrRef: template.srrRef,
          background: template.background,
          cause: template.cause,
          impactNarrative: template.impactNarrative,
          characteristics: template.characteristics,
          assumptions: template.assumptions,
          compoundScenarioNotes: template.compoundScenarioNotes,
          takeaways: template.takeaways,
          stressVariables,
          caseStudy,
          coversPeople: template.coversPeople,
          coversProperty: template.coversProperty,
          coversTechnology: template.coversTechnology,
          coversDataAvailability: template.coversDataAvailability,
          coversDataIntegrity: template.coversDataIntegrity,
          coversThirdParty: template.coversThirdParty,
          durationMin: template.durationMin,
        }}
        ibsList={template.ibsList.map((i) => ({
          id: i.id,
          code: i.code,
          name: i.name,
          criticality: i.criticality,
          impactToleranceMin: i.impactToleranceMin,
          description: i.description,
        }))}
        events={template.events.map((e) => ({
          id: e.id,
          eventNo: e.eventNo,
          scheduledTime: e.scheduledTime,
          title: e.title,
          description: e.description,
          senderRoleTitle: e.senderRoleTitle,
          toRoleTitles: e.toRoleTitles,
          ccRoleTitles: e.ccRoleTitles,
        }))}
        injects={template.injects.map((j) => ({
          id: j.id,
          injectNo: j.injectNo,
          scheduledTime: j.scheduledTime,
          summary: j.summary,
          description: j.description,
          relation: j.relation,
          kind: j.kind,
        }))}
        facilitatorQuestions={template.facilitatorQuestions.map((q) => ({
          id: q.id,
          category: q.category,
          text: q.text,
        }))}
        debriefQuestions={template.debriefQuestions.map((q) => ({
          id: q.id,
          category: q.category,
          text: q.text,
        }))}
      />
    </div>
  );
}
