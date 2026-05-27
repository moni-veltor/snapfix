import { NextResponse, type NextRequest } from "next/server";

/**
 * Site-wide access gate.
 *
 * Runs on every request (excluding Next internals + obvious static files).
 * If `ACCESS_CODE` is set, redirects to /access unless the request carries
 * the matching cookie. If unset, the gate is disabled (local dev / CI).
 *
 * The cookie value is sha256(ACCESS_CODE) — neither the cookie nor the
 * middleware ever sees the plaintext. Rotating ACCESS_CODE auto-invalidates
 * every existing cookie because the hash changes.
 *
 * Once past the gate, the existing email-password sign-in (NextAuth) takes
 * over for per-user access control. Two layers, distinct purposes.
 */

const COOKIE_NAME = "snapfix_access";

/**
 * Routes that bypass the gate even when ACCESS_CODE is set:
 *   - /access itself (so the gate page is reachable)
 *   - NextAuth callbacks (so OAuth flows still resolve)
 *   - tiny health/metadata endpoints we want public
 */
const SKIP_PATTERNS = [
  /^\/access(?:$|[/?])/,
  /^\/api\/auth\//,
  /^\/api\/health(?:$|[/?])/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
];

export async function middleware(req: NextRequest) {
  const code = process.env.ACCESS_CODE;
  if (!code) return NextResponse.next(); // gate disabled

  const { pathname } = req.nextUrl;
  if (SKIP_PATTERNS.some((re) => re.test(pathname))) return NextResponse.next();

  const expected = await sha256Hex(code);
  const got = req.cookies.get(COOKIE_NAME)?.value;
  if (got && safeEquals(got, expected)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/access";
  url.search = "";
  // Pass the original target so the gate page can bounce back after success.
  // Skip "/" — landing on the gate from root should land on root after, no need to encode.
  if (pathname !== "/") {
    url.searchParams.set("from", pathname + req.nextUrl.search);
  }
  return NextResponse.redirect(url);
}

/**
 * Matcher: everything EXCEPT Next.js internals and anything with a file
 * extension (assets, favicons, etc.). The skip-list inside the handler
 * handles the remaining exceptions (/access, /api/auth/*) so they're
 * legible in one place.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|woff|woff2|ttf|otf)).*)"],
};

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string equality (length-aware). */
function safeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
