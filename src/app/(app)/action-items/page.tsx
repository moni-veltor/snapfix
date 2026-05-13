import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateActionItemStatusAction } from "@/app/actions/action-items";

export const metadata = { title: "Action Items — SnapFix" };

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-surface-2 text-slate-700",
  MEDIUM: "bg-slate-200 text-slate-800",
  HIGH: "bg-amber-100 text-amber-800",
  CRITICAL: "bg-rose-100 text-rose-800",
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-sky-100 text-sky-800",
  BLOCKED: "bg-rose-100 text-rose-800",
  DONE: "bg-emerald-100 text-emerald-800",
  WONT_FIX: "bg-slate-200 text-slate-700",
};

export default async function ActionItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const me = await requireOrgUser();
  const sp = await searchParams;
  const filter = (sp.status ?? "open") as "open" | "all" | "closed";

  const items = await prisma.exerciseActionItem.findMany({
    where: {
      orgId: me.orgId,
      ...(filter === "open"
        ? { status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } }
        : filter === "closed"
          ? { status: { in: ["DONE", "WONT_FIX"] } }
          : {}),
    },
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    include: {
      exercise: { select: { id: true, title: true } },
      ownerUser: { select: { name: true, email: true } },
    },
  });

  const now = Date.now();
  const overdueCount = items.filter(
    (i) => i.dueAt && i.dueAt.getTime() < now && i.status !== "DONE" && i.status !== "WONT_FIX",
  ).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Action items</h1>
        <p className="mt-1 text-sm text-muted">
          {items.length} {filter === "open" ? "open" : filter === "closed" ? "closed" : "total"}
          {overdueCount > 0 && filter !== "closed" && (
            <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-800">
              {overdueCount} overdue
            </span>
          )}
        </p>
        <div className="mt-3 flex gap-2 text-xs">
          {(["open", "all", "closed"] as const).map((f) => (
            <Link
              key={f}
              href={`/action-items?status=${f}`}
              className={`rounded-full px-3 py-1 ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "border border-line-strong text-slate-700 hover:bg-surface-1"
              }`}
            >
              {f.toUpperCase()}
            </Link>
          ))}
        </div>
      </header>

      <ul className="space-y-2">
        {items.length === 0 && (
          <li className="rounded-md border border-dashed border-line-strong bg-surface-1 p-6 text-center text-sm text-muted">
            No action items in this view.
          </li>
        )}
        {items.map((i) => {
          const overdue =
            i.dueAt &&
            i.dueAt.getTime() < now &&
            i.status !== "DONE" &&
            i.status !== "WONT_FIX";
          return (
            <li
              key={i.id}
              className={`rounded-md border p-4 text-sm ${
                overdue ? "border-rose-200 bg-rose-50/30" : "border-line bg-surface-1"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{i.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_STYLES[i.priority]}`}>
                      {i.priority}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[i.status]}`}>
                      {i.status}
                    </span>
                    {overdue && (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs text-white">
                        overdue
                      </span>
                    )}
                  </div>
                  {i.description && <p className="mt-1 text-slate-600">{i.description}</p>}
                  <div className="mt-2 text-xs text-muted">
                    From{" "}
                    <Link href={`/exercises/${i.exercise.id}`} className="underline">
                      {i.exercise.title}
                    </Link>
                    {i.ownerUser ? (
                      <> · Owner: {i.ownerUser.name ?? i.ownerUser.email}</>
                    ) : i.ownerText ? (
                      <> · Owner: {i.ownerText}</>
                    ) : null}
                    {i.dueAt && <> · Due {i.dueAt.toISOString().slice(0, 10)}</>}
                  </div>
                </div>
                <form action={updateActionItemStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={i.id} />
                  <select
                    name="status"
                    defaultValue={i.status}
                    className="rounded border border-line-strong px-2 py-1 text-xs"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="DONE">DONE</option>
                    <option value="WONT_FIX">WONT_FIX</option>
                  </select>
                  <button className="rounded border border-line-strong px-2 py-1 text-xs">
                    Save
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
