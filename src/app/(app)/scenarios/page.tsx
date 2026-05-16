import Link from "next/link";
import { FileText, Library } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmptyState from "@/components/EmptyState";
import PageHero from "@/components/ui/PageHero";
import { ScenariosIllustration } from "@/components/illustrations/Illustrations";
import ScenarioGrid from "@/components/scenarios/ScenarioGrid";
import ScenarioAddButton from "@/components/scenarios/ScenarioAddButton";

export default async function ScenariosPage() {
  const user = await requireOrgUser();
  const scenarios = await prisma.scenario.findMany({
    where: { orgId: user.orgId, isTemplate: false },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { events: true, injects: true, ibsList: true, exercises: true } },
      createdBy: { select: { name: true, email: true } },
      templateOrigin: { select: { id: true, title: true } },
    },
  });
  const isFacilitator = user.orgRole === "OWNER" || user.orgRole === "ADMIN";
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Library"
        icon={FileText}
        title="Scenarios"
        pitch="Your authored scenarios — the MSEL events and injects that get played out in an exercise. Clone one from the CMORG library or author your own."
        actions={
          isFacilitator && (
            <div className="flex items-center gap-2">
              <Link
                href="/scenarios/library"
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
              >
                <Library size={14} strokeWidth={2.2} />
                Browse library
              </Link>
              <ScenarioAddButton />
            </div>
          )
        }
      />
      {scenarios.length === 0 ? (
        <EmptyState
          icon={<ScenariosIllustration size={96} className="text-indigo-500 dark:text-indigo-300" />}
          title="A blank tabletop"
          body={
            isFacilitator
              ? "Start with a CMORG scenario — 14 to choose from, all calibrated to UK regulatory expectations — or roll your own MSEL from scratch."
              : "Your facilitator will set up the scenarios you'll exercise against."
          }
          ctaHref={isFacilitator ? "/templates" : undefined}
          ctaLabel={isFacilitator ? "Open library" : undefined}
          secondaryHref={isFacilitator ? "/scenarios?new=1" : undefined}
          secondaryLabel={isFacilitator ? "Author from scratch" : undefined}
        />
      ) : (
        <ScenarioGrid scenarios={scenarios} />
      )}
    </div>
  );
}
