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
  // ─── Cadence (consumed by rules-cadence) ────────────────────────────
  cadence: {
    completedLast7Days: number;
    completedLast30Days: number;
    completedLast60Days: number;
    completedLast90Days: number;
    completedLast12Months: number;
    /** Days since the most recent IN_PROGRESS or COMPLETED exercise started. */
    daysSinceLastExerciseStart: number | null;
    /** Count of distinct quarters in last 4 with ≥1 completed exercise. */
    quartersInLast4WithExercise: number;
    /** Exercises with mode = DRY_RUN (lifetime). */
    dryRunsTotal: number;
    /** Dry runs in the last 90 days. */
    dryRunsLast90Days: number;
    /** Total exercises started but ABANDONED. */
    abandonedTotal: number;
    /** Distinct exercise titles run (creativity proxy). */
    distinctTitles: number;
    /** Distinct facilitators (people who've owned the facilitator seat). */
    distinctFacilitators: number;
    /** Best month-streak ever (max consecutive months with ≥1 exercise). */
    bestMonthStreak: number;
    /** Average difficulty (1-5) across exercises in window — null if unknown. */
    avgDifficultyInWindow: number | null;
    /** Exercises with regulator-evidence mode enabled (lifetime). */
    regulatorEvidenceTotal: number;
    /** Exercises that had a hot-wash filled in. */
    withHotWash: number;
  };
  // ─── People (consumed by rules-people org-scope) ───────────────────
  people: {
    rolesTotal: number;
    rolesSmf: number;
    rolesWithDeputy: number;
    seatsTotalActive: number;
    seatsClaimedActive: number;
    /** Distinct users with at least one ExerciseParticipant in window. */
    activeParticipantsInWindow: number;
    /** Sitreps logged in window. */
    sitrepsInWindow: number;
    /** IMT meetings logged in window. */
    imtMeetingsInWindow: number;
    /** Decisions logged in window. */
    decisionsInWindow: number;
    /** Decisions whose rationale is ≥ 10 chars (signal that authority + reasoning captured). */
    decisionsWithRationaleInWindow: number;
    /** Decisions approved (approvedAt set). */
    decisionsApprovedInWindow: number;
    /** Comms drafts in window — any status. */
    commsInWindow: number;
    /** Comms approved (approvedAt set). */
    commsApprovedInWindow: number;
    /** Comms rejected — cascade discipline proxy (LOW is better). */
    commsRejectedInWindow: number;
    /** Distinct users who've chaired an IMT meeting in window. */
    distinctImtChairsInWindow: number;
    /** Distinct stakeholders covered by approved comms in window (employees / customers / regs …). */
    distinctStakeholdersInWindow: number;
    /** % of participants who acked pre-read across exercises with a roster ≥ 3. */
    preReadAckRateInWindow: number; // 0..100
    /** Participants who mobilised (MOBILISED or DEPUTY_STEPPED_UP) in window. */
    mobilisedParticipantsInWindow: number;
    /** Eligible (non-observer) participants in window — denominator for mobilisation. */
    eligibleParticipantsInWindow: number;
  };
};

/**
 * Optional per-user slice used by personal achievements. Loaded only when
 * the page asks for it (userId supplied to loadAchievementOrgState).
 * Always queried over the same 12-month window for consistency with org
 * achievements.
 */
export type AchievementPersonalState = {
  userId: string;
  sitrepsFiledInWindow: number;
  decisionsLoggedInWindow: number;
  decisionsApprovedInWindow: number;
  imtMeetingsChairedInWindow: number;
  exercisesParticipatedInWindow: number;
  exercisesFacilitatedInWindow: number;
  commsDraftedInWindow: number;
  commsApprovedAsApproverInWindow: number;
  /** Distinct OrganizationRoles the user has claimed across exercises. */
  distinctRolesPlayed: number;
  /** Pre-read acks across exercises participated. */
  preReadAcksInWindow: number;
  /** Distinct exercises participated (any role) — lifetime. */
  exercisesParticipatedLifetime: number;
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

  // ─── Cadence + People queries (separate batch — keeps the tuple narrow) ──
  const fiveYrsAgo = new Date(now.getTime() - 5 * YEAR_MS);
  const [
    allExercises,
    exerciseHotWashes,
    rolesAll,
    activeExercisesWithSeats,
    sitrepsWindow,
    imtMeetingsWindow,
    decisionsWindow,
    commsWindow,
    participantsWindow,
  ] = await Promise.all([
    prisma.exercise.findMany({
      where: { orgId, startedAt: { gte: fiveYrsAgo } },
      select: {
        id: true,
        title: true,
        startedAt: true,
        completedAt: true,
        status: true,
        mode: true,
        facilitatorId: true,
        regulatorMode: true,
        scenario: {
          select: {
            difficultyCognitive: true,
            difficultyTimePressure: true,
            difficultyAmbiguity: true,
            difficultyStakeholders: true,
          },
        },
      },
    }),
    prisma.exerciseHotWash.findMany({
      where: { exercise: { orgId } },
      select: { exerciseId: true },
    }),
    prisma.organizationRole.findMany({
      where: { orgId },
      select: { id: true, isSMF: true, deputyOfRoleId: true },
    }),
    prisma.exercise.findMany({
      where: { orgId, status: { in: ["READY", "IN_PROGRESS", "PAUSED"] } },
      select: {
        seats: { select: { holderUserId: true } },
      },
    }),
    prisma.sitrep.findMany({
      where: { incident: { exercise: { orgId } }, createdAt: { gte: yearAgo } },
      select: { id: true },
    }),
    prisma.iMTMeeting.findMany({
      where: { incident: { exercise: { orgId } }, createdAt: { gte: yearAgo } },
      select: { chairParticipantId: true },
    }),
    prisma.decisionRecord.findMany({
      where: { incident: { exercise: { orgId } }, createdAt: { gte: yearAgo } },
      select: { id: true, rationale: true, approvedAt: true },
    }),
    prisma.communicationDraft.findMany({
      where: { exercise: { orgId }, createdAt: { gte: yearAgo } },
      select: { id: true, status: true, approvedAt: true, stakeholder: true },
    }),
    prisma.exerciseParticipant.findMany({
      where: { exercise: { orgId, completedAt: { gte: yearAgo } } },
      select: {
        userId: true,
        exerciseRole: true,
        mobilisationStatus: true,
        preReadAckedAt: true,
        exerciseId: true,
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

  // ─── Cadence aggregates ───────────────────────────────────────────────
  const ago7 = new Date(now.getTime() - 7 * 86_400_000);
  const ago30 = new Date(now.getTime() - 30 * 86_400_000);
  const ago60 = new Date(now.getTime() - 60 * 86_400_000);
  const ago90 = new Date(now.getTime() - 90 * 86_400_000);
  const ago12mo = yearAgo;

  const completedExs = allExercises.filter((e) => e.completedAt !== null);
  const completedLast7Days = completedExs.filter(
    (e) => e.completedAt && e.completedAt >= ago7,
  ).length;
  const completedLast30Days = completedExs.filter(
    (e) => e.completedAt && e.completedAt >= ago30,
  ).length;
  const completedLast60Days = completedExs.filter(
    (e) => e.completedAt && e.completedAt >= ago60,
  ).length;
  const completedLast90Days = completedExs.filter(
    (e) => e.completedAt && e.completedAt >= ago90,
  ).length;
  const completedLast12Months = completedExs.filter(
    (e) => e.completedAt && e.completedAt >= ago12mo,
  ).length;
  const mostRecentStart = allExercises
    .map((e) => e.startedAt)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const daysSinceLastExerciseStart = mostRecentStart
    ? Math.floor((now.getTime() - mostRecentStart.getTime()) / 86_400_000)
    : null;
  const quartersSet = new Set<string>();
  for (const e of completedExs) {
    if (!e.completedAt) continue;
    if (e.completedAt < new Date(now.getTime() - 4 * 92 * 86_400_000)) continue;
    const yq = `${e.completedAt.getFullYear()}-Q${Math.floor(e.completedAt.getMonth() / 3) + 1}`;
    quartersSet.add(yq);
  }
  const dryRunsTotal = allExercises.filter((e) => e.mode === "DRY_RUN").length;
  const dryRunsLast90Days = allExercises.filter(
    (e) => e.mode === "DRY_RUN" && e.startedAt && e.startedAt >= ago90,
  ).length;
  const abandonedTotal = allExercises.filter((e) => e.status === "ABANDONED").length;
  const distinctTitles = new Set(allExercises.map((e) => e.title.trim().toLowerCase())).size;
  const distinctFacilitators = new Set(
    allExercises.map((e) => e.facilitatorId).filter((id): id is string => !!id),
  ).size;
  // Best month-streak ever — walk all months and find max consecutive run.
  const allMonths = new Set<string>();
  for (const e of allExercises) {
    if (!e.startedAt) continue;
    allMonths.add(`${e.startedAt.getFullYear()}-${e.startedAt.getMonth() + 1}`);
  }
  const bestMonthStreak = computeBestMonthStreak(allMonths);
  const diffSums: number[] = [];
  for (const e of allExercises) {
    if (!e.startedAt || e.startedAt < yearAgo) continue;
    const s = e.scenario;
    const parts = [
      s.difficultyCognitive,
      s.difficultyTimePressure,
      s.difficultyAmbiguity,
      s.difficultyStakeholders,
    ].filter((n): n is number => typeof n === "number");
    if (parts.length === 0) continue;
    diffSums.push(parts.reduce((a, b) => a + b, 0) / parts.length);
  }
  const avgDifficultyInWindow =
    diffSums.length === 0 ? null : diffSums.reduce((a, b) => a + b, 0) / diffSums.length;
  const regulatorEvidenceTotal = allExercises.filter((e) => e.regulatorMode).length;
  const hotWashExerciseIds = new Set(exerciseHotWashes.map((h) => h.exerciseId));
  const withHotWash = allExercises.filter((e) => hotWashExerciseIds.has(e.id)).length;

  const cadence = {
    completedLast7Days,
    completedLast30Days,
    completedLast60Days,
    completedLast90Days,
    completedLast12Months,
    daysSinceLastExerciseStart,
    quartersInLast4WithExercise: quartersSet.size,
    dryRunsTotal,
    dryRunsLast90Days,
    abandonedTotal,
    distinctTitles,
    distinctFacilitators,
    bestMonthStreak,
    avgDifficultyInWindow,
    regulatorEvidenceTotal,
    withHotWash,
  };

  // ─── People aggregates ────────────────────────────────────────────────
  const seatsTotalActive = activeExercisesWithSeats.reduce(
    (n, ex) => n + ex.seats.length,
    0,
  );
  const seatsClaimedActive = activeExercisesWithSeats.reduce(
    (n, ex) => n + ex.seats.filter((s) => !!s.holderUserId).length,
    0,
  );
  const activeUserIds = new Set(
    participantsWindow.map((p) => p.userId).filter((u): u is string => !!u),
  );
  const decisionsWithRationaleInWindow = decisionsWindow.filter(
    (d) => d.rationale && d.rationale.trim().length >= 10,
  ).length;
  const decisionsApprovedInWindow = decisionsWindow.filter((d) => d.approvedAt !== null).length;
  const commsApprovedInWindow = commsWindow.filter((c) => c.approvedAt !== null).length;
  const commsRejectedInWindow = commsWindow.filter((c) => c.status === "REJECTED").length;
  const distinctImtChairsInWindow = new Set(
    imtMeetingsWindow.map((m) => m.chairParticipantId).filter((id): id is string => !!id),
  ).size;
  const distinctStakeholdersInWindow = new Set(
    commsWindow.map((c) => c.stakeholder).filter((s): s is NonNullable<typeof s> => !!s),
  ).size;
  const eligibleParticipantsInWindow = participantsWindow.filter(
    (p) => p.exerciseRole !== "OBSERVER",
  ).length;
  const mobilisedParticipantsInWindow = participantsWindow.filter(
    (p) =>
      p.exerciseRole !== "OBSERVER" &&
      (p.mobilisationStatus === "MOBILISED" || p.mobilisationStatus === "DEPUTY_STEPPED_UP"),
  ).length;
  // Pre-read ack rate — only meaningful when an exercise has ≥3 participants.
  const exerciseRosters = new Map<string, typeof participantsWindow>();
  for (const p of participantsWindow) {
    const list = exerciseRosters.get(p.exerciseId) ?? [];
    list.push(p);
    exerciseRosters.set(p.exerciseId, list);
  }
  let preReadEligible = 0;
  let preReadAcked = 0;
  for (const roster of exerciseRosters.values()) {
    if (roster.length < 3) continue;
    preReadEligible += roster.length;
    preReadAcked += roster.filter((p) => p.preReadAckedAt !== null).length;
  }
  const preReadAckRateInWindow =
    preReadEligible === 0 ? 0 : Math.round((preReadAcked / preReadEligible) * 100);

  const people = {
    rolesTotal: rolesAll.length,
    rolesSmf: rolesAll.filter((r) => r.isSMF).length,
    rolesWithDeputy: rolesAll.filter((r) => r.deputyOfRoleId !== null).length,
    seatsTotalActive,
    seatsClaimedActive,
    activeParticipantsInWindow: activeUserIds.size,
    sitrepsInWindow: sitrepsWindow.length,
    imtMeetingsInWindow: imtMeetingsWindow.length,
    decisionsInWindow: decisionsWindow.length,
    decisionsWithRationaleInWindow,
    decisionsApprovedInWindow,
    commsInWindow: commsWindow.length,
    commsApprovedInWindow,
    commsRejectedInWindow,
    distinctImtChairsInWindow,
    distinctStakeholdersInWindow,
    preReadAckRateInWindow,
    mobilisedParticipantsInWindow,
    eligibleParticipantsInWindow,
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
    cadence,
    people,
  };
}

// ─── Personal state loader (per-user slice for personal achievements) ────

export async function loadAchievementPersonalState(
  orgId: string,
  userId: string,
): Promise<AchievementPersonalState> {
  const now = new Date();
  const yearAgo = new Date(now.getTime() - YEAR_MS);

  const [
    participantRows,
    sitrepsByMe,
    decisionsByMe,
    imtMeetingsChaired,
    facilitatedInWindow,
    commsByMe,
    commsApprovedByMe,
    participantRowsLifetime,
  ] = await Promise.all([
    prisma.exerciseParticipant.findMany({
      where: {
        userId,
        exercise: { orgId, completedAt: { gte: yearAgo } },
      },
      select: {
        id: true,
        preReadAckedAt: true,
        roleTitle: true,
      },
    }),
    prisma.sitrep.count({
      where: {
        authorParticipant: { userId },
        incident: { exercise: { orgId } },
        createdAt: { gte: yearAgo },
      },
    }),
    prisma.decisionRecord.findMany({
      where: {
        authorUserId: userId,
        incident: { exercise: { orgId } },
        createdAt: { gte: yearAgo },
      },
      select: { approvedAt: true },
    }),
    prisma.iMTMeeting.count({
      where: {
        chairParticipant: { userId },
        incident: { exercise: { orgId } },
        createdAt: { gte: yearAgo },
      },
    }),
    prisma.exercise.count({
      where: {
        orgId,
        completedAt: { gte: yearAgo },
        OR: [{ facilitatorId: userId }, { coFacilitatorId: userId }],
      },
    }),
    prisma.communicationDraft.count({
      where: {
        exercise: { orgId },
        authorId: userId,
        createdAt: { gte: yearAgo },
      },
    }),
    prisma.communicationDraft.count({
      where: {
        exercise: { orgId },
        approverId: userId,
        approvedAt: { gte: yearAgo },
      },
    }),
    prisma.exerciseParticipant.count({
      where: { userId, exercise: { orgId } },
    }),
  ]);

  const distinctRolesPlayed = new Set(
    participantRows.map((p) => p.roleTitle.trim().toLowerCase()).filter((s) => !!s),
  ).size;

  return {
    userId,
    sitrepsFiledInWindow: sitrepsByMe,
    decisionsLoggedInWindow: decisionsByMe.length,
    decisionsApprovedInWindow: decisionsByMe.filter((d) => d.approvedAt !== null).length,
    imtMeetingsChairedInWindow: imtMeetingsChaired,
    exercisesParticipatedInWindow: participantRows.length,
    exercisesFacilitatedInWindow: facilitatedInWindow,
    commsDraftedInWindow: commsByMe,
    commsApprovedAsApproverInWindow: commsApprovedByMe,
    distinctRolesPlayed,
    preReadAcksInWindow: participantRows.filter((p) => p.preReadAckedAt !== null).length,
    exercisesParticipatedLifetime: participantRowsLifetime,
  };
}

function computeBestMonthStreak(months: Set<string>): number {
  if (months.size === 0) return 0;
  const parsed = Array.from(months)
    .map((m) => {
      const [y, mo] = m.split("-");
      return new Date(Number(y), Number(mo) - 1, 1).getTime();
    })
    .sort((a, b) => a - b);
  let best = 1;
  let current = 1;
  for (let i = 1; i < parsed.length; i++) {
    const prev = new Date(parsed[i - 1]);
    const expectedNext = new Date(prev.getFullYear(), prev.getMonth() + 1, 1).getTime();
    if (parsed[i] === expectedNext) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }
  return best;
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
