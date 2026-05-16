import Link from "next/link";
import { ArrowLeft, Building2, Plus, Users } from "lucide-react";
import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import ConfirmButton from "@/components/ConfirmButton";
import {
  createDepartmentAction,
  deleteDepartmentAction,
  updateDepartmentAction,
} from "@/app/actions/departments";

export const metadata = { title: "Departments — SnapFix" };

export default async function DepartmentsPage() {
  const me = await requireOrgRole("OWNER", "ADMIN");

  const [departments, members] = await Promise.all([
    prisma.department.findMany({
      where: { orgId: me.orgId },
      orderBy: [{ orderIdx: "asc" }, { name: "asc" }],
      include: {
        parent: { select: { id: true, name: true, abbreviation: true } },
        lead: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, ownedIBS: true, children: true } },
      },
    }),
    prisma.user.findMany({
      where: { orgId: me.orgId },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, name: true, email: true },
    }),
  ]);

  // Bucket by parent for tree-ish render. Top-level first, then children.
  const topLevel = departments.filter((d) => !d.parentId);
  const childrenByParent = new Map<string, typeof departments>();
  for (const d of departments) {
    if (d.parentId) {
      const arr = childrenByParent.get(d.parentId) ?? [];
      arr.push(d);
      childrenByParent.set(d.parentId, arr);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/org"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        Back to organisation
      </Link>

      <PageHero
        eyebrow="Org chart"
        icon={Building2}
        title="Departments"
        pitch="Business units / teams / functions. Separate from your IMT role catalogue: roles are who sits in the war-room during an exercise; departments are where people sit in the org chart day-to-day. IBSs can be owned end-to-end by a department."
      />

      <section className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Total departments" value={departments.length} />
        <StatTile
          label="Top-level"
          value={topLevel.length}
        />
        <StatTile
          label="With named lead"
          value={departments.filter((d) => d.leadId).length}
        />
        <StatTile
          label="Members assigned"
          value={departments.reduce((acc, d) => acc + d._count.members, 0)}
        />
      </section>

      {departments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-8 text-center text-sm text-muted">
          <p className="text-ink">No departments defined yet.</p>
          <p className="mt-1 text-xs">
            Start with your top-level business units — Retail Banking, Wholesale,
            Operations, Technology. You can nest sub-departments later.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {topLevel.map((d) => (
            <DepartmentCard
              key={d.id}
              dept={d}
              members={members}
              departments={departments}
              childrenByParent={childrenByParent}
              depth={0}
            />
          ))}
        </ul>
      )}

      <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
        <header>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Plus size={13} /> Create a new department
          </h2>
          <p className="mt-1 text-xs text-muted">
            Add a top-level business unit or a sub-team under an existing department.
          </p>
        </header>
        <form
          action={createDepartmentAction}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          <label className="text-xs">
            <span className="text-soft">Name *</span>
            <input
              name="name"
              required
              maxLength={120}
              placeholder="Retail Banking Technology"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="text-soft">Abbreviation</span>
            <input
              name="abbreviation"
              maxLength={20}
              placeholder="RBT"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="text-soft">Parent department</span>
            <select
              name="parentId"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
            >
              <option value="">— Top level —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="text-soft">Lead (named accountable person)</span>
            <select
              name="leadId"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
            >
              <option value="">— Unassigned —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs sm:col-span-2">
            <span className="text-soft">Description</span>
            <input
              name="description"
              maxLength={500}
              placeholder="What this department does in one line"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex justify-end sm:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={11} />
              Create department
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

type DepartmentRow = {
  id: string;
  name: string;
  abbreviation: string | null;
  description: string | null;
  parentId: string | null;
  parent: { id: string; name: string; abbreviation: string | null } | null;
  lead: { id: string; name: string | null; email: string } | null;
  leadId: string | null;
  _count: { members: number; ownedIBS: number; children: number };
};

function DepartmentCard({
  dept,
  members,
  departments,
  childrenByParent,
  depth,
}: {
  dept: DepartmentRow;
  members: { id: string; name: string | null; email: string }[];
  departments: DepartmentRow[];
  childrenByParent: Map<string, DepartmentRow[]>;
  depth: number;
}) {
  const kids = childrenByParent.get(dept.id) ?? [];
  return (
    <li>
      <article
        className="rounded-xl border border-line bg-surface-1 p-4"
        style={{ marginLeft: depth * 16 }}
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-ink">{dept.name}</h3>
              {dept.abbreviation && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-200">
                  {dept.abbreviation}
                </span>
              )}
              {dept.parent && (
                <span className="text-[11px] text-soft">
                  under <span className="text-muted">{dept.parent.name}</span>
                </span>
              )}
            </div>
            {dept.description && (
              <p className="mt-1 text-xs text-muted">{dept.description}</p>
            )}
            <p className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted">
              <span>
                <Users size={11} className="mr-1 inline" />
                {dept._count.members} member{dept._count.members === 1 ? "" : "s"}
              </span>
              <span>
                <Building2 size={11} className="mr-1 inline" />
                {dept._count.ownedIBS} IBS owned
              </span>
              {dept.lead ? (
                <span>
                  Lead:{" "}
                  <Link
                    className="text-ink hover:underline"
                    href={`/org/${dept.lead.id}`}
                  >
                    {dept.lead.name ?? dept.lead.email}
                  </Link>
                </span>
              ) : (
                <span className="text-soft">No lead assigned</span>
              )}
              {dept._count.children > 0 && (
                <span>{dept._count.children} sub-department{dept._count.children === 1 ? "" : "s"}</span>
              )}
            </p>
          </div>

          {dept._count.children === 0 && (
            <ConfirmButton
              action={deleteDepartmentAction}
              hidden={{ id: dept.id }}
              label="Delete"
              title={`Delete ${dept.name}?`}
              body="Members assigned to this department will be unassigned. IBSs owned by it will lose the ownership link. Audit-logged."
              confirmLabel="Delete"
              successMessage="Department deleted"
            />
          )}
        </header>

        <details className="mt-3">
          <summary className="cursor-pointer text-[11px] text-muted hover:text-ink">
            Edit
          </summary>
          <form
            action={updateDepartmentAction}
            className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            <input type="hidden" name="id" value={dept.id} />
            <label className="text-xs">
              <span className="text-soft">Name</span>
              <input
                name="name"
                required
                defaultValue={dept.name}
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-soft">Abbreviation</span>
              <input
                name="abbreviation"
                defaultValue={dept.abbreviation ?? ""}
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-soft">Parent</span>
              <select
                name="parentId"
                defaultValue={dept.parentId ?? ""}
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
              >
                <option value="">— Top level —</option>
                {departments
                  .filter((d) => d.id !== dept.id)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="text-soft">Lead</span>
              <select
                name="leadId"
                defaultValue={dept.leadId ?? ""}
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
              >
                <option value="">— Unassigned —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? m.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs sm:col-span-2">
              <span className="text-soft">Description</span>
              <input
                name="description"
                defaultValue={dept.description ?? ""}
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex justify-end sm:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Save changes
              </button>
            </div>
          </form>
        </details>
      </article>

      {kids.length > 0 && (
        <ul className="mt-2 space-y-2">
          {kids.map((c) => (
            <DepartmentCard
              key={c.id}
              dept={c}
              members={members}
              departments={departments}
              childrenByParent={childrenByParent}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-soft">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
