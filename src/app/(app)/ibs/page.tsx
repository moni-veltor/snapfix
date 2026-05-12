import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "IBS Register — SnapFix" };

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  DEPRECATED: "bg-slate-200 text-slate-700",
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Important Business Services</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your organisation's IBS register. {items.length}{" "}
            {items.length === 1 ? "service" : "services"} captured.
          </p>
        </div>
        {canManage && (
          <Link
            href="/ibs/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Add IBS
          </Link>
        )}
      </header>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
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
              className="rounded-md border border-slate-200 bg-white p-4 text-sm"
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
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                      {i.criticality}
                    </span>
                  </div>
                  {i.outcome && (
                    <p className="mt-1 line-clamp-2 text-slate-600">{i.outcome}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      Tolerance {Math.round(i.impactToleranceMin / 60)}h
                    </span>
                    {i.fcaToleranceMin && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        FCA {Math.round(i.fcaToleranceMin / 60 / 24)}d
                      </span>
                    )}
                    {i.praToleranceMin && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        PRA {Math.round(i.praToleranceMin / 60 / 24)}d
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      Tested in {i._count.exerciseLinks}{" "}
                      {i._count.exerciseLinks === 1 ? "exercise" : "exercises"}
                    </span>
                    {i.processOwner && (
                      <span className="text-slate-500">Owner: {i.processOwner}</span>
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
