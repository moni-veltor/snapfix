"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  applyDefaultRolesAction,
  createRoleAction,
  deleteRoleAction,
  moveRoleAction,
  updateRoleAction,
} from "@/app/actions/roles";
import { visualFor, FAMILY_TONE } from "@/lib/role-icons";

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

export default function RoleCatalogueEditor({ roles, members }: Props) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted">
          {roles.length} role{roles.length === 1 ? "" : "s"} in catalogue
        </div>
        <div className="flex flex-wrap gap-2">
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
            onClick={() => setCreating((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {creating ? <X size={12} /> : <Plus size={12} />}
            {creating ? "Cancel" : "Add role"}
          </button>
        </div>
      </div>

      {creating && (
        <RoleForm
          mode="create"
          members={members}
          roles={roles}
          onDone={() => setCreating(false)}
        />
      )}

      <ul className="space-y-2">
        {roles.length === 0 && !creating && (
          <li className="rounded-lg border border-dashed border-line p-8 text-center">
            <Sparkles
              size={20}
              className="mx-auto mb-2 text-indigo-500 dark:text-indigo-300"
            />
            <p className="text-sm font-medium text-ink">
              No roles in the catalogue yet
            </p>
            <p className="mt-1 text-xs text-muted">
              Use &ldquo;Add missing defaults&rdquo; to drop in the canonical
              15 IMT seats, or build your own.
            </p>
          </li>
        )}

        {roles.map((role, i) => (
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
              <RoleRowView
                role={role}
                index={i}
                total={roles.length}
                onEdit={() => setEditingId(role.id)}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RoleRowView({
  role,
  index,
  total,
  onEdit,
}: {
  role: RoleRow;
  index: number;
  total: number;
  onEdit: () => void;
}) {
  const v = visualFor(role.abbreviation);
  const tone = FAMILY_TONE[v.family];
  const Icon = v.icon;
  const inUse = role.seatCount > 0;

  return (
    <div className="group flex flex-wrap items-start gap-3 rounded-lg border border-line bg-surface-1 p-3 transition-colors hover:border-line-strong">
      <div className="flex flex-col items-center gap-0.5 pt-0.5">
        <form action={moveRoleAction}>
          <input type="hidden" name="roleId" value={role.id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            disabled={index === 0}
            aria-label="Move up"
            className="rounded p-1 text-soft hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronUp size={12} />
          </button>
        </form>
        <span className="text-[9px] font-mono text-soft">{index + 1}</span>
        <form action={moveRoleAction}>
          <input type="hidden" name="roleId" value={role.id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            disabled={index === total - 1}
            aria-label="Move down"
            className="rounded p-1 text-soft hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronDown size={12} />
          </button>
        </form>
      </div>

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone.iconBg}`}
      >
        <Icon size={18} className={tone.iconColor} strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-sm font-semibold text-ink">
            {role.abbreviation}
          </span>
          <span className="text-xs text-muted">·</span>
          <span className="truncate text-sm text-ink">{role.title}</span>
          {role.isSMF && (
            <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white">
              SMF
            </span>
          )}
          {role.isExecutive && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${tone.chip}`}
            >
              {tone.label}
            </span>
          )}
          {role.deputyOfAbbreviation && (
            <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
              Dep · {role.deputyOfAbbreviation}
            </span>
          )}
        </div>
        {role.responsibility && (
          <p className="mt-1 text-xs text-muted">{role.responsibility}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-soft">
          {role.defaultHolderName ? (
            <span className="flex items-center gap-1">
              <Users size={10} />
              Normally:{" "}
              <span className="text-muted">{role.defaultHolderName}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Users size={10} />
              No default holder
            </span>
          )}
          {role.seatCount > 0 && (
            <span>
              · {role.seatCount} exercise seat{role.seatCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md p-1.5 text-soft hover:bg-surface-2 hover:text-ink"
          aria-label="Edit role"
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
            aria-label="Delete role"
            title={inUse ? "Role is in use by an exercise seat" : "Delete"}
          >
            <Trash2 size={13} />
          </button>
        </form>
      </div>
    </div>
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
      className="space-y-3 rounded-lg border-2 border-dashed border-indigo-300 bg-surface-1 p-4 dark:border-indigo-700"
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
            placeholder="CTO"
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
            placeholder="Chief Technology Officer"
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
          placeholder="Authorises infrastructure decisions; liaises with critical vendors."
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
