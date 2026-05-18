import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import MtpEditor from "@/components/vendors/MtpEditor";
import { evaluateVendorReadiness } from "@/lib/vendor-mtp-readiness";
import NotificationsPanel from "@/components/vendors/NotificationsPanel";

export const metadata = { title: "Vendor — SnapFix" };

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireOrgUser();
  const canEdit = me.orgRole === "OWNER" || me.orgRole === "ADMIN";
  const { id } = await params;

  const vendor = await prisma.vendor.findFirst({
    where: { id, orgId: me.orgId },
    include: {
      assessments: { orderBy: [{ kind: "asc" }, { assessedAt: "desc" }] },
      ibsLinks: { include: { ibs: { select: { id: true, name: true, criticality: true } } } },
      notifications: { orderBy: { submissionId: "desc" } },
    },
  });
  if (!vendor) notFound();

  const readiness = evaluateVendorReadiness(vendor);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={
          vendor.isMaterialThirdParty
            ? `Material Third Party · ${vendor.tier}`
            : `Vendor · ${vendor.tier}`
        }
        icon={vendor.isMaterialThirdParty ? ShieldCheck : Building2}
        title={vendor.name}
        pitch={
          vendor.isMaterialThirdParty
            ? "PS26/2 register & notification record. All fields below feed the annual register snapshot and any contract-change notification you file."
            : "Mark as Material Third Party (PS26/2 1.04) to unlock register + notification fields."
        }
        actions={
          <Link
            href="/vendors"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
          >
            <ArrowLeft size={14} />
            Back to vendors
          </Link>
        }
      />

      <MtpEditor
        vendor={vendor}
        readiness={readiness}
        canEdit={canEdit}
      />

      <NotificationsPanel
        vendorId={vendor.id}
        vendorName={vendor.name}
        isMTP={vendor.isMaterialThirdParty}
        registerReady={readiness.isRegisterReady}
        canEdit={canEdit}
        notifications={vendor.notifications}
      />
    </div>
  );
}
