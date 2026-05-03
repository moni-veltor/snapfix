import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RunsPage() {
  await requireUser();
  const runs = await prisma.exerciseRun.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      scenario: { select: { title: true } },
      facilitator: { select: { name: true, email: true } },
    },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Exercise runs</h1>
      {runs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No runs yet. A facilitator can start one from a scenario.
        </p>
      ) : (
        <ul className="space-y-2">
          {runs.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-4 text-sm">
              <div>
                <Link href={`/runs/${r.id}`} className="font-medium hover:underline">
                  {r.title}
                </Link>
                <div className="text-xs text-slate-500">
                  {r.scenario.title} · facilitator {r.facilitator?.name ?? r.facilitator?.email ?? "—"}
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{r.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
