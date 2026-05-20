"use client";

import { useMemo, useState } from "react";
import { Check, Filter, Search, X } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import type {
  LibraryBrowserConfig,
  LibraryFilter,
  MultiChipFilter,
  SearchFilter,
  SingleChipFilter,
  ToggleFilter,
} from "./types";

type Props<T> = {
  open: boolean;
  onClose: () => void;
  config: LibraryBrowserConfig<T>;
  items: ReadonlyArray<T>;
  existingKeys: ReadonlySet<string>;
  canAdd: boolean;
};

/**
 * Unified drawer-based library browser. Renders a left-rail filter panel
 * + right card grid. Filter state lives entirely client-side; the server
 * action wiring lives inside each domain config's `card()` renderer.
 */
export default function LibraryBrowser<T>({
  open,
  onClose,
  config,
  items,
  existingKeys,
  canAdd,
}: Props<T>) {
  const [filterState, setFilterState] = useState<Record<string, unknown>>(() =>
    initialFilterState(config.filters),
  );

  // Apply every filter sequentially.
  const filtered = useMemo(() => {
    const arr = items.filter((item) => {
      for (const filter of config.filters) {
        if (!filterMatches(filter, item, filterState)) return false;
      }
      return true;
    });
    return arr;
  }, [items, filterState, config.filters]);

  const total = items.length;
  const showing = filtered.length;

  const hasActiveFilter = useMemo(
    () => config.filters.some((f) => isFilterActive(f, filterState)),
    [config.filters, filterState],
  );

  function updateFilter(key: string, value: unknown) {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  }

  function clearAll() {
    setFilterState(initialFilterState(config.filters));
  }

  // Find the search filter so we can render it inline at the top of the
  // content pane (it's the most-used filter; the rest go in the left rail).
  const searchFilter = config.filters.find((f): f is SearchFilter<T> => f.kind === "search");
  const railFilters = config.filters.filter((f) => f.kind !== "search");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="2xl"
      title={config.title}
      subtitle={config.subtitle ?? `${total} item${total === 1 ? "" : "s"} in the library`}
      footer={
        <p className="text-[11px] text-soft">
          Showing <span className="font-mono font-semibold text-ink">{showing}</span> of {total}
          {hasActiveFilter ? " · filters active" : ""}
        </p>
      }
      headerExtras={
        hasActiveFilter ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-md border border-line-strong bg-surface-0 px-2.5 py-1 text-[11px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X size={11} />
            Clear filters
          </button>
        ) : null
      }
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-[260px_1fr]">
        <FilterRail
          filters={railFilters}
          items={items}
          filterState={filterState}
          onChange={updateFilter}
        />
        <main className="flex min-w-0 flex-col">
          {searchFilter && (
            <div className="sticky top-0 z-10 border-b border-line bg-surface-elev/95 p-4 backdrop-blur">
              <SearchInput
                filter={searchFilter}
                value={(filterState[searchFilter.key] as string) ?? ""}
                onChange={(v) => updateFilter(searchFilter.key, v)}
              />
            </div>
          )}
          <div className="min-h-0 flex-1 p-4">
            {filtered.length === 0 ? (
              <EmptyState onClear={clearAll} hasActiveFilter={hasActiveFilter} />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => {
                  const key = config.itemKey(item);
                  const existingKey = (config.existingKey ?? config.itemKey)(item);
                  const already = existingKeys.has(existingKey);
                  return (
                    <li key={key} className="contents">
                      {config.card(item, { already, canAdd })}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>
      </div>
    </Drawer>
  );
}

// ─── Filter rail (chips + toggles + dropdowns) ──────────────────────────

function FilterRail<T>({
  filters,
  items,
  filterState,
  onChange,
}: {
  filters: ReadonlyArray<Exclude<LibraryFilter<T>, SearchFilter<T>>>;
  items: ReadonlyArray<T>;
  filterState: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  if (filters.length === 0) return null;
  return (
    <aside className="border-b border-line bg-surface-1 p-4 lg:max-h-full lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-2 pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
        <Filter size={12} />
        Filters
      </div>
      <div className="space-y-5">
        {filters.map((f) => {
          switch (f.kind) {
            case "multi-chip":
              return (
                <MultiChipBlock
                  key={f.key}
                  filter={f}
                  items={items}
                  value={(filterState[f.key] as Set<string>) ?? new Set<string>()}
                  onChange={(v) => onChange(f.key, v)}
                />
              );
            case "single-chip":
              return (
                <SingleChipBlock
                  key={f.key}
                  filter={f}
                  items={items}
                  value={(filterState[f.key] as string) ?? "all"}
                  onChange={(v) => onChange(f.key, v)}
                />
              );
            case "toggle":
              return (
                <ToggleBlock
                  key={f.key}
                  filter={f}
                  items={items}
                  value={(filterState[f.key] as boolean) ?? false}
                  onChange={(v) => onChange(f.key, v)}
                />
              );
            // search renders in the content pane, not the rail
            default:
              return null;
          }
        })}
      </div>
    </aside>
  );
}

function SearchInput<T>({
  filter,
  value,
  onChange,
}: {
  filter: SearchFilter<T>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="relative block">
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-soft"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={filter.placeholder ?? "Search…"}
        className="w-full rounded-md border border-line bg-surface-0 px-9 py-2 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-soft hover:bg-surface-2 hover:text-ink"
        >
          <X size={12} />
        </button>
      )}
    </label>
  );
}

function MultiChipBlock<T>({
  filter,
  items,
  value,
  onChange,
}: {
  filter: MultiChipFilter<T>;
  items: ReadonlyArray<T>;
  value: Set<string>;
  onChange: (v: Set<string>) => void;
}) {
  const counts = useMemo(() => {
    const out: Record<string, number> = { __total: items.length };
    for (const item of items) {
      for (const v of filter.getValues(item)) out[v] = (out[v] ?? 0) + 1;
    }
    return out;
  }, [items, filter]);

  function toggle(v: string) {
    const next = new Set(value);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(next);
  }

  const activeGroupId = useMemo(() => {
    if (value.size === 0 || !filter.groups) return null;
    for (const g of filter.groups) {
      if (g.values.length !== value.size) continue;
      if (g.values.every((v) => value.has(v))) return g.id;
    }
    return null;
  }, [filter.groups, value]);

  return (
    <section>
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-soft">
        {filter.label}
      </h3>
      {filter.groups && filter.groups.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {filter.groups.map((g) => {
            const active = activeGroupId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onChange(new Set(g.values))}
                className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all ${
                  active
                    ? "border-indigo-400 bg-accent-soft text-indigo-700 dark:border-indigo-700 dark:text-indigo-200"
                    : "border-line bg-surface-0 text-muted hover:border-line-strong hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Chip
          label={filter.allLabel ?? "All"}
          active={value.size === 0}
          count={counts.__total}
          onClick={() => onChange(new Set())}
        />
        {filter.options.map((o) => {
          const count = counts[o.value] ?? 0;
          if (count === 0) return null;
          const selected = value.has(o.value);
          return (
            <Chip
              key={o.value}
              label={o.label}
              count={count}
              active={selected}
              tone={o.tone}
              showCheck
              onClick={() => toggle(o.value)}
            />
          );
        })}
      </div>
    </section>
  );
}

function SingleChipBlock<T>({
  filter,
  items,
  value,
  onChange,
}: {
  filter: SingleChipFilter<T>;
  items: ReadonlyArray<T>;
  value: string;
  onChange: (v: string) => void;
}) {
  const counts = useMemo(() => {
    const out: Record<string, number> = { __total: items.length };
    for (const item of items) {
      const v = filter.getValue(item);
      if (v) out[v] = (out[v] ?? 0) + 1;
    }
    return out;
  }, [items, filter]);

  const options = useMemo<
    ReadonlyArray<{ value: string; label: string; tone?: string }>
  >(() => {
    if (filter.options) return filter.options;
    // Derive from items in alpha order.
    const set = new Set<string>();
    for (const item of items) {
      const v = filter.getValue(item);
      if (v) set.add(v);
    }
    return Array.from(set)
      .sort()
      .map((v) => ({ value: v, label: v }));
  }, [items, filter]);

  return (
    <section>
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-soft">
        {filter.label}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        <Chip
          label={filter.allLabel ?? "All"}
          active={value === "all"}
          count={counts.__total}
          onClick={() => onChange("all")}
        />
        {options.map((o) => {
          const count = counts[o.value] ?? 0;
          if (count === 0) return null;
          const active = value === o.value;
          return (
            <Chip
              key={o.value}
              label={o.label}
              count={count}
              active={active}
              tone={o.tone}
              onClick={() => onChange(o.value)}
            />
          );
        })}
      </div>
    </section>
  );
}

function ToggleBlock<T>({
  filter,
  items,
  value,
  onChange,
}: {
  filter: ToggleFilter<T>;
  items: ReadonlyArray<T>;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const matchedCount = useMemo(
    () => items.filter((i) => filter.predicate(i)).length,
    [items, filter],
  );
  return (
    <section>
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-line-strong text-indigo-600 focus:ring-indigo-500"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">{filter.label}</span>
          {filter.helpText && (
            <span className="block text-[11px] text-soft">{filter.helpText}</span>
          )}
          <span className="mt-0.5 block text-[10px] font-mono text-muted">
            {matchedCount} match{matchedCount === 1 ? "" : "es"}
          </span>
        </span>
      </label>
    </section>
  );
}

function Chip({
  label,
  count,
  active,
  tone,
  showCheck = false,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone?: string;
  showCheck?: boolean;
  onClick: () => void;
}) {
  const activeClass = tone ?? "bg-slate-900 text-white dark:bg-indigo-500";
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
        active
          ? activeClass
          : "bg-surface-0 text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {active && showCheck && <Check size={9} strokeWidth={3} />}
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

function EmptyState({
  onClear,
  hasActiveFilter,
}: {
  onClear: () => void;
  hasActiveFilter: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-10 text-center">
      <p className="text-sm text-muted">No matches in the library for these filters.</p>
      {hasActiveFilter && (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 inline-flex items-center gap-1 rounded-md border border-line-strong bg-surface-0 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
        >
          <X size={12} />
          Clear filters
        </button>
      )}
    </div>
  );
}

// ─── State helpers ──────────────────────────────────────────────────────

function initialFilterState<T>(
  filters: ReadonlyArray<LibraryFilter<T>>,
): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  for (const f of filters) {
    switch (f.kind) {
      case "search":
        state[f.key] = "";
        break;
      case "multi-chip":
        state[f.key] = new Set<string>();
        break;
      case "single-chip":
        state[f.key] = "all";
        break;
      case "toggle":
        state[f.key] = false;
        break;
    }
  }
  return state;
}

function filterMatches<T>(
  filter: LibraryFilter<T>,
  item: T,
  state: Record<string, unknown>,
): boolean {
  switch (filter.kind) {
    case "search": {
      const q = ((state[filter.key] as string) ?? "").trim().toLowerCase();
      if (q === "") return true;
      return filter.getHaystack(item).toLowerCase().includes(q);
    }
    case "multi-chip": {
      const selected = (state[filter.key] as Set<string>) ?? new Set<string>();
      if (selected.size === 0) return true;
      return filter.getValues(item).some((v) => selected.has(v));
    }
    case "single-chip": {
      const v = (state[filter.key] as string) ?? "all";
      if (v === "all") return true;
      return filter.getValue(item) === v;
    }
    case "toggle": {
      const on = (state[filter.key] as boolean) ?? false;
      if (!on) return true;
      return filter.predicate(item);
    }
  }
}

function isFilterActive<T>(
  filter: LibraryFilter<T>,
  state: Record<string, unknown>,
): boolean {
  switch (filter.kind) {
    case "search":
      return ((state[filter.key] as string) ?? "").trim().length > 0;
    case "multi-chip":
      return ((state[filter.key] as Set<string>) ?? new Set()).size > 0;
    case "single-chip":
      return ((state[filter.key] as string) ?? "all") !== "all";
    case "toggle":
      return Boolean(state[filter.key]);
  }
}
