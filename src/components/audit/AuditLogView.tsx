"use client";

import { useMemo, useState } from "react";
import { Clock, ScrollText, User as UserIcon } from "lucide-react";

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
  const [page, setPage] = useState(1);

  const actions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) set.add(e.action);
    return ["all", ...Array.from(set).sort()];
  }, [entries]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: entries.length };
    for (const e of entries) out[e.action] = (out[e.action] ?? 0) + 1;
    return out;
  }, [entries]);

  const q = query.trim().toLowerCase();
  const filtered = entries.filter((e) => {
    if (action !== "all" && e.action !== action) return false;
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

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const window = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section className="space-y-4">
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
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink"
        >
          {actions.map((a) => (
            <option key={a} value={a}>
              {a === "all" ? "All actions" : a} ({counts[a] ?? 0})
            </option>
          ))}
        </select>
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
