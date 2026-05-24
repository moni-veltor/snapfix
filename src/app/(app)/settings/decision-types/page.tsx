import Link from "next/link";
import { ArrowLeft, Archive, ArchiveRestore, ListChecks, Plus, Save } from "lucide-react";
import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import {
  archiveOrgDecisionTypeAction,
  createOrgDecisionTypeAction,
  unarchiveOrgDecisionTypeAction,
  updateOrgDecisionTypeAction,
} from "@/app/actions/decision-types";

export const metadata = { title: "Decision presets — Settings" };

export default async function DecisionTypesSettingsPage() {
  const me = await requireOrgRole("OWNER", "ADMIN");

  const presets = await prisma.orgDecisionType.findMany({
    where: { orgId: me.orgId },
    orderBy: [{ archived: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const active = presets.filter((p) => !p.archived);
  const archived = presets.filter((p) => p.archived);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Admin"
        icon={ListChecks}
        title="Decision presets"
        pitch="Custom IMT decision vocabulary"
      />

      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
        >
          <ArrowLeft size={12} />
          Back to settings
        </Link>

        <section className="rounded-lg border border-line bg-surface-1 p-5">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Plus size={14} />
            Add a decision preset
          </h2>
          <p className="mt-1 text-xs text-muted">
            Code is a short stable identifier for the audit log (lowercase, hyphenated).
            Approver roles is a comma-separated list of role titles (e.g. <code>CRO, CFO</code>) — leave blank if no formal approval is required.
          </p>
          <form action={createOrgDecisionTypeAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <span className="text-muted">Code</span>
              <input
                name="code"
                required
                pattern="[a-z0-9\-]+"
                placeholder="halt-outbound-payments" aria-label="halt-outbound-payments"
                className="mt-1 w-full rounded-md border border-line-strong px-2 py-1.5 font-mono text-sm text-ink"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted">Label</span>
              <input
                name="label"
                required
                placeholder="Halt outbound payments" aria-label="Halt outbound payments"
                className="mt-1 w-full rounded-md border border-line-strong px-2 py-1.5 text-sm text-ink"
              />
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="text-muted">Hint (optional)</span>
              <input
                name="hint"
                placeholder="One-line guidance shown when this preset is selected" aria-label="One-line guidance shown when this preset is selected"
                className="mt-1 w-full rounded-md border border-line-strong px-2 py-1.5 text-sm text-ink"
              />
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="text-muted">Approver roles (comma-separated)</span>
              <input
                name="approverRolesCsv"
                placeholder="CRO, CFO" aria-label="CRO, CFO"
                className="mt-1 w-full rounded-md border border-line-strong px-2 py-1.5 text-sm text-ink"
              />
            </label>
            <label className="flex items-start gap-2 text-xs sm:col-span-2">
              <input
                type="checkbox"
                name="requiresDualControl"
                value="on"
                className="mt-0.5"
              />
              <span>
                <span className="font-semibold text-ink">Requires dual control</span>
                <span className="block text-soft">
                  4-eyes rule — surfaces a &quot;requires 2 approvers&quot; chip on the
                  decision picker and on the approvals dock.
                </span>
              </span>
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <button className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                <Plus size={12} />
                Add preset
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Active presets ({active.length})
          </h2>
          {active.length === 0 ? (
            <p className="rounded-md border border-dashed border-line bg-surface-1 p-4 text-xs text-muted">
              No custom presets yet. Built-in IMT decisions still work — these add to them.
            </p>
          ) : (
            <ul className="space-y-2">
              {active.map((p) => (
                <li key={p.id} className="rounded-md border border-line bg-surface-1 p-4">
                  <form
                    action={updateOrgDecisionTypeAction}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <input type="hidden" name="id" value={p.id} />
                    <div className="text-xs text-muted sm:col-span-2">
                      Code: <span className="font-mono text-ink">{p.code}</span>
                    </div>
                    <label className="text-xs">
                      <span className="text-muted">Label</span>
                      <input
                        name="label"
                        required
                        defaultValue={p.label}
                        className="mt-1 w-full rounded-md border border-line-strong px-2 py-1.5 text-sm text-ink"
                      />
                    </label>
                    <label className="text-xs">
                      <span className="text-muted">Approver roles (CSV)</span>
                      <input
                        name="approverRolesCsv"
                        defaultValue={p.approverRoles.join(", ")}
                        className="mt-1 w-full rounded-md border border-line-strong px-2 py-1.5 text-sm text-ink"
                      />
                    </label>
                    <label className="text-xs sm:col-span-2">
                      <span className="text-muted">Hint</span>
                      <input
                        name="hint"
                        defaultValue={p.hint ?? ""}
                        className="mt-1 w-full rounded-md border border-line-strong px-2 py-1.5 text-sm text-ink"
                      />
                    </label>
                    <label className="flex items-start gap-2 text-xs sm:col-span-2">
                      <input
                        type="checkbox"
                        name="requiresDualControl"
                        value="on"
                        defaultChecked={p.requiresDualControl}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-semibold text-ink">Requires dual control</span>
                        <span className="block text-soft">
                          4-eyes — surfaces a chip on the decision picker + approvals dock.
                        </span>
                      </span>
                    </label>
                    <div className="sm:col-span-2 flex justify-end gap-2">
                      <button className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-2">
                        <Save size={11} />
                        Save
                      </button>
                    </div>
                  </form>
                  <form action={archiveOrgDecisionTypeAction} className="mt-2 flex justify-end">
                    <input type="hidden" name="id" value={p.id} />
                    <button className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-soft hover:text-rose-700">
                      <Archive size={10} />
                      Archive (hide from form)
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        {archived.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Archived ({archived.length})
            </h2>
            <ul className="space-y-1">
              {archived.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-dashed border-line bg-surface-0 px-3 py-2 text-xs text-muted"
                >
                  <span>
                    <span className="font-mono">{p.code}</span> · {p.label}
                  </span>
                  <form action={unarchiveOrgDecisionTypeAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline">
                      <ArchiveRestore size={10} />
                      Restore
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
