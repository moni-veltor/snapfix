"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Database,
  Lock,
  Network,
  Plus,
  Radar,
  Server,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { addLibrarySystemAction } from "@/app/actions/tech-recovery";
import { withToast } from "@/lib/toast-action";
import {
  FAILOVER_LABEL,
  SYSTEM_KIND_LABEL,
  SYSTEM_TIER_CHIP,
  SYSTEM_TIER_LABEL,
  fmtMin,
} from "@/lib/tech-recovery";
import { SYSTEM_LIBRARY, type LibrarySystem } from "@/lib/tech-system-library";
import type { TechSystemKind } from "@/generated/prisma/enums";

const KIND_ICON: Record<TechSystemKind, LucideIcon> = {
  APPLICATION: Workflow,
  INFRASTRUCTURE: Server,
  DATABASE: Database,
  NETWORK: Network,
  AUTH: Lock,
  OBSERVABILITY: Radar,
  OTHER: Sparkles,
};

const KIND_TONE: Record<TechSystemKind, string> = {
  APPLICATION: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  INFRASTRUCTURE: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  DATABASE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  NETWORK: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  AUTH: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  OBSERVABILITY: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  OTHER: "bg-surface-2 text-muted",
};

const KIND_ORDER: TechSystemKind[] = [
  "APPLICATION",
  "INFRASTRUCTURE",
  "DATABASE",
  "NETWORK",
  "AUTH",
  "OBSERVABILITY",
  "OTHER",
];

type Props = {
  existingNames: Set<string>;
  canManage: boolean;
};

export default function SystemLibraryGrid({ existingNames, canManage }: Props) {
  const [tierFilter, setTierFilter] = useState<"all" | "CRITICAL" | "ESSENTIAL" | "IMPORTANT" | "ROUTINE">(
    "all",
  );
  const [kindFilter, setKindFilter] = useState<"all" | TechSystemKind>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return SYSTEM_LIBRARY.filter((s) => {
      if (tierFilter !== "all" && s.suggestedTier !== tierFilter) return false;
      if (kindFilter !== "all" && s.kind !== kindFilter) return false;
      const q = query.trim().toLowerCase();
      if (q) {
        const hay = `${s.name} ${s.description} ${SYSTEM_KIND_LABEL[s.kind]}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tierFilter, kindFilter, query]);

  const kindCounts = useMemo(() => {
    const out: Record<string, number> = { all: SYSTEM_LIBRARY.length };
    for (const s of SYSTEM_LIBRARY) out[s.kind] = (out[s.kind] ?? 0) + 1;
    return out;
  }, []);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by system, description, kind…"
          className="min-w-[220px] flex-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <div role="tablist" className="flex flex-wrap gap-1">
          {(["all", "CRITICAL", "ESSENTIAL", "IMPORTANT", "ROUTINE"] as const).map((t) => {
            const active = tierFilter === t;
            return (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setTierFilter(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "bg-slate-900 text-white dark:bg-indigo-500"
                    : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {t === "all" ? "All tiers" : t[0] + t.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tablist" className="flex flex-wrap gap-1.5">
        <KindChip
          label="All"
          count={kindCounts.all}
          active={kindFilter === "all"}
          onClick={() => setKindFilter("all")}
        />
        {KIND_ORDER.map((k) => {
          const count = kindCounts[k] ?? 0;
          if (count === 0) return null;
          const Icon = KIND_ICON[k];
          return (
            <KindChip
              key={k}
              label={SYSTEM_KIND_LABEL[k]}
              count={count}
              active={kindFilter === k}
              tone={KIND_TONE[k]}
              Icon={Icon}
              onClick={() => setKindFilter(k)}
            />
          );
        })}
      </div>

      <p className="text-[11px] text-soft">
        {filtered.length} of {SYSTEM_LIBRARY.length} library systems shown
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-10 text-center text-sm text-muted">
          No matches. Loosen the filters or try a different search.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <li key={s.slug}>
              <LibraryCard
                system={s}
                already={existingNames.has(s.name)}
                canManage={canManage}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function KindChip({
  label,
  count,
  active,
  tone,
  Icon,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone?: string;
  Icon?: LucideIcon;
  onClick: () => void;
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
      {Icon && <Icon size={11} />}
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

function LibraryCard({
  system,
  already,
  canManage,
}: {
  system: LibrarySystem;
  already: boolean;
  canManage: boolean;
}) {
  const Icon = KIND_ICON[system.kind];
  const kindTone = KIND_TONE[system.kind];
  return (
    <article
      className={`group flex h-full flex-col rounded-xl border bg-surface-1 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${
        already ? "border-emerald-300 dark:border-emerald-700/60" : "border-line"
      }`}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-start gap-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${kindTone}`}
          >
            <Icon size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 text-sm font-semibold text-ink">{system.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${kindTone}`}
              >
                {SYSTEM_KIND_LABEL[system.kind]}
              </span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${SYSTEM_TIER_CHIP[system.suggestedTier]}`}
              >
                {SYSTEM_TIER_LABEL[system.suggestedTier]}
              </span>
            </div>
          </div>
        </header>

        <p className="line-clamp-3 text-xs text-muted">{system.description}</p>

        <div className="grid grid-cols-3 gap-1.5 text-[10px] text-soft">
          <Stat label="RTO" value={fmtMin(system.rtoMin)} />
          <Stat label="RPO" value={fmtMin(system.rpoMin)} />
          <Stat label="MTPD" value={fmtMin(system.mtpdMin)} />
        </div>

        <div className="flex flex-wrap items-center gap-1 text-[10px] text-soft">
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
            Failover · {FAILOVER_LABEL[system.suggestedFailoverKind]}
          </span>
          {system.primaryRegion && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
              {system.primaryRegion}
              {system.failoverRegion ? ` → ${system.failoverRegion}` : ""}
            </span>
          )}
        </div>

        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          {already ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 size={10} />
              In your register
            </span>
          ) : (
            <span className="text-[10px] text-soft">Not added yet</span>
          )}
          {canManage && !already && (
            <form
              action={withToast(addLibrarySystemAction, {
                success: `Added ${system.name}`,
                description: "Tune objectives and failover in the register",
                error: "Couldn't add this system",
              })}
            >
              <input type="hidden" name="slug" value={system.slug} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <Plus size={10} />
                Add system
              </button>
            </form>
          )}
        </footer>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface-0 px-2 py-1 text-center">
      <div className="text-[9px] uppercase tracking-wider text-soft">{label}</div>
      <div className="font-mono text-[11px] text-ink">{value}</div>
    </div>
  );
}
