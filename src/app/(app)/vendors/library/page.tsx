import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import VendorLibraryGrid from "@/components/vendors/VendorLibraryGrid";
import { VENDOR_LIBRARY } from "@/lib/vendor-library";

export const metadata = { title: "Vendor library — SnapFix" };

export default async function VendorLibraryPage() {
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const existing = await prisma.vendor.findMany({
    where: { orgId: me.orgId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => e.name));

  return (
    <div className="space-y-6">
      <Link
        href="/vendors"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        Back to register
      </Link>
      <PageHero
        eyebrow="Library"
        icon={Library}
        title="Vendor library"
        pitch={`${VENDOR_LIBRARY.length} pre-built providers active in UK banking & fintech — Thought Machine, Mambu, ClearBank, GoCardless, AWS and more, grouped by domain. One-click to add to your register.`}
      />
      <VendorLibraryGrid
        library={VENDOR_LIBRARY}
        existingNames={existingNames}
        canManage={canManage}
      />
    </div>
  );
}
