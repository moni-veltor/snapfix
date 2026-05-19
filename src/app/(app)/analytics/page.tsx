import { BarChart3 } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import AudienceTabs, { type Audience } from "@/components/analytics/AudienceTabs";
import FilterBar from "@/components/analytics/FilterBar";
import ProgrammeTab from "@/components/analytics/ProgrammeTab";
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
        pitch="Operational-resilience evidence sliced for the audience that's asking. Filter by time, jurisdiction, classification or IBS — every tile updates."
      />

      <AudienceTabs current={audience} carryParams={carryParams} />

      <FilterBar ibsOptions={ibsOptions} />

      {audience === "programme" && (
        <ProgrammeTab orgId={me.orgId} filters={filters} range={range} />
      )}

      {audience === "board" && (
        <Placeholder
          title="Board view"
          message="Strategic KPIs + 1-page export ship in Commit B. Health composite, programme spend, coverage %, regulator-readiness, top 3 risks."
        />
      )}

      {audience === "executive" && (
        <Placeholder
          title="Executive view (ERCC / BRCC + Comms)"
          message="Performance trend, regulator-clock performance, BCP activations, comms cascade compliance, monthly digest subscription. Ships in Commit C."
        />
      )}

      {audience === "risk" && (
        <Placeholder
          title="Risk view (1LoD / 2LoD / 3LoD)"
          message="Top failed controls, RTO/RPO tolerance-breach register, decision-with-rationale rate, cyber DD overdue. Ships in Commit C."
        />
      )}

      {audience === "vendors" && (
        <Placeholder
          title="Vendors view"
          message="Hyperscaler concentration heatmap, MTP readiness, exit-plan freshness, annual concentration brief export. Ships in Commit D."
        />
      )}
    </div>
  );
}

function Placeholder({ title, message }: { title: string; message: string }) {
  return (
    <section className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
        {title}
      </p>
      <p className="mt-2 text-sm text-muted">{message}</p>
    </section>
  );
}
