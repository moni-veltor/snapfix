import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Calendar — SnapFix" };

export default async function CalendarPage() {
  const me = await requireOrgUser();
  const exercises = await prisma.exercise.findMany({
    where: {
      orgId: me.orgId,
      OR: [{ plannedDate: { not: null } }, { startedAt: { not: null } }],
    },
    orderBy: [{ plannedDate: "asc" }, { startedAt: "asc" }],
    include: {
      scenario: { select: { title: true } },
      facilitator: { select: { name: true, email: true } },
    },
  });

  // Group by year-month
  const groups = new Map<string, typeof exercises>();
  for (const ex of exercises) {
    const d = ex.plannedDate ?? ex.startedAt ?? ex.createdAt;
    const ym = d.toISOString().slice(0, 7);
    const list = groups.get(ym) ?? [];
    list.push(ex);
    groups.set(ym, list);
  }
  const sortedYMs = Array.from(groups.keys()).sort();
  const now = new Date();
  const currentYM = now.toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Exercise calendar</h1>
        <p className="mt-1 text-sm text-muted">
          {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"} with planned or
          started dates.
        </p>
      </header>

      {sortedYMs.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-strong bg-surface-1 p-6 text-center text-sm text-muted">
          No exercises scheduled yet.
        </p>
      ) : (
        <div className="space-y-6">
          {sortedYMs.map((ym) => {
            const date = new Date(ym + "-01");
            const label = date.toLocaleString("en-GB", { month: "long", year: "numeric" });
            const isCurrent = ym === currentYM;
            const list = groups.get(ym) ?? [];
            return (
              <section key={ym} className="space-y-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
                  {label}
                  {isCurrent && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                      Current
                    </span>
                  )}
                </h2>
                <ul className="space-y-2">
                  {list.map((ex) => {
                    const d = ex.plannedDate ?? ex.startedAt;
                    return (
                      <li
                        key={ex.id}
                        className="flex items-center justify-between rounded-md border border-line bg-surface-1 p-3 text-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-20 shrink-0 text-center">
                            <div className="text-xs uppercase tracking-wide text-muted">
                              {d?.toLocaleString("en-GB", { weekday: "short" })}
                            </div>
                            <div className="text-2xl font-semibold text-slate-800">
                              {d?.getDate()}
                            </div>
                          </div>
                          <div>
                            <Link
                              href={`/exercises/${ex.id}`}
                              className="font-medium hover:underline"
                            >
                              {ex.title}
                            </Link>
                            <div className="text-xs text-muted">
                              {ex.scenario.title} ·{" "}
                              {ex.facilitator?.name ?? ex.facilitator?.email ?? "—"}
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                          {ex.status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
