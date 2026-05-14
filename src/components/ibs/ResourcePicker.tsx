"use client";

import { useMemo, useState } from "react";
import { Plus, X, type LucideIcon } from "lucide-react";

type Suggestion = { value: string; source: "system" | "vendor" | "library" };

type Props = {
  name: string;
  label: string;
  icon?: LucideIcon;
  hint?: string;
  placeholder?: string;
  initial?: string[];
  suggestions?: Suggestion[];
  /** When true, multi-line free text is wrapped per-line. Default false. */
  multilineFallback?: boolean;
};

/**
 * Chip-based picker for IBS resource-map fields. Used to replace the
 * "type one per line" textareas in the IBS form with a click-to-pick UI
 * driven by the org's existing tech-systems and vendors registers.
 *
 * Renders:
 *  - a hidden textarea with newline-joined values (so the existing server
 *    action that parses `name.split("\n")` keeps working)
 *  - a chip strip for selected items
 *  - a search input + suggestions panel + custom-add button
 */
export default function ResourcePicker({
  name,
  label,
  icon: Icon,
  hint,
  placeholder = "Search or type to add…",
  initial = [],
  suggestions = [],
}: Props) {
  const [selected, setSelected] = useState<string[]>(
    initial.filter((s) => s.trim().length > 0),
  );
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(
    () => new Set(selected.map((s) => s.toLowerCase())),
    [selected],
  );
  const visibleSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suggestions
      .filter((s) => !selectedSet.has(s.value.toLowerCase()))
      .filter((s) => q === "" || s.value.toLowerCase().includes(q))
      .slice(0, 12);
  }, [suggestions, query, selectedSet]);

  const exactQueryMatch =
    query.trim().length > 0 &&
    !selectedSet.has(query.trim().toLowerCase()) &&
    !visibleSuggestions.some((s) => s.value.toLowerCase() === query.trim().toLowerCase());

  const add = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (selectedSet.has(trimmed.toLowerCase())) return;
    setSelected((cur) => [...cur, trimmed]);
    setQuery("");
  };

  const remove = (value: string) => {
    setSelected((cur) => cur.filter((s) => s !== value));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
          {Icon && <Icon size={11} />}
          {label}
        </label>
        <span className="text-[10px] text-soft">
          {selected.length} selected
        </span>
      </div>

      {/* Hidden textarea so server actions that parse name.split("\n") keep working */}
      <textarea
        name={name}
        value={selected.join("\n")}
        readOnly
        tabIndex={-1}
        className="sr-only"
        aria-hidden
      />

      {/* Selected chips */}
      <div className="flex min-h-[2.25rem] flex-wrap items-center gap-1.5 rounded-md border border-line bg-surface-0 p-1.5">
        {selected.length === 0 && (
          <span className="px-2 text-[11px] text-soft">No items selected yet.</span>
        )}
        {selected.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-200"
          >
            {s}
            <button
              type="button"
              onClick={() => remove(s)}
              aria-label={`Remove ${s}`}
              className="text-indigo-700/70 hover:text-rose-600 dark:text-indigo-200/70"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>

      {/* Search + suggestions */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                e.preventDefault();
                add(query);
              }
            }}
            className="flex-1 rounded-md border border-line bg-surface-0 px-2.5 py-1.5 text-xs text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          {exactQueryMatch && (
            <button
              type="button"
              onClick={() => add(query)}
              className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={10} />
              Add &ldquo;{query.trim().slice(0, 18)}&rdquo;
            </button>
          )}
        </div>

        {visibleSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleSuggestions.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => add(s.value)}
                className="group inline-flex items-center gap-1 rounded-full border border-line bg-surface-1 px-2 py-0.5 text-[11px] text-muted transition-all hover:border-indigo-400 hover:bg-accent-soft hover:text-indigo-700 dark:hover:text-indigo-200"
                title={
                  s.source === "system"
                    ? "From your tech-recovery register"
                    : s.source === "vendor"
                      ? "From your vendor register"
                      : "Common pattern"
                }
              >
                <Plus size={9} className="opacity-50 group-hover:opacity-100" />
                {s.value}
                <span
                  className={`rounded-full px-1 text-[8px] uppercase tracking-wider ${
                    s.source === "system"
                      ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200"
                      : s.source === "vendor"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                        : "bg-surface-2 text-soft"
                  }`}
                >
                  {s.source === "system" ? "sys" : s.source === "vendor" ? "vendor" : "lib"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {hint && <p className="text-[10px] text-soft">{hint}</p>}
    </div>
  );
}
