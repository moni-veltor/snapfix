import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Service layer for the annual operational-resilience self-attestation cycle.
 *
 * The PRA expects every in-scope firm to produce, sign and retain an annual
 * self-assessment confirming the firm is operating within impact tolerances
 * for every IBS — or has a credible remediation plan. The artefact rolls up
 * the IBS register, tolerances, resource maps, 12 months of testing evidence,
 * action items, gap analysis and investment plan, signed by 1st-line,
 * 2nd-line and the named SMF, then ratified by the board.
 *
 * The functions here are the read/write primitives that the UI surface
 * (planned in R2–R5) will compose. R1 keeps the surface narrow: snapshot
 * generation, hash-chain append, cycle lifecycle helpers.
 *
 * Six-year retention is enforced by `retainUntilAt` on each attestation
 * row; any delete path must check this floor before permitting removal.
 */

const RETENTION_YEARS = 6;

export type ResilienceSnapshot = {
  generatedAt: string; // ISO timestamp
  orgId: string;
  smfAccountableUserId: string | null;
  boardCommittee: string | null;
  ibsRegister: SnapshotIBS[];
  vendorCriticality: SnapshotVendor[];
  exerciseHistoryLast12Months: SnapshotExercise[];
  openActionItems: SnapshotActionItem[];
  materialChangesSinceLastCycle: SnapshotMaterialChange[];
};

type SnapshotIBS = {
  id: string;
  code: string;
  name: string;
  status: string;
  approvedAt: string | null;
  reviewDueAt: string | null;
  impactToleranceMin: number;
  fcaToleranceMin: number | null;
  praToleranceMin: number | null;
  toleranceRationale: string | null;
  criticality: string;
  processOwnerUserId: string | null;
  ownerDepartmentId: string | null;
  attestations: SnapshotAttestation[];
  resources: SnapshotResource[];
};

type SnapshotAttestation = {
  line: string;
  status: string;
  reviewerId: string | null;
  reviewedAt: string | null;
  cycle: string;
};

type SnapshotResource = {
  kind: string;
  label: string;
  criticality: string;
  vendorId: string | null;
  techSystemId: string | null;
  departmentId: string | null;
};

type SnapshotVendor = {
  id: string;
  name: string;
  tier: string | null;
  isDoraCritical: boolean;
  isMaterialThirdParty: boolean;
  ibsIds: string[];
};

type SnapshotExercise = {
  id: string;
  title: string;
  scenarioTitle: string;
  status: string;
  mode: string;
  plannedDate: string | null;
  ibsIds: string[];
  hasAAR: boolean;
  actionItemCount: number;
};

type SnapshotActionItem = {
  id: string;
  title: string;
  ownerUserId: string | null;
  ownerText: string | null;
  dueAt: string | null;
  status: string;
  priority: string;
  exerciseId: string;
};

type SnapshotMaterialChange = {
  id: string;
  kind: string;
  description: string;
  declaredAt: string;
  reviewOutcome: string;
};

/**
 * Compose the frozen rollup written to `OrgResilienceAttestation.snapshotJson`
 * at sign-off time. Includes everything a supervisor would expect to see
 * dated to the moment of attestation: the register, the test history, the
 * open action items, the vendor criticality map.
 *
 * Pulls cycleId optionally so the snapshot can name the prior-cycle gap
 * delta later; for R1 we just stamp the current state.
 */
export async function buildResilienceSnapshot(
  orgId: string,
  opts: { sinceCycleId?: string } = {},
): Promise<ResilienceSnapshot> {
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [org, ibsRows, vendorRows, exerciseRows, actionItemRows, materialChanges] =
    await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          smfAccountableForResilienceUserId: true,
          boardCommitteeForResilienceName: true,
        },
      }),
      prisma.organizationIBS.findMany({
        where: { orgId },
        include: {
          attestations: {
            select: {
              line: true,
              status: true,
              reviewerId: true,
              reviewedAt: true,
              cycle: true,
            },
          },
          resources: {
            select: {
              kind: true,
              label: true,
              criticality: true,
              vendorId: true,
              techSystemId: true,
              departmentId: true,
            },
          },
        },
        orderBy: { code: "asc" },
      }),
      prisma.vendor.findMany({
        where: { orgId },
        select: {
          id: true,
          name: true,
          tier: true,
          isDoraCritical: true,
          isMaterialThirdParty: true,
          ibsLinks: { select: { ibsId: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.exercise.findMany({
        where: {
          orgId,
          OR: [
            { plannedDate: { gte: twelveMonthsAgo } },
            { startedAt: { gte: twelveMonthsAgo } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          mode: true,
          plannedDate: true,
          scenario: { select: { title: true } },
          ibsLinks: { select: { ibsId: true } },
          aar: { select: { id: true } },
          actionItems: { select: { id: true } },
        },
        orderBy: { plannedDate: "desc" },
      }),
      prisma.exerciseActionItem.findMany({
        where: {
          orgId,
          status: { notIn: ["DONE", "WONT_FIX"] },
        },
        select: {
          id: true,
          title: true,
          ownerUserId: true,
          ownerText: true,
          dueAt: true,
          status: true,
          priority: true,
          exerciseId: true,
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      }),
      opts.sinceCycleId
        ? prisma.orgResilienceMaterialChange.findMany({
            where: { orgId, attestationCycleId: opts.sinceCycleId },
            select: {
              id: true,
              kind: true,
              description: true,
              declaredAt: true,
              reviewOutcome: true,
            },
            orderBy: { declaredAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

  return {
    generatedAt: now.toISOString(),
    orgId,
    smfAccountableUserId: org?.smfAccountableForResilienceUserId ?? null,
    boardCommittee: org?.boardCommitteeForResilienceName ?? null,
    ibsRegister: ibsRows.map((ibs) => ({
      id: ibs.id,
      code: ibs.code,
      name: ibs.name,
      status: ibs.status,
      approvedAt: ibs.approvedAt?.toISOString() ?? null,
      reviewDueAt: ibs.reviewDueAt?.toISOString() ?? null,
      impactToleranceMin: ibs.impactToleranceMin,
      fcaToleranceMin: ibs.fcaToleranceMin,
      praToleranceMin: ibs.praToleranceMin,
      toleranceRationale: ibs.toleranceRationale,
      criticality: ibs.criticality,
      processOwnerUserId: ibs.processOwnerUserId,
      ownerDepartmentId: ibs.ownerDepartmentId,
      attestations: ibs.attestations.map((a) => ({
        line: a.line,
        status: a.status,
        reviewerId: a.reviewerId,
        reviewedAt: a.reviewedAt?.toISOString() ?? null,
        cycle: a.cycle,
      })),
      resources: ibs.resources.map((r) => ({
        kind: r.kind,
        label: r.label,
        criticality: r.criticality,
        vendorId: r.vendorId,
        techSystemId: r.techSystemId,
        departmentId: r.departmentId,
      })),
    })),
    vendorCriticality: vendorRows.map((v) => ({
      id: v.id,
      name: v.name,
      tier: v.tier,
      isDoraCritical: v.isDoraCritical,
      isMaterialThirdParty: v.isMaterialThirdParty,
      ibsIds: v.ibsLinks.map((l) => l.ibsId),
    })),
    exerciseHistoryLast12Months: exerciseRows.map((e) => ({
      id: e.id,
      title: e.title,
      scenarioTitle: e.scenario.title,
      status: e.status,
      mode: e.mode,
      plannedDate: e.plannedDate?.toISOString() ?? null,
      ibsIds: e.ibsLinks.map((l) => l.ibsId),
      hasAAR: !!e.aar,
      actionItemCount: e.actionItems.length,
    })),
    openActionItems: actionItemRows.map((ai) => ({
      id: ai.id,
      title: ai.title,
      ownerUserId: ai.ownerUserId,
      ownerText: ai.ownerText,
      dueAt: ai.dueAt?.toISOString() ?? null,
      status: ai.status,
      priority: ai.priority,
      exerciseId: ai.exerciseId,
    })),
    materialChangesSinceLastCycle: materialChanges.map((c) => ({
      id: c.id,
      kind: c.kind,
      description: c.description,
      declaredAt: c.declaredAt.toISOString(),
      reviewOutcome: c.reviewOutcome,
    })),
  };
}

/**
 * Compute the retention floor for a new attestation row. PRA expectation is
 * six years from the opening of the cycle; the cascade-delete path checks
 * this before permitting removal.
 */
export function computeRetainUntilAt(openedAt: Date): Date {
  const out = new Date(openedAt);
  out.setFullYear(out.getFullYear() + RETENTION_YEARS);
  return out;
}

/**
 * Append a hash-chained entry for an attestation sign-off event. Mirrors
 * appendAuditEntry's shape so a supervisor can re-walk the chain offline
 * (sha256(prevHash || canonical(payload) || timestamp)).
 *
 * The first entry of a chain has prevHash = 64 zero-chars.
 */
export async function appendAttestationHashEntry(
  attestationId: string,
  payload: Record<string, unknown>,
): Promise<{ sequence: number; hash: string; prevHash: string }> {
  const last = await prisma.orgResilienceAttestationHashEntry.findFirst({
    where: { attestationId },
    orderBy: { sequence: "desc" },
    select: { sequence: true, hash: true },
  });

  const sequence = (last?.sequence ?? -1) + 1;
  const prevHash = last?.hash ?? "0".repeat(64);
  const occurredAt = new Date();
  const canonical = canonicalise({ ...payload, attestationId, sequence });
  const hash = createHash("sha256")
    .update(prevHash)
    .update("|")
    .update(canonical)
    .update("|")
    .update(occurredAt.toISOString())
    .digest("hex");

  await prisma.orgResilienceAttestationHashEntry.create({
    data: {
      attestationId,
      sequence,
      hash,
      prevHash,
      payload: payload as never,
      occurredAt,
    },
  });

  return { sequence, hash, prevHash };
}

/**
 * Canonical JSON: keys sorted at every level, no whitespace. Makes the
 * hash deterministic regardless of how the payload was constructed.
 */
function canonicalise(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalise).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => `${JSON.stringify(k)}:${canonicalise(obj[k])}`);
  return `{${parts.join(",")}}`;
}
