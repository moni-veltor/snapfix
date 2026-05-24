"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email";

const NewsletterSchema = z.object({
  email: z.email(),
  source: z.string().max(120).optional(),
});

export type NewsletterState = { ok?: true; error?: string } | undefined;

const CONTACT_INBOX = process.env.CONTACT_INBOX ?? "monica.velasquez.torres@outlook.com";

export async function subscribeNewsletterAction(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = NewsletterSchema.safeParse({
    email: formData.get("email"),
    source: formData.get("source") || undefined,
  });
  if (!parsed.success) {
    return { error: "That email looks off — give it another go?" };
  }
  const { email, source } = parsed.data;

  const subject = `[SnapFix] Newsletter subscription — ${email}`;
  const text = `New newsletter subscription\nEmail: ${email}\nSource: ${source ?? "footer"}\n`;
  const html = `<p>New newsletter subscription</p>
    <p><strong>Email:</strong> ${esc(email)}<br /><strong>Source:</strong> ${esc(source ?? "footer")}</p>`;

  const result = await sendEmail({ to: CONTACT_INBOX, subject, html, text });
  if (!result.ok) return { error: "Couldn't subscribe — try again or email us." };
  return { ok: true };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
