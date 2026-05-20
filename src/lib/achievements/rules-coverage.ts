import type { AchievementRule } from "./types";

/**
 * 50 Coverage achievements arranged across the 5 maturity levels:
 *   L1 Awareness  — inventory exists (10)
 *   L2 Documented — governance metadata captured (10)
 *   L3 Tested     — exercised at least once (10)
 *   L4 Measured   — rigour the regulator wants to see (10)
 *   L5 Optimised  — sustained excellence (10)
 *
 * Each predicate is a pure function of AchievementOrgState. The state loader
 * pre-computes everything; rules just check.
 */

// ─── helpers ───────────────────────────────────────────────────────────

function pctLabel(value: number, total: number): string {
  if (total === 0) return "0 of 0";
  const pct = Math.round((value / total) * 100);
  return `${value} of ${total} · ${pct}%`;
}

function unlockedFromCount(value: number, target: number, unit: string) {
  if (value >= target) {
    return {
      status: "unlocked" as const,
      progress: 1 as const,
      valueLabel: `${value} ${unit}`,
    };
  }
  return {
    status: "inProgress" as const,
    progress: target === 0 ? 0 : value / target,
    valueLabel: `${value} ${unit}`,
    nextLabel: `${target - value} more`,
  };
}

function unlockedFromPct(value: number, total: number, target: number) {
  if (total === 0) {
    return {
      status: "inProgress" as const,
      progress: 0,
      valueLabel: "no data yet",
      nextLabel: "add to the register first",
    };
  }
  const pct = (value / total) * 100;
  if (pct >= target) {
    return {
      status: "unlocked" as const,
      progress: 1 as const,
      valueLabel: pctLabel(value, total),
    };
  }
  return {
    status: "inProgress" as const,
    progress: pct / target,
    valueLabel: pctLabel(value, total),
    nextLabel: `${target}% needed`,
  };
}

function unlockedFromBoolean(ok: boolean, valueLabel: string, nextLabel: string) {
  return ok
    ? { status: "unlocked" as const, progress: 1 as const, valueLabel }
    : {
        status: "inProgress" as const,
        progress: 0,
        valueLabel,
        nextLabel,
      };
}

// ─── Rules ─────────────────────────────────────────────────────────────

export const COVERAGE_RULES: AchievementRule[] = [
  // ──────────────────── L1 — Awareness (10) ────────────────────
  {
    id: "coverage-first-ibs",
    topic: "coverage",
    level: 1,
    title: "Capture your first IBS",
    description: "The first row in your Important Business Service register.",
    icon: "Building2",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) => unlockedFromCount(s.ibs.total, 1, "IBS captured"),
  },
  {
    id: "coverage-first-vendor",
    topic: "coverage",
    level: 1,
    title: "First vendor on the register",
    description: "Add your first third-party provider.",
    icon: "Boxes",
    sticky: true,
    deepLink: "/vendors",
    evaluate: (s) => unlockedFromCount(s.vendors.total, 1, "vendor"),
  },
  {
    id: "coverage-first-system",
    topic: "coverage",
    level: 1,
    title: "First tech system tagged",
    description: "Add a system to the technical recovery register.",
    icon: "Server",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) => unlockedFromCount(s.systems.total, 1, "system"),
  },
  {
    id: "coverage-first-resource",
    topic: "coverage",
    level: 1,
    title: "First resource-map node",
    description: "Map a vendor, system or process to an IBS.",
    icon: "Network",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) => unlockedFromCount(s.resources.total, 1, "resource"),
  },
  {
    id: "coverage-first-tolerance",
    topic: "coverage",
    level: 1,
    title: "First impact tolerance set",
    description: "Give an IBS its recovery-time tolerance.",
    icon: "Target",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) => unlockedFromCount(s.ibs.withTolerance, 1, "with tolerance"),
  },
  {
    id: "coverage-first-journey",
    topic: "coverage",
    level: 1,
    title: "First customer journey tagged",
    description: "Capture which customer journey an IBS supports.",
    icon: "Users",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) =>
      unlockedFromCount(s.ibs.withCustomerJourneys, 1, "with journeys"),
  },
  {
    id: "coverage-first-third-party-link",
    topic: "coverage",
    level: 1,
    title: "First vendor → IBS link",
    description: "Connect a vendor to the IBS it underpins.",
    icon: "Layers",
    sticky: true,
    deepLink: "/vendors",
    evaluate: (s) => unlockedFromCount(s.vendors.withDeptLink, 1, "linked"),
  },
  {
    id: "coverage-first-product",
    topic: "coverage",
    level: 1,
    title: "First product captured",
    description: "Tag the products that depend on an IBS.",
    icon: "Package",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) =>
      unlockedFromCount(s.ibs.withProductsCovered, 1, "with products"),
  },
  {
    id: "coverage-first-process-owner",
    topic: "coverage",
    level: 1,
    title: "First process owner named",
    description: "Document who owns the IBS day-to-day.",
    icon: "Briefcase",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) => unlockedFromCount(s.ibs.withProcessOwner, 1, "owners named"),
  },
  {
    id: "coverage-first-criticality",
    topic: "coverage",
    level: 1,
    title: "First criticality assigned",
    description: "Classify an IBS as MEDIUM, HIGH or CRITICAL.",
    icon: "ShieldCheck",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) =>
      unlockedFromCount(s.ibs.withCriticality, 1, "above LOW"),
  },

  // ──────────────────── L2 — Documented (10) ───────────────────
  {
    id: "coverage-ibs-approved-one",
    topic: "coverage",
    level: 2,
    title: "First IBS APPROVED",
    description: "Move an IBS from DRAFT to APPROVED status.",
    icon: "BadgeCheck",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) => unlockedFromCount(s.ibs.approved, 1, "approved"),
  },
  {
    id: "coverage-ibs-approved-three",
    topic: "coverage",
    level: 2,
    title: "Three IBSs APPROVED",
    description: "Get three IBSs across the line.",
    icon: "BadgeCheck",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) => unlockedFromCount(s.ibs.approved, 3, "approved"),
  },
  {
    id: "coverage-vendor-contract-dates",
    topic: "coverage",
    level: 2,
    title: "Vendor contract dates captured",
    description: "Both start + end dates on one vendor record.",
    icon: "FileCheck",
    sticky: true,
    deepLink: "/vendors",
    evaluate: (s) =>
      unlockedFromCount(s.vendors.withContractDates, 1, "with contract dates"),
  },
  {
    id: "coverage-system-rto-rpo",
    topic: "coverage",
    level: 2,
    title: "System RTO + RPO set",
    description: "Both recovery objectives declared on one system.",
    icon: "Target",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) =>
      unlockedFromCount(s.systems.withRtoAndRpo, 1, "with RTO + RPO"),
  },
  {
    id: "coverage-ibs-fca-tolerance",
    topic: "coverage",
    level: 2,
    title: "IBS with FCA tolerance",
    description: "Add a regulator-facing tolerance to an IBS.",
    icon: "Shield",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) =>
      unlockedFromCount(s.ibs.withFcaTolerance, 1, "with FCA tolerance"),
  },
  {
    id: "coverage-ibs-pra-tolerance",
    topic: "coverage",
    level: 2,
    title: "IBS with PRA tolerance",
    description: "Add a PRA-side tolerance to an IBS.",
    icon: "Shield",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) =>
      unlockedFromCount(s.ibs.withPraTolerance, 1, "with PRA tolerance"),
  },
  {
    id: "coverage-mtp-with-lei",
    topic: "coverage",
    level: 2,
    title: "MTP vendor with valid LEI",
    description: "Capture a Legal Entity Identifier on an MTP vendor.",
    icon: "Crown",
    sticky: true,
    deepLink: "/vendors",
    evaluate: (s) => unlockedFromCount(s.vendors.withLei, 1, "with LEI"),
  },
  {
    id: "coverage-ibs-department-owner",
    topic: "coverage",
    level: 2,
    title: "IBS with department owner",
    description: "Assign an end-to-end owner from your org chart.",
    icon: "Users",
    sticky: true,
    deepLink: "/ibs",
    evaluate: (s) =>
      unlockedFromCount(s.ibs.withDepartmentOwner, 1, "with owner"),
  },
  {
    id: "coverage-system-failover-region",
    topic: "coverage",
    level: 2,
    title: "System failover region declared",
    description: "Capture where the system can fail over to.",
    icon: "Network",
    sticky: true,
    deepLink: "/tech-recovery",
    evaluate: (s) =>
      unlockedFromCount(s.systems.withFailoverRegion, 1, "with failover region"),
  },
  {
    id: "coverage-vendor-assurance",
    topic: "coverage",
    level: 2,
    title: "Vendor assurance logged",
    description: "Record the assurance kind a vendor provides (SOC 2 etc).",
    icon: "ShieldCheck",
    sticky: true,
    deepLink: "/vendors",
    evaluate: (s) =>
      unlockedFromCount(s.vendors.withAssurance, 1, "with assurance"),
  },

  // ──────────────────── L3 — Tested (10) ───────────────────────
  {
    id: "coverage-first-ibs-exercised",
    topic: "coverage",
    level: 3,
    title: "First IBS exercised",
    description: "Run an exercise that touches an IBS in your register.",
    icon: "Flame",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      unlockedFromCount(s.ibs.exercisedAtLeastOnce, 1, "exercised"),
  },
  {
    id: "coverage-harm-people",
    topic: "coverage",
    level: 3,
    title: "Covered People harm",
    description: "An exercise tested the People harm dimension.",
    icon: "Users",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => unlockedFromCount(s.exercises.coveredPeople, 1, "covered"),
  },
  {
    id: "coverage-harm-property",
    topic: "coverage",
    level: 3,
    title: "Covered Property harm",
    description: "An exercise tested the Property harm dimension.",
    icon: "Building2",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) => unlockedFromCount(s.exercises.coveredProperty, 1, "covered"),
  },
  {
    id: "coverage-harm-technology",
    topic: "coverage",
    level: 3,
    title: "Covered Technology harm",
    description: "An exercise tested the Technology harm dimension.",
    icon: "Server",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      unlockedFromCount(s.exercises.coveredTechnology, 1, "covered"),
  },
  {
    id: "coverage-harm-data-availability",
    topic: "coverage",
    level: 3,
    title: "Covered Data Availability harm",
    description: "An exercise tested the Data Availability harm dimension.",
    icon: "Database",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      unlockedFromCount(s.exercises.coveredDataAvailability, 1, "covered"),
  },
  {
    id: "coverage-harm-data-integrity",
    topic: "coverage",
    level: 3,
    title: "Covered Data Integrity harm",
    description: "An exercise tested the Data Integrity harm dimension.",
    icon: "Database",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      unlockedFromCount(s.exercises.coveredDataIntegrity, 1, "covered"),
  },
  {
    id: "coverage-harm-third-party",
    topic: "coverage",
    level: 3,
    title: "Covered Third Party harm",
    description: "An exercise tested the Third Party harm dimension.",
    icon: "Boxes",
    sticky: true,
    deepLink: "/exercises",
    evaluate: (s) =>
      unlockedFromCount(s.exercises.coveredThirdParty, 1, "covered"),
  },
  {
    id: "coverage-25pct-ibs",
    topic: "coverage",
    level: 3,
    title: "25% IBS coverage",
    description: "A quarter of registered IBSs have been exercised.",
    icon: "Sparkles",
    sticky: true,
    deepLink: "/analytics",
    evaluate: (s) =>
      unlockedFromPct(s.ibs.exercisedAtLeastOnce, s.ibs.total, 25),
  },
  {
    id: "coverage-50pct-ibs",
    topic: "coverage",
    level: 3,
    title: "50% IBS coverage",
    description: "Half the register has had a run-through.",
    icon: "Sparkles",
    sticky: true,
    deepLink: "/analytics",
    evaluate: (s) =>
      unlockedFromPct(s.ibs.exercisedAtLeastOnce, s.ibs.total, 50),
  },
  {
    id: "coverage-80pct-ibs",
    topic: "coverage",
    level: 3,
    title: "80% IBS coverage",
    description: "The good-practice floor for an annual cycle.",
    icon: "Trophy",
    sticky: true,
    deepLink: "/analytics",
    evaluate: (s) =>
      unlockedFromPct(s.ibs.exercisedAtLeastOnce, s.ibs.total, 80),
  },

  // ──────────────────── L4 — Measured (10) ─────────────────────
  {
    id: "coverage-100pct-ibs-window",
    topic: "coverage",
    level: 4,
    title: "100% IBS coverage in window",
    description: "Every registered IBS exercised in the last 12 months.",
    icon: "Trophy",
    sticky: false,
    deepLink: "/analytics",
    evaluate: (s) =>
      unlockedFromPct(s.ibs.exercisedInWindow, s.ibs.total, 100),
  },
  {
    id: "coverage-all-harms-window",
    topic: "coverage",
    level: 4,
    title: "All 6 harms covered in window",
    description: "Each of the standard harm dimensions tested at least once.",
    icon: "Layers",
    sticky: false,
    deepLink: "/analytics",
    evaluate: (s) => {
      const covered =
        (s.exercises.coveredPeople > 0 ? 1 : 0) +
        (s.exercises.coveredProperty > 0 ? 1 : 0) +
        (s.exercises.coveredTechnology > 0 ? 1 : 0) +
        (s.exercises.coveredDataAvailability > 0 ? 1 : 0) +
        (s.exercises.coveredDataIntegrity > 0 ? 1 : 0) +
        (s.exercises.coveredThirdParty > 0 ? 1 : 0);
      return unlockedFromCount(covered, 6, "of 6 harms");
    },
  },
  {
    id: "coverage-all-mtp-in-snapshot",
    topic: "coverage",
    level: 4,
    title: "Every MTP in the snapshot",
    description: "Each Material Third Party present in your latest register snapshot.",
    icon: "FileSpreadsheet",
    sticky: false,
    deepLink: "/vendors/register",
    evaluate: (s) =>
      unlockedFromBoolean(
        s.vendors.mtpTotal > 0 && s.vendors.inLatestSnapshot === s.vendors.mtpTotal,
        `${s.vendors.inLatestSnapshot}/${s.vendors.mtpTotal} in snapshot`,
        "generate a fresh snapshot",
      ),
  },
  {
    id: "coverage-attestation-all-ibs",
    topic: "coverage",
    level: 4,
    title: "Annual attestation on every IBS",
    description: "Every IBS has an attestation closed this year.",
    icon: "BadgeCheck",
    sticky: false,
    deepLink: "/ibs",
    evaluate: (s) =>
      unlockedFromPct(s.ibs.withAttestationThisYear, s.ibs.total, 100),
  },
  {
    id: "coverage-mtp-register-ready",
    topic: "coverage",
    level: 4,
    title: "Every MTP register-ready",
    description: "Every MTP vendor passes the FCA/PRA register checks.",
    icon: "ShieldCheck",
    sticky: false,
    deepLink: "/vendors",
    evaluate: (s) =>
      unlockedFromPct(s.vendors.mtpRegisterReady, s.vendors.mtpTotal, 100),
  },
  {
    id: "coverage-programme-3-quarters",
    topic: "coverage",
    level: 4,
    title: "Programme calendar with 3 quarters",
    description: "≥ 3 quarters of the current year slotted with a scenario.",
    icon: "CalendarCheck",
    sticky: false,
    deepLink: "/scenarios/programme",
    evaluate: (s) =>
      unlockedFromCount(s.programme.quartersSlottedThisYear, 3, "quarters slotted"),
  },
  {
    id: "coverage-programme-4-quarters",
    topic: "coverage",
    level: 4,
    title: "Programme calendar with 4 quarters",
    description: "Every quarter of the year has a scenario assigned.",
    icon: "CalendarCheck",
    sticky: false,
    deepLink: "/scenarios/programme",
    evaluate: (s) =>
      unlockedFromCount(s.programme.quartersSlottedThisYear, 4, "quarters slotted"),
  },
  {
    id: "coverage-system-dr-tested",
    topic: "coverage",
    level: 4,
    title: "Every system DR-tested",
    description: "Each registered system has at least one DR test on file.",
    icon: "Zap",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) => unlockedFromPct(s.systems.withDrTestAny, s.systems.total, 100),
  },
  {
    id: "coverage-no-untested-critical",
    topic: "coverage",
    level: 4,
    title: "No untested critical IBSs",
    description: "No critical IBS older than 12 months without an exercise.",
    icon: "Shield",
    sticky: false,
    deepLink: "/analytics",
    evaluate: (s) =>
      unlockedFromBoolean(
        s.ibs.criticalUntestedOlderThan12mo === 0 && s.ibs.total > 0,
        s.ibs.criticalUntestedOlderThan12mo === 0
          ? "no gaps"
          : `${s.ibs.criticalUntestedOlderThan12mo} critical IBS untested > 12mo`,
        "exercise the criticals",
      ),
  },
  {
    id: "coverage-sequential-codes",
    topic: "coverage",
    level: 4,
    title: "Sequential IBS codes",
    description: "IBS codes are 1..N with no gaps (clean register hygiene).",
    icon: "BookOpen",
    sticky: false,
    deepLink: "/ibs",
    evaluate: (s) =>
      unlockedFromBoolean(
        s.ibs.sequentialCodes && s.ibs.total > 0,
        s.ibs.sequentialCodes ? "no gaps" : "renumber to remove gaps",
        "renumber to 1..N",
      ),
  },

  // ──────────────────── L5 — Optimised (10) ────────────────────
  {
    id: "coverage-every-ibs-twice",
    topic: "coverage",
    level: 5,
    title: "Every IBS exercised twice",
    description: "Every IBS exercised at least twice in the last 12 months.",
    icon: "Trophy",
    sticky: false,
    deepLink: "/analytics",
    evaluate: (s) =>
      unlockedFromPct(s.ibs.exercisedTwiceInWindow, s.ibs.total, 100),
  },
  {
    id: "coverage-every-harm-twice",
    topic: "coverage",
    level: 5,
    title: "Every harm covered twice",
    description: "Each of the 6 harm dimensions tested at least twice in window.",
    icon: "Layers",
    sticky: false,
    deepLink: "/analytics",
    evaluate: (s) =>
      unlockedFromCount(s.exercises.coveredEachHarmTwice, 6, "harms ≥ 2× covered"),
  },
  {
    id: "coverage-sector-spread-3",
    topic: "coverage",
    level: 5,
    title: "Sector spread ≥ 3",
    description: "Exercises this year touched at least 3 distinct categories.",
    icon: "Sparkles",
    sticky: false,
    deepLink: "/analytics",
    evaluate: (s) =>
      unlockedFromCount(s.sectors.distinctCoveredInWindow, 3, "categories"),
  },
  {
    id: "coverage-vendor-exit-fresh",
    topic: "coverage",
    level: 5,
    title: "Every MTP exit plan fresh",
    description: "Every MTP vendor with an exit plan reviewed in the last 12 months.",
    icon: "ShieldCheck",
    sticky: false,
    deepLink: "/vendors",
    evaluate: (s) =>
      unlockedFromPct(s.vendors.withFreshExitPlan, s.vendors.mtpTotal, 100),
  },
  {
    id: "coverage-system-failover-configured",
    topic: "coverage",
    level: 5,
    title: "Every system has failover",
    description: "No system left with failoverKind = NONE.",
    icon: "Zap",
    sticky: false,
    deepLink: "/tech-recovery",
    evaluate: (s) =>
      unlockedFromPct(s.systems.withFailoverConfigured, s.systems.total, 100),
  },
  {
    id: "coverage-shared-dep-map",
    topic: "coverage",
    level: 5,
    title: "Shared dependency map surfaced",
    description: "At least 3 resources shared across 2+ IBSs — concentration risk visible.",
    icon: "Network",
    sticky: false,
    deepLink: "/ibs",
    evaluate: (s) =>
      unlockedFromCount(s.resources.sharedAcrossIBS, 3, "shared resources"),
  },
  {
    id: "coverage-programme-adherence-90",
    topic: "coverage",
    level: 5,
    title: "Programme adherence ≥ 90%",
    description: "≥ 90% of slotted quarters this year actually exercised.",
    icon: "CalendarCheck",
    sticky: false,
    deepLink: "/scenarios/programme",
    evaluate: (s) =>
      unlockedFromPct(
        s.programme.quartersExercisedThisYear,
        s.programme.quartersSlottedThisYear,
        90,
      ),
  },
  {
    id: "coverage-annual-register-filed",
    topic: "coverage",
    level: 5,
    title: "Annual register filed",
    description: "A VendorRegisterSnapshot exists with this year's reporting date.",
    icon: "FileSpreadsheet",
    sticky: false,
    deepLink: "/vendors/register",
    evaluate: (s) =>
      unlockedFromCount(s.snapshots.snapshotsThisYear, 1, "snapshot this year"),
  },
  {
    id: "coverage-zero-orphan-resources",
    topic: "coverage",
    level: 5,
    title: "Zero orphan resources",
    description: "Every resource-map node linked to a vendor, system or department.",
    icon: "Network",
    sticky: false,
    deepLink: "/ibs",
    evaluate: (s) =>
      unlockedFromBoolean(
        s.resources.total > 0 && s.resources.orphan === 0,
        s.resources.orphan === 0
          ? "all linked"
          : `${s.resources.orphan} unlinked`,
        "link the unlinked",
      ),
  },
  {
    id: "coverage-mtp-100",
    topic: "coverage",
    level: 5,
    title: "Every MTP fully register-ready",
    description: "Every MTP vendor passes every regulator-required field check.",
    icon: "Crown",
    sticky: false,
    deepLink: "/vendors",
    evaluate: (s) =>
      unlockedFromBoolean(
        s.vendors.mtpTotal > 0 && s.vendors.mtpRegisterReady === s.vendors.mtpTotal,
        `${s.vendors.mtpRegisterReady}/${s.vendors.mtpTotal} ready`,
        "fill the regulator-required fields",
      ),
  },
];
