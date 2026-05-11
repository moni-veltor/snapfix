"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { invitationEmail, sendEmail } from "@/lib/email";
import type { OrgRole } from "@/generated/prisma/client";

const INVITE_TTL_DAYS = 14;

async function originFromHeaders(): Promise<string> {
  const h = await headers();
  const explicit = process.env.NEXTAUTH_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const InviteSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type InviteResult =
  | { ok: true; emailed: boolean; acceptUrl: string }
  | { ok: false; error: string };

export async function inviteMemberAction(
  _prev: InviteResult | undefined,
  formData: FormData,
): Promise<InviteResult> {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const parsed = InviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { email, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser?.orgId) {
    return { ok: false, error: "That email already belongs to a member of an organisation." };
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  // Upsert: refresh a pending invite for the same email rather than erroring on the
  // (orgId, email) unique constraint.
  const invitation = await prisma.invitation.upsert({
    where: { orgId_email: { orgId: user.orgId, email } },
    create: {
      orgId: user.orgId,
      email,
      role,
      token,
      invitedById: user.id,
      expiresAt,
    },
    update: {
      role,
      token,
      invitedById: user.id,
      expiresAt,
      acceptedAt: null,
      revokedAt: null,
    },
  });

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: user.orgId },
    select: { name: true },
  });

  const origin = await originFromHeaders();
  const acceptUrl = `${origin}/accept-invitation/${invitation.token}`;
  const mail = invitationEmail({
    orgName: org.name,
    inviterName: user.name ?? null,
    acceptUrl,
    expiresAt,
  });
  const sent = await sendEmail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    preheaderLink: acceptUrl,
  });

  revalidatePath("/org");

  if (!sent.ok) {
    return { ok: false, error: `Invitation created but email failed: ${sent.error}` };
  }
  return { ok: true, emailed: sent.provider === "resend", acceptUrl };
}

export async function revokeInvitationAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  await prisma.invitation.updateMany({
    where: { id, orgId: user.orgId, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  revalidatePath("/org");
}

export async function resendInvitationAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  const invite = await prisma.invitation.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!invite || invite.acceptedAt || invite.revokedAt) return;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.invitation.update({
    where: { id: invite.id },
    data: { token, expiresAt },
  });

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: user.orgId },
    select: { name: true },
  });
  const origin = await originFromHeaders();
  const acceptUrl = `${origin}/accept-invitation/${token}`;
  const mail = invitationEmail({
    orgName: org.name,
    inviterName: user.name ?? null,
    acceptUrl,
    expiresAt,
  });
  await sendEmail({
    to: invite.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    preheaderLink: acceptUrl,
  });
  revalidatePath("/org");
}

export async function removeMemberAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const targetId = String(formData.get("userId"));
  if (targetId === user.id) return; // can't remove yourself
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { orgId: true, orgRole: true } });
  if (!target || target.orgId !== user.orgId) return;
  // Only an OWNER can remove an OWNER, and we never leave an org with zero owners.
  if (target.orgRole === "OWNER" && user.orgRole !== "OWNER") return;
  if (target.orgRole === "OWNER") {
    const ownerCount = await prisma.user.count({ where: { orgId: user.orgId, orgRole: "OWNER" } });
    if (ownerCount <= 1) return;
  }
  await prisma.user.update({
    where: { id: targetId },
    data: { orgId: null, orgRole: null },
  });
  revalidatePath("/org");
}

const ChangeRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

export async function changeRoleAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const parsed = ChangeRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return;
  const { userId, role } = parsed.data as { userId: string; role: OrgRole };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { orgId: true, orgRole: true },
  });
  if (!target || target.orgId !== user.orgId) return;
  // Only OWNERs can promote/demote OWNERs; never leave the org with zero owners.
  if ((target.orgRole === "OWNER" || role === "OWNER") && user.orgRole !== "OWNER") return;
  if (target.orgRole === "OWNER" && role !== "OWNER") {
    const ownerCount = await prisma.user.count({ where: { orgId: user.orgId, orgRole: "OWNER" } });
    if (ownerCount <= 1) return;
  }
  await prisma.user.update({ where: { id: userId }, data: { orgRole: role } });
  revalidatePath("/org");
}
