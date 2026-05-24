"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Crown,
  Edit3,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  applyDefaultRolesAction,
  createRoleAction,
  deleteRoleAction,
  moveRoleAction,
  updateRoleAction,
} from "@/app/actions/roles";
import {
  FAMILY_TONE,
  visualFor,
  type RoleFamily,
} from "@/lib/role-icons";

type RoleRow = {
  id: string;
  abbreviation: string;
  title: string;
  responsibility: string | null;
  isSMF: boolean;
  isExecutive: boolean;
  deputyOfRoleId: string | null;
  deputyOfAbbreviation: string | null;
  defaultHolderId: string | null;
  defaultHolderName: string | null;
  defaultHolderEmail: string | null;
  seatCount: number;
  orderIdx: number;
};

type Member = { id: string; name: string | null; email: string };

type Props = {
  roles: RoleRow[];
  members: Member[];
};

type Filter = "all" | RoleFamily;

const FAMILY_FILTERS: { id: Filter; label: string; hint: string }[] = [
  { id: "all", label: "All", hint: "Every seat in one place" },
  { id: "executive", label: "Executive", hint: "C-suite & strategic" },
  { id: "tactical", label: "Tactical", hint: "Engineering & ops" },
  { id: "comms", label: "Communications", hint: "Customer & press" },
  { id: "compliance", label: "Compliance", hint: "Risk & legal" },
  { id: "other", label: "Other", hint: "Custom & specialist" },
];

/** SMF first, then executive, then by user-defined order. */
function seniorityCompare(a: RoleRow, b: RoleRow): number {
  if (a.isSMF !== b.isSMF) return a.isSMF ? -1 : 1;
  if (a.isExecutive !== b.isExecutive) return a.isExecutive ? -1 : 1;
  return a.orderIdx - b.orderIdx;
}

function familyOf(role: RoleRow): RoleFamily {
  return visualFor(role.abbreviation).family;
}

export default function RoleCatalogueEditor({ roles, members }: Props) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const out: Record<RoleFamily, RoleRow[]> = {
      executive: [],
      tactical: [],
      comms: [],
      compliance: [],
      other: [],
    };
    for (const r of roles) {
      out[familyOf(r)].push(r);
    }
    for (const k of Object.keys(out) as RoleFamily[]) {
      out[k].sort(seniorityCompare);
    }
    return out;
  }, [roles]);

  const q = query.trim().toLowerCase();
  const matches = (r: RoleRow) =>
    q === "" ||
    r.abbreviation.toLowerCase().includes(q) ||
    r.title.toLowerCase().includes(q) ||
    (r.responsibility ?? "").toLowerCase().includes(q);

  const visibleFamilies: RoleFamily[] =
    filter === "all"
      ? (["executive", "tactical", "comms", "compliance", "other"] as RoleFamily[])
      : [filter];

  const visibleCount = visibleFamilies.reduce(
    (acc, f) => acc + grouped[f].filter(matches).length,
    0,
  );

  return (
    <section className="space-y-5">
      {/* Top controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by abbreviation, title or responsibility…"
            className="w-full rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <form action={applyDefaultRolesAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
            title="Add any missing canonical IMT roles without overwriting existing ones"
          >
            <RotateCcw size={12} />
            Add missing defaults
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setCreating((v) => !v);
            setEditingId(null);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {creating ? <X size={12} /> : <Plus size={12} />}
          {creating ? "Cancel" : "Add role"}
        </button>
      </div>

      {/* Family tabs */}
      <div role="tablist" className="flex flex-wrap gap-1">
        {FAMILY_FILTERS.map((f) => {
          const count =
            f.id === "all"
              ? roles.length
              : grouped[f.id as RoleFamily].length;
          const active = filter === f.id;
          const tone = f.id !== "all" ? FAMILY_TONE[f.id as RoleFamily] : null;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? tone
                    ? `${tone.chip} ring-2 ring-offset-1 ring-offset-surface-0 ${tone.ring.replace("border-", "ring-")}`
                    : "bg-slate-900 text-white dark:bg-indigo-500"
                  : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                  active
                    ? "bg-white/40 text-current dark:bg-black/30"
                    : "bg-surface-2 text-soft"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inline create form */}
      {creating && (
        <RoleForm
          mode="create"
          members={members}
          roles={roles}
          onDone={() => setCreating(false)}
        />
      )}

      {/* Empty state when nothing matches */}
      {visibleCount === 0 && !creating && (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-10 text-center">
          <Sparkles size={20} className="mx-auto mb-2 text-indigo-500 dark:text-indigo-300" />
          <p className="text-sm font-medium text-ink">
            {roles.length === 0
              ? "No roles in the catalogue yet"
              : "No roles match this view"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {roles.length === 0
              ? "Use “Add missing defaults” to drop in the canonical 15 IMT seats, or build your own."
              : "Try a different category or clear your search."}
          </p>
        </div>
      )}

      {/* Family sections */}
      <div className="space-y-6">
        {visibleFamilies.map((fam) => {
          const items = grouped[fam].filter(matches);
          if (items.length === 0) return null;
          const tone = FAMILY_TONE[fam];
          return (
            <section key={fam}>
              <header className="mb-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.chip}`}
                >
                  {tone.label}
                </span>
                <span className="text-[11px] text-soft">
                  {items.length} seat{items.length === 1 ? "" : "s"} ·
                  {" "}seniority order
                </span>
              </header>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((role, idx) => (
                  <li key={role.id}>
                    {editingId === role.id ? (
                      <RoleForm
                        mode="edit"
                        role={role}
                        members={members}
                        roles={roles}
                        onDone={() => setEditingId(null)}
                      />
                    ) : (
                      <RoleCard
                        role={role}
                        familyIndex={idx}
                        familyTotal={items.length}
                        onEdit={() => {
                          setEditingId(role.id);
                          setCreating(false);
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function RoleCard({
  role,
  familyIndex,
  familyTotal,
  onEdit,
}: {
  role: RoleRow;
  familyIndex: number;
  familyTotal: number;
  onEdit: () => void;
}) {
  const v = visualFor(role.abbreviation);
  const tone = FAMILY_TONE[v.family];
  const Icon = v.icon;
  const inUse = role.seatCount > 0;

  return (
    <article
      className={`group relative flex h-full flex-col rounded-xl border bg-surface-1 p-4 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${tone.ring}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone.iconBg}`}
          >
            <Icon size={20} className={tone.iconColor} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-sm font-semibold text-ink">
              {role.abbreviation}
            </div>
            <div className="truncate text-xs text-muted">{role.title}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-1.5 text-soft hover:bg-surface-2 hover:text-ink"
            aria-label={`Edit ${role.abbreviation}`}
            title="Edit"
          >
            <Edit3 size={13} />
          </button>
          <form action={deleteRoleAction}>
            <input type="hidden" name="roleId" value={role.id} />
            <button
              type="submit"
              disabled={inUse}
              className="rounded-md p-1.5 text-soft hover:bg-rose-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
              aria-label={`Delete ${role.abbreviation}`}
              title={inUse ? "Role is in use by an exercise seat" : "Delete"}
            >
              <Trash2 size={13} />
            </button>
          </form>
        </div>
      </header>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-1">
        {role.isSMF && (
          <Badge icon={ShieldCheck}>SMF</Badge>
        )}
        {role.isExecutive && (
          <Badge icon={Crown}>Executive</Badge>
        )}
        {role.deputyOfAbbreviation && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
            Deputy · {role.deputyOfAbbreviation}
          </span>
        )}
      </div>

      {/* Responsibility */}
      {role.responsibility && (
        <p className="mt-3 line-clamp-3 text-xs text-muted">
          {role.responsibility}
        </p>
      )}

      {/* Footer */}
      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <div className="flex items-center gap-1.5 text-[10px] text-soft">
          <Users size={10} />
          {role.defaultHolderName ? (
            <span className="truncate text-muted">
              {role.defaultHolderName}
            </span>
          ) : (
            <span>No default holder</span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <form action={moveRoleAction}>
            <input type="hidden" name="roleId" value={role.id} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              disabled={familyIndex === 0}
              aria-label="Move up"
              className="rounded p-1 text-soft hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronUp size={11} />
            </button>
          </form>
          <form action={moveRoleAction}>
            <input type="hidden" name="roleId" value={role.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              disabled={familyIndex === familyTotal - 1}
              aria-label="Move down"
              className="rounded p-1 text-soft hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronDown size={11} />
            </button>
          </form>
        </div>
      </footer>

      {role.seatCount > 0 && (
        <span className="absolute right-3 top-3 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800 opacity-100 transition-opacity group-hover:opacity-0 dark:bg-emerald-950/40 dark:text-emerald-200">
          {role.seatCount} active
        </span>
      )}
    </article>
  );
}

function Badge({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
      <Icon size={9} />
      {children}
    </span>
  );
}

function RoleForm({
  mode,
  role,
  members,
  roles,
  onDone,
}: {
  mode: "create" | "edit";
  role?: RoleRow;
  members: Member[];
  roles: RoleRow[];
  onDone: () => void;
}) {
  const action = mode === "create" ? createRoleAction : updateRoleAction;
  const eligibleDeputyOf = roles.filter((r) => r.id !== role?.id);

  return (
    <form
      action={async (fd) => {
        await action(fd);
        onDone();
      }}
      className="space-y-3 rounded-xl border-2 border-dashed border-indigo-300 bg-surface-1 p-4 dark:border-indigo-700"
    >
      {mode === "edit" && (
        <input type="hidden" name="roleId" value={role!.id} />
      )}

      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Abbreviation
          </label>
          <input
            name="abbreviation"
            required
            maxLength={40}
            defaultValue={role?.abbreviation ?? ""}
            placeholder="CTO" aria-label="CTO"
            className="mt-1 w-full rounded-md border border-line bg-surface-0 px-2 py-1.5 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Title
          </label>
          <input
            name="title"
            required
            maxLength={120}
            defaultValue={role?.title ?? ""}
            placeholder="Chief Technology Officer" aria-label="Chief Technology Officer"
            className="mt-1 w-full rounded-md border border-line bg-surface-0 px-2 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Responsibility (one line)
        </label>
        <input
          name="responsibility"
          maxLength={500}
          defaultValue={role?.responsibility ?? ""}
          placeholder="Authorises infrastructure decisions; liaises with critical vendors." aria-label="Authorises infrastructure decisions; liaises with critical vendors."
          className="mt-1 w-full rounded-md border border-line bg-surface-0 px-2 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Deputy of
          </label>
          <select
            name="deputyOfRoleId"
            defaultValue={role?.deputyOfRoleId ?? "none"}
            className="mt-1 w-full rounded-md border border-line bg-surface-0 px-2 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="none">— None —</option>
            {eligibleDeputyOf.map((r) => (
              <option key={r.id} value={r.id}>
                {r.abbreviation} · {r.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Default holder
          </label>
          <select
            name="defaultHolderId"
            defaultValue={role?.defaultHolderId ?? "none"}
            className="mt-1 w-full rounded-md border border-line bg-surface-0 px-2 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="none">— None —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? m.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            name="isSMF"
            defaultChecked={role?.isSMF ?? false}
            className="rounded border-line"
          />
          <span className="font-medium text-ink">SMF-flagged</span>
          <span className="text-soft">(senior manager function)</span>
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            name="isExecutive"
            defaultChecked={role?.isExecutive ?? false}
            className="rounded border-line"
          />
          <span className="font-medium text-ink">Executive</span>
          <span className="text-soft">(C-suite or equivalent)</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-line bg-surface-0 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {mode === "create" ? "Add role" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
