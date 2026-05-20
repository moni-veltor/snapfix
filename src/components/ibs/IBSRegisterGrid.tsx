"use client";

import { useMemo, useState } from "react";
import {
  Building,
  CheckCircle2,
  Database,
  Server,
  ShieldAlert,
  Users,
  Wifi,
  Boxes,
  type LucideIcon,
} from "lucide-react";
import IBSQuickEditDrawer from "@/components/ibs/IBSQuickEditDrawer";
import MineToggle, { useMineToggle } from "@/components/ui/MineToggle";

type RegisterRow = {
  id: string;
  code: string;
  name: string;
  outcome: string | null;
  status: "DRAFT" | "APPROVED" | "DEPRECATED" | string;
  criticality: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  impactToleranceMin: number;
  fcaToleranceMin: number | null;
  praToleranceMin: number | null;
  processOwner: string | null;
  processOwnerUserId: string | null;
  exerciseCount: number;
  coversPeople: boolean;
  coversProperty: boolean;
  coversTechnology: boolean;
  coversDataAvailability: boolean;
  coversDataIntegrity: boolean;
  coversThirdParty: boolean;
};

type Filter = "all" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "CRITICAL", label: "Critical" },
  { id: "HIGH", label: "High" },
  { id: "MEDIUM", label: "Medium" },
  { id: "LOW", label: "Low" },
];

const CRITICALITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const CRITICALITY_TONE: Record<
  string,
  { chip: string; ring: string; bar: string }
> = {
  CRITICAL: {
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    ring: "border-rose-300 dark:border-rose-700/60",
    bar: "bg-rose-500",
  },
  HIGH: {
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    ring: "border-amber-300 dark:border-amber-700/60",
    bar: "bg-amber-500",
  },
  MEDIUM: {
    chip: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
    ring: "border-cyan-300 dark:border-cyan-700/60",
    bar: "bg-cyan-500",
  },
  LOW: {
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    ring: "border-emerald-300 dark:border-emerald-700/60",
    bar: "bg-emerald-500",
  },
};

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  APPROVED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  DEPRECATED: "bg-surface-2 text-muted",
};

const HARM_ICONS: { key: keyof RegisterRow; label: string; icon: LucideIcon }[] = [
  { key: "coversPeople", label: "People", icon: Users },
  { key: "coversProperty", label: "Property", icon: Building },
  { key: "coversTechnology", label: "Technology", icon: Server },
  { key: "coversDataAvailability", label: "Data availability", icon: Wifi },
  { key: "coversDataIntegrity", label: "Data integrity", icon: Database },
  { key: "coversThirdParty", label: "Third party", icon: Boxes },
];

function fmtHours(min: number): string {
  if (min < 60) return `${min}m`;
  if (min < 60 * 24) return `${Math.round(min / 60)}h`;
  return `${Math.round(min / 60 / 24)}d`;
}

export default function IBSRegisterGrid({
  rows,
  canEdit = false,
  currentUserId = null,
}: {
  rows: RegisterRow[];
  canEdit?: boolean;
  currentUserId?: string | null;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [mineOnly, setMineOnly] = useMineToggle("ibs");
  const [editId, setEditId] = useState<string | null>(null);
  const mineCount = currentUserId
    ? rows.filter((r) => r.processOwnerUserId === currentUserId).length
    : 0;
  const editRow = editId ? rows.find((r) => r.id === editId) ?? null : null;
  const editStub = editRow
    ? { id: editRow.id, code: editRow.code, name: editRow.name }
    : null;

  const groups = useMemo(() => {
    const out: Record<string, RegisterRow[]> = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };
    for (const r of rows) {
      const k = (r.criticality in out ? r.criticality : "LOW") as keyof typeof out;
      out[k].push(r);
    }
    for (const k of Object.keys(out)) {
      out[k].sort((a, b) => a.code.localeCompare(b.code));
    }
    return out;
  }, [rows]);

  const q = query.trim().toLowerCase();
  const matches = (r: RegisterRow) => {
    if (mineOnly && currentUserId && r.processOwnerUserId !== currentUserId) {
      return false;
    }
    if (q === "") return true;
    return (
      r.code.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      (r.outcome ?? "").toLowerCase().includes(q) ||
      (r.processOwner ?? "").toLowerCase().includes(q)
    );
  };

  const visibleKeys =
    filter === "all"
      ? (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const)
      : ([filter] as const);

  const visibleCount = visibleKeys.reduce(
    (acc, k) => acc + groups[k].filter(matches).length,
    0,
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code, name, outcome or owner…"
          className="min-w-[220px] flex-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        {currentUserId && (
          <MineToggle
            on={mineOnly}
            onChange={setMineOnly}
            count={mineCount}
            total={rows.length}
          />
        )}
        <div role="tablist" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => {
            const count = f.id === "all" ? rows.length : groups[f.id].length;
            const active = filter === f.id;
            const tone = f.id !== "all" ? CRITICALITY_TONE[f.id] : null;
            return (
              <button
                key={f.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? tone
                      ? tone.chip
                      : "bg-slate-900 text-white dark:bg-indigo-500"
                    : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span>{f.label}</span>
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
      </div>

      {visibleCount === 0 && (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
          No services match this view.
        </div>
      )}

      {visibleKeys.map((k) => {
        const items = groups[k].filter(matches);
        if (items.length === 0) return null;
        const sortedByCriticality = items.sort(
          (a, b) =>
            (CRITICALITY_ORDER[a.criticality] ?? 99) -
            (CRITICALITY_ORDER[b.criticality] ?? 99),
        );
        const tone = CRITICALITY_TONE[k];
        return (
          <section key={k}>
            <header className="mb-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.chip}`}
              >
                {k}
              </span>
              <span className="text-[11px] text-soft">
                {items.length} service{items.length === 1 ? "" : "s"}
              </span>
            </header>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sortedByCriticality.map((r) => (
                <li key={r.id}>
                  <ServiceCard
                    row={r}
                    canEdit={canEdit}
                    onEdit={() => setEditId(r.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <IBSQuickEditDrawer
        open={editStub !== null}
        onClose={() => setEditId(null)}
        ibs={editStub}
        canEdit={canEdit}
      />
    </section>
  );
}

function ServiceCard({
  row,
  canEdit,
  onEdit,
}: {
  row: RegisterRow;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const tone = CRITICALITY_TONE[row.criticality] ?? CRITICALITY_TONE.LOW;

  const handleActivate = () => {
    if (canEdit) onEdit();
    else window.location.assign(`/ibs/${row.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      }}
      className={`group block h-full cursor-pointer rounded-xl border bg-surface-1 text-left transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${tone.ring}`}
    >
      <div className={`h-1 rounded-t-xl ${tone.bar}`} />
      <article className="flex h-full flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-soft">{row.code}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tone.chip}`}
              >
                {row.criticality}
              </span>
            </div>
            <h3 className="mt-1 truncate text-sm font-semibold text-ink">
              {row.name}
            </h3>
          </div>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${STATUS_TONE[row.status] ?? STATUS_TONE.DEPRECATED}`}
          >
            {row.status}
          </span>
        </header>

        {row.outcome && (
          <p className="line-clamp-2 text-xs text-muted">{row.outcome}</p>
        )}

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <Chip>Tolerance {fmtHours(row.impactToleranceMin)}</Chip>
          {row.fcaToleranceMin && <Chip>FCA {fmtHours(row.fcaToleranceMin)}</Chip>}
          {row.praToleranceMin && <Chip>PRA {fmtHours(row.praToleranceMin)}</Chip>}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {HARM_ICONS.map(({ key, label, icon: Icon }) => {
            const on = row[key] as boolean;
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
                <Icon size={10} />
              </span>
            );
          })}
        </div>

        <footer className="mt-auto flex items-center justify-between border-t border-line pt-3 text-[10px] text-soft">
          <span className="flex items-center gap-1">
            {row.exerciseCount > 0 ? (
              <CheckCircle2 size={10} className="text-emerald-600 dark:text-emerald-300" />
            ) : (
              <ShieldAlert size={10} className="text-rose-600 dark:text-rose-300" />
            )}
            {row.exerciseCount} exercise{row.exerciseCount === 1 ? "" : "s"}
          </span>
          {row.processOwner ? (
            <span className="truncate">Owner: {row.processOwner}</span>
          ) : (
            <span className="text-rose-600 dark:text-rose-300">No owner</span>
          )}
        </footer>
      </article>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">
      {children}
    </span>
  );
}

