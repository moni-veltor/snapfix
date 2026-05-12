import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Scenarios</h1>
        {isFacilitator && (
          <Link
            href="/scenarios/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            New scenario
          </Link>
        )}
      </div>
      {scenarios.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No scenarios yet. {isFacilitator ? "Create one to get started." : "Ask a facilitator to add one."}
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {scenarios.map((s) => (
            <li key={s.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <Link href={`/scenarios/${s.id}`} className="text-lg font-semibold hover:underline">
                {s.title}
              </Link>
              <p className="mt-1 text-xs text-slate-500">
                D-Day {s.dDayDate.toISOString().slice(0, 10)} · {s.durationMin} min ·
                {" "}created by {s.createdBy?.name ?? s.createdBy?.email ?? "system"}
              </p>
              <p className="mt-3 line-clamp-3 text-sm text-slate-600">{s.background}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
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
    <span className="rounded-full bg-slate-100 px-2 py-0.5">{children}</span>
  );
}
