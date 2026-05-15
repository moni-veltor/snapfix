import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import SystemLibraryGrid from "@/components/tech/SystemLibraryGrid";
import { SYSTEM_LIBRARY } from "@/lib/tech-system-library";

export const metadata = { title: "System library — SnapFix" };

export default async function SystemLibraryPage() {
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const existing = await prisma.techSystem.findMany({
    where: { orgId: me.orgId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => e.name));

  return (
    <div className="space-y-6">
      <Link
        href="/tech-recovery"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        Back to register
      </Link>
      <PageHero
        eyebrow="Library"
        icon={Library}
        title="Tech system library"
        pitch={`${SYSTEM_LIBRARY.length} pre-built systems typical of a UK banking stack — core ledger, payments engine, IdP, hyperscaler regions, SWIFT and more. One-click to add with sensible RTO / RPO / failover defaults you can tune later.`}
      />
      <SystemLibraryGrid existingNames={existingNames} canManage={canManage} />
    </div>
  );
}
