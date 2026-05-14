"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertOctagon,
  Boxes,
  Building,
  Cloud,
  Database,
  FileText,
  Server,
  ShieldAlert,
  Sparkles,
  Users,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cloneTemplateAction } from "@/app/actions/templates";

type Template = {
  id: string;
  title: string;
  background: string;
  category: string | null;
  tier: "TIER_1" | "TIER_2" | "TIER_3" | null;
  srrRef: string | null;
  coversPeople: boolean;
  coversProperty: boolean;
  coversTechnology: boolean;
  coversDataAvailability: boolean;
  coversDataIntegrity: boolean;
  coversThirdParty: boolean;
  _count: { events: number; injects: number; ibsList: number };
};

type ExistingClone = { id: string; title: string };

type Props = {
  templates: Template[];
  clonesByOriginId: Record<string, ExistingClone[]>;
  canClone: boolean;
  orgTier: "TIER_1" | "TIER_2" | "TIER_3" | null;
};

type TierFilter = "applicable" | "all" | "TIER_1" | "TIER_2" | "TIER_3";

const CATEGORY_VISUAL: Record<
  string,
  { icon: LucideIcon; tone: string; ring: string; bar: string }
> = {
  "Technology & Data (Cyber)": {
    icon: ShieldAlert,
    tone: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    ring: "border-rose-300 dark:border-rose-700/60",
    bar: "from-rose-500 to-rose-400",
  },
  "Cloud & Infrastructure": {
    icon: Cloud,
    tone: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
    ring: "border-indigo-300 dark:border-indigo-700/60",
    bar: "from-indigo-500 to-indigo-400",
  },
  "Third Party": {
    icon: Boxes,
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    ring: "border-amber-300 dark:border-amber-700/60",
    bar: "from-amber-500 to-amber-400",
  },
  "Data Integrity": {
    icon: Database,
    tone: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
    ring: "border-violet-300 dark:border-violet-700/60",
    bar: "from-violet-500 to-violet-400",
  },
  People: {
    icon: Users,
    tone: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
    ring: "border-cyan-300 dark:border-cyan-700/60",
    bar: "from-cyan-500 to-cyan-400",
  },
  Property: {
    icon: Building,
    tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    ring: "border-emerald-300 dark:border-emerald-700/60",
    bar: "from-emerald-500 to-emerald-400",
  },
};

const DEFAULT_VISUAL = {
  icon: Sparkles,
  tone: "bg-surface-2 text-muted",
  ring: "border-line",
  bar: "from-slate-500 to-slate-400",
};

const HARM_ICONS: { key: keyof Template; label: string; icon: LucideIcon }[] = [
  { key: "coversPeople", label: "People", icon: Users },
  { key: "coversProperty", label: "Property", icon: Building },
  { key: "coversTechnology", label: "Tech", icon: Server },
  { key: "coversDataAvailability", label: "Avail.", icon: Wifi },
  { key: "coversDataIntegrity", label: "Integ.", icon: Database },
  { key: "coversThirdParty", label: "3rd", icon: Boxes },
];

const TIER_LABEL: Record<string, string> = {
  TIER_1: "Tier 1",
  TIER_2: "Tier 2",
  TIER_3: "Tier 3",
};

export default function TemplateLibraryGrid({
  templates,
  clonesByOriginId,
  canClone,
  orgTier,
}: Props) {
  const [tierFilter, setTierFilter] = useState<TierFilter>(
    orgTier ? "applicable" : "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      // Tier filter
      if (tierFilter === "all") {
        // accept all
      } else if (tierFilter === "applicable") {
        // accept tier-null (applies to all tiers) + tier matching the org's
        if (orgTier && t.tier && t.tier !== orgTier) return false;
      } else {
        // explicit tier — must match exactly (excludes tier-null)
        if (t.tier !== tierFilter) return false;
      }
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      const q = query.trim().toLowerCase();
      if (q && !t.title.toLowerCase().includes(q) && !t.background.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [templates, tierFilter, categoryFilter, query, orgTier]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of templates) if (t.category) set.add(t.category);
    return Array.from(set).sort();
  }, [templates]);

  const categoryCounts = useMemo(() => {
    const out: Record<string, number> = { all: templates.length };
    for (const t of templates) {
      const k = t.category ?? "Other";
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }, [templates]);

  const tierTabs: { id: TierFilter; label: string }[] = [];
  if (orgTier) tierTabs.push({ id: "applicable", label: `Recommended for ${TIER_LABEL[orgTier]}` });
  tierTabs.push({ id: "all", label: "All tiers" });
  tierTabs.push({ id: "TIER_1", label: "Tier 1" });
  tierTabs.push({ id: "TIER_2", label: "Tier 2" });
  tierTabs.push({ id: "TIER_3", label: "Tier 3" });

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the library — try ‘DDoS’, ‘AWS’, ‘ransomware’…"
          className="min-w-[260px] flex-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <div role="tablist" className="flex flex-wrap gap-1">
          {tierTabs.map((t) => {
            const active = tierFilter === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setTierFilter(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "bg-slate-900 text-white dark:bg-indigo-500"
                    : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tablist" className="flex flex-wrap gap-1.5">
        <CategoryChip
          active={categoryFilter === "all"}
          onClick={() => setCategoryFilter("all")}
          count={categoryCounts.all}
        >
          All categories
        </CategoryChip>
        {categories.map((c) => {
          const v = CATEGORY_VISUAL[c] ?? DEFAULT_VISUAL;
          const Icon = v.icon;
          return (
            <CategoryChip
              key={c}
              active={categoryFilter === c}
              onClick={() => setCategoryFilter(c)}
              count={categoryCounts[c] ?? 0}
              tone={v.tone}
            >
              <Icon size={11} className="shrink-0" />
              {c}
            </CategoryChip>
          );
        })}
      </div>

      <p className="text-[11px] text-soft">
        {filtered.length} of {templates.length} scenarios shown
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-10 text-center text-sm text-muted">
          No scenarios match this view. Loosen the filters or try a different search.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <li key={t.id}>
              <TemplateCard
                template={t}
                clones={clonesByOriginId[t.id] ?? []}
                canClone={canClone}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CategoryChip({
  active,
  onClick,
  count,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? tone ?? "bg-slate-900 text-white dark:bg-indigo-500"
          : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
          active ? "bg-white/30 dark:bg-black/30" : "bg-surface-2 text-soft"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function TemplateCard({
  template,
  clones,
  canClone,
}: {
  template: Template;
  clones: ExistingClone[];
  canClone: boolean;
}) {
  const v = CATEGORY_VISUAL[template.category ?? ""] ?? DEFAULT_VISUAL;
  const Icon = v.icon;
  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl border bg-surface-1 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${v.ring}`}
    >
      {/* Animated top bar — pulses on hover. */}
      <div
        className={`h-1.5 bg-gradient-to-r ${v.bar} transition-all duration-300 group-hover:h-2`}
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/templates/${template.id}`}
              className="block text-sm font-semibold text-ink hover:underline"
            >
              {template.title}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${v.tone}`}
              >
                <Icon size={9} />
                {template.category ?? "Other"}
              </span>
              {template.tier ? (
                <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white dark:bg-indigo-500">
                  {TIER_LABEL[template.tier]}
                </span>
              ) : (
                <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted">
                  All tiers
                </span>
              )}
              {template.srrRef && (
                <span className="rounded-full bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-soft">
                  SRR {template.srrRef}
                </span>
              )}
            </div>
          </div>
        </header>

        <p className="line-clamp-3 text-xs text-muted">{template.background}</p>

        <div className="flex flex-wrap items-center gap-1">
          {HARM_ICONS.map(({ key, label, icon: H }) => {
            const on = template[key] as boolean;
            return (
              <span
                key={label}
                title={`${label}${on ? "" : " — not covered"}`}
                className={`flex h-5 w-5 items-center justify-center rounded-md transition-colors ${
                  on
                    ? "bg-accent-soft text-indigo-700 dark:text-indigo-200"
                    : "bg-surface-2 text-soft"
                }`}
              >
                <H size={10} />
              </span>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1 text-[10px] text-soft">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5">
            <Building size={9} />
            {template._count.ibsList} IBS
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5">
            <FileText size={9} />
            {template._count.events} events
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5">
            <Zap size={9} />
            {template._count.injects} injects
          </span>
        </div>

        {clones.length > 0 && (
          <div className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
            <AlertOctagon size={9} className="-mt-0.5 mr-1 inline" />
            Already cloned: {clones.map((c, i) => (
              <span key={c.id}>
                {i > 0 && ", "}
                <Link href={`/scenarios/${c.id}`} className="underline">
                  {c.title}
                </Link>
              </span>
            ))}
          </div>
        )}

        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          <Link
            href={`/templates/${template.id}`}
            className="text-xs font-medium text-muted hover:text-ink"
          >
            Read scenario →
          </Link>
          {canClone && (
            <form action={cloneTemplateAction}>
              <input type="hidden" name="templateId" value={template.id} />
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-[var(--shadow-card)] transition-all hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Clone
              </button>
            </form>
          )}
        </footer>
      </div>
    </article>
  );
}
