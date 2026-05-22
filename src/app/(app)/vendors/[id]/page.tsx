import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import MtpEditor, {
  AssessmentsPanel,
  ReadinessHeader,
} from "@/components/vendors/MtpEditor";
import type { VendorExisting } from "@/components/vendors/VendorAddWizard";
import VendorDetailTabs, {
  type VendorTabKey,
} from "@/components/vendors/VendorDetailTabs";
import VendorDetailWizardWrapper from "@/components/vendors/VendorDetailWizardWrapper";
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

  const wizardExisting: VendorExisting = {
    id: vendor.id,
    name: vendor.name,
    description: vendor.description,
    serviceKind: vendor.serviceKind,
    tier: vendor.tier,
    contactName: vendor.contactName,
    contactEmail: vendor.contactEmail,
    statusUrl: vendor.statusUrl,
    isDoraCritical: vendor.isDoraCritical,
    doraIctTier: vendor.doraIctTier,
    hyperscaler: vendor.hyperscaler,
    region: vendor.region,
    contractStartAt: vendor.contractStartAt,
    contractEndAt: vendor.contractEndAt,
    contractRenewalNoticeDays: vendor.contractRenewalNoticeDays,
    contractAnnualValueGBP: vendor.contractAnnualValueGBP,
    assuranceKind: vendor.assuranceKind,
    assuranceExpiryAt: vendor.assuranceExpiryAt,
    exitPlanReviewedAt: vendor.exitPlanReviewedAt,
    exitPlanRTOMin: vendor.exitPlanRTOMin,
    exitPlanNotes: vendor.exitPlanNotes,
  };

  const basicsPanel: ReactNode = (
    <section className="rounded-xl border border-line bg-surface-1 p-5">
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-ink">Vendor basics</h2>
        <p className="mt-0.5 text-[11px] text-soft">
          Same five-step wizard used to add a vendor. Save persists the row.
        </p>
      </header>
      <VendorDetailWizardWrapper existing={wizardExisting} />
    </section>
  );

  const mtpPanel: ReactNode = (
    <MtpEditor
      vendor={vendor}
      readiness={readiness}
      canEdit={canEdit}
      hideReadiness
      hideAssessments
    />
  );

  const assessmentsPanel: ReactNode = (
    <AssessmentsPanel
      vendorId={vendor.id}
      assessments={vendor.assessments}
      canEdit={canEdit}
    />
  );

  const notificationsPanel: ReactNode = (
    <NotificationsPanel
      vendorId={vendor.id}
      vendorName={vendor.name}
      isMTP={vendor.isMaterialThirdParty}
      registerReady={readiness.isRegisterReady}
      canEdit={canEdit}
      notifications={vendor.notifications}
    />
  );

  const panels: Partial<Record<VendorTabKey, ReactNode>> = {
    basics: basicsPanel,
    mtp: mtpPanel,
    assessments: assessmentsPanel,
    notifications: notificationsPanel,
  };
  const counts: Partial<Record<VendorTabKey, number>> = {
    assessments: vendor.assessments.length,
    notifications: vendor.notifications.length,
  };

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
            ? "Feeds register + notifications"
            : "Mark MTP to unlock register fields"
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

      <ReadinessHeader readiness={readiness} isMTP={vendor.isMaterialThirdParty} />

      <VendorDetailTabs vendorId={vendor.id} panels={panels} counts={counts} />
    </div>
  );
}
