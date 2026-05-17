import "server-only";
import { prisma } from "@/lib/prisma";

export type ToleranceBreach = {
  ibsName: string;
  toleranceMin: number;
  actualMin: number | null;
  breachedBy: number | null;
  /** True when the recovery missed the tolerance window. */
  isBreached: boolean;
  /** Plain-English note for the evidence pack. */
  summary: string;
};

/**
 * For an incident: walk every IBS the scenario tests, look up its declared
 * impact tolerance (impactToleranceMin), compare to actual recovery time
 * (incident.closedAt - incident.invokedAt), and report which tolerances
 * were breached. Any breach is regulator-notifiable.
 */
export async function evaluateToleranceBreaches(incidentId: string): Promise<ToleranceBreach[]> {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    select: {
      invokedAt: true,
      closedAt: true,
      exercise: {
        select: {
          scenario: {
            select: {
              ibsList: { select: { name: true, impactToleranceMin: true } },
            },
          },
        },
      },
    },
  });
  if (!incident) return [];

  const actualMin =
    incident.invokedAt && incident.closedAt
      ? Math.round((incident.closedAt.getTime() - incident.invokedAt.getTime()) / 60_000)
      : null;

  return incident.exercise.scenario.ibsList.map((ibs) => {
    const breachedBy = actualMin !== null ? actualMin - ibs.impactToleranceMin : null;
    const isBreached = breachedBy !== null && breachedBy > 0;
    return {
      ibsName: ibs.name,
      toleranceMin: ibs.impactToleranceMin,
      actualMin,
      breachedBy,
      isBreached,
      summary: isBreached
        ? `Breached tolerance by ${breachedBy} min (tolerance ${ibs.impactToleranceMin} min · actual ${actualMin} min). Regulator-notifiable on a real incident.`
        : actualMin !== null
          ? `Within tolerance (${actualMin} min vs ${ibs.impactToleranceMin} min budget).`
          : `Tolerance ${ibs.impactToleranceMin} min — actual recovery time not yet known.`,
    };
  });
}
