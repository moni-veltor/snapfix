import { CheckSquare, Flame, ListChecks, Clock, CheckCircle2 } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import ActionItemBoard from "@/components/action-items/ActionItemBoard";

export const metadata = { title: "Action Items — SnapFix" };

type Filter = "open" | "overdue" | "in-progress" | "blocked" | "closed" | "all";

const VALID_FILTERS: Filter[] = [
  "open",
  "overdue",
  "in-progress",
  "blocked",
  "closed",
  "all",
];

export default async function ActionItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const me = await requireOrgUser();

  const items = await prisma.exerciseActionItem.findMany({
    where: { orgId: me.orgId },
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    include: {
      exercise: { select: { id: true, title: true } },
      ownerUser: { select: { name: true, email: true } },
    },
  });

  // Server-side counts for the stat row. `Date.now()` is "impure" by
  // React's purity rule, but in a server component each render maps
  // 1:1 to a request — the value is stable for the render that matters.
  /* eslint-disable react-hooks/purity */
  const now = Date.now();
  const ago7d = now - 7 * 86_400_000;
  /* eslint-enable react-hooks/purity */

  const isOverdue = (i: (typeof items)[number]) =>
    !!i.dueAt &&
    i.dueAt.getTime() < now &&
    i.status !== "DONE" &&
    i.status !== "WONT_FIX";
  const openCount = items.filter((i) => i.status === "OPEN").length;
  const inProgressCount = items.filter((i) => i.status === "IN_PROGRESS").length;
  const overdueCount = items.filter(isOverdue).length;
  const closedCount = items.filter(
    (i) => i.status === "DONE" || i.status === "WONT_FIX",
  ).length;
  const closedRecently = items.filter(
    (i) =>
      (i.status === "DONE" || i.status === "WONT_FIX") &&
      i.updatedAt.getTime() >= ago7d,
  ).length;

  const sp = await searchParams;
  const requestedFilter = sp.status as Filter | undefined;
  const defaultFilter: Filter =
    requestedFilter && VALID_FILTERS.includes(requestedFilter)
      ? requestedFilter
      : "open";

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Follow-through"
        icon={CheckSquare}
        title="Action items"
        pitch="Debrief follow-through · close the loop"
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Open"
          value={openCount}
          icon={<ListChecks size={12} />}
          tone={openCount > 20 ? "warn" : "neutral"}
        />
        <Stat
          label="In progress"
          value={inProgressCount}
          icon={<Clock size={12} />}
          tone="neutral"
        />
        <Stat
          label="Overdue"
          value={overdueCount}
          icon={<Flame size={12} />}
          tone={overdueCount > 0 ? "critical" : "ok"}
        />
        <Stat
          label="Closed (7d)"
          value={closedRecently}
          icon={<CheckCircle2 size={12} />}
          tone="ok"
          sub={`${closedCount} total`}
        />
      </section>

      <ActionItemBoard
        defaultFilter={defaultFilter}
        items={items.map((i) => ({
          id: i.id,
          title: i.title,
          description: i.description,
          priority: i.priority,
          status: i.status,
          dueAt: i.dueAt,
          ownerText: i.ownerText,
          ownerUser: i.ownerUser,
          exercise: i.exercise,
        }))}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone = "neutral",
  sub,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone?: "ok" | "warn" | "critical" | "neutral";
  sub?: string;
}) {
  const cls =
    tone === "critical"
      ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
        : tone === "ok"
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
          : "border-line bg-surface-1";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-soft">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
      {sub && <div className="text-[10px] text-soft">{sub}</div>}
    </div>
  );
}
