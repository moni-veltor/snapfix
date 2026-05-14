"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";
import { CommsStatus, CommsStakeholder } from "@/generated/prisma/enums";

const StakeholderLabel: Record<CommsStakeholder, string> = {
  EMPLOYEES: "Employees",
  CUSTOMERS: "Customers",
  REGULATORS: "Regulators",
  SHAREHOLDERS: "Shareholders",
  MEDIA: "Media",
  THIRD_PARTY_VENDORS: "Third-party vendors",
  INTERMEDIARIES: "Intermediaries",
  ICO: "ICO",
  INSURERS: "Insurers",
  OTHER: "Other",
};

/**
 * Cascade ordering rule:
 *   - Employees BEFORE customers / third parties
 *   - Customers WITH third parties (i.e. customers requires employees done)
 *   - Media WITH customers (i.e. media requires employees done)
 * Returns a violation message, or null if the cascade is satisfied.
 */
async function cascadeViolation(
  exerciseId: string,
  stakeholder: CommsStakeholder | null,
): Promise<string | null> {
  if (!stakeholder) return null;

  // For these audiences, employees must be SENT first.
  const requiresEmployeesFirst: CommsStakeholder[] = [
    "CUSTOMERS",
    "MEDIA",
    "THIRD_PARTY_VENDORS",
    "INTERMEDIARIES",
  ];
  if (!requiresEmployeesFirst.includes(stakeholder)) return null;

  const employeeSent = await prisma.communicationDraft.findFirst({
    where: { exerciseId, stakeholder: "EMPLOYEES", status: "SENT" },
    select: { id: true },
  });
  if (employeeSent) return null;

  return `Per industry best practice, communications to ${StakeholderLabel[stakeholder]} must come AFTER communications to employees. Send the employee cascade first.`;
}

const SubmitSchema = z.object({
  exerciseId: z.string(),
  draftId: z.string(),
});

/** Submit a draft for approval. */
export async function submitCommsForApprovalAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = SubmitSchema.parse(Object.fromEntries(formData));
  await prisma.communicationDraft.updateMany({
    where: { id: data.draftId, exercise: { id: data.exerciseId, orgId: me.orgId } },
    data: { status: CommsStatus.AWAITING_APPROVAL },
  });
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}

const ApproveSchema = z.object({
  exerciseId: z.string(),
  draftId: z.string(),
});

/** Approve a draft. */
export async function approveCommsAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = ApproveSchema.parse(Object.fromEntries(formData));
  await prisma.communicationDraft.updateMany({
    where: { id: data.draftId, exercise: { id: data.exerciseId, orgId: me.orgId } },
    data: {
      status: CommsStatus.APPROVED,
      approverId: me.id,
      approvedAt: new Date(),
    },
  });
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}

/** Reject a draft (e.g. cascade ordering, off-message). */
const RejectSchema = z.object({
  exerciseId: z.string(),
  draftId: z.string(),
  reason: z.string().min(1),
});
export async function rejectCommsAction(formData: FormData) {
  const me = await requireOrgUser();
  const data = RejectSchema.parse(Object.fromEntries(formData));
  await prisma.communicationDraft.updateMany({
    where: { id: data.draftId, exercise: { id: data.exerciseId, orgId: me.orgId } },
    data: {
      status: CommsStatus.REJECTED,
      rejectionReason: data.reason,
      approverId: me.id,
    },
  });
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}

const SendSchema = z.object({
  exerciseId: z.string(),
  draftId: z.string(),
});

/** Mark a draft as sent. Enforces cascade-ordering (best practice */
export async function sendCommsAction(formData: FormData): Promise<{ error?: string } | void> {
  const me = await requireOrgUser();
  const data = SendSchema.parse(Object.fromEntries(formData));

  const draft = await prisma.communicationDraft.findFirst({
    where: { id: data.draftId, exercise: { id: data.exerciseId, orgId: me.orgId } },
  });
  if (!draft) return;

  if (draft.status !== "APPROVED" && draft.status !== "AWAITING_APPROVAL") {
    return { error: "Draft must be approved before sending." };
  }

  const violation = await cascadeViolation(data.exerciseId, draft.stakeholder);
  if (violation) return { error: violation };

  await prisma.communicationDraft.update({
    where: { id: draft.id },
    data: { status: CommsStatus.SENT, sentAt: new Date() },
  });
  revalidatePath(`/exercises/${data.exerciseId}/live`);
}
