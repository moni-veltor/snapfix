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
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { name, email, password, organizationName } = parsed.data;

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
      data: { name: organizationName, slug },
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
  // Clear NextAuth's session cookies. (We're using JWT strategy, so no DB row to delete.)
  const cookieStore = await cookies();
  for (const name of [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
  ]) {
    cookieStore.delete(name);
  }
  redirect("/");
}
