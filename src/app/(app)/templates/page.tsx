import { BookMarked } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import TemplateLibraryGrid from "@/components/templates/TemplateLibraryGrid";

export const metadata = { title: "Scenario Library — SnapFix" };

export default async function TemplatesPage() {
  const me = await requireOrgUser();
  const org = await prisma.organization.findUnique({
    where: { id: me.orgId },
    select: { tier: true },
  });

  const templates = await prisma.scenario.findMany({
    where: { isTemplate: true, orgId: null },
    orderBy: [{ category: "asc" }, { title: "asc" }],
    include: { _count: { select: { events: true, injects: true, ibsList: true } } },
  });

  const myClones = await prisma.scenario.findMany({
    where: { orgId: me.orgId, templateOriginId: { not: null } },
    select: { id: true, title: true, templateOriginId: true },
  });
  const clonesByOriginId: Record<string, { id: string; title: string }[]> = {};
  for (const c of myClones) {
    if (!c.templateOriginId) continue;
    const list = clonesByOriginId[c.templateOriginId] ?? [];
    list.push({ id: c.id, title: c.title });
    clonesByOriginId[c.templateOriginId] = list;
  }

  const canClone = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Library"
        icon={BookMarked}
        title="Scenario library"
        pitch={`${templates.length} ready-to-clone templates`}
      />

      <TemplateLibraryGrid
        templates={templates.map((t) => ({
          id: t.id,
          title: t.title,
          background: t.background,
          category: t.category,
          tier: t.tier,
          srrRef: t.srrRef,
          coversPeople: t.coversPeople,
          coversProperty: t.coversProperty,
          coversTechnology: t.coversTechnology,
          coversDataAvailability: t.coversDataAvailability,
          coversDataIntegrity: t.coversDataIntegrity,
          coversThirdParty: t.coversThirdParty,
          _count: t._count,
        }))}
        clonesByOriginId={clonesByOriginId}
        canClone={canClone}
        orgTier={org?.tier ?? null}
      />
    </div>
  );
}
