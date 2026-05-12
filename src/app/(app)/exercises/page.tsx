import Link from "next/link";
import { Target } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmptyState from "@/components/EmptyState";

export default async function ExercisesPage() {
  const user = await requireOrgUser();
  const exercises = await prisma.exercise.findMany({
    where: { orgId: user.orgId },
    orderBy: [{ status: "asc" }, { plannedDate: "asc" }, { createdAt: "desc" }],
    include: {
      scenario: { select: { title: true } },
      facilitator: { select: { name: true, email: true } },
      _count: { select: { participants: true, teams: true } },
    },
  });
  const canCreate = user.orgRole === "OWNER" || user.orgRole === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Exercises</h1>
        {canCreate && (
          <Link
            href="/exercises/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Plan a new exercise
          </Link>
        )}
      </div>
      {exercises.length === 0 ? (
        <EmptyState
          icon={<Target size={20} />}
          title="No exercises yet"
          body={
            canCreate
              ? "Plan an exercise from one of your scenarios — pick a date, assemble your team, run it live."
              : "Ask an admin to plan one."
          }
          ctaHref={canCreate ? "/exercises/new" : undefined}
          ctaLabel={canCreate ? "Plan an exercise" : undefined}
        />
      ) : (
        <ul className="space-y-2">
          {exercises.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-4 text-sm"
            >
              <div>
                <Link href={`/exercises/${e.id}`} className="font-medium hover:underline">
                  {e.title}
                </Link>
                <div className="text-xs text-slate-500">
                  {e.scenario.title}
                  {e.plannedDate && (
                    <> · {e.plannedDate.toISOString().slice(0, 16).replace("T", " ")}</>
                  )}
                  {" · facilitator "}
                  {e.facilitator?.name ?? e.facilitator?.email ?? "—"}
                  {" · "}
                  {e._count.participants} on roster
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{e.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
