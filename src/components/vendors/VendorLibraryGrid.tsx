"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Cloud,
  Plus,
  Shield,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { addLibraryVendorAction } from "@/app/actions/vendors";
import { withToast } from "@/lib/toast-action";
import {
  VENDOR_CATEGORIES,
  type LibraryVendor,
  type VendorCategory,
} from "@/lib/vendor-library";
import {
  SECTORS,
  SECTOR_GROUPS,
  SECTOR_SHORT_LABEL,
  SECTOR_TONE,
  type Sector,
} from "@/lib/library/sectors";

const TIER_LABEL: Record<string, string> = {
  TIER_1: "Tier 1",
  TIER_2: "Tier 2",
  TIER_3: "Tier 3",
};

const CATEGORY_TONE: Record<VendorCategory, string> = {
  "Core banking": "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  Payments: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  "Card issuing": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  "Open banking": "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  "KYC / Identity": "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  "AML / Sanctions": "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-200",
  Fraud: "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200",
  Reconciliations: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  "Documents & e-sign": "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200",
  "Cloud & infra": "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  Communications: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
  "Customer & CRM": "bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-200",
  Treasury: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200",
  "Energy & utilities": "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
  "Telecoms infra": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  "Healthcare IT": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  "Retail & ecommerce": "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200",
  "Transport & travel": "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  "Logistics & shipping": "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  "Government IT": "bg-slate-200 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200",
  "Education tech": "bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-200",
  "Media & broadcast": "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200",
  "Manufacturing & industrial": "bg-stone-200 text-stone-800 dark:bg-stone-800/60 dark:text-stone-200",
  Cybersecurity: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200",
  "Productivity & HR": "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200",
};

const ASSURANCE_LABEL: Record<string, string> = {
  SOC2_TYPE_2: "SOC 2 · Type 2",
  SOC2_TYPE_1: "SOC 2 · Type 1",
  ISAE3402: "ISAE 3402",
  ISO27001: "ISO 27001",
};

type Props = {
  library: LibraryVendor[];
  existingNames: Set<string>;
  canManage: boolean;
};

export default function VendorLibraryGrid({
  library,
  existingNames,
  canManage,
}: Props) {
  const [tierFilter, setTierFilter] = useState<"all" | "TIER_1" | "TIER_2" | "TIER_3">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | VendorCategory>("all");
  /** Multi-select sector set. Empty = "all sectors". */
  const [selectedSectors, setSelectedSectors] = useState<Set<Sector>>(new Set());
  const [doraOnly, setDoraOnly] = useState(false);
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
    return library.filter((v) => {
      if (tierFilter !== "all" && v.suggestedTier !== tierFilter) return false;
      if (categoryFilter !== "all" && v.category !== categoryFilter) return false;
      if (selectedSectors.size > 0) {
        const hasMatch = (v.sectors ?? []).some((s) => selectedSectors.has(s));
        if (!hasMatch) return false;
      }
      if (doraOnly && !v.isDoraCritical) return false;
      const q = query.trim().toLowerCase();
      if (q) {
        const hay = `${v.name} ${v.serviceKind} ${v.description} ${v.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [library, tierFilter, categoryFilter, selectedSectors, doraOnly, query]);

  const categoryCounts = useMemo(() => {
    const out: Record<string, number> = { all: library.length };
    for (const v of library) out[v.category] = (out[v.category] ?? 0) + 1;
    return out;
  }, [library]);

  const sectorCounts = useMemo(() => {
    const out: Record<string, number> = { all: library.length };
    for (const v of library) {
      for (const s of v.sectors ?? []) out[s] = (out[s] ?? 0) + 1;
    }
    return out;
  }, [library]);

  const activeGroupId = useMemo(() => {
    if (selectedSectors.size === 0) return null;
    for (const g of SECTOR_GROUPS) {
      if (g.sectors.length !== selectedSectors.size) continue;
      if (g.sectors.every((s) => selectedSectors.has(s))) return g.id;
    }
    return null;
  }, [selectedSectors]);

  const hasActiveFilter =
    selectedSectors.size > 0 ||
    categoryFilter !== "all" ||
    tierFilter !== "all" ||
    doraOnly ||
    query.trim().length > 0;

  return (
    <section className="space-y-5">
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 -mx-2 space-y-3 bg-surface-0/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-surface-0/80">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by vendor, service, category…"
            className="min-w-[220px] flex-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <div role="tablist" className="flex flex-wrap gap-1">
            {(["all", "TIER_1", "TIER_2", "TIER_3"] as const).map((t) => {
              const active = tierFilter === t;
              return (
                <button
                  key={t}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setTierFilter(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-slate-900 text-white dark:bg-indigo-500"
                      : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  {t === "all" ? "All tiers" : TIER_LABEL[t]}
                </button>
              );
            })}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface-1 px-3 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink">
            <input
              type="checkbox"
              checked={doraOnly}
              onChange={(e) => setDoraOnly(e.target.checked)}
              className="h-3 w-3 rounded border-line"
            />
            <Shield size={11} />
            DORA-critical only
          </label>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                clearSectors();
                setCategoryFilter("all");
                setTierFilter("all");
                setDoraOnly(false);
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
            aria-pressed={selectedSectors.size === 0}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
              selectedSectors.size === 0
                ? "bg-slate-900 text-white dark:bg-indigo-500"
                : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
            }`}
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
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
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

      <div role="tablist" className="flex flex-wrap gap-1.5">
        <CategoryChip
          label="All"
          count={categoryCounts.all}
          active={categoryFilter === "all"}
          onClick={() => setCategoryFilter("all")}
        />
        {VENDOR_CATEGORIES.map((c) => {
          const count = categoryCounts[c] ?? 0;
          if (count === 0) return null;
          return (
            <CategoryChip
              key={c}
              label={c}
              count={count}
              active={categoryFilter === c}
              tone={CATEGORY_TONE[c]}
              onClick={() => setCategoryFilter(c)}
            />
          );
        })}
      </div>

      <p className="text-[11px] text-soft">
        {filtered.length} of {library.length} library vendors shown
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
          {filtered.map((v) => (
            <li key={v.slug}>
              <LibraryCard
                vendor={v}
                already={existingNames.has(v.name)}
                canManage={canManage}
              />
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
  vendor,
  already,
  canManage,
}: {
  vendor: LibraryVendor;
  already: boolean;
  canManage: boolean;
}) {
  const catTone = CATEGORY_TONE[vendor.category] ?? "bg-surface-2 text-muted";
  const TierIcon: LucideIcon = ShieldCheck;
  return (
    <article
      className={`group flex h-full flex-col rounded-xl border bg-surface-1 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${
        already ? "border-emerald-300 dark:border-emerald-700/60" : "border-line"
      }`}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-sm font-semibold text-ink">{vendor.name}</h3>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-soft">{vendor.serviceKind}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${catTone}`}
              >
                {vendor.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted">
                <TierIcon size={9} />
                {TIER_LABEL[vendor.suggestedTier]}
              </span>
              {vendor.isDoraCritical && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                  <Shield size={9} />
                  DORA
                </span>
              )}
            </div>
          </div>
        </header>

        <p className="line-clamp-3 text-xs text-muted">{vendor.description}</p>

        <div className="flex flex-wrap items-center gap-1 text-[10px] text-soft">
          {vendor.hyperscaler && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5">
              <Cloud size={9} />
              {vendor.hyperscaler}
            </span>
          )}
          {vendor.region && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">{vendor.region}</span>
          )}
          {vendor.assuranceKind && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
              {ASSURANCE_LABEL[vendor.assuranceKind] ?? vendor.assuranceKind}
            </span>
          )}
        </div>

        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          {already ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 size={10} />
              In your register
            </span>
          ) : (
            <span className="text-[10px] text-soft">Not added yet</span>
          )}
          {canManage && !already && (
            <form
              action={withToast(addLibraryVendorAction, {
                success: `Added ${vendor.name}`,
                description: "Opened in your vendor register",
                error: "Couldn't add this vendor",
              })}
            >
              <input type="hidden" name="slug" value={vendor.slug} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <Plus size={10} />
                Add vendor
              </button>
            </form>
          )}
        </footer>
      </div>
    </article>
  );
}
