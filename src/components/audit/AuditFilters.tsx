"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export type ActorOption = { value: string; label: string };

/**
 * URL-driven filter bar for /audit. Sits above the server-rendered
 * table; updating any control replaces the URL search params via
 * router.replace, which re-runs the server query.
 *
 * Action + actor dropdowns are populated server-side from a
 * `findMany({ distinct })` so they reflect the full register, not
 * just the current page.
 */
export default function AuditFilters({
  q,
  action,
  actor,
  fromDate,
  toDate,
  actionOptions,
  actorOptions,
  exportHref,
}: {
  q: string;
  action: string;
  actor: string;
  fromDate: string;
  toDate: string;
  actionOptions: { value: string; count: number }[];
  actorOptions: ActorOption[];
  /** Pre-built `/api/audit/export?…` URL preserving the active filters. */
  exportHref: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [query, setQuery] = useState(q);

  // Debounce search input to keep server hits down.
  useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (query.trim() === "") next.delete("q");
      else next.set("q", query.trim());
      next.delete("page");
      start(() => router.replace(`${pathname}?${next.toString()}`));
    }, 300);
    return () => clearTimeout(t);
  }, [query, params, pathname, router]);

  function setParam(key: string, value: string, defaultValue: string) {
    const next = new URLSearchParams(params);
    if (value === defaultValue || value === "") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`));
  }

  const hasActive =
    q.length > 0 || action !== "all" || actor !== "all" || fromDate !== "" || toDate !== "";

  return (
    <div className="sticky top-0 z-10 -mx-2 space-y-2 bg-surface-0/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-surface-0/80">
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
            placeholder="Search by summary, action or actor…"
            aria-label="Search audit log"
            className="w-full rounded-md border border-line bg-surface-1 py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          {pending && (
            <span
              aria-hidden
              className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 animate-pulse rounded-full bg-indigo-500"
            />
          )}
        </div>
        <Link
          href={exportHref}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong hover:bg-surface-2"
          title="Download the current filtered view as CSV"
          aria-label="Export filtered audit log as CSV"
        >
          Export CSV
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-[11px] text-muted">
          <span>Action</span>
          <select
            value={action}
            onChange={(e) => setParam("action", e.target.value, "all")}
            className="rounded-md border border-line bg-surface-1 px-2 py-1 text-xs text-ink"
            aria-label="Filter by action"
          >
            <option value="all">All actions</option>
            {actionOptions.map((a) => (
              <option key={a.value} value={a.value}>
                {a.value} ({a.count})
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-muted">
          <span>Actor</span>
          <select
            value={actor}
            onChange={(e) => setParam("actor", e.target.value, "all")}
            className="rounded-md border border-line bg-surface-1 px-2 py-1 text-xs text-ink"
            aria-label="Filter by actor"
          >
            <option value="all">All actors</option>
            <option value="__system__">System (no actor)</option>
            {actorOptions.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-muted">
          <span>From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setParam("from", e.target.value, "")}
            className="rounded-md border border-line bg-surface-1 px-2 py-1 text-xs text-ink"
            aria-label="From date"
          />
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-muted">
          <span>To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setParam("to", e.target.value, "")}
            className="rounded-md border border-line bg-surface-1 px-2 py-1 text-xs text-ink"
            aria-label="To date"
          />
        </label>

        {hasActive && (
          <Link
            href={pathname}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2 py-1 text-[11px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X size={10} />
            Clear all
          </Link>
        )}
      </div>
    </div>
  );
}
