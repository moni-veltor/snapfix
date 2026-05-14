"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Boxes,
  Building,
  Database,
  FileText,
  Layers,
  Server,
  Target,
  Users,
  Wifi,
  Wand2,
  type LucideIcon,
} from "lucide-react";

type ScenarioRow = {
  id: string;
  title: string;
  background: string;
  dDayDate: Date;
  durationMin: number;
  category: string | null;
  tier: "TIER_1" | "TIER_2" | "TIER_3" | null;
  coversPeople: boolean;
  coversProperty: boolean;
  coversTechnology: boolean;
  coversDataAvailability: boolean;
  coversDataIntegrity: boolean;
  coversThirdParty: boolean;
  createdBy: { name: string | null; email: string } | null;
  templateOrigin: { id: string; title: string } | null;
  _count: { events: number; injects: number; ibsList: number; exercises: number };
};

const HARM_ICONS: {
  key: keyof Pick<
    ScenarioRow,
    | "coversPeople"
    | "coversProperty"
    | "coversTechnology"
    | "coversDataAvailability"
    | "coversDataIntegrity"
    | "coversThirdParty"
  >;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "coversPeople", label: "People", icon: Users },
  { key: "coversProperty", label: "Property", icon: Building },
  { key: "coversTechnology", label: "Technology", icon: Server },
  { key: "coversDataAvailability", label: "Data avail.", icon: Wifi },
  { key: "coversDataIntegrity", label: "Data integrity", icon: Database },
  { key: "coversThirdParty", label: "Third party", icon: Boxes },
];

export default function ScenarioGrid({ scenarios }: { scenarios: ScenarioRow[] }) {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of scenarios) if (s.category) set.add(s.category);
    return ["all", ...Array.from(set).sort()];
  }, [scenarios]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: scenarios.length };
    for (const s of scenarios) {
      const k = s.category ?? "Uncategorised";
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }, [scenarios]);

  const q = query.trim().toLowerCase();
  const filtered = scenarios.filter((s) => {
    if (q && !s.title.toLowerCase().includes(q) && !s.background.toLowerCase().includes(q))
      return false;
    if (category === "all") return true;
    return (s.category ?? "Uncategorised") === category;
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or background…"
          className="min-w-[220px] flex-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      {categories.length > 1 && (
        <div role="tablist" className="flex flex-wrap gap-1">
          {categories.map((c) => {
            const active = category === c;
            const count = counts[c] ?? 0;
            const label = c === "all" ? "All" : c;
            return (
              <button
                key={c}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setCategory(c)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "bg-slate-900 text-white dark:bg-indigo-500"
                    : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    active ? "bg-white/30 dark:bg-black/30" : "bg-surface-2 text-soft"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
          No scenarios match this view.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <li key={s.id}>
              <ScenarioCard scenario={s} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ScenarioCard({ scenario }: { scenario: ScenarioRow }) {
  return (
    <Link
      href={`/scenarios/${scenario.id}`}
      className="group block h-full rounded-xl border border-line bg-surface-1 transition-all hover:-translate-y-px hover:border-line-strong hover:shadow-[var(--shadow-card-md)]"
    >
      <article className="flex h-full flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold text-ink">
              {scenario.title}
            </h3>
            {scenario.category && (
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-soft">
                {scenario.category}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {scenario.templateOrigin && (
              <span
                title={`Cloned from ${scenario.templateOrigin.title}`}
                className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-200"
              >
                <Wand2 size={9} className="inline" />
              </span>
            )}
            {scenario.tier && (
              <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted">
                {scenario.tier.replace("_", " ")}
              </span>
            )}
          </div>
        </header>

        <p className="line-clamp-2 text-xs text-muted">{scenario.background}</p>

        <div className="flex flex-wrap items-center gap-1">
          {HARM_ICONS.map(({ key, label, icon: Icon }) => {
            const on = scenario[key];
            return (
              <span
                key={label}
                title={`${label}${on ? "" : " — not covered"}`}
                className={`flex h-5 w-5 items-center justify-center rounded-md ${
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

        <div className="flex flex-wrap gap-1 text-[10px]">
          <Pill icon={Layers}>{scenario._count.ibsList} IBS</Pill>
          <Pill icon={FileText}>{scenario._count.events} events</Pill>
          <Pill icon={FileText}>{scenario._count.injects} injects</Pill>
          <Pill icon={Target}>{scenario._count.exercises} runs</Pill>
        </div>

        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-[10px] text-soft">
          <span>
            D-Day{" "}
            {scenario.dDayDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span>{scenario.durationMin} min</span>
        </footer>
      </article>
    </Link>
  );
}

function Pill({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-muted">
      <Icon size={10} />
      {children}
    </span>
  );
}
