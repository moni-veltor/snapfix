import { NextResponse } from "next/server";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CSV_HEADERS, vendorToCsvRow, type VendorLite } from "@/lib/dora";

function csvEscape(s: string): string {
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const me = await requireOrgUser();
  const vendors = await prisma.vendor.findMany({
    where: { orgId: me.orgId },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    include: { _count: { select: { ibsLinks: true } } },
  });

  const rows = vendors.map<VendorLite>((v) => ({
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

  const lines = [CSV_HEADERS.map(csvEscape).join(",")];
  for (const v of rows) {
    lines.push(vendorToCsvRow(v).map(csvEscape).join(","));
  }
  const body = lines.join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dora-register-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
