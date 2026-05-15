import Link from "next/link";
import { Boxes, Library } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import DORAInsights from "@/components/vendors/DORAInsights";
import VendorGrid from "@/components/vendors/VendorGrid";
import VendorAddWizard from "@/components/vendors/VendorAddWizard";
import type { VendorLite } from "@/lib/dora";

export default async function VendorsPage() {
  const me = await requireOrgUser();
  const [vendors, ibsList] = await Promise.all([
    prisma.vendor.findMany({
      where: { orgId: me.orgId },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
      include: {
        ibsLinks: { include: { ibs: { select: { id: true, code: true, name: true } } } },
        _count: { select: { ibsLinks: true } },
      },
    }),
    prisma.organizationIBS.findMany({
      where: { orgId: me.orgId },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const vendorsLite: VendorLite[] = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    tier: v.tier,
    isDoraCritical: v.isDoraCritical,
    doraIctTier: v.doraIctTier,
    hyperscaler: v.hyperscaler,
    region: v.region,
    contractStartAt: v.contractStartAt,
    contractEndAt: v.contractEndAt,
    contractRenewalNoticeDays: v.contractRenewalNoticeDays,
    contractAnnualValueGBP: v.contractAnnualValueGBP,
    assuranceKind: v.assuranceKind,
    assuranceExpiryAt: v.assuranceExpiryAt,
    exitPlanReviewedAt: v.exitPlanReviewedAt,
    exitPlanRTOMin: v.exitPlanRTOMin,
    exitPlanNotes: v.exitPlanNotes,
    fourthParties: v.fourthParties,
    ibsLinkCount: v._count.ibsLinks,
  }));

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Dependencies"
        icon={Boxes}
        title="Critical third parties"
        pitch="Vendors that support your IBSs. Link each to the services it underpins so a vendor outage instantly surfaces the affected IBSs — and capture DORA fields below so the Register of Information stays current."
        actions={
          canManage ? (
            <Link
              href="/vendors/library"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Library size={13} />
              Browse vendor library
            </Link>
          ) : undefined
        }
      />

      <DORAInsights vendors={vendorsLite} />

      {vendors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-8 text-center text-sm text-muted">
          No vendors yet.{" "}
          {canManage
            ? "Start from the library above — or add one manually with the wizard below."
            : "Ask an admin to add the firm's critical third parties."}
        </div>
      ) : (
        <VendorGrid
          vendors={vendors.map((v) => ({
            id: v.id,
            name: v.name,
            description: v.description,
            serviceKind: v.serviceKind,
            tier: v.tier,
            contactName: v.contactName,
            contactEmail: v.contactEmail,
            contactPhone: v.contactPhone,
            statusUrl: v.statusUrl,
            isDoraCritical: v.isDoraCritical,
            hyperscaler: v.hyperscaler,
            region: v.region,
            assuranceKind: v.assuranceKind,
            assuranceExpiryAt: v.assuranceExpiryAt,
            exitPlanReviewedAt: v.exitPlanReviewedAt,
            ibsLinks: v.ibsLinks.map((l) => ({
              ibsId: l.ibsId,
              ibs: { id: l.ibs.id, code: l.ibs.code, name: l.ibs.name },
            })),
          }))}
          ibsList={ibsList}
          canManage={canManage}
        />
      )}

      {canManage && <VendorAddWizard />}
    </div>
  );
}
