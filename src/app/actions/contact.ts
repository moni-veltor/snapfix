"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email";

const ContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.email(),
  firm: z.string().min(1).max(120),
  tier: z.string().optional(),
  interest: z.string().min(1).max(40),
  message: z.string().max(5000).optional(),
});

export type ContactState = { ok?: true; error?: string } | undefined;

const CONTACT_INBOX = process.env.CONTACT_INBOX ?? "monica.velasquez.torres@outlook.com";

export async function sendContactMessageAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    firm: formData.get("firm"),
    tier: formData.get("tier") || undefined,
    interest: formData.get("interest"),
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { name, email, firm, tier, interest, message } = parsed.data;

  const subject = `[SnapFix] New ${interest} enquiry from ${firm}`;
  const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a">
    <h2 style="margin:0 0 12px">New enquiry from snapfix.app/contact</h2>
    <p><strong>Name:</strong> ${esc(name)}<br />
       <strong>Email:</strong> ${esc(email)}<br />
       <strong>Firm:</strong> ${esc(firm)}<br />
       <strong>Tier:</strong> ${esc(tier ?? "—")}<br />
       <strong>Interest:</strong> ${esc(interest)}</p>
    ${message ? `<p><strong>Message:</strong></p><div style="border-left:3px solid #4f46e5;padding-left:12px;color:#475569;white-space:pre-wrap">${esc(message)}</div>` : ""}
  </body></html>`;
  const text = `New enquiry\nName: ${name}\nEmail: ${email}\nFirm: ${firm}\nTier: ${tier ?? "—"}\nInterest: ${interest}\n${message ? `\nMessage:\n${message}` : ""}`;

  const result = await sendEmail({ to: CONTACT_INBOX, subject, html, text });
  if (!result.ok) return { error: `Could not send: ${result.error}` };
  return { ok: true };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
