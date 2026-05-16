"use client";

import { useMemo, useState } from "react";
import { Clock, Download, ScrollText, User as UserIcon, X } from "lucide-react";

type AuditRow = {
  id: string;
  createdAt: Date;
  action: string;
  summary: string;
  actor: { name: string | null; email: string } | null;
};

const PAGE_SIZE = 40;

export default function AuditLogView({ entries }: { entries: AuditRow[] }) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState<string>("all");
  const [actor, setActor] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>(""); // YYYY-MM-DD
  const [toDate, setToDate] = useState<string>("");
  const [page, setPage] = useState(1);

  const actions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) set.add(e.action);
    return ["all", ...Array.from(set).sort()];
  }, [entries]);

  const actors = useMemo(() => {
    const map = new Map<string, string>(); // value (email or 'system') → display label
    map.set("all", "All actors");
    map.set("__system__", "System (no actor)");
    for (const e of entries) {
      if (!e.actor) continue;
      const key = e.actor.email;
      const label = e.actor.name ?? e.actor.email;
      if (!map.has(key)) map.set(key, label);
    }
    return Array.from(map.entries());
  }, [entries]);

  const actionCounts = useMemo(() => {
    const out: Record<string, number> = { all: entries.length };
    for (const e of entries) out[e.action] = (out[e.action] ?? 0) + 1;
    return out;
  }, [entries]);

  const q = query.trim().toLowerCase();
  const fromMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
  const toMs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

  const filtered = entries.filter((e) => {
    if (action !== "all" && e.action !== action) return false;
    if (actor !== "all") {
      if (actor === "__system__" && e.actor) return false;
      if (actor !== "__system__" && e.actor?.email !== actor) return false;
    }
    const ts = e.createdAt.getTime();
    if (fromMs !== null && ts < fromMs) return false;
    if (toMs !== null && ts > toMs) return false;
    if (
      q &&
      !e.summary.toLowerCase().includes(q) &&
      !e.action.toLowerCase().includes(q) &&
      !(e.actor?.name ?? "").toLowerCase().includes(q) &&
      !(e.actor?.email ?? "").toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  const hasActiveFilter =
    query.trim().length > 0 ||
    action !== "all" ||
    actor !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  function clearAll() {
    setQuery("");
    setAction("all");
    setActor("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const window = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function exportCSV() {
    const header = ["timestamp_iso", "action", "actor_name", "actor_email", "summary"];
    const rows = filtered.map((e) => [
      e.createdAt.toISOString(),
      e.action,
      e.actor?.name ?? "",
      e.actor?.email ?? "",
      e.summary,
    ]);
    const csv = [header, ...rows]
      .map((cols) =>
        cols
          .map((c) => {
            const s = String(c ?? "");
            // RFC-4180 quoting: wrap in double-quotes, escape internal quotes
            if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
          .join(","),
      )
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `snapfix-audit-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-4">
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 -mx-2 space-y-2 bg-surface-0/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-surface-0/80">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by summary, action or actor…"
            className="min-w-[220px] flex-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="button"
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
            title="Download the current filtered view as CSV"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <span>Action</span>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-line bg-surface-0 px-2 py-1 text-xs text-ink"
            >
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a === "all" ? "All" : a} ({actionCounts[a] ?? 0})
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <span>Actor</span>
            <select
              value={actor}
              onChange={(e) => {
                setActor(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-line bg-surface-0 px-2 py-1 text-xs text-ink"
            >
              {actors.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <span>From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-line bg-surface-0 px-2 py-1 text-xs text-ink"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <span>To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-line bg-surface-0 px-2 py-1 text-xs text-ink"
            />
          </label>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2 py-1 text-[11px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
            >
              <X size={10} />
              Clear all
            </button>
          )}

          <span className="ml-auto text-[11px] text-soft">
            {filtered.length} of {entries.length} events
            {hasActiveFilter && " filtered"}
          </span>
        </div>
      </div>

      {window.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
          No audit events match this view.
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface-1 text-sm">
          {window.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center gap-2 px-3 py-2 hover:bg-surface-2"
            >
              <Clock size={11} className="shrink-0 text-soft" />
              <span className="font-mono text-[11px] text-soft">
                {e.createdAt.toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                {e.action}
              </span>
              <span className="min-w-0 flex-1 truncate text-ink">{e.summary}</span>
              <span className="flex shrink-0 items-center gap-1 text-[10px] text-soft">
                <UserIcon size={9} />
                {e.actor?.name ?? e.actor?.email ?? "system"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <footer className="flex items-center justify-between gap-2 text-[11px] text-muted">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(filtered.length, currentPage * PAGE_SIZE)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-line bg-surface-0 px-2 py-1 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Newer
            </button>
            <span className="px-2 font-mono">
              {currentPage} / {pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={currentPage === pages}
              className="rounded-md border border-line bg-surface-0 px-2 py-1 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Older →
            </button>
          </div>
        </footer>
      )}
    </section>
  );
}

// keep ScrollText icon available if a caller wants to render an empty-state.
export { ScrollText };
