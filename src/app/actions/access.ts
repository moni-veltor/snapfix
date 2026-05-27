"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Site-wide access gate — server action.
 *
 * Validates the submitted code against ACCESS_CODE (constant-time compare),
 * sets a 30-day HTTP-only cookie carrying the hash, and redirects back to
 * the page the user was trying to reach. The middleware compares the cookie
 * to sha256(ACCESS_CODE) on every subsequent request.
 *
 * When ACCESS_CODE is unset (local dev / CI), the gate is disabled and the
 * action redirects straight through.
 */

const COOKIE_NAME = "snapfix_access";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type AccessState = { error?: string } | undefined;

export async function submitAccessCodeAction(
  _prev: AccessState,
  formData: FormData,
): Promise<AccessState> {
  const rawCode = formData.get("code");
  const rawFrom = formData.get("from");

  if (typeof rawCode !== "string" || rawCode.length === 0) {
    return { error: "Enter a code." };
  }

  const from = isSafeReturnPath(rawFrom) ? rawFrom : "/";
  const expected = process.env.ACCESS_CODE;

  // Light brute-force delay regardless of outcome (~0.5s).
  await new Promise((r) => setTimeout(r, 500));

  if (!expected) {
    // Gate disabled — let the user through.
    redirect(from);
  }

  const submittedHash = createHash("sha256").update(rawCode).digest();
  const expectedHash = createHash("sha256").update(expected).digest();

  if (
    submittedHash.length !== expectedHash.length ||
    !timingSafeEqual(submittedHash, expectedHash)
  ) {
    return { error: "That code didn't work. Try again, or request a new one." };
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: expectedHash.toString("hex"),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  redirect(from);
}

/**
 * Only allow internal redirects (path-relative, no protocol). Defends
 * against an open redirect via the `?from=` query parameter.
 */
function isSafeReturnPath(value: FormDataEntryValue | null): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  );
}
