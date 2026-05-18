"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { generateNotificationXlsx, submissionTypeLabel } from "@/lib/ps26-xlsx";
import { MtpSubmissionType } from "@/generated/prisma/enums";
import { audit } from "@/lib/audit";

const CreateSchema = z.object({
  vendorId: z.string(),
  submissionType: z.nativeEnum(MtpSubmissionType),
  reportingDate: z.string().min(1),
  changeNarrative: z.string().max(2000).optional(),
  notificationNote: z.string().max(2000).optional(),
});

/**
 * Generate a PS26/2 notification XLSX + persist VendorMtpNotification.
 * Submission state starts as DRAFT; submitNotificationAction flips it to
 * SUBMITTED once the firm has actually filed with the regulator.
 */
export async function generateNotificationAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  const data = CreateSchema.parse(raw);

  const [org, vendor] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: me.orgId },
      select: { name: true, slug: true },
    }),
    prisma.vendor.findFirst({
      where: { id: data.vendorId, orgId: me.orgId },
      include: { assessments: { orderBy: { assessedAt: "desc" } } },
    }),
  ]);
  if (!vendor) redirect("/vendors");

  // Auto-increment submissionId per vendor.
  const last = await prisma.vendorMtpNotification.findFirst({
    where: { vendorId: vendor.id },
    orderBy: { submissionId: "desc" },
    select: { submissionId: true },
  });
  const submissionId = (last?.submissionId ?? 0) + 1;
  const reportingDate = new Date(data.reportingDate);

  const xlsxBuffer = await generateNotificationXlsx({
    header: {
      reportingDate,
      submissionId,
      submissionType: submissionTypeLabel(data.submissionType),
      firmName: org.name,
      frn: "", // captured in org settings later
      groupHoldingFrn: null,
      renewalChangeNarrative: data.submissionType === "CONTRACT_RENEWAL" ? data.changeNarrative ?? null : null,
    },
    vendor,
  });

  const filename = `vendor-notifications/${org.slug}/${vendor.id}/notif-${reportingDate.toISOString().slice(0, 10)}-${submissionId}.xlsx`;
  const blob = await put(filename, xlsxBuffer, {
    access: "public",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  const created = await prisma.vendorMtpNotification.create({
    data: {
      vendorId: vendor.id,
      submissionType: data.submissionType,
      submissionId,
      reportingDate,
      changeNarrative: data.changeNarrative ?? null,
      notificationNote: data.notificationNote ?? null,
      status: "DRAFT",
      xlsxBlobUrl: blob.url,
      xlsxBlobPath: filename,
      createdByUserId: me.id,
    },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "vendor.notification.generated",
    targetType: "VendorMtpNotification",
    targetId: created.id,
    summary: `Generated ${submissionTypeLabel(data.submissionType)} notification #${submissionId} for ${vendor.name}`,
    metadata: {
      vendorId: vendor.id,
      submissionType: data.submissionType,
      submissionId,
      reportingDate: reportingDate.toISOString(),
    },
  });

  revalidatePath(`/vendors/${vendor.id}`);
  revalidatePath("/vendors/notifications");
}

const FlipStatusSchema = z.object({
  vendorId: z.string(),
  notificationId: z.string(),
  status: z.enum(["SUBMITTED", "ACKNOWLEDGED"]),
  ackReference: z.string().max(120).optional(),
});

export async function flipNotificationStatusAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const data = FlipStatusSchema.parse(Object.fromEntries(formData));

  const ok = await prisma.vendorMtpNotification.findFirst({
    where: {
      id: data.notificationId,
      vendor: { id: data.vendorId, orgId: me.orgId },
    },
    select: { id: true },
  });
  if (!ok) return;

  const now = new Date();
  await prisma.vendorMtpNotification.update({
    where: { id: data.notificationId },
    data: {
      status: data.status,
      ...(data.status === "SUBMITTED" ? { submittedAt: now } : {}),
      ...(data.status === "ACKNOWLEDGED" ? { acknowledgedAt: now, ackReference: data.ackReference ?? null } : {}),
    },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: data.status === "SUBMITTED" ? "vendor.notification.submitted" : "vendor.notification.acknowledged",
    targetType: "VendorMtpNotification",
    targetId: data.notificationId,
    summary: `Notification ${data.status === "SUBMITTED" ? "marked submitted" : `acknowledged${data.ackReference ? ` (${data.ackReference})` : ""}`}`,
  });

  revalidatePath(`/vendors/${data.vendorId}`);
  revalidatePath("/vendors/notifications");
}
