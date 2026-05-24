import { Clock, ScrollText, User as UserIcon } from "lucide-react";
import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import Pagination from "@/components/ui/Pagination";
import AuditFilters from "@/components/audit/AuditFilters";
import { buildAuditWhere } from "@/lib/audit-query";

export const metadata = { title: "Audit Log — SnapFix" };

const PAGE_SIZE = 50;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    action?: string;
    actor?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const action = sp.action ?? "all";
  const actor = sp.actor ?? "all";
  const fromDate = sp.from ?? "";
  const toDate = sp.to ?? "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where = buildAuditWhere({ orgId: me.orgId, q, action, actor, fromDate, toDate });

  // Page-of-results + full count + distinct action/actor lists for the
  // filter selects. All in parallel.
  const [entries, totalMatched, totalAll, actionGroups, actorRows] = await Promise.all([
    prisma.auditLogEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLogEntry.count({ where }),
    prisma.auditLogEntry.count({ where: { orgId: me.orgId } }),
    prisma.auditLogEntry.groupBy({
      by: ["action"],
      where: { orgId: me.orgId },
      _count: { _all: true },
      orderBy: { action: "asc" },
    }),
    prisma.auditLogEntry.findMany({
      where: { orgId: me.orgId, actorId: { not: null } },
      distinct: ["actorId"],
      select: { actor: { select: { id: true, name: true, email: true } } },
      take: 200,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalMatched / PAGE_SIZE));

  const actionOptions = actionGroups.map((g) => ({
    value: g.action,
    count: g._count._all,
  }));
  const actorOptions = actorRows
    .map((r) => r.actor)
    .filter((u): u is NonNullable<typeof u> => u !== null)
    .map((u) => ({ value: u.email, label: u.name ?? u.email }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Pre-build the CSV export URL preserving the current filters.
  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (action !== "all") exportParams.set("action", action);
  if (actor !== "all") exportParams.set("actor", actor);
  if (fromDate) exportParams.set("from", fromDate);
  if (toDate) exportParams.set("to", toDate);
  const exportHref = `/api/audit/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Trace"
        icon={ScrollText}
        title="Audit log"
        pitch={`${totalAll.toLocaleString()} events · regulator-ready trace · CSV export`}
      />

      <AuditFilters
        q={q}
        action={action}
        actor={actor}
        fromDate={fromDate}
        toDate={toDate}
        actionOptions={actionOptions}
        actorOptions={actorOptions}
        exportHref={exportHref}
      />

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
          No audit events match this view.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
          <ul className="divide-y divide-line text-sm">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-2 px-3 py-2 hover:bg-surface-2"
              >
                <Clock size={11} className="shrink-0 text-soft" aria-hidden="true" />
                <span
                  className="font-mono text-[11px] text-soft"
                  title={e.createdAt.toISOString()}
                >
                  {formatTimestamp(e.createdAt)}
                </span>
                <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  {e.action}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink">{e.summary}</span>
                <span className="flex shrink-0 items-center gap-1 text-[10px] text-soft">
                  <UserIcon size={9} aria-hidden="true" />
                  {e.actor?.name ?? e.actor?.email ?? "system"}
                </span>
              </li>
            ))}
          </ul>
          <Pagination
            basePath="/audit"
            currentPage={page}
            totalPages={totalPages}
            total={totalMatched}
            pageSize={PAGE_SIZE}
            itemLabel="events"
            otherParams={{
              q: q || undefined,
              action: action !== "all" ? action : undefined,
              actor: actor !== "all" ? actor : undefined,
              from: fromDate || undefined,
              to: toDate || undefined,
            }}
          />
        </div>
      )}
    </div>
  );
}

function formatTimestamp(d: Date): string {
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
