"use client";

import {
  Building,
  CheckCircle2,
  Database,
  ExternalLink,
  Plus,
  Server,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { addLibraryScenarioAction } from "@/app/actions/scenarios";
import { withToast } from "@/lib/toast-action";
import {
  SECTOR_GROUPS,
  SECTOR_LABEL,
  SECTOR_SHORT_LABEL,
  SECTOR_TONE,
  SECTORS,
} from "@/lib/library/sectors";
import type { LibraryScenario } from "@/lib/library/scenarios/types";
import type { LibraryBrowserConfig, LibraryCardContext } from "../types";

const HARM_ICONS: { key: keyof LibraryScenario; label: string; icon: LucideIcon }[] = [
  { key: "coversPeople", label: "People", icon: Users },
  { key: "coversProperty", label: "Property", icon: Building },
  { key: "coversTechnology", label: "Tech", icon: Server },
  { key: "coversDataAvailability", label: "Avail.", icon: Wifi },
  { key: "coversDataIntegrity", label: "Integ.", icon: Database },
  { key: "coversThirdParty", label: "3rd", icon: ExternalLink },
];

const TIER_LABEL: Record<string, string> = {
  TIER_1: "Tier 1",
  TIER_2: "Tier 2",
  TIER_3: "Tier 3",
};

export const SCENARIO_LIBRARY_CONFIG: LibraryBrowserConfig<LibraryScenario> = {
  itemKey: (s) => s.slug,
  existingKey: (s) => s.title,
  title: "Scenario library",
  subtitle:
    "Sector-tagged scenarios calibrated to UK regulatory expectations. Clone one to your scenarios and author the MSEL events.",
  filters: [
    {
      kind: "search",
      key: "search",
      placeholder: "Search by title, background, category…",
      getHaystack: (s) => `${s.title} ${s.background} ${s.category}`,
    },
    {
      kind: "multi-chip",
      key: "sectors",
      label: "Sector",
      options: SECTORS.map((s) => ({
        value: s,
        label: SECTOR_SHORT_LABEL[s],
        tone: SECTOR_TONE[s],
      })),
      getValues: (s) => s.sectors,
      groups: SECTOR_GROUPS.map((g) => ({
        id: g.id,
        label: g.label,
        values: g.sectors,
      })),
    },
    {
      kind: "single-chip",
      key: "category",
      label: "Category",
      getValue: (s) => s.category,
    },
  ],
  card: (scenario, ctx) => <ScenarioCard scenario={scenario} ctx={ctx} />,
};

function ScenarioCard({
  scenario,
  ctx,
}: {
  scenario: LibraryScenario;
  ctx: LibraryCardContext;
}) {
  const primarySector = scenario.sectors[0];
  return (
    <article className="group flex h-full flex-col rounded-xl border border-line bg-surface-1 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)]">
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink">{scenario.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {primarySector && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${SECTOR_TONE[primarySector]}`}
              >
                {SECTOR_SHORT_LABEL[primarySector]}
              </span>
            )}
            {scenario.sectors.length > 1 && (
              <span
                className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted"
                title={scenario.sectors
                  .slice(1)
                  .map((s) => SECTOR_LABEL[s])
                  .join(", ")}
              >
                +{scenario.sectors.length - 1}
              </span>
            )}
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted">
              {scenario.category}
            </span>
            {scenario.tier && (
              <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted">
                {TIER_LABEL[scenario.tier]}
              </span>
            )}
          </div>
        </header>

        <p className="line-clamp-4 text-xs text-muted">{scenario.background}</p>

        <div className="flex flex-wrap items-center gap-1">
          {HARM_ICONS.map(({ key, label, icon: Icon }) => {
            const on = scenario[key] as boolean | undefined;
            return (
              <span
                key={label}
                title={`${label}${on ? "" : " — not covered"}`}
                className={`flex h-5 w-5 items-center justify-center rounded-md transition-colors ${
                  on
                    ? "bg-accent-soft text-indigo-700 dark:text-indigo-200"
                    : "bg-surface-2 text-soft"
                }`}
              >
                <Icon size={10} />
              </span>
            );
          })}
        </div>

        {scenario.caseStudy && (
          <p className="text-[10px] text-soft">
            <span className="font-medium text-muted">Real-world:</span>{" "}
            {scenario.caseStudy.title}
          </p>
        )}

        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          <span className="text-[10px] text-soft">
            {scenario.durationMin ?? 120}m exercise · {scenario.seedEvents?.length ?? 0} seed events
          </span>
          {ctx.already ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
              <CheckCircle2 size={10} />
              Added
            </span>
          ) : ctx.canAdd ? (
            <form
              action={withToast(addLibraryScenarioAction, {
                success: `Cloned "${scenario.title}"`,
                description: "Opened in your scenarios — author the MSEL events",
                error: "Couldn't clone this scenario",
              })}
            >
              <input type="hidden" name="slug" value={scenario.slug} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <Plus size={10} />
                Clone
              </button>
            </form>
          ) : null}
        </footer>
      </div>
    </article>
  );
}
