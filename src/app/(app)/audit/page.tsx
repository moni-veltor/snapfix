import { ScrollText } from "lucide-react";
import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import AuditLogView from "@/components/audit/AuditLogView";

export const metadata = { title: "Audit Log — SnapFix" };

export default async function AuditPage() {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const entries = await prisma.auditLogEntry.findMany({
    where: { orgId: me.orgId },
    orderBy: { createdAt: "desc" },
    take: 2000,
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Trace"
        icon={ScrollText}
        title="Audit log"
        pitch={`Last ${entries.length} events. Filter by action, actor or date range; export the filtered view as CSV for internal-audit and regulator submissions.`}
      />
      <AuditLogView entries={entries} />
    </div>
  );
}
