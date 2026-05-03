"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SignUpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(200),
  role: z.enum(["FACILITATOR", "PARTICIPANT"]),
});

export type AuthFormState = { error?: string } | undefined;

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = SignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, passwordHash, role },
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
