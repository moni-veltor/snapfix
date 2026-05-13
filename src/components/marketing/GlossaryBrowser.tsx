"use client";

import { useMemo, useState } from "react";
import { GLOSSARY, CATEGORIES, type GlossaryEntry } from "@/lib/glossary";

export default function GlossaryBrowser() {
  const [query, setQuery] = useState("");
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY.filter((e) => {
      if (activeCats.size > 0 && !activeCats.has(e.category)) return false;
      if (!q) return true;
      return (
        e.term.toLowerCase().includes(q) ||
        e.short.toLowerCase().includes(q) ||
        (e.acronymOf ?? "").toLowerCase().includes(q) ||
        (e.longer ?? "").toLowerCase().includes(q)
      );
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [query, activeCats]);

  const bySlug = useMemo(() => new Map(GLOSSARY.map((e) => [e.slug, e])), []);

  const toggleCat = (c: string) =>
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 30+ terms… (try 'sitrep', 'IBS', 'consumer duty')"
          className="w-full rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const active = activeCats.has(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCat(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-indigo-500 text-white"
                    : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {c}
              </button>
            );
          })}
          {activeCats.size > 0 && (
            <button
              type="button"
              onClick={() => setActiveCats(new Set())}
              className="rounded-full bg-transparent px-3 py-1 text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {filtered.length} of {GLOSSARY.length} term{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <ul className="space-y-3">
        {filtered.map((e) => (
          <Entry key={e.slug} e={e} bySlug={bySlug} onCrossClick={setQuery} />
        ))}
        {filtered.length === 0 && (
          <li className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-400">
            No terms match. Try a different search or clear the filters.
          </li>
        )}
      </ul>
    </div>
  );
}

function Entry({
  e,
  bySlug,
  onCrossClick,
}: {
  e: GlossaryEntry;
  bySlug: Map<string, GlossaryEntry>;
  onCrossClick: (q: string) => void;
}) {
  return (
    <li
      id={e.slug}
      className="scroll-mt-24 rounded-lg border border-white/10 bg-white/[0.03] p-5"
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-lg font-semibold text-white">{e.term}</h3>
        {e.acronymOf && (
          <span className="text-sm text-slate-400">— {e.acronymOf}</span>
        )}
        <span className="ml-auto rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
          {e.category}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-300">{e.short}</p>
      {e.longer && <p className="mt-2 text-sm text-slate-400">{e.longer}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {e.source && (
          <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-indigo-200">
            {e.source}
          </span>
        )}
        {e.related && e.related.length > 0 && (
          <>
            <span className="text-slate-500">See also:</span>
            {e.related.map((slug) => {
              const t = bySlug.get(slug);
              if (!t) return null;
              return (
                <a
                  key={slug}
                  href={`#${slug}`}
                  onClick={() => onCrossClick("")}
                  className="rounded-full bg-white/[0.05] px-2 py-0.5 text-slate-300 hover:bg-white/[0.1] hover:text-white"
                >
                  {t.term}
                </a>
              );
            })}
          </>
        )}
      </div>
    </li>
  );
}
