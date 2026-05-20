"use client";

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
import type { LibrarySystem } from "@/lib/tech-system-library";
import type { TechSystemKind } from "@/generated/prisma/enums";
import type { LibraryBrowserConfig, LibraryCardContext } from "../types";

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

export const TECH_LIBRARY_CONFIG: LibraryBrowserConfig<LibrarySystem> = {
  itemKey: (s) => s.slug,
  existingKey: (s) => s.name,
  title: "Tech system library",
  subtitle:
    "Reference systems with sensible RTO / RPO / failover defaults. Tune the tier and regions after you add.",
  filters: [
    {
      kind: "search",
      key: "search",
      placeholder: "Search by system, description, kind…",
      getHaystack: (s) => `${s.name} ${s.description} ${SYSTEM_KIND_LABEL[s.kind]}`,
    },
    {
      kind: "single-chip",
      key: "kind",
      label: "Kind",
      options: KIND_ORDER.map((k) => ({
        value: k,
        label: SYSTEM_KIND_LABEL[k],
        tone: KIND_TONE[k],
      })),
      getValue: (s) => s.kind,
    },
    {
      kind: "single-chip",
      key: "tier",
      label: "Recovery tier",
      options: [
        { value: "CRITICAL", label: "Critical" },
        { value: "ESSENTIAL", label: "Essential" },
        { value: "IMPORTANT", label: "Important" },
        { value: "ROUTINE", label: "Routine" },
      ],
      getValue: (s) => s.suggestedTier,
    },
  ],
  card: (system, ctx) => <SystemCard system={system} ctx={ctx} />,
};

function SystemCard({
  system,
  ctx,
}: {
  system: LibrarySystem;
  ctx: LibraryCardContext;
}) {
  const Icon = KIND_ICON[system.kind];
  const kindTone = KIND_TONE[system.kind];
  return (
    <article
      className={`flex h-full flex-col rounded-xl border bg-surface-1 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${
        ctx.already ? "border-emerald-300 dark:border-emerald-700/60" : "border-line"
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
          {ctx.already ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 size={10} />
              In register
            </span>
          ) : (
            <span className="text-[10px] text-soft">Not added yet</span>
          )}
          {ctx.canAdd && !ctx.already && (
            <form
              action={withToast(addLibrarySystemAction, {
                success: `Added ${system.name}`,
                description: "Sensible defaults applied — tune in the register",
                error: "Couldn't add this system",
              })}
            >
              <input type="hidden" name="slug" value={system.slug} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <Plus size={10} />
                Add
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
    <div className="rounded-md border border-line bg-surface-0 px-1.5 py-1 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-soft">{label}</p>
      <p className="font-mono text-[11px] font-semibold text-ink">{value}</p>
    </div>
  );
}
