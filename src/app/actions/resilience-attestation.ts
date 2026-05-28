"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  buildResilienceSnapshot,
  computeRetainUntilAt,
} from "@/lib/resilience-attestation";

/**
 * Open a new annual attestation cycle for the given year (default: this
 * year). Creates a DRAFT row, captures the initial frozen snapshot, and
 * redirects to the drill page. Idempotent per (org, year) via the schema's
 * @@unique — a second attempt redirects to the existing cycle.
 *
 * Sign-off itself (the three-line chain) lands in R3; this only stands up
 * the cycle and its snapshot.
 */
const OpenInput = z.object({
  cycleYear: z.coerce.number().int().min(2000).max(2100).optional(),
});

export async function openAttestationCycleAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const { cycleYear } = OpenInput.parse({
    cycleYear: formData.get("cycleYear") || undefined,
  });
  const year = cycleYear ?? new Date().getUTCFullYear();

  const existing = await prisma.orgResilienceAttestation.findFirst({
    where: { orgId: me.orgId, cycleYear: year },
    select: { id: true },
  });
  if (existing) {
    redirect(`/resilience/attest/${year}`);
  }

  const openedAt = new Date();
  const snapshot = await buildResilienceSnapshot(me.orgId);

  const created = await prisma.orgResilienceAttestation.create({
    data: {
      orgId: me.orgId,
      cycleYear: year,
      cycleLabel: `FY${year}`,
      status: "DRAFT",
      openedAt,
      openedById: me.id,
      snapshotJson: snapshot as never,
      retainUntilAt: computeRetainUntilAt(openedAt),
    },
    select: { id: true },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "attestation.cycle.opened",
    targetType: "attestation",
    targetId: created.id,
    summary: `Opened the FY${year} operational-resilience attestation cycle`,
    metadata: {
      cycleYear: year,
      ibsCount: snapshot.ibsRegister.length,
      exerciseCount: snapshot.exerciseHistoryLast12Months.length,
    },
  });

  redirect(`/resilience/attest/${year}`);
}

/**
 * Re-capture the snapshot on a DRAFT cycle. Lets an admin refresh the
 * frozen rollup after editing the IBS register / vendors / exercises but
 * before sign-off. No-op once the cycle is signed (snapshot is the
 * historical record from then on).
 */
const RegenInput = z.object({ cycleId: z.string().min(1) });

export async function regenerateAttestationSnapshotAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const { cycleId } = RegenInput.parse({ cycleId: formData.get("cycleId") });

  const cycle = await prisma.orgResilienceAttestation.findFirst({
    where: { id: cycleId, orgId: me.orgId },
    select: { id: true, cycleYear: true, status: true },
  });
  if (!cycle) return;
  if (cycle.status !== "DRAFT") return; // frozen once under review / attested

  const snapshot = await buildResilienceSnapshot(me.orgId);
  await prisma.orgResilienceAttestation.update({
    where: { id: cycle.id },
    data: { snapshotJson: snapshot as never },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "attestation.snapshot.generated",
    targetType: "attestation",
    targetId: cycle.id,
    summary: `Refreshed the FY${cycle.cycleYear} attestation snapshot`,
    metadata: { cycleYear: cycle.cycleYear, ibsCount: snapshot.ibsRegister.length },
  });

  revalidatePath(`/resilience/attest/${cycle.cycleYear}`);
}
