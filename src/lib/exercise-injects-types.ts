import type { InjectKind } from "@/generated/prisma/enums";

export type AggregatedInject = {
  id: string;
  source: "scenario" | "custom";
  effectiveDDayMin: number;
  scenarioScheduledTime: string | null;
  scenarioId: string | null;
  scenarioTitle: string | null;
  scenarioSequence: number | null;
  scenarioLabel: string | null;
  injectNo: number | null;
  kind: InjectKind | null;
  summary: string;
  description: string;
  senderRoleTitle: string | null;
  toRoleTitles: string[];
  ccRoleTitles: string[];
  hidden: boolean;
  overrideId: string | null;
};

export type CoverageGap = {
  injectId: string;
  injectSummary: string;
  missingRole: string;
};

export type Density = {
  bucketStartMin: number;
  injectCount: number;
};

export function ddayMinToHhmm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
