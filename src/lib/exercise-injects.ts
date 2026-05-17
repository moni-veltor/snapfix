import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  AggregatedInject,
  CoverageGap,
  Density,
} from "@/lib/exercise-injects-types";

export type { AggregatedInject, CoverageGap, Density } from "@/lib/exercise-injects-types";
export { ddayMinToHhmm } from "@/lib/exercise-injects-types";

/** Loads the exercise's chained scenarios + their injects + the override layer
 *  and produces the timeline list, applying offset and hidden flags. */
export async function loadAggregatedInjects(exerciseId: string): Promise<AggregatedInject[]> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: {
      chainedScenarios: {
        orderBy: { sequence: "asc" },
        select: {
          sequence: true,
          offsetMin: true,
          label: true,
          scenario: {
            select: {
              id: true,
              title: true,
              injects: {
                orderBy: { injectNo: "asc" },
                select: {
                  id: true,
                  injectNo: true,
                  kind: true,
                  scheduledTime: true,
                  summary: true,
                  description: true,
                  senderRoleTitle: true,
                  toRoleTitles: true,
                  ccRoleTitles: true,
                },
              },
            },
          },
        },
      },
      injectOverrides: true,
    },
  });
  if (!exercise) return [];

  const overrideByInjectId = new Map<string, (typeof exercise.injectOverrides)[number]>();
  const customOverrides: (typeof exercise.injectOverrides)[number][] = [];
  for (const o of exercise.injectOverrides) {
    if (o.injectId) overrideByInjectId.set(o.injectId, o);
    else customOverrides.push(o);
  }

  const out: AggregatedInject[] = [];

  for (const link of exercise.chainedScenarios) {
    for (const i of link.scenario.injects) {
      const override = overrideByInjectId.get(i.id);
      const effectiveTimeStr = override?.scheduledTime ?? i.scheduledTime;
      const effectiveDDayMin = parseHhmm(effectiveTimeStr) + link.offsetMin;
      out.push({
        id: i.id,
        source: "scenario",
        effectiveDDayMin,
        scenarioScheduledTime: i.scheduledTime,
        scenarioId: link.scenario.id,
        scenarioTitle: link.scenario.title,
        scenarioSequence: link.sequence,
        scenarioLabel: link.label,
        injectNo: i.injectNo,
        kind: i.kind,
        summary: override?.summary ?? i.summary,
        description: override?.description ?? i.description,
        senderRoleTitle: override?.senderRoleTitle ?? i.senderRoleTitle,
        toRoleTitles: override && override.toRoleTitles.length > 0 ? override.toRoleTitles : i.toRoleTitles,
        ccRoleTitles: override && override.ccRoleTitles.length > 0 ? override.ccRoleTitles : i.ccRoleTitles,
        hidden: override?.hidden ?? false,
        overrideId: override?.id ?? null,
      });
    }
  }

  for (const c of customOverrides) {
    out.push({
      id: `override:${c.id}`,
      source: "custom",
      effectiveDDayMin: parseHhmm(c.scheduledTime ?? "00:00"),
      scenarioScheduledTime: null,
      scenarioId: null,
      scenarioTitle: null,
      scenarioSequence: null,
      scenarioLabel: null,
      injectNo: null,
      kind: c.kind,
      summary: c.summary ?? "(untitled custom inject)",
      description: c.description ?? "",
      senderRoleTitle: c.senderRoleTitle,
      toRoleTitles: c.toRoleTitles,
      ccRoleTitles: c.ccRoleTitles,
      hidden: c.hidden,
      overrideId: c.id,
    });
  }

  out.sort((a, b) => a.effectiveDDayMin - b.effectiveDDayMin);
  return out;
}

/** Coverage check: every inject's `toRoleTitles` must match at least one
 *  participant's roleTitle. Returns the gaps. */
export function findCoverageGaps(
  injects: AggregatedInject[],
  rosterRoleTitles: Set<string>,
): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  for (const i of injects) {
    if (i.hidden) continue;
    for (const role of i.toRoleTitles) {
      if (!rosterRoleTitles.has(role)) {
        gaps.push({ injectId: i.id, injectSummary: i.summary, missingRole: role });
      }
    }
  }
  return gaps;
}

/** Density: warn when more than N injects fall into a 5-min D-Day window. */
export function findDensityHotspots(
  injects: AggregatedInject[],
  thresholdPerFiveMinWindow: number = 4,
): Density[] {
  const buckets = new Map<number, number>();
  for (const i of injects) {
    if (i.hidden) continue;
    const bucket = Math.floor(i.effectiveDDayMin / 5) * 5;
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .filter(([, n]) => n > thresholdPerFiveMinWindow)
    .map(([bucketStartMin, injectCount]) => ({ bucketStartMin, injectCount }))
    .sort((a, b) => a.bucketStartMin - b.bucketStartMin);
}

function parseHhmm(hhmm: string): number {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}
