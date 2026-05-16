"use client";

import { useMemo, useState } from "react";
import {
  Building,
  Check,
  Database,
  ExternalLink,
  Plus,
  Server,
  Users,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react";
import { addLibraryScenarioAction } from "@/app/actions/scenarios";
import { withToast } from "@/lib/toast-action";
import {
  SECTORS,
  SECTOR_GROUPS,
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
  /** Multi-select sector set. Empty = "all sectors". */
  const [selectedSectors, setSelectedSectors] = useState<Set<Sector>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [query, setQuery] = useState("");

  function toggleSector(s: Sector) {
    setSelectedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function applyGroup(sectors: Sector[]) {
    setSelectedSectors(new Set(sectors));
  }

  function clearSectors() {
    setSelectedSectors(new Set());
  }

  const filtered = useMemo(() => {
    return library.filter((l) => {
      if (selectedSectors.size > 0) {
        const hasMatch = l.sectors.some((s) => selectedSectors.has(s));
        if (!hasMatch) return false;
      }
      if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
      const q = query.trim().toLowerCase();
      if (q) {
        const hay = `${l.title} ${l.background} ${l.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [library, selectedSectors, categoryFilter, query]);

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

  /** Detect if the current selection exactly matches a known group. */
  const activeGroupId = useMemo(() => {
    if (selectedSectors.size === 0) return null;
    for (const g of SECTOR_GROUPS) {
      if (g.sectors.length !== selectedSectors.size) continue;
      if (g.sectors.every((s) => selectedSectors.has(s))) return g.id;
    }
    return null;
  }, [selectedSectors]);

  const hasActiveFilter =
    selectedSectors.size > 0 || categoryFilter !== "all" || query.trim().length > 0;

  return (
    <section className="space-y-5">
      {/* Sticky filter bar — stays visible while scrolling cards */}
      <div className="sticky top-0 z-10 -mx-2 space-y-3 bg-surface-0/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-surface-0/80">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, background, category…"
            className="min-w-[220px] flex-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                clearSectors();
                setCategoryFilter("all");
                setQuery("");
              }}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink"
            >
              <X size={11} />
              Clear all
            </button>
          )}
        </div>

        {/* Quick-pick group buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-soft">
            Quick picks
          </span>
          {SECTOR_GROUPS.map((g) => {
            const active = activeGroupId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => applyGroup(g.sectors)}
                className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all ${
                  active
                    ? "border-indigo-400 bg-accent-soft text-indigo-700 dark:border-indigo-700 dark:text-indigo-200"
                    : "border-line bg-surface-1 text-muted hover:border-line-strong hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Multi-select sector chip row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={clearSectors}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              selectedSectors.size === 0
                ? "bg-slate-900 text-white dark:bg-indigo-500"
                : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
            }`}
            aria-pressed={selectedSectors.size === 0}
          >
            All sectors
            <span
              className={`rounded-full px-1.5 py-0 text-[9px] font-semibold ${
                selectedSectors.size === 0
                  ? "bg-white/30 dark:bg-black/30"
                  : "bg-surface-2 text-soft"
              }`}
            >
              {sectorCounts.all}
            </span>
          </button>
          {SECTORS.map((s) => {
            const count = sectorCounts[s] ?? 0;
            if (count === 0) return null;
            const selected = selectedSectors.has(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleSector(s)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  selected
                    ? SECTOR_TONE[s]
                    : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {selected && <Check size={10} strokeWidth={3} />}
                {SECTOR_SHORT_LABEL[s]}
                <span
                  className={`rounded-full px-1.5 py-0 text-[9px] font-semibold ${
                    selected ? "bg-white/40 dark:bg-black/40" : "bg-surface-2 text-soft"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category row — keep below the sticky bar so it scrolls away */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-soft">
          Category
        </p>
        <div role="tablist" className="flex flex-wrap gap-1.5">
          <CategoryChip
            label="All"
            count={categoryCounts.all}
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
          />
          {categories.map((c) => {
            const count = categoryCounts[c] ?? 0;
            return (
              <CategoryChip
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
        {selectedSectors.size > 0 && (
          <>
            {" "}
            · filtered to{" "}
            {Array.from(selectedSectors)
              .map((s) => SECTOR_SHORT_LABEL[s])
              .join(", ")}
          </>
        )}
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

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
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
          ? "bg-slate-900 text-white dark:bg-indigo-500"
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
