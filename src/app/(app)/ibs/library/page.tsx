import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import IBSLibraryGrid from "@/components/ibs/IBSLibraryGrid";
import { IBS_LIBRARY } from "@/lib/ibs-library";

export const metadata = { title: "IBS Library — SnapFix" };

export default async function IBSLibraryPage() {
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const [org, existing] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: me.orgId },
      select: { tier: true },
    }),
    prisma.organizationIBS.findMany({
      where: { orgId: me.orgId },
      select: { name: true },
    }),
  ]);

  const existingNames = new Set(existing.map((e) => e.name));

  return (
    <div className="space-y-6">
      <Link
        href="/ibs"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        Back to register
      </Link>
      <PageHero
        eyebrow="Library"
        icon={Library}
        title="IBS library"
        pitch={`${IBS_LIBRARY.length} pre-built Important Business Services across tier-1 banks, tier-2 fintechs and tier-3 insurers. One-click to add — codes are sequenced automatically.`}
      />
      <IBSLibraryGrid
        library={IBS_LIBRARY}
        existingNames={existingNames}
        orgTier={org?.tier ?? null}
        canManage={canManage}
      />
    </div>
  );
}
