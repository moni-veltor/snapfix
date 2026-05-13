import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Audit Log — SnapFix" };

export default async function AuditPage() {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const entries = await prisma.auditLogEntry.findMany({
    where: { orgId: me.orgId },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-muted">
          Last {entries.length} events. Surfaced for regulator / internal-audit traceability.
        </p>
      </header>

      <ul className="space-y-1 text-sm">
        {entries.length === 0 && (
          <li className="rounded border border-dashed border-line-strong bg-surface-1 p-6 text-center text-muted">
            No audit events yet.
          </li>
        )}
        {entries.map((e) => (
          <li
            key={e.id}
            className="rounded border border-line bg-surface-1 px-3 py-2"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="font-mono text-xs text-muted">
                  {e.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                </span>{" "}
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">{e.action}</span>{" "}
                <span className="text-slate-800">{e.summary}</span>
              </div>
              <span className="text-xs text-muted">
                {e.actor?.name ?? e.actor?.email ?? "system"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
