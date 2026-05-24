import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Live, in-flight tolerance burn-down for an active incident.
 *
 * Distinct from evaluateToleranceBreaches (which scores a *closed*
 * incident with both invoked + closed timestamps): this evaluates the
 * gap between "minutes since invocation" and the IBS's declared
 * impactToleranceMin, and tells the IMT how much budget is left per
 * IBS while the incident is still running.
 */
export type LiveToleranceRow = {
  ibsName: string;
  toleranceMin: number;
  elapsedMin: number;
  remainingMin: number;
  /** elapsed / tolerance (≥ 1 means breached). */
  pctConsumed: number;
  status: "OK" | "WARNING" | "AT_RISK" | "BREACHED";
};

export async function evaluateLiveTolerance(
  incidentId: string,
  now: Date = new Date(),
): Promise<LiveToleranceRow[]> {
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
  if (!incident || !incident.invokedAt) return [];

  const endMs = (incident.closedAt ?? now).getTime();
  const elapsedMin = Math.max(
    0,
    Math.round((endMs - incident.invokedAt.getTime()) / 60_000),
  );

  return incident.exercise.scenario.ibsList
    .map((ibs) => {
      const remainingMin = ibs.impactToleranceMin - elapsedMin;
      const pctConsumed =
        ibs.impactToleranceMin > 0 ? elapsedMin / ibs.impactToleranceMin : 1;
      const status: LiveToleranceRow["status"] =
        pctConsumed >= 1
          ? "BREACHED"
          : pctConsumed >= 0.8
            ? "AT_RISK"
            : pctConsumed >= 0.5
              ? "WARNING"
              : "OK";
      return {
        ibsName: ibs.name,
        toleranceMin: ibs.impactToleranceMin,
        elapsedMin,
        remainingMin,
        pctConsumed,
        status,
      };
    })
    .sort((a, b) => b.pctConsumed - a.pctConsumed);
}

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
