"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { FileText, Target, Building2, CheckSquare, Users, Search } from "lucide-react";

type SearchPayload = {
  q: string;
  results: {
    scenarios: { id: string; title: string }[];
    exercises: { id: string; title: string; status: string }[];
    ibsList: { id: string; code: string; name: string }[];
    actionItems: { id: string; title: string; exerciseId: string; status: string }[];
    members: { id: string; name: string | null; email: string }[];
  };
};

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchPayload["results"] | null>(null);
  const [loading, setLoading] = useState(false);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const j = (await res.json()) as SearchPayload;
          setData(j.results);
        }
      } catch {
        /* swallow */
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [query, open]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-30 hidden items-center gap-2 rounded-full border border-line-strong bg-surface-1 px-3 py-2 text-xs text-muted shadow-sm hover:bg-surface-0 md:flex"
        aria-label="Open search"
      >
        <Search size={14} />
        Search
        <kbd className="ml-2 rounded border border-line-strong bg-surface-0 px-1.5 py-0.5 font-mono text-[10px] text-muted">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg border border-line bg-surface-1 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          shouldFilter={false}
          className="overflow-hidden"
          loop
          label="Search SnapFix"
        >
          <div className="flex items-center gap-2 border-b border-line px-4">
            <Search size={16} className="text-soft" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search scenarios, exercises, IBS, action items, people…"
              className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-soft"
            />
            <kbd className="rounded border border-line-strong bg-surface-0 px-1.5 py-0.5 font-mono text-[10px] text-muted">
              esc
            </kbd>
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto px-1 py-2">
            {loading && (
              <div className="px-3 py-2 text-xs text-muted">Searching…</div>
            )}
            {data && !loading && (
              <>
                <Group label="Scenarios" Icon={FileText}>
                  {data.scenarios.map((s) => (
                    <Item key={s.id} onSelect={() => go(`/scenarios/${s.id}`)}>
                      <FileText size={14} className="text-soft" />
                      <span className="truncate">{s.title}</span>
                    </Item>
                  ))}
                </Group>
                <Group label="Exercises" Icon={Target}>
                  {data.exercises.map((e) => (
                    <Item key={e.id} onSelect={() => go(`/exercises/${e.id}`)}>
                      <Target size={14} className="text-soft" />
                      <span className="truncate">{e.title}</span>
                      <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                        {e.status}
                      </span>
                    </Item>
                  ))}
                </Group>
                <Group label="IBS register" Icon={Building2}>
                  {data.ibsList.map((i) => (
                    <Item key={i.id} onSelect={() => go(`/ibs/${i.id}`)}>
                      <Building2 size={14} className="text-soft" />
                      <span className="font-mono text-xs text-muted">{i.code}</span>
                      <span className="truncate">{i.name}</span>
                    </Item>
                  ))}
                </Group>
                <Group label="Action items" Icon={CheckSquare}>
                  {data.actionItems.map((a) => (
                    <Item key={a.id} onSelect={() => go(`/exercises/${a.exerciseId}/debrief`)}>
                      <CheckSquare size={14} className="text-soft" />
                      <span className="truncate">{a.title}</span>
                      <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                        {a.status}
                      </span>
                    </Item>
                  ))}
                </Group>
                <Group label="People" Icon={Users}>
                  {data.members.map((m) => (
                    <Item key={m.id} onSelect={() => go("/org")}>
                      <Users size={14} className="text-soft" />
                      <span className="truncate">{m.name ?? m.email}</span>
                      {m.name && (
                        <span className="text-xs text-soft">{m.email}</span>
                      )}
                    </Item>
                  ))}
                </Group>
              </>
            )}
            <Command.Empty className="px-3 py-6 text-center text-xs text-muted">
              {loading ? "" : query ? "No matches" : "Type to search the platform"}
            </Command.Empty>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function Group({
  label,
  children,
  Icon,
}: {
  label: string;
  children: React.ReactNode;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  // cmdk Group only renders if it has matched items
  const childArray = Array.isArray(children) ? children.flat() : [children];
  const nonEmpty = childArray.filter(Boolean);
  if (nonEmpty.length === 0) return null;
  return (
    <Command.Group
      heading={
        <span className="flex items-center gap-2 px-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-soft">
          <Icon size={12} />
          {label}
        </span>
      }
      className="mb-1"
    >
      {children}
    </Command.Group>
  );
}

function Item({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-ink aria-selected:bg-indigo-50 aria-selected:text-indigo-700"
    >
      {children}
    </Command.Item>
  );
}
