"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "node:crypto";
import { ACCESS_CODE_HASH } from "@/lib/access-code";

/**
 * Site-wide access gate — server action.
 *
 * Hashes the submission and constant-time-compares against the hardwired
 * ACCESS_CODE_HASH in src/lib/access-code.ts. On match, sets a 30-day
 * HttpOnly cookie carrying the hash and redirects to the requested page.
 *
 * When ACCESS_CODE_HASH is empty (gate disabled), the action redirects
 * straight through.
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

  // Light brute-force delay regardless of outcome (~0.5s).
  await new Promise((r) => setTimeout(r, 500));

  if (!ACCESS_CODE_HASH) {
    // Gate disabled — let the user through.
    redirect(from);
  }

  const submittedHashHex = createHash("sha256").update(rawCode).digest("hex");

  // Constant-time compare. Convert both hex strings to equal-length
  // Buffers so timingSafeEqual doesn't bail on length mismatch alone.
  const expectedBuf = Buffer.from(ACCESS_CODE_HASH, "hex");
  const submittedBuf = Buffer.from(submittedHashHex, "hex");
  if (
    expectedBuf.length !== submittedBuf.length ||
    !timingSafeEqual(submittedBuf, expectedBuf)
  ) {
    return { error: "That code didn't work. Try again, or request a new one." };
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: ACCESS_CODE_HASH,
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
