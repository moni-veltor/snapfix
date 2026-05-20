import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * AchievementOrgState — single org-wide snapshot loaded once per page render.
 * All rule predicates read from this struct, so adding a rule never adds a
 * DB query. Keep the loader cheap by batching counts via prisma.$transaction.
 */
export type AchievementOrgState = {
  ibs: {
    total: number;
    approved: number;
    withTolerance: number;
    withFcaTolerance: number;
    withPraTolerance: number;
    withProcessOwner: number;
    withDepartmentOwner: number;
    withCustomerJourneys: number;
    withProductsCovered: number;
    withImpactCustomerFinancial: number;
    withImpactReputational: number;
    withResources: number;
    withReviewDueAt: number;
    withApprovedAt: number;
    withCriticality: number;
    exercisedAtLeastOnce: number;
    exercisedInWindow: number;
    exercisedTwiceInWindow: number;
    withAttestationThisYear: number;
    sequentialCodes: boolean;
    criticalUntestedOlderThan12mo: number;
  };
  vendors: {
    total: number;
    mtpTotal: number;
    withContractDates: number;
    withHyperscaler: number;
    withAssurance: number;
    withLei: number;
    withDeptLink: number;
    withFreshExitPlan: number;
    withAnyExitPlan: number;
    mtpRegisterReady: number;
    inLatestSnapshot: number;
  };
  systems: {
    total: number;
    withRtoAndRpo: number;
    withFailoverRegion: number;
    withFailoverConfigured: number;
    withDrTestAny: number;
    drTestCount: number;
    healthyDrTestCount: number;
    backupConfigured: number;
  };
  exercises: {
    completedTotal: number;
    completedInWindow: number;
    scenariosClonedFromLibrary: number;
    monthsStreak: number;
    coveredPeople: number;
    coveredProperty: number;
    coveredTechnology: number;
    coveredDataAvailability: number;
    coveredDataIntegrity: number;
    coveredThirdParty: number;
    coveredEachHarmTwice: number; // count of harms covered >= 2x in window
  };
  resources: {
    total: number;
    withLinkedEntity: number;
    orphan: number;
    sharedAcrossIBS: number;
  };
  programme: {
    quartersSlottedThisYear: number;
    quartersExercisedThisYear: number;
  };
  sectors: {
    distinctCoveredInWindow: number;
  };
  snapshots: {
    latestSnapshotVendorCount: number;
    snapshotsThisYear: number;
    latestReportingDate: Date | null;
  };
};

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export async function loadAchievementOrgState(orgId: string): Promise<AchievementOrgState> {
  const now = new Date();
  const yearAgo = new Date(now.getTime() - YEAR_MS);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    ibsRows,
    vendorRows,
    systemRows,
    completedExerciseRows,
    completedInWindowRows,
    drTestCount,
    resourceRows,
    attestationsThisYear,
    scenariosClonedCount,
    exerciseStartedAtsForStreak,
    latestSnapshot,
    snapshotsThisYearCount,
    programmeRows,
    exercisesInWindowFull,
  ] = await prisma.$transaction([
    prisma.organizationIBS.findMany({
      where: { orgId },
      select: {
        id: true,
        code: true,
        status: true,
        approvedAt: true,
        reviewDueAt: true,
        criticality: true,
        impactToleranceMin: true,
        fcaToleranceMin: true,
        praToleranceMin: true,
        processOwner: true,
        ownerDepartmentId: true,
        customerJourneys: true,
        productsCovered: true,
        impactCustomerFinancial: true,
        impactReputational: true,
        createdAt: true,
        exerciseLinks: {
          select: { exercise: { select: { startedAt: true, completedAt: true } } },
        },
        resources: { select: { id: true } },
      },
    }),
    prisma.vendor.findMany({
      where: { orgId },
      select: {
        id: true,
        contractStartAt: true,
        contractEndAt: true,
        hyperscaler: true,
        region: true,
        assuranceKind: true,
        legalEntityIdentifier: true,
        isMaterialThirdParty: true,
        exitPlanReviewedAt: true,
        exitPlanNotes: true,
        contractRef: true,
        legalName: true,
        isOutsourcing: true,
        serviceTypeTaxonomy: true,
        cloudDeployment: true,
        productServiceDescription: true,
        supplyChainRanking: true,
        noticePeriodVendorDays: true,
        noticePeriodFirmDays: true,
        governingLaw: true,
        materialityReason: true,
        materialityAssessedAt: true,
        functionCategory: true,
        countryDataStored: true,
        countryServiceDeliveredFrom: true,
        contractAnnualValueGBP: true,
        compliesWithRules: true,
        smfSignedOff: true,
        governanceApprovedAt: true,
        substitutability: true,
        reintegrationAbility: true,
        impactOfDiscontinuing: true,
        ibsLinks: { select: { ibsId: true } },
      },
    }),
    prisma.techSystem.findMany({
      where: { orgId },
      select: {
        id: true,
        rtoMin: true,
        rpoMin: true,
        failoverKind: true,
        failoverRegion: true,
        backupFrequency: true,
        drTests: {
          select: { outcome: true, testedAt: true },
        },
      },
    }),
    prisma.exercise.count({ where: { orgId, status: "COMPLETED" } }),
    prisma.exercise.count({
      where: { orgId, status: "COMPLETED", completedAt: { gte: yearAgo } },
    }),
    prisma.dRTest.count({ where: { system: { orgId } } }),
    prisma.iBSResource.findMany({
      where: { ibs: { orgId } },
      select: {
        id: true,
        ibsId: true,
        label: true,
        vendorId: true,
        techSystemId: true,
        departmentId: true,
      },
    }),
    prisma.iBSAttestation.findMany({
      where: { orgId, createdAt: { gte: startOfYear } },
      select: { ibsId: true, status: true },
    }),
    prisma.scenario.count({ where: { orgId, templateOriginId: { not: null } } }),
    prisma.exercise.findMany({
      where: { orgId, startedAt: { not: null, gte: yearAgo } },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    }),
    prisma.vendorRegisterSnapshot.findFirst({
      where: { orgId },
      orderBy: { reportingDate: "desc" },
      select: { id: true, reportingDate: true, vendorSnapshots: true },
    }),
    prisma.vendorRegisterSnapshot.count({
      where: { orgId, reportingDate: { gte: startOfYear } },
    }),
    prisma.scenario.findMany({
      where: { orgId, isTemplate: false, programmeYear: now.getFullYear() },
      select: {
        programmeQuarter: true,
        exercises: { select: { startedAt: true } },
      },
    }),
    prisma.exercise.findMany({
      where: { orgId, completedAt: { gte: yearAgo }, status: "COMPLETED" },
      select: {
        scenario: {
          select: {
            category: true,
            coversPeople: true,
            coversProperty: true,
            coversTechnology: true,
            coversDataAvailability: true,
            coversDataIntegrity: true,
            coversThirdParty: true,
          },
        },
        ibsLinks: { select: { ibsId: true } },
      },
    }),
  ]);

  // ─── IBS ────────────────────────────────────────────────────────────────
  const ibs = {
    total: ibsRows.length,
    approved: ibsRows.filter((i) => i.status === "APPROVED").length,
    withTolerance: ibsRows.filter((i) => i.impactToleranceMin > 0).length,
    withFcaTolerance: ibsRows.filter((i) => i.fcaToleranceMin !== null).length,
    withPraTolerance: ibsRows.filter((i) => i.praToleranceMin !== null).length,
    withProcessOwner: ibsRows.filter((i) => !!i.processOwner).length,
    withDepartmentOwner: ibsRows.filter((i) => !!i.ownerDepartmentId).length,
    withCustomerJourneys: ibsRows.filter((i) => i.customerJourneys.length > 0).length,
    withProductsCovered: ibsRows.filter((i) => i.productsCovered.length > 0).length,
    withImpactCustomerFinancial: ibsRows.filter((i) => !!i.impactCustomerFinancial).length,
    withImpactReputational: ibsRows.filter((i) => !!i.impactReputational).length,
    withResources: ibsRows.filter((i) => i.resources.length > 0).length,
    withReviewDueAt: ibsRows.filter((i) => !!i.reviewDueAt).length,
    withApprovedAt: ibsRows.filter((i) => !!i.approvedAt).length,
    withCriticality: ibsRows.filter((i) => i.criticality !== "LOW").length,
    exercisedAtLeastOnce: ibsRows.filter((i) => i.exerciseLinks.length > 0).length,
    exercisedInWindow: ibsRows.filter((i) =>
      i.exerciseLinks.some(
        (l) => l.exercise.startedAt && l.exercise.startedAt >= yearAgo,
      ),
    ).length,
    exercisedTwiceInWindow: ibsRows.filter(
      (i) =>
        i.exerciseLinks.filter(
          (l) => l.exercise.startedAt && l.exercise.startedAt >= yearAgo,
        ).length >= 2,
    ).length,
    withAttestationThisYear: new Set(
      attestationsThisYear.filter((a) => a.status === "ATTESTED").map((a) => a.ibsId),
    ).size,
    sequentialCodes: hasSequentialCodes(ibsRows.map((i) => i.code)),
    criticalUntestedOlderThan12mo: ibsRows.filter(
      (i) =>
        (i.criticality === "CRITICAL" || i.criticality === "HIGH") &&
        i.exerciseLinks.every(
          (l) => !l.exercise.startedAt || l.exercise.startedAt < yearAgo,
        ) &&
        i.createdAt < yearAgo,
    ).length,
  };

  // ─── Vendors ────────────────────────────────────────────────────────────
  const mtpVendors = vendorRows.filter((v) => v.isMaterialThirdParty);
  const snapshotVendorIds = parseSnapshotVendorIds(latestSnapshot?.vendorSnapshots);
  const vendors = {
    total: vendorRows.length,
    mtpTotal: mtpVendors.length,
    withContractDates: vendorRows.filter(
      (v) => v.contractStartAt && v.contractEndAt,
    ).length,
    withHyperscaler: vendorRows.filter((v) => !!v.hyperscaler).length,
    withAssurance: vendorRows.filter((v) => !!v.assuranceKind).length,
    withLei: vendorRows.filter(
      (v) =>
        v.legalEntityIdentifier && /^[A-Z0-9]{20}$/.test(v.legalEntityIdentifier),
    ).length,
    withDeptLink: vendorRows.filter((v) => v.ibsLinks.length > 0).length,
    withFreshExitPlan: vendorRows.filter(
      (v) =>
        v.exitPlanReviewedAt &&
        v.exitPlanReviewedAt >= yearAgo &&
        v.exitPlanNotes &&
        v.exitPlanNotes.trim().length > 40,
    ).length,
    withAnyExitPlan: vendorRows.filter(
      (v) => !!v.exitPlanNotes && v.exitPlanNotes.trim().length > 0,
    ).length,
    mtpRegisterReady: mtpVendors.filter((v) => isMtpRegisterReady(v)).length,
    inLatestSnapshot: mtpVendors.filter((v) => snapshotVendorIds.has(v.id)).length,
  };

  // ─── Systems ────────────────────────────────────────────────────────────
  const systems = {
    total: systemRows.length,
    withRtoAndRpo: systemRows.filter(
      (s) => s.rtoMin !== null && s.rpoMin !== null,
    ).length,
    withFailoverRegion: systemRows.filter((s) => !!s.failoverRegion).length,
    withFailoverConfigured: systemRows.filter(
      (s) => s.failoverKind !== "NONE",
    ).length,
    withDrTestAny: systemRows.filter((s) => s.drTests.length > 0).length,
    drTestCount,
    healthyDrTestCount: systemRows.reduce(
      (n, s) => n + s.drTests.filter((t) => t.outcome === "PASS").length,
      0,
    ),
    backupConfigured: systemRows.filter((s) => !!s.backupFrequency).length,
  };

  // ─── Exercises + harm coverage in window ────────────────────────────────
  let coveredPeople = 0;
  let coveredProperty = 0;
  let coveredTechnology = 0;
  let coveredDataAvailability = 0;
  let coveredDataIntegrity = 0;
  let coveredThirdParty = 0;
  let p2 = 0;
  let pr2 = 0;
  let t2 = 0;
  let da2 = 0;
  let di2 = 0;
  let tp2 = 0;
  const sectors = new Set<string>();
  for (const e of exercisesInWindowFull) {
    if (e.scenario.coversPeople) coveredPeople += 1;
    if (e.scenario.coversProperty) coveredProperty += 1;
    if (e.scenario.coversTechnology) coveredTechnology += 1;
    if (e.scenario.coversDataAvailability) coveredDataAvailability += 1;
    if (e.scenario.coversDataIntegrity) coveredDataIntegrity += 1;
    if (e.scenario.coversThirdParty) coveredThirdParty += 1;
    if (e.scenario.category) sectors.add(e.scenario.category);
  }
  p2 = coveredPeople >= 2 ? 1 : 0;
  pr2 = coveredProperty >= 2 ? 1 : 0;
  t2 = coveredTechnology >= 2 ? 1 : 0;
  da2 = coveredDataAvailability >= 2 ? 1 : 0;
  di2 = coveredDataIntegrity >= 2 ? 1 : 0;
  tp2 = coveredThirdParty >= 2 ? 1 : 0;

  // Monthly-exercise streak ending in the current month
  const monthsSet = new Set<string>();
  for (const e of exerciseStartedAtsForStreak) {
    if (!e.startedAt) continue;
    monthsSet.add(`${e.startedAt.getFullYear()}-${e.startedAt.getMonth() + 1}`);
  }
  let monthsStreak = 0;
  let cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  while (monthsSet.has(`${cursor.getFullYear()}-${cursor.getMonth() + 1}`)) {
    monthsStreak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    if (monthsStreak > 36) break;
  }

  const exercises = {
    completedTotal: completedExerciseRows,
    completedInWindow: completedInWindowRows,
    scenariosClonedFromLibrary: scenariosClonedCount,
    monthsStreak,
    coveredPeople,
    coveredProperty,
    coveredTechnology,
    coveredDataAvailability,
    coveredDataIntegrity,
    coveredThirdParty,
    coveredEachHarmTwice: p2 + pr2 + t2 + da2 + di2 + tp2,
  };

  // ─── Resources ──────────────────────────────────────────────────────────
  const labelToIbsIds = new Map<string, Set<string>>();
  for (const r of resourceRows) {
    const key = r.label.trim().toLowerCase();
    if (!key) continue;
    const set = labelToIbsIds.get(key) ?? new Set<string>();
    set.add(r.ibsId);
    labelToIbsIds.set(key, set);
  }
  let sharedAcrossIBS = 0;
  for (const set of labelToIbsIds.values()) {
    if (set.size >= 2) sharedAcrossIBS += 1;
  }
  const resources = {
    total: resourceRows.length,
    withLinkedEntity: resourceRows.filter(
      (r) => r.vendorId || r.techSystemId || r.departmentId,
    ).length,
    orphan: resourceRows.filter(
      (r) => !r.vendorId && !r.techSystemId && !r.departmentId,
    ).length,
    sharedAcrossIBS,
  };

  // ─── Programme calendar ────────────────────────────────────────────────
  const quartersSlotted = new Set<number>();
  const quartersExercised = new Set<number>();
  for (const p of programmeRows) {
    if (p.programmeQuarter) quartersSlotted.add(p.programmeQuarter);
    if (p.programmeQuarter && p.exercises.some((e) => e.startedAt)) {
      quartersExercised.add(p.programmeQuarter);
    }
  }

  // ─── Snapshots ─────────────────────────────────────────────────────────
  const snapshots = {
    latestSnapshotVendorCount: snapshotVendorIds.size,
    snapshotsThisYear: snapshotsThisYearCount,
    latestReportingDate: latestSnapshot?.reportingDate ?? null,
  };

  return {
    ibs,
    vendors,
    systems,
    exercises,
    resources,
    programme: {
      quartersSlottedThisYear: quartersSlotted.size,
      quartersExercisedThisYear: quartersExercised.size,
    },
    sectors: { distinctCoveredInWindow: sectors.size },
    snapshots,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function hasSequentialCodes(codes: string[]): boolean {
  if (codes.length === 0) return false;
  // Codes look like "IBS_01" — extract trailing number and check 1..n with no gaps.
  const nums = codes
    .map((c) => {
      const m = c.match(/_(\d+)$/);
      return m ? Number.parseInt(m[1], 10) : null;
    })
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);
  if (nums.length === 0) return false;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== i + 1) return false;
  }
  return true;
}

function parseSnapshotVendorIds(raw: unknown): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(raw)) return ids;
  for (const item of raw) {
    if (item && typeof item === "object" && "vendorId" in item) {
      const v = (item as { vendorId: unknown }).vendorId;
      if (typeof v === "string") ids.add(v);
    }
  }
  return ids;
}

/**
 * Inline copy of the readiness check so the loader doesn't pull from
 * vendor-mtp-readiness (which requires a richer Vendor shape). Counts
 * the bare-minimum FCA/PRA fields rather than every assurance check.
 */
function isMtpRegisterReady(v: {
  contractRef: string | null;
  legalName: string | null;
  legalEntityIdentifier: string | null;
  isOutsourcing: boolean | null;
  serviceTypeTaxonomy: string | null;
  cloudDeployment: unknown;
  productServiceDescription: string | null;
  supplyChainRanking: number | null;
  contractStartAt: Date | null;
  noticePeriodVendorDays: number | null;
  noticePeriodFirmDays: number | null;
  governingLaw: string | null;
  materialityReason: unknown;
  materialityAssessedAt: Date | null;
  functionCategory: unknown;
  countryDataStored: string | null;
  countryServiceDeliveredFrom: string | null;
  contractAnnualValueGBP: number | null;
  compliesWithRules: unknown;
  smfSignedOff: boolean | null;
  governanceApprovedAt: Date | null;
  substitutability: unknown;
  reintegrationAbility: unknown;
  impactOfDiscontinuing: unknown;
}): boolean {
  const checks: boolean[] = [
    notEmpty(v.contractRef),
    notEmpty(v.legalName),
    !!v.legalEntityIdentifier && /^[A-Z0-9]{20}$/.test(v.legalEntityIdentifier),
    v.isOutsourcing !== null,
    notEmpty(v.serviceTypeTaxonomy),
    v.cloudDeployment !== null,
    notEmpty(v.productServiceDescription),
    v.supplyChainRanking !== null,
    v.contractStartAt !== null,
    v.noticePeriodVendorDays !== null,
    v.noticePeriodFirmDays !== null,
    notEmpty(v.governingLaw),
    v.materialityReason !== null,
    v.materialityAssessedAt !== null,
    v.functionCategory !== null,
    notEmpty(v.countryDataStored),
    notEmpty(v.countryServiceDeliveredFrom),
    v.contractAnnualValueGBP !== null,
    v.compliesWithRules !== null,
    v.smfSignedOff !== null,
    v.governanceApprovedAt !== null,
    v.substitutability !== null,
    v.reintegrationAbility !== null,
    v.impactOfDiscontinuing !== null,
  ];
  return checks.every(Boolean);
}

function notEmpty(s: string | null | undefined): boolean {
  return typeof s === "string" && s.trim().length > 0;
}
