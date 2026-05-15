"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Cloud,
  Plus,
  Shield,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { addLibraryVendorAction } from "@/app/actions/vendors";
import { withToast } from "@/lib/toast-action";
import {
  VENDOR_CATEGORIES,
  type LibraryVendor,
  type VendorCategory,
} from "@/lib/vendor-library";

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
  const [doraOnly, setDoraOnly] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return library.filter((v) => {
      if (tierFilter !== "all" && v.suggestedTier !== tierFilter) return false;
      if (categoryFilter !== "all" && v.category !== categoryFilter) return false;
      if (doraOnly && !v.isDoraCritical) return false;
      const q = query.trim().toLowerCase();
      if (q) {
        const hay = `${v.name} ${v.serviceKind} ${v.description} ${v.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [library, tierFilter, categoryFilter, doraOnly, query]);

  const categoryCounts = useMemo(() => {
    const out: Record<string, number> = { all: library.length };
    for (const v of library) out[v.category] = (out[v.category] ?? 0) + 1;
    return out;
  }, [library]);

  return (
    <section className="space-y-5">
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
