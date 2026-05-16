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

// ─── Per-member profile updates ─────────────────────────────────────────────

const ProfileSchema = z.object({
  userId: z.string().min(1),
  name: z.string().max(120).optional(),
  jobTitle: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  altEmail: z.string().max(200).optional(),
  outOfHoursPhone: z.string().max(40).optional(),
  bio: z.string().max(2000).optional(),
});

function emptyToNull(v: string | undefined): string | null {
  if (v === undefined) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/**
 * Update a member's profile fields. Admins can edit anyone in their org;
 * members can edit themselves. Email / role are not editable here.
 */
export async function updateMemberProfileAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN", "MEMBER");
  const parsed = ProfileSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name") ?? undefined,
    jobTitle: formData.get("jobTitle") ?? undefined,
    location: formData.get("location") ?? undefined,
    phone: formData.get("phone") ?? undefined,
    altEmail: formData.get("altEmail") ?? undefined,
    outOfHoursPhone: formData.get("outOfHoursPhone") ?? undefined,
    bio: formData.get("bio") ?? undefined,
  });
  if (!parsed.success) return;
  const { userId, name, jobTitle, location, phone, altEmail, outOfHoursPhone, bio } =
    parsed.data;

  const canEditAnyone = me.orgRole === "OWNER" || me.orgRole === "ADMIN";
  if (!canEditAnyone && userId !== me.id) return;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { orgId: true },
  });
  if (!target || target.orgId !== me.orgId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: emptyToNull(name) ?? undefined,
      jobTitle: emptyToNull(jobTitle),
      location: emptyToNull(location),
      phone: emptyToNull(phone),
      altEmail: emptyToNull(altEmail),
      outOfHoursPhone: emptyToNull(outOfHoursPhone),
      bio: emptyToNull(bio),
    },
  });

  revalidatePath(`/org/${userId}`);
  revalidatePath("/org");
}

const ChangeRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

// ─── Bulk CSV invite ────────────────────────────────────────────────────────

export type BulkInviteRowResult =
  | { row: number; email: string; status: "created" | "updated" | "skipped"; reason?: string }
  | { row: number; email: string; status: "error"; reason: string };

export type BulkInviteResult =
  | {
      ok: true;
      total: number;
      created: number;
      updated: number;
      skipped: number;
      errors: number;
      rows: BulkInviteRowResult[];
    }
  | { ok: false; error: string };

const BulkInviteRowSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  role: z.enum(["ADMIN", "MEMBER"]),
});

/**
 * Bulk-invite members from a CSV payload. Expected format:
 *
 *   email,role
 *   alice@bank.com,ADMIN
 *   bob@bank.com,MEMBER
 *
 * Header row is optional but recommended. Role column accepts ADMIN / MEMBER
 * (case-insensitive); blank or invalid roles default to MEMBER.
 *
 * Emails are upserted into Invitation just like the single-invite action.
 * Emails belonging to existing org members are skipped (not errored).
 * Emails belonging to a user in another org are flagged as errors.
 *
 * No email is sent per row — the result returns the accept URLs so the admin
 * can choose to email them individually or paste into their own broadcast.
 * (Keeps the action well under serverless time limits for big imports.)
 */
export async function bulkInviteMembersAction(
  _prev: BulkInviteResult | undefined,
  formData: FormData,
): Promise<BulkInviteResult> {
  const user = await requireOrgRole("OWNER", "ADMIN");

  const raw = String(formData.get("csv") ?? "").trim();
  if (!raw) return { ok: false, error: "Paste at least one row of CSV." };

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return { ok: false, error: "No usable rows in the input." };

  // Detect header row — if the first row has "email" in it, skip it.
  const startIdx = /^email/i.test(lines[0]) ? 1 : 0;
  if (lines.length - startIdx === 0) {
    return { ok: false, error: "Only a header row was provided — add at least one member." };
  }

  if (lines.length - startIdx > 500) {
    return {
      ok: false,
      error: "Bulk import is capped at 500 rows per batch. Split your CSV.",
    };
  }

  const rows: BulkInviteRowResult[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = startIdx; i < lines.length; i++) {
    const row = i - startIdx + 1;
    const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const rawEmail = cells[0] ?? "";
    const rawRole = (cells[1] ?? "MEMBER").toUpperCase();

    const parsed = BulkInviteRowSchema.safeParse({
      email: rawEmail,
      role: rawRole === "ADMIN" ? "ADMIN" : "MEMBER",
    });
    if (!parsed.success) {
      errors++;
      rows.push({
        row,
        email: rawEmail,
        status: "error",
        reason: parsed.error.issues.map((e) => e.message).join("; "),
      });
      continue;
    }
    const { email, role } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { orgId: true },
    });
    if (existingUser?.orgId === user.orgId) {
      skipped++;
      rows.push({ row, email, status: "skipped", reason: "already a member of this org" });
      continue;
    }
    if (existingUser?.orgId) {
      errors++;
      rows.push({
        row,
        email,
        status: "error",
        reason: "belongs to a different organisation",
      });
      continue;
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const existing = await prisma.invitation.findUnique({
      where: { orgId_email: { orgId: user.orgId, email } },
      select: { id: true },
    });

    await prisma.invitation.upsert({
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

    if (existing) {
      updated++;
      rows.push({ row, email, status: "updated", reason: "refreshed existing pending invite" });
    } else {
      created++;
      rows.push({ row, email, status: "created" });
    }
  }

  revalidatePath("/org");

  return {
    ok: true,
    total: lines.length - startIdx,
    created,
    updated,
    skipped,
    errors,
    rows,
  };
}

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
