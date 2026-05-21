import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Crown,
  Sparkles,
  Users as UsersIcon,
} from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import OrgInviteButton from "./OrgInviteButton";
import OrgBulkImportButton from "./OrgBulkImportButton";
import {
  changeRoleAction,
  removeMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
} from "@/app/actions/org";
import ConfirmButton from "@/components/ConfirmButton";
import TierBadge from "@/components/org/TierBadge";
import TierMinimumsPanel from "@/components/org/TierMinimumsPanel";
import { evaluateTierMinimums } from "@/lib/tier-minimums";

function initials(s: string): string {
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (s[0] ?? "?").toUpperCase();
}

export default async function OrgPage() {
  // Anyone in the org can see this page; only OWNER/ADMIN can act.
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const [org, members, pendingInvitations, tierMinimums, presetEligibility] =
    await Promise.all([
      prisma.organization.findUniqueOrThrow({ where: { id: me.orgId } }),
      prisma.user.findMany({
        where: { orgId: me.orgId },
        orderBy: [{ orgRole: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          orgRole: true,
          createdAt: true,
          _count: { select: { exerciseParticipations: true } },
        },
      }),
      canManage
        ? prisma.invitation.findMany({
            where: { orgId: me.orgId, acceptedAt: null, revokedAt: null },
            orderBy: { createdAt: "desc" },
            include: { invitedBy: { select: { name: true, email: true } } },
          })
        : Promise.resolve([]),
      evaluateTierMinimums(me.orgId),
      // "Looks empty" check — if there are no roles + no IBSs + no vendors,
      // the starter-pack CTA appears so admins can seed the lot in one click.
      canManage
        ? Promise.all([
            prisma.organizationRole.count({ where: { orgId: me.orgId } }),
            prisma.organizationIBS.count({ where: { orgId: me.orgId } }),
            prisma.vendor.count({ where: { orgId: me.orgId } }),
          ]).then(([roles, ibs, vendors]) => roles + ibs + vendors === 0)
        : Promise.resolve(false),
    ]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Admin"
        icon={UsersIcon}
        title={org.name}
        pitch={
          <span className="flex flex-wrap items-center gap-2">
            <TierBadge
              tier={org.tier}
              label={tierMinimums.tierLabel}
              canEditSettings={canManage}
            />
            <span className="text-soft">·</span>
            <span>
              {members.length} {members.length === 1 ? "member" : "members"} · you are{" "}
              <span className="font-medium text-ink">{me.orgRole}</span>
            </span>
          </span>
        }
        actions={
          canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/org/departments"
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
              >
                <Building2 size={14} strokeWidth={2.2} />
                Departments
              </Link>
              <Link
                href="/org/roles"
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
              >
                <Crown size={14} strokeWidth={2.2} />
                Role catalogue
              </Link>
              <OrgBulkImportButton />
              <OrgInviteButton />
            </div>
          ) : undefined
        }
      />

      {canManage && presetEligibility && (
        <Link
          href="/settings/presets"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-300 bg-indigo-50/60 px-5 py-3 text-sm transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card)] dark:border-indigo-700/60 dark:bg-indigo-950/30"
        >
          <span className="flex items-center gap-2 text-ink">
            <Sparkles size={14} className="text-indigo-600 dark:text-indigo-300" />
            <span className="font-semibold">No roles, IBSs or vendors yet.</span>
            <span className="text-muted">
              Apply a {tierMinimums.tierLabel.split(" — ")[0]} starter pack to seed the lot in one click.
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-indigo-600 dark:text-indigo-300">
            Open presets
            <ArrowRight size={11} />
          </span>
        </Link>
      )}

      <TierMinimumsPanel result={tierMinimums} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Members</h2>
        <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface-1">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between p-3 text-sm">
              <Link
                href={`/org/${m.id}`}
                className="-m-3 flex items-center gap-3 rounded-md p-3 hover:bg-surface-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  {initials(m.name ?? m.email)}
                </div>
                <div>
                  <div className="font-medium text-ink">{m.name ?? m.email}</div>
                  <div className="text-xs text-muted">
                    {m.email} · {m._count.exerciseParticipations}{" "}
                    {m._count.exerciseParticipations === 1 ? "exercise" : "exercises"}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-3">
                {canManage && m.id !== me.id ? (
                  <form action={changeRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={m.id} />
                    <select
                      name="role"
                      defaultValue={m.orgRole ?? "MEMBER"}
                      className="rounded border border-line-strong px-2 py-1 text-xs"
                    >
                      {me.orgRole === "OWNER" && <option value="OWNER">OWNER</option>}
                      <option value="ADMIN">ADMIN</option>
                      <option value="MEMBER">MEMBER</option>
                    </select>
                    <button className="rounded border border-line-strong px-2 py-1 text-xs hover:bg-surface-0">
                      Save
                    </button>
                  </form>
                ) : (
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">{m.orgRole}</span>
                )}
                {canManage && m.id !== me.id && (
                  <ConfirmButton
                    action={removeMemberAction}
                    hidden={{ userId: m.id }}
                    label="Remove"
                    title={`Remove ${m.name ?? m.email}?`}
                    body="They'll lose access to the organisation immediately. They can be re-invited later."
                    confirmLabel="Remove"
                    successMessage="Member removed"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {canManage && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pending invitations</h2>
          {pendingInvitations.length === 0 ? (
            <p className="rounded border border-dashed border-line-strong bg-surface-1 p-4 text-sm text-muted">
              No pending invitations.
            </p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface-1">
              {pendingInvitations.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <div className="font-medium">{inv.email}</div>
                    <div className="text-xs text-muted">
                      {inv.role} · invited by{" "}
                      {inv.invitedBy?.name ?? inv.invitedBy?.email ?? "—"} ·
                      {" expires "}
                      {inv.expiresAt.toISOString().slice(0, 10)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <form action={resendInvitationAction}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button className="text-xs text-muted hover:underline">Resend</button>
                    </form>
                    <ConfirmButton
                      action={revokeInvitationAction}
                      hidden={{ id: inv.id }}
                      label="Revoke"
                      title={`Revoke this invitation?`}
                      body={`The invite to ${inv.email} will be cancelled and the accept link will stop working.`}
                      confirmLabel="Revoke"
                      successMessage="Invitation revoked"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

