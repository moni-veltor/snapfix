"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const AcceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  password: z.string().min(8).max(200).optional(),
});

export type AcceptResult = { error?: string } | undefined;

/**
 * Accepts an invitation. Branches:
 *  - signed-in user with matching email + no org → join org
 *  - no user with that email → create user with provided name+password, join org
 *  - any other case → return a helpful error
 */
export async function acceptInvitationAction(
  _prev: AcceptResult,
  formData: FormData,
): Promise<AcceptResult> {
  const parsed = AcceptSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name") || undefined,
    password: formData.get("password") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { token, name, password } = parsed.data;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { org: { select: { name: true } } },
  });
  if (!invitation) return { error: "This invitation link is not valid." };
  if (invitation.acceptedAt) return { error: "This invitation has already been used." };
  if (invitation.revokedAt) return { error: "This invitation has been revoked." };
  if (invitation.expiresAt < new Date()) return { error: "This invitation has expired." };

  const session = await auth();

  if (session?.user) {
    // Signed in. The email must match the invitation and the user must not already be in an org.
    if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return {
        error: `You are signed in as ${session.user.email}, but the invitation was sent to ${invitation.email}. Sign out and try again.`,
      };
    }
    if (session.user.orgId) {
      return { error: "You already belong to an organisation. Leave it first to accept a new invitation." };
    }
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          orgId: invitation.orgId,
          orgRole: invitation.role,
          // Only fill blanks — don't clobber existing values the user
          // already set on their profile.
          ...(invitation.prefillJobTitle ? { jobTitle: invitation.prefillJobTitle } : {}),
          ...(invitation.prefillPhone ? { phone: invitation.prefillPhone } : {}),
          ...(invitation.prefillOutOfHoursPhone
            ? { outOfHoursPhone: invitation.prefillOutOfHoursPhone }
            : {}),
          ...(invitation.prefillLocation ? { location: invitation.prefillLocation } : {}),
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);
    redirect("/dashboard");
  }

  // Not signed in. Either create a brand-new user (with supplied password) or send to sign-in.
  const existing = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (existing) {
    // Tell the user to sign in first — accept link will be re-resolved on /sign-in callback.
    return {
      error: "An account with this email already exists. Please sign in first, then revisit the invitation link.",
    };
  }
  if (!name || !password) {
    return { error: "Please provide your name and a password to create your account." };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.create({
      data: {
        email: invitation.email,
        name,
        passwordHash,
        orgId: invitation.orgId,
        orgRole: invitation.role,
        jobTitle: invitation.prefillJobTitle,
        phone: invitation.prefillPhone,
        outOfHoursPhone: invitation.prefillOutOfHoursPhone,
        location: invitation.prefillLocation,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);
  redirect("/sign-in?registered=1");
}
