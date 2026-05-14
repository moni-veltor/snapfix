"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const SignUpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(200),
  organizationName: z.string().min(1).max(120),
  tier: z.enum(["TIER_1", "TIER_2", "TIER_3"]).optional(),
});

export type AuthFormState = { error?: string } | undefined;

/**
 * First-user sign-up. Creates the Organization and the user as OWNER.
 * (Invitees go through /accept-invitation/[token] instead.)
 */
export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = SignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationName: formData.get("organizationName"),
    tier: formData.get("tier") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { name, email, password, organizationName, tier } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const baseSlug = slugify(organizationName) || "org";
    let slug = baseSlug;
    let suffix = 1;
    while (await tx.organization.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
    const org = await tx.organization.create({
      data: { name: organizationName, slug, tier: tier ?? null },
    });
    await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        orgId: org.id,
        orgRole: "OWNER",
      },
    });
  });

  redirect("/sign-in?registered=1");
}

export async function signOutAction() {
  // Clear NextAuth's session cookies. (We're using JWT strategy, so no DB row
  // to delete.) `cookieStore.delete()` is unreliable for cookies with explicit
  // path / secure / __Host- prefixes, so we override with maxAge:0 + matching
  // path which forces the browser to expire them.
  const cookieStore = await cookies();
  const cookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    // Some deployments use a chunked variant for large JWTs
    "next-auth.session-token.0",
    "next-auth.session-token.1",
    "__Secure-next-auth.session-token.0",
    "__Secure-next-auth.session-token.1",
  ];
  for (const name of cookieNames) {
    cookieStore.set(name, "", {
      maxAge: 0,
      path: "/",
      expires: new Date(0),
      sameSite: "lax",
      // Match the secure setting of the original cookie when running under HTTPS.
      secure: name.startsWith("__Secure-") || name.startsWith("__Host-"),
    });
  }
  // Redirect to /sign-in with a marker so the sign-in page can opt out of its
  // "you're already signed in, jump to dashboard" auto-redirect.
  redirect("/sign-in?signedOut=1");
}
