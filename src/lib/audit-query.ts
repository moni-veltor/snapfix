import "server-only";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Shared Prisma `where` builder for the audit log — used by both the
 * /audit page (paginated render) and the /api/audit/export route (full
 * CSV stream) so the filter semantics are guaranteed identical.
 */
export function buildAuditWhere({
  orgId,
  q,
  action,
  actor,
  fromDate,
  toDate,
}: {
  orgId: string;
  q: string;
  action: string;
  actor: string;
  fromDate: string;
  toDate: string;
}): Prisma.AuditLogEntryWhereInput {
  const where: Prisma.AuditLogEntryWhereInput = { orgId };
  if (action !== "all") where.action = action;
  if (actor === "__system__") where.actorId = null;
  else if (actor !== "all") where.actor = { email: actor };
  const createdAt: Prisma.DateTimeFilter = {};
  if (fromDate) {
    const d = new Date(`${fromDate}T00:00:00`);
    if (!Number.isNaN(d.getTime())) createdAt.gte = d;
  }
  if (toDate) {
    const d = new Date(`${toDate}T23:59:59`);
    if (!Number.isNaN(d.getTime())) createdAt.lte = d;
  }
  if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;
  if (q) {
    where.OR = [
      { summary: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
      { actor: { is: { name: { contains: q, mode: "insensitive" } } } },
      { actor: { is: { email: { contains: q, mode: "insensitive" } } } },
    ];
  }
  return where;
}
