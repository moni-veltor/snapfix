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
  appendAttestationHashEntry,
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

// ─── Settings ────────────────────────────────────────────────────────────────

const SettingsInput = z.object({
  smfUserId: z.string().optional(),
  boardCommittee: z.string().max(200).optional(),
  cycleStartMonth: z.coerce.number().int().min(1).max(12).optional().or(z.nan()),
});

export type ResilienceSettingsState = { ok?: true; error?: string } | undefined;

/**
 * Update the org-level attestation configuration: the named SMF accountable
 * (who alone may sign the executive line), the board committee, and the
 * cycle start month. Surfaced at /settings/resilience.
 *
 * useActionState signature so the form can render a "Saved ✓" / error state.
 */
export async function updateResilienceSettingsAction(
  _prev: ResilienceSettingsState,
  formData: FormData,
): Promise<ResilienceSettingsState> {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const parsed = SettingsInput.safeParse({
    smfUserId: formData.get("smfUserId") || undefined,
    boardCommittee: formData.get("boardCommittee") || undefined,
    cycleStartMonth: formData.get("cycleStartMonth") || undefined,
  });
  if (!parsed.success) {
    return { error: "Couldn't save those settings — check the cycle month." };
  }

  // Validate the SMF, if set, is a real user in this org.
  let smfId: string | null = null;
  if (parsed.data.smfUserId) {
    const u = await prisma.user.findFirst({
      where: { id: parsed.data.smfUserId, orgId: me.orgId },
      select: { id: true },
    });
    if (!u) {
      return { error: "That person isn't a member of this organisation." };
    }
    smfId = u.id;
  }

  const month =
    parsed.data.cycleStartMonth === undefined || Number.isNaN(parsed.data.cycleStartMonth)
      ? null
      : parsed.data.cycleStartMonth;

  await prisma.organization.update({
    where: { id: me.orgId },
    data: {
      smfAccountableForResilienceUserId: smfId,
      boardCommitteeForResilienceName: parsed.data.boardCommittee?.trim() || null,
      attestationCycleStartMonth: month,
    },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "attestation.settings.updated",
    targetType: "attestation",
    summary: "Updated operational-resilience attestation settings",
    metadata: { smfSet: !!smfId, boardSet: !!parsed.data.boardCommittee, cycleStartMonth: month },
  });

  revalidatePath("/settings/resilience");
  revalidatePath("/resilience/attest");
  return { ok: true };
}

// ─── Three-line sign-off ─────────────────────────────────────────────────────

const SignInput = z.object({
  cycleId: z.string().min(1),
  line: z.enum(["first", "second", "executive"]),
  notes: z.string().max(2000).optional(),
});

type SignResult = { error?: string } | undefined;

/**
 * Sign one line of the three-line attestation chain. Enforces:
 *   - ordering: first → second → executive
 *   - the executive line may only be signed by the named SMF
 *   - the cycle isn't already ATTESTED / SUPERSEDED
 *
 * The first signature flips DRAFT → UNDER_REVIEW (freezing the snapshot);
 * the executive signature flips UNDER_REVIEW → ATTESTED. Every signature
 * appends a hash-chain entry so the chain of custody is tamper-evident.
 */
export async function signAttestationLineAction(formData: FormData): Promise<SignResult> {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const { cycleId, line, notes } = SignInput.parse({
    cycleId: formData.get("cycleId"),
    line: formData.get("line"),
    notes: formData.get("notes") || undefined,
  });

  const cycle = await prisma.orgResilienceAttestation.findFirst({
    where: { id: cycleId, orgId: me.orgId },
    select: {
      id: true,
      cycleYear: true,
      status: true,
      firstLineSignedAt: true,
      secondLineSignedAt: true,
      executiveSignedAt: true,
    },
  });
  if (!cycle) return { error: "Cycle not found." };
  if (cycle.status === "ATTESTED" || cycle.status === "SUPERSEDED") {
    return { error: "This cycle is already attested — it can't be re-signed." };
  }

  // Ordering guard.
  if (line === "second" && !cycle.firstLineSignedAt) {
    return { error: "The first line must sign before the second line." };
  }
  if (line === "executive" && (!cycle.firstLineSignedAt || !cycle.secondLineSignedAt)) {
    return { error: "Both the first and second lines must sign before the executive." };
  }

  // Executive line is gated to the named SMF.
  if (line === "executive") {
    const org = await prisma.organization.findUnique({
      where: { id: me.orgId },
      select: { smfAccountableForResilienceUserId: true },
    });
    if (!org?.smfAccountableForResilienceUserId) {
      return { error: "Name the SMF accountable in settings before the executive signs." };
    }
    if (org.smfAccountableForResilienceUserId !== me.id) {
      return { error: "Only the named SMF accountable can sign the executive line." };
    }
  }

  const now = new Date();
  const data =
    line === "first"
      ? { firstLineSignedAt: now, firstLineSignedById: me.id, firstLineNotes: notes ?? null }
      : line === "second"
        ? { secondLineSignedAt: now, secondLineSignedById: me.id, secondLineNotes: notes ?? null }
        : { executiveSignedAt: now, executiveSignedById: me.id, executiveNotes: notes ?? null };

  // State transition.
  const nextStatus =
    line === "executive" ? "ATTESTED" : cycle.status === "DRAFT" ? "UNDER_REVIEW" : cycle.status;

  await prisma.orgResilienceAttestation.update({
    where: { id: cycle.id },
    data: { ...data, status: nextStatus },
  });

  await appendAttestationHashEntry(cycle.id, {
    event: `sign.${line}`,
    actorId: me.id,
    signedAt: now.toISOString(),
    notes: notes ?? null,
  });

  const actionCode =
    line === "first"
      ? "attestation.first_line.signed"
      : line === "second"
        ? "attestation.second_line.signed"
        : "attestation.executive.signed";

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: actionCode,
    targetType: "attestation",
    targetId: cycle.id,
    summary: `Signed the ${line} line of the FY${cycle.cycleYear} attestation${line === "executive" ? " — cycle now ATTESTED" : ""}`,
    metadata: { cycleYear: cycle.cycleYear, line },
  });

  revalidatePath(`/resilience/attest/${cycle.cycleYear}`);
  revalidatePath("/resilience/attest");
  return undefined;
}

// ─── Board ratification ──────────────────────────────────────────────────────

const BoardInput = z.object({
  cycleId: z.string().min(1),
  committee: z.string().max(200).optional(),
  minuteRef: z.string().max(200).optional(),
});

/**
 * Record the board's ratification of an attested cycle. Captures the
 * committee name + minute reference (the platform doesn't model board
 * membership; this is a recorded fact, not a signature). Hash-chained
 * and audited like the sign-off lines.
 */
export async function recordBoardApprovalAction(formData: FormData): Promise<SignResult> {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const { cycleId, committee, minuteRef } = BoardInput.parse({
    cycleId: formData.get("cycleId"),
    committee: formData.get("committee") || undefined,
    minuteRef: formData.get("minuteRef") || undefined,
  });

  const cycle = await prisma.orgResilienceAttestation.findFirst({
    where: { id: cycleId, orgId: me.orgId },
    select: { id: true, cycleYear: true, executiveSignedAt: true },
  });
  if (!cycle) return { error: "Cycle not found." };
  if (!cycle.executiveSignedAt) {
    return { error: "The executive (SMF) must sign before board ratification is recorded." };
  }

  const org = await prisma.organization.findUnique({
    where: { id: me.orgId },
    select: { boardCommitteeForResilienceName: true },
  });
  const now = new Date();

  await prisma.orgResilienceAttestation.update({
    where: { id: cycle.id },
    data: {
      boardApprovedAt: now,
      boardCommittee: committee?.trim() || org?.boardCommitteeForResilienceName || null,
      boardMinuteRef: minuteRef?.trim() || null,
    },
  });

  await appendAttestationHashEntry(cycle.id, {
    event: "board.approved",
    actorId: me.id,
    approvedAt: now.toISOString(),
    minuteRef: minuteRef ?? null,
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "attestation.board.approved",
    targetType: "attestation",
    targetId: cycle.id,
    summary: `Recorded board ratification of the FY${cycle.cycleYear} attestation`,
    metadata: { cycleYear: cycle.cycleYear },
  });

  revalidatePath(`/resilience/attest/${cycle.cycleYear}`);
  return undefined;
}
