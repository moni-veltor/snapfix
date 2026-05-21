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
import OrgOnboardDrawer from "./OrgOnboardDrawer";
import OrgBulkImportButton from "./OrgBulkImportButton";
import {
  resendInvitationAction,
  revokeInvitationAction,
} from "@/app/actions/org";
import ConfirmButton from "@/components/ConfirmButton";
import TierBadge from "@/components/org/TierBadge";
import TierMinimumsPanel from "@/components/org/TierMinimumsPanel";
import OrgMatrix from "@/components/org/OrgMatrix";
import { evaluateTierMinimums } from "@/lib/tier-minimums";

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
          jobTitle: true,
          location: true,
          phone: true,
          altEmail: true,
          outOfHoursPhone: true,
          department: {
            select: { id: true, name: true, abbreviation: true },
          },
          defaultRoleHoldings: {
            select: {
              id: true,
              abbreviation: true,
              title: true,
              isSMF: true,
              isExecutive: true,
              deputyOfRoleId: true,
            },
          },
          ownedIBS: {
            select: { id: true, code: true, name: true },
            orderBy: { code: "asc" },
            take: 5,
          },
          _count: {
            select: {
              exerciseParticipations: true,
              ownedIBS: true,
              ownedActionItems: { where: { status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } } },
            },
          },
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
              <OrgOnboardDrawer tier={org.tier} />
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

      <OrgMatrix
        canManage={canManage}
        members={members.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          orgRole: m.orgRole,
          jobTitle: m.jobTitle,
          location: m.location,
          phone: m.phone,
          outOfHoursPhone: m.outOfHoursPhone,
          altEmail: m.altEmail,
          department: m.department
            ? {
                id: m.department.id,
                name: m.department.name,
                abbreviation: m.department.abbreviation,
              }
            : null,
          seats: m.defaultRoleHoldings.map((r) => ({
            id: r.id,
            abbreviation: r.abbreviation,
            title: r.title,
            isSMF: r.isSMF,
            isExecutive: r.isExecutive,
            isDeputy: r.deputyOfRoleId !== null,
          })),
          ownedIBSCount: m._count.ownedIBS,
          ownedIBSSample: m.ownedIBS,
          openActionItemsCount: m._count.ownedActionItems,
        }))}
      />

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

