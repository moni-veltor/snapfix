import "server-only";
import { Resend } from "resend";

const fromAddress = process.env.RESEND_FROM ?? "SnapFix <onboarding@resend.dev>";
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export type SendResult =
  | { ok: true; provider: "resend"; id?: string }
  | { ok: true; provider: "console"; loggedLink?: string }
  | { ok: false; error: string };

/**
 * Send an HTML email. If RESEND_API_KEY is not set, the message is logged to
 * the server console so local development works without an account.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  preheaderLink?: string; // the link the user is meant to click — also logged
}): Promise<SendResult> {
  const { to, subject, html, text, preheaderLink } = input;
  if (!resend) {
    console.log("─".repeat(60));
    console.log(`📧 [email disabled — RESEND_API_KEY not set]`);
    console.log(`   to:      ${to}`);
    console.log(`   subject: ${subject}`);
    if (preheaderLink) console.log(`   link:    ${preheaderLink}`);
    console.log("─".repeat(60));
    return { ok: true, provider: "console", loggedLink: preheaderLink };
  }
  const result = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
    text,
  });
  if (result.error) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true, provider: "resend", id: result.data?.id };
}

export function invitationEmail(input: {
  orgName: string;
  inviterName: string | null;
  acceptUrl: string;
  expiresAt: Date;
}): { subject: string; html: string; text: string } {
  const { orgName, inviterName, acceptUrl, expiresAt } = input;
  const inviter = inviterName ?? "Someone";
  const expires = expiresAt.toUTCString();
  const subject = `${inviter} invited you to ${orgName} on SnapFix`;
  const html = `<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;padding:32px;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:32px">
    <h1 style="margin:0 0 8px;font-size:20px">You've been invited to ${escapeHtml(orgName)}</h1>
    <p style="margin:0 0 16px;color:#475569">${escapeHtml(inviter)} has invited you to join their operational resilience workspace on SnapFix.</p>
    <p style="margin:24px 0">
      <a href="${acceptUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Accept invitation</a>
    </p>
    <p style="margin:24px 0 0;font-size:13px;color:#64748b">Or paste this link into your browser:<br><span style="word-break:break-all">${acceptUrl}</span></p>
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8">This invitation expires ${escapeHtml(expires)}.</p>
  </div>
</body></html>`;
  const text = `${inviter} invited you to ${orgName} on SnapFix.\n\nAccept the invitation: ${acceptUrl}\n\nExpires ${expires}.`;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
