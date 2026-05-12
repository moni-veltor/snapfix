import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import AcceptForm from "./AcceptForm";

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      org: { select: { name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });
  if (!invitation) notFound();

  const session = await auth();
  const isUsed = !!invitation.acceptedAt;
  const isRevoked = !!invitation.revokedAt;
  const isExpired = invitation.expiresAt < new Date();
  const existingAccount = await prisma.user.findUnique({
    where: { email: invitation.email },
    select: { id: true, orgId: true },
  });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Join {invitation.org.name}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {(invitation.invitedBy?.name ?? invitation.invitedBy?.email) ?? "Someone"} invited{" "}
          <span className="font-medium">{invitation.email}</span> to join as{" "}
          <span className="font-medium">{invitation.role}</span>.
        </p>
      </header>

      {isUsed && <Banner kind="warn">This invitation has already been used.</Banner>}
      {isRevoked && <Banner kind="warn">This invitation has been revoked.</Banner>}
      {isExpired && !isUsed && !isRevoked && (
        <Banner kind="warn">This invitation has expired. Ask the admin to send a fresh one.</Banner>
      )}

      {!isUsed && !isRevoked && !isExpired && (
        <>
          {session?.user ? (
            session.user.email.toLowerCase() === invitation.email.toLowerCase() && !session.user.orgId ? (
              <AcceptForm token={token} mode="signed-in" />
            ) : session.user.email.toLowerCase() !== invitation.email.toLowerCase() ? (
              <Banner kind="warn">
                You're signed in as <span className="font-mono">{session.user.email}</span>, but this invitation
                is for <span className="font-mono">{invitation.email}</span>.{" "}
                <Link href="/" className="underline">
                  Go home
                </Link>{" "}
                and sign out before continuing.
              </Banner>
            ) : (
              <Banner kind="warn">
                You already belong to an organisation.{" "}
                <Link href="/org" className="underline">
                  Open organisation
                </Link>
                .
              </Banner>
            )
          ) : existingAccount ? (
            <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
              An account with this email already exists. Please{" "}
              <Link href={`/sign-in?next=${encodeURIComponent(`/accept-invitation/${token}`)}`} className="underline">
                sign in
              </Link>{" "}
              first, then return to this page to accept.
            </div>
          ) : (
            <AcceptForm token={token} mode="new-account" email={invitation.email} />
          )}
        </>
      )}
    </div>
  );
}

function Banner({ kind, children }: { kind: "warn" | "ok"; children: React.ReactNode }) {
  const colour =
    kind === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";
  return <div className={`rounded-md border p-3 text-sm ${colour}`}>{children}</div>;
}
