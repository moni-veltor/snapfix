/**
 * Achievements — derived badges that reward healthy resilience habits.
 * Each one is computed from existing data; no extra storage. Use to
 * motivate the right behaviours: cadence, coverage, depth, DR testing.
 */

import {
  Sparkles,
  Trophy,
  Shield,
  Flame,
  CalendarCheck,
  Server,
  Crown,
  Users,
  Layers,
  Award,
  type LucideIcon,
} from "lucide-react";

export type AchievementId =
  | "first-ibs"
  | "ibs-five"
  | "ibs-ten"
  | "first-exercise"
  | "exercise-cadence"
  | "first-dr-test"
  | "all-harms"
  | "deputy-chain"
  | "dora-clean"
  | "full-house";

export type AchievementIconName =
  | "Sparkles"
  | "Trophy"
  | "Shield"
  | "Flame"
  | "CalendarCheck"
  | "Server"
  | "Crown"
  | "Users"
  | "Layers"
  | "Award";

export type Achievement = {
  id: AchievementId;
  label: string;
  description: string;
  iconName: AchievementIconName;
  unlocked: boolean;
  progress?: string;
};

export type AchievementInput = {
  ibsCount: number;
  exercisesCompletedCount: number;
  exercisesLast90Days: number;
  drTestCount: number;
  harmTypesCovered: number;
  rolesWithDeputy: number;
  rolesTotal: number;
  vendorsWithExitPlan: number;
  vendorsCriticalTotal: number;
};

export function computeAchievements(input: AchievementInput): Achievement[] {
  const base: Achievement[] = [
    {
      id: "first-ibs",
      label: "First service registered",
      description: "Captured your first Important Business Service.",
      iconName: "Sparkles",
      unlocked: input.ibsCount >= 1,
    },
    {
      id: "ibs-five",
      label: "Building the register",
      description: "Five IBSs on the books.",
      iconName: "Layers",
      unlocked: input.ibsCount >= 5,
      progress: input.ibsCount < 5 ? `${input.ibsCount} / 5` : undefined,
    },
    {
      id: "ibs-ten",
      label: "Comprehensive coverage",
      description: "Ten or more IBSs registered — your customer-journey map looks serious.",
      iconName: "Trophy",
      unlocked: input.ibsCount >= 10,
      progress: input.ibsCount < 10 ? `${input.ibsCount} / 10` : undefined,
    },
    {
      id: "first-exercise",
      label: "First drill in the bag",
      description: "Ran your first exercise to completion.",
      iconName: "Flame",
      unlocked: input.exercisesCompletedCount >= 1,
    },
    {
      id: "exercise-cadence",
      label: "On the cadence",
      description: "Three or more exercises in the last 90 days.",
      iconName: "CalendarCheck",
      unlocked: input.exercisesLast90Days >= 3,
      progress:
        input.exercisesLast90Days < 3 ? `${input.exercisesLast90Days} / 3` : undefined,
    },
    {
      id: "first-dr-test",
      label: "Ledger started",
      description: "Logged your first DR test.",
      iconName: "Server",
      unlocked: input.drTestCount >= 1,
    },
    {
      id: "all-harms",
      label: "All six harms exercised",
      description: "Tested every harm type — people, property, tech, availability, integrity, third-party.",
      iconName: "Shield",
      unlocked: input.harmTypesCovered >= 6,
      progress: input.harmTypesCovered < 6 ? `${input.harmTypesCovered} / 6` : undefined,
    },
    {
      id: "deputy-chain",
      label: "Deputy chain wired",
      description: "At least half of all roles have a named deputy.",
      iconName: "Users",
      unlocked:
        input.rolesTotal > 0 &&
        input.rolesWithDeputy >= Math.ceil(input.rolesTotal * 0.5),
      progress:
        input.rolesTotal > 0
          ? `${input.rolesWithDeputy} / ${Math.ceil(input.rolesTotal * 0.5)}`
          : undefined,
    },
    {
      id: "dora-clean",
      label: "DORA exit-ready",
      description: "Every critical vendor has a fresh exit plan on file.",
      iconName: "Crown",
      unlocked:
        input.vendorsCriticalTotal > 0 &&
        input.vendorsWithExitPlan === input.vendorsCriticalTotal,
      progress:
        input.vendorsCriticalTotal > 0
          ? `${input.vendorsWithExitPlan} / ${input.vendorsCriticalTotal}`
          : "0 / 0",
    },
  ];

  const fullHouse: Achievement = {
    id: "full-house",
    label: "Full house",
    description: "Every previous badge unlocked — give yourself a coffee.",
    iconName: "Award",
    unlocked: base.every((b) => b.unlocked),
  };

  return [...base, fullHouse];
}

export const ACHIEVEMENT_ICONS: Record<AchievementIconName, LucideIcon> = {
  Sparkles,
  Trophy,
  Shield,
  Flame,
  CalendarCheck,
  Server,
  Crown,
  Users,
  Layers,
  Award,
};
