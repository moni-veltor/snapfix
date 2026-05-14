"use client";

import { useMemo, useState } from "react";
import {
  Building,
  CheckCircle2,
  Boxes,
  Database,
  Server,
  Users,
  Wifi,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { addLibraryIBSAction } from "@/app/actions/ibs";
import {
  IBS_CATEGORIES,
  type IBSCategory,
  type LibraryIBS,
} from "@/lib/ibs-library";

const TIER_LABEL: Record<string, string> = {
  TIER_1: "Tier 1",
  TIER_2: "Tier 2",
  TIER_3: "Tier 3",
};

const HARM_ICONS: { key: keyof LibraryIBS; label: string; icon: LucideIcon }[] = [
  { key: "coversPeople", label: "People", icon: Users },
  { key: "coversProperty", label: "Property", icon: Building },
  { key: "coversTechnology", label: "Tech", icon: Server },
  { key: "coversDataAvailability", label: "Avail.", icon: Wifi },
  { key: "coversDataIntegrity", label: "Integ.", icon: Database },
  { key: "coversThirdParty", label: "3rd", icon: Boxes },
];

const CATEGORY_TONE: Record<string, string> = {
  Payments: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  "Customer access": "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  "Cards & ATM": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  Lending: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  Onboarding: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  Trading: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  Insurance: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  Support: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  "Branch & cash": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  Treasury: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
};

type Props = {
  library: LibraryIBS[];
  existingNames: Set<string>;
  orgTier: "TIER_1" | "TIER_2" | "TIER_3" | null;
  canManage: boolean;
};

export default function IBSLibraryGrid({
  library,
  existingNames,
  orgTier,
  canManage,
}: Props) {
  const [tierFilter, setTierFilter] = useState<"all" | "TIER_1" | "TIER_2" | "TIER_3">(
    orgTier ?? "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<"all" | IBSCategory>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return library.filter((l) => {
      if (tierFilter !== "all" && !l.tiers.includes(tierFilter)) return false;
      if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
      const q = query.trim().toLowerCase();
      if (q) {
        const hay = `${l.name} ${l.outcome} ${l.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [library, tierFilter, categoryFilter, query]);

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
          placeholder="Search by name, outcome, category…"
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
      </div>

      <div role="tablist" className="flex flex-wrap gap-1.5">
        <button
          type="button"
          role="tab"
          aria-selected={categoryFilter === "all"}
          onClick={() => setCategoryFilter("all")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            categoryFilter === "all"
              ? "bg-slate-900 text-white dark:bg-indigo-500"
              : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
          }`}
        >
          All
          <span
            className={`rounded-full px-1.5 py-0 text-[9px] font-semibold ${
              categoryFilter === "all" ? "bg-white/30 dark:bg-black/30" : "bg-surface-2 text-soft"
            }`}
          >
            {categoryCounts.all}
          </span>
        </button>
        {IBS_CATEGORIES.map((c) => {
          const active = categoryFilter === c;
          const count = categoryCounts[c] ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategoryFilter(c)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                active ? CATEGORY_TONE[c] : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {c}
              <span
                className={`rounded-full px-1.5 py-0 text-[9px] font-semibold ${
                  active ? "bg-white/30 dark:bg-black/30" : "bg-surface-2 text-soft"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-soft">
        {filtered.length} of {library.length} library IBSs shown
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-10 text-center text-sm text-muted">
          No matches. Loosen the filters or try a different search.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => (
            <li key={l.slug}>
              <LibraryCard
                ibs={l}
                already={existingNames.has(l.name)}
                canManage={canManage}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LibraryCard({
  ibs,
  already,
  canManage,
}: {
  ibs: LibraryIBS;
  already: boolean;
  canManage: boolean;
}) {
  const catTone = CATEGORY_TONE[ibs.category] ?? "bg-surface-2 text-muted";
  return (
    <article
      className={`group flex h-full flex-col rounded-xl border bg-surface-1 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${
        already ? "border-emerald-300 dark:border-emerald-700/60" : "border-line"
      }`}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold text-ink">{ibs.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${catTone}`}
              >
                {ibs.category}
              </span>
              {ibs.tiers.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted"
                >
                  {TIER_LABEL[t]}
                </span>
              ))}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                  ibs.criticality === "CRITICAL"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                    : ibs.criticality === "HIGH"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                      : ibs.criticality === "MEDIUM"
                        ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200"
                        : "bg-surface-2 text-muted"
                }`}
              >
                {ibs.criticality}
              </span>
            </div>
          </div>
        </header>

        <p className="line-clamp-2 text-xs text-muted">{ibs.outcome}</p>

        <div className="flex flex-wrap items-center gap-1 text-[10px] text-soft">
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
            Tolerance{" "}
            {ibs.toleranceMin < 60
              ? `${ibs.toleranceMin}m`
              : ibs.toleranceMin < 1440
                ? `${Math.round(ibs.toleranceMin / 60)}h`
                : `${Math.round(ibs.toleranceMin / 60 / 24)}d`}
          </span>
          {ibs.fcaToleranceMin && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
              FCA{" "}
              {ibs.fcaToleranceMin < 1440
                ? `${Math.round(ibs.fcaToleranceMin / 60)}h`
                : `${Math.round(ibs.fcaToleranceMin / 60 / 24)}d`}
            </span>
          )}
          {ibs.praToleranceMin && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
              PRA{" "}
              {ibs.praToleranceMin < 1440
                ? `${Math.round(ibs.praToleranceMin / 60)}h`
                : `${Math.round(ibs.praToleranceMin / 60 / 24)}d`}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {HARM_ICONS.map(({ key, label, icon: Icon }) => {
            const on = ibs[key] as boolean | undefined;
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

        {ibs.thirdParties && ibs.thirdParties.length > 0 && (
          <details className="text-[11px] text-soft">
            <summary className="cursor-pointer hover:text-ink">
              Sample dependencies
            </summary>
            <p className="mt-1 text-muted">
              {ibs.thirdParties.slice(0, 4).join(" · ")}
              {(ibs.technology?.length ?? 0) > 0 && (
                <>
                  {" · "}
                  {ibs.technology!.slice(0, 4).join(" · ")}
                </>
              )}
            </p>
          </details>
        )}

        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          {already ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 size={10} />
              Already in register
            </span>
          ) : (
            <span className="text-[10px] text-soft">
              Not in register yet
            </span>
          )}
          {canManage && !already && (
            <form action={addLibraryIBSAction}>
              <input type="hidden" name="slug" value={ibs.slug} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <Plus size={10} />
                Add to register
              </button>
            </form>
          )}
        </footer>
      </div>
    </article>
  );
}
