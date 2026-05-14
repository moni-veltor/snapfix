import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmptyState from "@/components/EmptyState";
import PageHero from "@/components/ui/PageHero";
import { ScenariosIllustration } from "@/components/illustrations/Illustrations";

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
            <Link
              href="/scenarios/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={14} strokeWidth={2.4} />
              New scenario
            </Link>
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
          secondaryHref={isFacilitator ? "/scenarios/new" : undefined}
          secondaryLabel={isFacilitator ? "Author from scratch" : undefined}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {scenarios.map((s) => (
            <li key={s.id} className="rounded-lg border border-line bg-surface-1 p-5">
              <Link href={`/scenarios/${s.id}`} className="text-lg font-semibold hover:underline">
                {s.title}
              </Link>
              <p className="mt-1 text-xs text-muted">
                D-Day {s.dDayDate.toISOString().slice(0, 10)} · {s.durationMin} min ·
                {" "}created by {s.createdBy?.name ?? s.createdBy?.email ?? "system"}
              </p>
              <p className="mt-3 line-clamp-3 text-sm text-slate-600">{s.background}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
                <Pill>{s._count.ibsList} IBS</Pill>
                <Pill>{s._count.events} events</Pill>
                <Pill>{s._count.injects} injects</Pill>
                <Pill>{s._count.exercises} runs</Pill>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-surface-2 px-2 py-0.5">{children}</span>
  );
}
