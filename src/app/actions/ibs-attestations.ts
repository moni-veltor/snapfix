"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { AttestationLine } from "@/generated/prisma/enums";

const LINES: AttestationLine[] = ["FIRST_LINE", "SECOND_LINE", "EXECUTIVE"];

function defaultCycleLabel(d: Date = new Date()): string {
  return `${d.getUTCFullYear()}-FY`;
}

const StartCycleSchema = z.object({
  ibsId: z.string().min(1),
  cycle: z.string().min(1).max(20).optional(),
});

/**
 * Open a new attestation cycle for an IBS. Creates three REQUESTED
 * entries (FIRST_LINE, SECOND_LINE, EXECUTIVE) under the same cycle
 * label. Idempotent — if a cycle with the same label exists, this is a
 * no-op so the action can be re-triggered safely.
 */
export async function startAttestationCycleAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const parsed = StartCycleSchema.safeParse({
    ibsId: formData.get("ibsId"),
    cycle: formData.get("cycle") || undefined,
  });
  if (!parsed.success) return;
  const { ibsId } = parsed.data;
  const cycle = parsed.data.cycle ?? defaultCycleLabel();

  const ibs = await prisma.organizationIBS.findFirst({
    where: { id: ibsId, orgId: me.orgId },
    select: { id: true, code: true, name: true },
  });
  if (!ibs) return;

  // Skip if any entry already exists for this cycle.
  const existing = await prisma.iBSAttestation.findFirst({
    where: { ibsId, cycle },
    select: { id: true },
  });
  if (existing) {
    revalidatePath(`/ibs/${ibsId}`);
    return;
  }

  await prisma.iBSAttestation.createMany({
    data: LINES.map((line) => ({
      ibsId,
      orgId: me.orgId,
      cycle,
      line,
      status: "REQUESTED" as const,
    })),
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "ibs.attestation.requested",
    targetType: "ibs",
    targetId: ibsId,
    summary: `Opened attestation cycle ${cycle} for ${ibs.code} — ${ibs.name}`,
  });

  revalidatePath(`/ibs/${ibsId}`);
  revalidatePath("/ibs");
}

const DecideSchema = z.object({
  attestationId: z.string().min(1),
  decision: z.enum(["ATTESTED", "REJECTED"]),
  comment: z.string().max(2000).optional(),
});

/**
 * Sign off (or reject) an open attestation. Reviewer is the current user.
 * Any org member can attest — gate on role at the line level handled in the
 * UI (FIRST_LINE typically the process owner; SECOND_LINE typically risk;
 * EXECUTIVE typically OWNER). The action accepts any authenticated org user
 * to keep the workflow flexible; record-keeping shows who actually signed.
 */
export async function decideAttestationAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN", "MEMBER");
  const parsed = DecideSchema.safeParse({
    attestationId: formData.get("attestationId"),
    decision: formData.get("decision"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) return;
  const { attestationId, decision, comment } = parsed.data;

  const att = await prisma.iBSAttestation.findFirst({
    where: { id: attestationId, orgId: me.orgId, status: "REQUESTED" },
    include: { ibs: { select: { code: true, name: true } } },
  });
  if (!att) return;

  await prisma.iBSAttestation.update({
    where: { id: attestationId },
    data: {
      status: decision,
      reviewerId: me.id,
      reviewedAt: new Date(),
      comment: comment ?? null,
    },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action:
      decision === "ATTESTED"
        ? "ibs.attestation.attested"
        : "ibs.attestation.rejected",
    targetType: "ibs",
    targetId: att.ibsId,
    summary: `${decision === "ATTESTED" ? "Signed off" : "Rejected"} ${att.line} for ${att.ibs.code} (cycle ${att.cycle})`,
  });

  revalidatePath(`/ibs/${att.ibsId}`);
  revalidatePath("/ibs");
}
