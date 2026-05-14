"use client";

import { useMemo, useState } from "react";
import {
  Users,
  Server,
  Boxes,
  Database,
  Workflow,
  Building,
  type LucideIcon,
} from "lucide-react";

type Category = "people" | "technology" | "thirdParties" | "information" | "processes" | "facilities";

type Props = {
  ibsCode: string;
  ibsName: string;
  technology: string[];
  thirdParties: string[];
  information: string[];
  processes: string[];
  peopleNotes: string | null;
  facilities: string | null;
  /** Map of dependency-name → list of OTHER IBSs that share that dependency. */
  sharedBy: Record<string, { id: string; code: string; name: string }[]>;
};

const CATEGORY_META: Record<
  Category,
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  people: {
    label: "People",
    icon: Users,
    color: "text-rose-600 dark:text-rose-300",
    bg: "bg-rose-100 dark:bg-rose-950/40",
  },
  technology: {
    label: "Technology",
    icon: Server,
    color: "text-cyan-600 dark:text-cyan-300",
    bg: "bg-cyan-100 dark:bg-cyan-950/40",
  },
  thirdParties: {
    label: "3rd parties",
    icon: Boxes,
    color: "text-emerald-600 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
  },
  information: {
    label: "Information",
    icon: Database,
    color: "text-violet-600 dark:text-violet-300",
    bg: "bg-violet-100 dark:bg-violet-950/40",
  },
  processes: {
    label: "Processes",
    icon: Workflow,
    color: "text-indigo-600 dark:text-indigo-300",
    bg: "bg-indigo-100 dark:bg-indigo-950/40",
  },
  facilities: {
    label: "Facilities",
    icon: Building,
    color: "text-amber-600 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-950/40",
  },
};

/**
 * Interactive resource map. The IBS sits at the centre; categories
 * (people/tech/3rd party/info/processes/facilities) radiate out as spokes.
 * Click a dependency tag to see which OTHER IBSs share it — surfaces
 * single-points-of-failure across the register at a glance.
 */
export default function DependencyMap({
  ibsCode,
  ibsName,
  technology,
  thirdParties,
  information,
  processes,
  peopleNotes,
  facilities,
  sharedBy,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const groups = useMemo(() => {
    const g: { category: Category; items: string[] }[] = [];
    if (peopleNotes && peopleNotes.trim()) {
      g.push({ category: "people", items: [peopleNotes.trim()] });
    }
    if (technology.length) g.push({ category: "technology", items: technology });
    if (thirdParties.length) g.push({ category: "thirdParties", items: thirdParties });
    if (information.length) g.push({ category: "information", items: information });
    if (processes.length) g.push({ category: "processes", items: processes });
    if (facilities && facilities.trim()) {
      g.push({ category: "facilities", items: [facilities.trim()] });
    }
    return g;
  }, [technology, thirdParties, information, processes, peopleNotes, facilities]);

  const sharedList = selected ? sharedBy[selected] ?? [] : [];

  return (
    <section className="rounded-xl border border-line bg-surface-1 p-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Dependency map</h3>
          <p className="mt-0.5 text-xs text-muted">
            Every resource this IBS relies on. Click a tag to find shared dependencies.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-soft">
          <span>{groups.reduce((a, g) => a + g.items.length, 0)} dependencies</span>
        </div>
      </header>

      {groups.length === 0 ? (
        <p className="mt-4 rounded border border-dashed border-line p-6 text-center text-xs text-muted">
          No dependencies recorded yet. Edit the IBS to populate the resource map.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-gradient-brand-soft p-3">
              <span className="font-mono text-sm font-semibold text-ink">{ibsCode}</span>
              <span className="text-sm text-ink">{ibsName}</span>
            </div>
            <ul className="space-y-3">
              {groups.map((g) => {
                const meta = CATEGORY_META[g.category];
                const Icon = meta.icon;
                return (
                  <li key={g.category}>
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-soft">
                      <span className={`flex h-5 w-5 items-center justify-center rounded ${meta.bg}`}>
                        <Icon size={11} className={meta.color} />
                      </span>
                      {meta.label}
                      <span className="text-soft">· {g.items.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((item) => {
                        const isSelected = selected === item;
                        const shared = sharedBy[item];
                        const count = shared ? shared.length : 0;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() =>
                              setSelected((cur) => (cur === item ? null : item))
                            }
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-all ${
                              isSelected
                                ? "border-indigo-400 bg-indigo-500/15 text-indigo-700 dark:text-indigo-200"
                                : count > 0
                                  ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200"
                                  : "border-line bg-surface-0 text-ink hover:border-line-strong"
                            }`}
                          >
                            <span>{item}</span>
                            {count > 0 && (
                              <span
                                className={`rounded-full px-1 text-[9px] font-semibold ${
                                  isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-amber-600 text-white"
                                }`}
                                title={`Shared with ${count} other IBS${count === 1 ? "" : "s"}`}
                              >
                                +{count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-lg border border-line bg-surface-0 p-4">
            {selected ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
                    Shared dependency
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-ink">{selected}</p>
                </div>
                {sharedList.length === 0 ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                    Only this IBS depends on <span className="font-medium">{selected}</span>. No
                    shared-dependency risk.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
                      <span className="font-semibold">{sharedList.length}</span> other IBS
                      {sharedList.length === 1 ? "" : "s"} depend on this — if it fails, expect
                      cascade impact.
                    </div>
                    <ul className="space-y-1 text-xs">
                      {sharedList.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center gap-2 rounded-md border border-line bg-surface-1 px-2 py-1.5"
                        >
                          <span className="font-mono text-[10px] text-soft">{s.code}</span>
                          <span className="truncate text-ink">{s.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-[11px] text-muted underline hover:text-ink"
                >
                  Clear selection
                </button>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-soft">
                  Shared-dependency view
                </div>
                <p className="mt-2 text-xs text-muted">
                  Click any tag in the resource map to see which other IBSs share that
                  dependency. Tags marked <span className="rounded-full bg-amber-100 px-1 text-amber-700">+N</span> are
                  shared with N other services — those are your cross-IBS single-points-of-failure.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
