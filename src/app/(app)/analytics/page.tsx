import { BarChart3 } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import AudienceTabs, { type Audience } from "@/components/analytics/AudienceTabs";
import FilterBar from "@/components/analytics/FilterBar";
import BoardTab from "@/components/analytics/BoardTab";
import ProgrammeTab from "@/components/analytics/ProgrammeTab";
import ExecutiveTab from "@/components/analytics/ExecutiveTab";
import RiskTab from "@/components/analytics/RiskTab";
import VendorsTab from "@/components/analytics/VendorsTab";
import {
  parseFiltersFromSearchParams,
  resolveDateRange,
} from "@/lib/analytics-filters";

export const metadata = { title: "Analytics — SnapFix" };

const AUDIENCES: Audience[] = ["board", "executive", "programme", "risk", "vendors"];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireOrgUser();
  const sp = await searchParams;

  const audienceRaw = Array.isArray(sp.audience) ? sp.audience[0] : sp.audience;
  const audience: Audience = AUDIENCES.includes(audienceRaw as Audience)
    ? (audienceRaw as Audience)
    : "programme";

  const filters = parseFiltersFromSearchParams(sp);
  const range = resolveDateRange(filters.range);

  // Compact key-value mirror of the URL params, used to keep filter state
  // when switching audience tabs.
  const carryParams: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") carryParams[k] = v;
  }

  const ibsOptions = await prisma.organizationIBS.findMany({
    where: { orgId: me.orgId },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true, criticality: true },
  });

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={`${audience.charAt(0).toUpperCase()}${audience.slice(1)} view`}
        icon={BarChart3}
        title="Analytics"
        pitch="Per-audience evidence · live filters"
      />

      <AudienceTabs current={audience} carryParams={carryParams} />

      <FilterBar ibsOptions={ibsOptions} />

      {audience === "programme" && (
        <ProgrammeTab orgId={me.orgId} filters={filters} range={range} />
      )}

      {audience === "board" && (
        <BoardTab orgId={me.orgId} filters={filters} range={range} />
      )}

      {audience === "executive" && (
        <ExecutiveTab orgId={me.orgId} filters={filters} range={range} />
      )}

      {audience === "risk" && (
        <RiskTab orgId={me.orgId} filters={filters} range={range} />
      )}

      {audience === "vendors" && (
        <VendorsTab orgId={me.orgId} filters={filters} range={range} />
      )}
    </div>
  );
}
