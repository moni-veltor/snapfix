import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";

export const metadata = { title: "IBS Register — SnapFix" };

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  DEPRECATED: "bg-surface-2 text-ink",
};

export default async function IBSListPage() {
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const items = await prisma.organizationIBS.findMany({
    where: { orgId: me.orgId },
    orderBy: [{ status: "asc" }, { code: "asc" }],
    include: {
      _count: { select: { exerciseLinks: true } },
      processOwnerUser: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Register"
        icon={Building2}
        title="Important Business Services"
        pitch={`The spine of your operational-resilience programme. ${items.length} ${items.length === 1 ? "service" : "services"} captured — each with its tolerance, its resource map, and its testing history.`}
        actions={
          canManage && (
            <Link
              href="/ibs/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={14} strokeWidth={2.4} />
              Add IBS
            </Link>
          )
        }
      />

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-surface-1 p-8 text-center text-sm text-muted">
          No IBS yet.{" "}
          {canManage ? (
            <>
              Start by{" "}
              <Link href="/ibs/new" className="underline">
                adding your first one
              </Link>
              .
            </>
          ) : (
            "Ask an admin to add the first one."
          )}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li
              key={i.id}
              className="rounded-md border border-line bg-surface-1 p-4 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/ibs/${i.id}`} className="font-medium hover:underline">
                      <span className="font-mono text-xs">{i.code}</span> · {i.name}
                    </Link>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[i.status] ?? ""}`}>
                      {i.status}
                    </span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                      {i.criticality}
                    </span>
                  </div>
                  {i.outcome && (
                    <p className="mt-1 line-clamp-2 text-muted">{i.outcome}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                    <span className="rounded-full bg-surface-2 px-2 py-0.5">
                      Tolerance {Math.round(i.impactToleranceMin / 60)}h
                    </span>
                    {i.fcaToleranceMin && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5">
                        FCA {Math.round(i.fcaToleranceMin / 60 / 24)}d
                      </span>
                    )}
                    {i.praToleranceMin && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5">
                        PRA {Math.round(i.praToleranceMin / 60 / 24)}d
                      </span>
                    )}
                    <span className="rounded-full bg-surface-2 px-2 py-0.5">
                      Tested in {i._count.exerciseLinks}{" "}
                      {i._count.exerciseLinks === 1 ? "exercise" : "exercises"}
                    </span>
                    {i.processOwner && (
                      <span className="text-muted">Owner: {i.processOwner}</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
