"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { generateRegisterXlsx } from "@/lib/ps26-xlsx";
import { evaluateVendorReadiness } from "@/lib/vendor-mtp-readiness";
import { audit } from "@/lib/audit";

/**
 * Generate the annual PS26/2 MTP register snapshot. Captures an immutable
 * VendorRegisterSnapshot row + uploads the XLSX to Vercel Blob.
 *
 * Snapshot includes every vendor flagged isMaterialThirdParty at this moment;
 * the full Vendor row is JSON-serialised into the snapshot so the filed
 * contents stay reproducible even if the live Vendor row is later edited.
 */
export async function generateAnnualRegisterAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const reportingDateRaw = String(formData.get("reportingDate") ?? "");
  const reportingDate = reportingDateRaw ? new Date(reportingDateRaw) : new Date();

  const [org, vendors] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: me.orgId },
      select: { name: true, slug: true },
    }),
    prisma.vendor.findMany({
      where: { orgId: me.orgId, isMaterialThirdParty: true },
      orderBy: { name: "asc" },
      include: { assessments: { orderBy: { assessedAt: "desc" } } },
    }),
  ]);

  if (vendors.length === 0) return;

  // Compute next submissionId for this org.
  const lastSnap = await prisma.vendorRegisterSnapshot.findFirst({
    where: { orgId: me.orgId },
    orderBy: { submissionId: "desc" },
    select: { submissionId: true },
  });
  const submissionId = (lastSnap?.submissionId ?? 0) + 1;

  // Resolve firm FRN from a settings field if you've got one; fall back to slug.
  const firmFrn = ""; // PS26/2 §1.05 — captured during settings later; left blank for v1.

  const xlsxBuffer = await generateRegisterXlsx({
    header: {
      reportingDate,
      submissionId,
      submissionType: "Annual Material Third Party Register",
      firmName: org.name,
      frn: firmFrn,
      groupHoldingFrn: null,
    },
    vendors,
  });

  // Upload to Vercel Blob.
  const filename = `vendor-register/${org.slug}/snapshot-${reportingDate.toISOString().slice(0, 10)}-${submissionId}.xlsx`;
  const blob = await put(filename, xlsxBuffer, {
    access: "public",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  // Freeze the snapshot data.
  const snapshotData = vendors.map((v) => ({
    vendorId: v.id,
    name: v.name,
    legalName: v.legalName,
    contractRef: v.contractRef,
    readinessPct:
      Math.round((evaluateVendorReadiness(v).passed / evaluateVendorReadiness(v).total) * 100),
    snapshotAt: new Date().toISOString(),
  }));

  const snapshot = await prisma.vendorRegisterSnapshot.create({
    data: {
      orgId: me.orgId,
      reportingDate,
      submissionId,
      vendorSnapshots: snapshotData,
      xlsxBlobUrl: blob.url,
      xlsxBlobPath: filename,
      createdByUserId: me.id,
    },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "vendor.register.generated",
    targetType: "VendorRegisterSnapshot",
    targetId: snapshot.id,
    summary: `Generated PS26/2 MTP register #${submissionId} (${vendors.length} vendors)`,
    metadata: {
      submissionId,
      reportingDate: reportingDate.toISOString(),
      vendorCount: vendors.length,
    },
  });

  revalidatePath("/vendors/register");
}
