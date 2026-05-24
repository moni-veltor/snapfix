import { NextResponse } from "next/server";
import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAuditWhere } from "@/lib/audit-query";

/**
 * Stream the audit log for the caller's org as a CSV, applying the same
 * filters the /audit UI is rendering. Capped at 50,000 rows per export
 * so a runaway query can't tank the server — anyone needing more should
 * narrow the date range or run multiple exports.
 *
 * RFC-4180 quoting: any field containing comma, quote or newline is
 * wrapped in double quotes; internal quotes are doubled.
 */

const MAX_ROWS = 50_000;

export async function GET(request: Request) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const url = new URL(request.url);
  const where = buildAuditWhere({
    orgId: me.orgId,
    q: (url.searchParams.get("q") ?? "").trim(),
    action: url.searchParams.get("action") ?? "all",
    actor: url.searchParams.get("actor") ?? "all",
    fromDate: url.searchParams.get("from") ?? "",
    toDate: url.searchParams.get("to") ?? "",
  });

  const rows = await prisma.auditLogEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    include: { actor: { select: { name: true, email: true } } },
  });

  const header = [
    "timestamp_iso",
    "action",
    "target_type",
    "target_id",
    "actor_name",
    "actor_email",
    "summary",
  ];
  const lines = [headerLine(header)];
  for (const r of rows) {
    lines.push(
      csvLine([
        r.createdAt.toISOString(),
        r.action,
        r.targetType,
        r.targetId ?? "",
        r.actor?.name ?? "",
        r.actor?.email ?? "",
        r.summary,
      ]),
    );
  }
  if (rows.length === MAX_ROWS) {
    lines.push(
      csvLine([
        "",
        "",
        "",
        "",
        "",
        "",
        `(export truncated at ${MAX_ROWS.toLocaleString()} rows — narrow the date range to see older events)`,
      ]),
    );
  }
  const csv = lines.join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="snapfix-audit-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvLine(cols: string[]): string {
  return cols.map(csvField).join(",");
}

function headerLine(cols: string[]): string {
  return cols.map(csvField).join(",");
}

function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
