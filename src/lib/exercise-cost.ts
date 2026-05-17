import "server-only";
import { prisma } from "@/lib/prisma";

/** Sector-default fully-loaded hourly rates (GBP, major currency units).
 *  Used when an org hasn't set its own defaultExerciseRates in settings. */
export const SECTOR_DEFAULT_RATES_GBP: Record<string, number> = {
  CEO: 600,
  CRO: 500,
  CFO: 500,
  CTO: 500,
  COO: 500,
  CCO: 450,
  CPO: 450,
  ISM: 350,
  "Head of Compliance": 350,
  "Head of External Affairs": 300,
  "Comms Lead": 250,
  "Sn.TPM": 280,
  TPM: 220,
  "Sn. DA/E": 240,
  "Customer Ops Lead": 200,
  Facilitator: 200,
  "Co-Facilitator": 200,
  // Catch-all for anything not in the table.
  __default__: 180,
};

/** Resolved rate for a participant — org override > sector default > __default__. */
export function rateForRole(
  roleTitle: string,
  orgRates: Record<string, number> | null | undefined,
): number {
  if (orgRates && typeof orgRates[roleTitle] === "number") return orgRates[roleTitle];
  if (typeof SECTOR_DEFAULT_RATES_GBP[roleTitle] === "number") return SECTOR_DEFAULT_RATES_GBP[roleTitle];
  return SECTOR_DEFAULT_RATES_GBP.__default__;
}

export type CostBreakdown = {
  totalMinor: number;          // pence
  totalMajor: number;          // pounds (or org currency)
  currency: string;
  perParticipant: { roleTitle: string; rate: number; minutes: number; subtotal: number }[];
};

/** Estimated cost = roster × planned duration × per-role rate. */
export async function estimateExerciseCost(exerciseId: string): Promise<CostBreakdown | null> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: {
      durationMin: true,
      org: { select: { defaultExerciseRates: true, exerciseCostCurrency: true } },
      participants: { select: { roleTitle: true } },
    },
  });
  if (!exercise || !exercise.durationMin) return null;

  const orgRates = (exercise.org.defaultExerciseRates ?? null) as Record<string, number> | null;
  const currency = exercise.org.exerciseCostCurrency ?? "GBP";
  const minutes = exercise.durationMin;

  const perParticipant = exercise.participants.map((p) => {
    const rate = rateForRole(p.roleTitle, orgRates);
    const subtotal = (rate * minutes) / 60;
    return { roleTitle: p.roleTitle, rate, minutes, subtotal };
  });
  const totalMajor = perParticipant.reduce((sum, p) => sum + p.subtotal, 0);
  return {
    totalMinor: Math.round(totalMajor * 100),
    totalMajor: Math.round(totalMajor),
    currency,
    perParticipant,
  };
}

/** Actual cost = per-participant attended-minutes × rate, computed at closure. */
export async function actualExerciseCost(exerciseId: string): Promise<CostBreakdown | null> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: {
      completedAt: true,
      org: { select: { defaultExerciseRates: true, exerciseCostCurrency: true } },
      participants: {
        select: {
          roleTitle: true,
          attendedFromAt: true,
          attendedUntilAt: true,
        },
      },
    },
  });
  if (!exercise) return null;

  const orgRates = (exercise.org.defaultExerciseRates ?? null) as Record<string, number> | null;
  const currency = exercise.org.exerciseCostCurrency ?? "GBP";

  const perParticipant = exercise.participants.map((p) => {
    const rate = rateForRole(p.roleTitle, orgRates);
    let minutes = 0;
    if (p.attendedFromAt && p.attendedUntilAt) {
      minutes = Math.max(
        0,
        Math.round((p.attendedUntilAt.getTime() - p.attendedFromAt.getTime()) / 60000),
      );
    } else if (p.attendedFromAt && exercise.completedAt) {
      minutes = Math.max(
        0,
        Math.round((exercise.completedAt.getTime() - p.attendedFromAt.getTime()) / 60000),
      );
    }
    const subtotal = (rate * minutes) / 60;
    return { roleTitle: p.roleTitle, rate, minutes, subtotal };
  });
  const totalMajor = perParticipant.reduce((sum, p) => sum + p.subtotal, 0);
  return {
    totalMinor: Math.round(totalMajor * 100),
    totalMajor: Math.round(totalMajor),
    currency,
    perParticipant,
  };
}

export function formatMoney(major: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(major);
}
