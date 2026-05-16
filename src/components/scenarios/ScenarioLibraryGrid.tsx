"use client";

import { useMemo, useState } from "react";
import {
  Building,
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
  SECTORS,
  SECTOR_LABEL,
  SECTOR_SHORT_LABEL,
  SECTOR_TONE,
  type Sector,
} from "@/lib/library/sectors";
import type { LibraryScenario } from "@/lib/library/scenarios/types";

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

type Props = {
  library: LibraryScenario[];
  canManage: boolean;
};

export default function ScenarioLibraryGrid({ library, canManage }: Props) {
  const [sectorFilter, setSectorFilter] = useState<"all" | Sector>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return library.filter((l) => {
      if (sectorFilter !== "all" && !l.sectors.includes(sectorFilter)) return false;
      if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
      const q = query.trim().toLowerCase();
      if (q) {
        const hay = `${l.title} ${l.background} ${l.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [library, sectorFilter, categoryFilter, query]);

  const sectorCounts = useMemo(() => {
    const out: Record<string, number> = { all: library.length };
    for (const l of library) {
      for (const s of l.sectors) out[s] = (out[s] ?? 0) + 1;
    }
    return out;
  }, [library]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const l of library) set.add(l.category);
    return Array.from(set).sort();
  }, [library]);

  const categoryCounts = useMemo(() => {
    const out: Record<string, number> = { all: library.length };
    for (const l of library) out[l.category] = (out[l.category] ?? 0) + 1;
    return out;
  }, [library]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, background, category…"
          className="min-w-[220px] flex-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-soft">
          Sector
        </p>
        <div role="tablist" className="flex flex-wrap gap-1.5">
          <SectorChip
            label="All sectors"
            count={sectorCounts.all}
            active={sectorFilter === "all"}
            onClick={() => setSectorFilter("all")}
          />
          {SECTORS.map((s) => {
            const count = sectorCounts[s] ?? 0;
            if (count === 0) return null;
            return (
              <SectorChip
                key={s}
                label={SECTOR_SHORT_LABEL[s]}
                count={count}
                active={sectorFilter === s}
                tone={SECTOR_TONE[s]}
                onClick={() => setSectorFilter(s)}
              />
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-soft">
          Category
        </p>
        <div role="tablist" className="flex flex-wrap gap-1.5">
          <SectorChip
            label="All"
            count={categoryCounts.all}
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
          />
          {categories.map((c) => {
            const count = categoryCounts[c] ?? 0;
            return (
              <SectorChip
                key={c}
                label={c}
                count={count}
                active={categoryFilter === c}
                onClick={() => setCategoryFilter(c)}
              />
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-soft">
        {filtered.length} of {library.length} library scenarios shown
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-10 text-center text-sm text-muted">
          No matches. Loosen the filters or try a different search.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => (
            <li key={l.slug}>
              <LibraryCard scenario={l} canManage={canManage} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SectorChip({
  label,
  count,
  active,
  tone,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? tone ?? "bg-slate-900 text-white dark:bg-indigo-500"
          : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0 text-[9px] font-semibold ${
          active ? "bg-white/30 dark:bg-black/30" : "bg-surface-2 text-soft"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function LibraryCard({
  scenario,
  canManage,
}: {
  scenario: LibraryScenario;
  canManage: boolean;
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
          {canManage && (
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
                Clone to register
              </button>
            </form>
          )}
        </footer>
      </div>
    </article>
  );
}
