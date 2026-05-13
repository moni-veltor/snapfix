import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cloneTemplateAction } from "@/app/actions/templates";
import type { FirmTier } from "@/generated/prisma/client";

export const metadata = { title: "Scenario Library — SnapFix" };

const TIER_LABEL: Record<FirmTier, string> = {
  TIER_1: "Tier 1 — Global Universal",
  TIER_2: "Tier 2 — Digital Challenger",
  TIER_3: "Tier 3 — New / Smaller",
};

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const me = await requireOrgUser();
  const sp = await searchParams;

  // Pull org tier for default filter; ?tier= overrides; "any" = show all.
  const org = await prisma.organization.findUnique({
    where: { id: me.orgId },
    select: { tier: true },
  });

  const filterParam = sp.tier as "TIER_1" | "TIER_2" | "TIER_3" | "any" | undefined;
  const activeFilter: FirmTier | "any" | "applicable" =
    filterParam === "any"
      ? "any"
      : filterParam === "TIER_1" || filterParam === "TIER_2" || filterParam === "TIER_3"
        ? filterParam
        : org?.tier
          ? "applicable" // default: tier-applicable to org tier (your tier + ANY)
          : "any";

  // Build where clause
  let where: { isTemplate: true; orgId: null; tier?: FirmTier | { in: FirmTier[] } | null } = {
    isTemplate: true,
    orgId: null,
  };
  if (activeFilter === "applicable" && org?.tier) {
    where = { ...where, tier: { in: [org.tier] } };
    // Also need to include tier-null (applies to all)
  }
  // For "applicable", we want (tier == org.tier OR tier == null). Prisma doesn't
  // easily express that in one where, so we do two queries and merge below.

  const [tiered, anyTier] = await Promise.all([
    activeFilter === "applicable" && org?.tier
      ? prisma.scenario.findMany({
          where: { isTemplate: true, orgId: null, tier: org.tier },
          orderBy: [{ category: "asc" }, { title: "asc" }],
          include: { _count: { select: { events: true, injects: true, ibsList: true } } },
        })
      : activeFilter === "any"
        ? Promise.resolve([])
        : activeFilter === "TIER_1" || activeFilter === "TIER_2" || activeFilter === "TIER_3"
          ? prisma.scenario.findMany({
              where: { isTemplate: true, orgId: null, tier: activeFilter },
              orderBy: [{ category: "asc" }, { title: "asc" }],
              include: { _count: { select: { events: true, injects: true, ibsList: true } } },
            })
          : Promise.resolve([]),
    activeFilter === "any" || activeFilter === "applicable"
      ? prisma.scenario.findMany({
          where: { isTemplate: true, orgId: null, tier: activeFilter === "applicable" ? null : undefined },
          orderBy: [{ category: "asc" }, { title: "asc" }],
          include: { _count: { select: { events: true, injects: true, ibsList: true } } },
        })
      : Promise.resolve([]),
  ]);

  const templates = activeFilter === "any" ? anyTier : [...tiered, ...anyTier];

  const myClones = await prisma.scenario.findMany({
    where: { orgId: me.orgId, templateOriginId: { not: null } },
    select: { id: true, title: true, templateOriginId: true },
  });
  const cloneByOriginId = new Map<string, { id: string; title: string }[]>();
  for (const c of myClones) {
    if (!c.templateOriginId) continue;
    const list = cloneByOriginId.get(c.templateOriginId) ?? [];
    list.push({ id: c.id, title: c.title });
    cloneByOriginId.set(c.templateOriginId, list);
  }

  const byCategory = new Map<string, typeof templates>();
  for (const t of templates) {
    const cat = t.category ?? "Other";
    const list = byCategory.get(cat) ?? [];
    list.push(t);
    byCategory.set(cat, list);
  }
  const sortedCategories = Array.from(byCategory.keys()).sort();
  const canClone = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Scenario Library</h1>
        <p className="mt-1 text-sm text-slate-600">
          {templates.length} scenario templates. CMORG DSL plus tier-specific scenarios for Tier 1
          (HSBC-scale), Tier 2 (Starling-scale), and Tier 3 (new banks / fintechs).
        </p>
        <FilterBar
          activeFilter={activeFilter}
          orgTier={org?.tier ?? null}
        />
      </header>

      <div className="space-y-8">
        {sortedCategories.map((cat) => (
          <section key={cat} className="space-y-3">
            <h2 className="text-lg font-semibold">{cat}</h2>
            <ul className="space-y-2">
              {(byCategory.get(cat) ?? []).map((t) => {
                const existing = cloneByOriginId.get(t.id);
                return (
                  <li
                    key={t.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-line bg-surface-1 p-4 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/templates/${t.id}`}
                          className="font-medium hover:underline"
                        >
                          {t.title}
                        </Link>
                        {t.tier && (
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">
                            {TIER_LABEL[t.tier]}
                          </span>
                        )}
                        {!t.tier && (
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                            All tiers
                          </span>
                        )}
                        {t.srrRef && (
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-xs">
                            SRR {t.srrRef}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-slate-600">{t.background}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                        <span className="rounded-full bg-surface-2 px-2 py-0.5">{t._count.ibsList} IBS</span>
                        <span className="rounded-full bg-surface-2 px-2 py-0.5">{t._count.events} events</span>
                        <span className="rounded-full bg-surface-2 px-2 py-0.5">{t._count.injects} injects</span>
                        <RiskCoverageBadges scenario={t} />
                      </div>
                      {existing && existing.length > 0 && (
                        <p className="mt-2 text-xs text-emerald-700">
                          Already cloned:{" "}
                          {existing.map((c, i) => (
                            <span key={c.id}>
                              {i > 0 && ", "}
                              <Link href={`/scenarios/${c.id}`} className="underline">
                                {c.title}
                              </Link>
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                    {canClone && (
                      <form action={cloneTemplateAction}>
                        <input type="hidden" name="templateId" value={t.id} />
                        <button className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-700">
                          Clone into my org
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function FilterBar({
  activeFilter,
  orgTier,
}: {
  activeFilter: FirmTier | "any" | "applicable";
  orgTier: FirmTier | null;
}) {
  const links: { label: string; href: string; active: boolean }[] = [];
  if (orgTier) {
    links.push({
      label: `Recommended for your tier (${TIER_LABEL[orgTier].split("—")[0].trim()} + All-tier)`,
      href: "/templates",
      active: activeFilter === "applicable",
    });
  }
  links.push({ label: "All", href: "/templates?tier=any", active: activeFilter === "any" });
  for (const t of ["TIER_1", "TIER_2", "TIER_3"] as FirmTier[]) {
    links.push({
      label: TIER_LABEL[t].split("—")[0].trim(),
      href: `/templates?tier=${t}`,
      active: activeFilter === t,
    });
  }
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {links.map((l) => (
        <Link
          key={l.href + l.label}
          href={l.href}
          className={`rounded-full px-3 py-1 text-xs ${
            l.active
              ? "bg-slate-900 text-white"
              : "border border-line-strong text-slate-700 hover:bg-surface-1"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

function RiskCoverageBadges({
  scenario,
}: {
  scenario: {
    coversPeople: boolean;
    coversProperty: boolean;
    coversTechnology: boolean;
    coversDataAvailability: boolean;
    coversDataIntegrity: boolean;
    coversThirdParty: boolean;
  };
}) {
  const items: { label: string; on: boolean }[] = [
    { label: "People", on: scenario.coversPeople },
    { label: "Property", on: scenario.coversProperty },
    { label: "Tech", on: scenario.coversTechnology },
    { label: "Data Avail.", on: scenario.coversDataAvailability },
    { label: "Data Integ.", on: scenario.coversDataIntegrity },
    { label: "3rd Party", on: scenario.coversThirdParty },
  ];
  return (
    <>
      {items
        .filter((i) => i.on)
        .map((i) => (
          <span
            key={i.label}
            className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-white"
          >
            {i.label}
          </span>
        ))}
    </>
  );
}
