"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

export type FilterOption = {
  value: string;
  label: string;
  /** Optional Tailwind class string for the active pill background. */
  tone?: string;
  /** Count badge shown on the chip. */
  count?: number;
};

export type FilterGroup = {
  /** Query-param key (e.g. "status"). */
  key: string;
  label: string;
  options: FilterOption[];
  /** Default value if not in URL (typically "all"). */
  defaultValue: string;
};

/**
 * URL-driven search + filter-chip bar. Used by the paginated list pages
 * (/vendors/register, /vendors/notifications, /vendors/contracts) so
 * navigation, pagination and per-row deep-links all share the same
 * filter state without client-only state drift.
 *
 * Filter chips emit `router.replace` so the search params stay in the
 * URL but the back-button history isn't polluted. The search input is
 * debounced to 300ms so each keypress doesn't refetch.
 */
export default function ListUrlControls({
  searchPlaceholder = "Search…",
  searchKey = "q",
  filters = [],
}: {
  searchPlaceholder?: string;
  searchKey?: string;
  filters?: FilterGroup[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [query, setQuery] = useState(params.get(searchKey) ?? "");

  // Debounce search updates to the URL.
  useEffect(() => {
    const currentInUrl = params.get(searchKey) ?? "";
    if (query === currentInUrl) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (query.trim() === "") next.delete(searchKey);
      else next.set(searchKey, query.trim());
      next.delete("page");
      start(() => router.replace(`${pathname}?${next.toString()}`));
    }, 300);
    return () => clearTimeout(t);
  }, [query, params, pathname, router, searchKey]);

  function setFilter(key: string, value: string, defaultValue: string) {
    const next = new URLSearchParams(params);
    if (value === defaultValue) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Search
          size={13}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-soft"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-md border border-line bg-surface-1 py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        {pending && (
          <span
            aria-hidden
            className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 animate-pulse rounded-full bg-indigo-500"
          />
        )}
      </div>

      {filters.map((group) => {
        const current = params.get(group.key) ?? group.defaultValue;
        return (
          <div key={group.key} role="tablist" aria-label={group.label} className="flex flex-wrap gap-1">
            {group.options.map((o) => {
              const active = o.value === current;
              return (
                <button
                  key={o.value}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setFilter(group.key, o.value, group.defaultValue)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? o.tone ?? "bg-slate-900 text-white dark:bg-indigo-500"
                      : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  {o.label}
                  {typeof o.count === "number" && o.count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                        active ? "bg-white/30" : "bg-surface-2 text-soft"
                      }`}
                    >
                      {o.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
