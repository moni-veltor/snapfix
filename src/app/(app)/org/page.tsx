import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InviteForm from "./InviteForm";
import {
  changeRoleAction,
  removeMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
} from "@/app/actions/org";
import ConfirmButton from "@/components/ConfirmButton";

function initials(s: string): string {
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (s[0] ?? "?").toUpperCase();
}

export default async function OrgPage() {
  // Anyone in the org can see this page; only OWNER/ADMIN can act.
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const [org, members, pendingInvitations] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {members.length} {members.length === 1 ? "member" : "members"} · You are{" "}
          <span className="font-medium text-slate-700">{me.orgRole}</span>
        </p>
      </header>

      {canManage && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Invite a teammate</h2>
          <InviteForm />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Members</h2>
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-md border border-slate-200 bg-white">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between p-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  {initials(m.name ?? m.email)}
                </div>
                <div>
                  <div className="font-medium">{m.name ?? m.email}</div>
                  <div className="text-xs text-slate-500">
                    {m.email} · {m._count.exerciseParticipations}{" "}
                    {m._count.exerciseParticipations === 1 ? "exercise" : "exercises"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {canManage && m.id !== me.id ? (
                  <form action={changeRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={m.id} />
                    <select
                      name="role"
                      defaultValue={m.orgRole ?? "MEMBER"}
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                    >
                      {me.orgRole === "OWNER" && <option value="OWNER">OWNER</option>}
                      <option value="ADMIN">ADMIN</option>
                      <option value="MEMBER">MEMBER</option>
                    </select>
                    <button className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                      Save
                    </button>
                  </form>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{m.orgRole}</span>
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
            <p className="rounded border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              No pending invitations.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-md border border-slate-200 bg-white">
              {pendingInvitations.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <div className="font-medium">{inv.email}</div>
                    <div className="text-xs text-slate-500">
                      {inv.role} · invited by{" "}
                      {inv.invitedBy?.name ?? inv.invitedBy?.email ?? "—"} ·
                      {" expires "}
                      {inv.expiresAt.toISOString().slice(0, 10)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <form action={resendInvitationAction}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button className="text-xs text-slate-600 hover:underline">Resend</button>
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

