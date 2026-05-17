import "server-only";
import { prisma } from "@/lib/prisma";

export type DifficultyAxes = {
  cognitive: number | null;
  timePressure: number | null;
  ambiguity: number | null;
  stakeholders: number | null;
};

export type DifficultyOverall = {
  axes: DifficultyAxes;
  /** max of the populated axes; null if none set. */
  overall: number | null;
  label: "Foundational" | "Routine" | "Stretching" | "Adversarial" | "Worst-day" | "Unrated";
};

export function computeDifficulty(s: {
  difficultyCognitive: number | null;
  difficultyTimePressure: number | null;
  difficultyAmbiguity: number | null;
  difficultyStakeholders: number | null;
}): DifficultyOverall {
  const axes: DifficultyAxes = {
    cognitive: s.difficultyCognitive,
    timePressure: s.difficultyTimePressure,
    ambiguity: s.difficultyAmbiguity,
    stakeholders: s.difficultyStakeholders,
  };
  const values = Object.values(axes).filter((v): v is number => v !== null && v !== undefined);
  if (values.length === 0) return { axes, overall: null, label: "Unrated" };
  const overall = Math.max(...values);
  const label = (
    {
      1: "Foundational",
      2: "Routine",
      3: "Stretching",
      4: "Adversarial",
      5: "Worst-day",
    } as const
  )[overall as 1 | 2 | 3 | 4 | 5];
  return { axes, overall, label };
}

/**
 * Average overall-difficulty across the org's last N completed exercises.
 * Used to recommend "your team is ready for difficulty N+1 next" in the
 * Step 2 scenario picker. Null if there's not enough history.
 */
export async function recentTeamDifficulty(
  orgId: string,
  lookback: number = 3,
): Promise<{ avg: number; sampleSize: number } | null> {
  const exercises = await prisma.exercise.findMany({
    where: { orgId, status: { in: ["COMPLETED"] } },
    orderBy: { completedAt: "desc" },
    take: lookback,
    select: {
      scenario: {
        select: {
          difficultyCognitive: true,
          difficultyTimePressure: true,
          difficultyAmbiguity: true,
          difficultyStakeholders: true,
        },
      },
    },
  });
  const overalls = exercises
    .map((e) => computeDifficulty(e.scenario).overall)
    .filter((v): v is number => v !== null);
  if (overalls.length === 0) return null;
  const avg = overalls.reduce((a, b) => a + b, 0) / overalls.length;
  return { avg, sampleSize: overalls.length };
}
