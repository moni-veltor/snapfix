import "server-only";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { OrgRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      orgId: string | null;
      orgRole: OrgRole | null;
    };
  }
  interface User {
    orgId: string | null;
    orgRole: OrgRole | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    orgId: string | null;
    orgRole: OrgRole | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          orgId: user.orgId,
          orgRole: user.orgRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.uid = user.id;
        token.orgId = (user as { orgId: string | null }).orgId;
        token.orgRole = (user as { orgRole: OrgRole | null }).orgRole;
      } else if (trigger === "update" && token.uid) {
        // Refresh org info from DB (e.g. after accepting an invitation)
        const fresh = await prisma.user.findUnique({
          where: { id: token.uid as string },
          select: { orgId: true, orgRole: true },
        });
        if (fresh) {
          token.orgId = fresh.orgId;
          token.orgRole = fresh.orgRole;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid;
        session.user.orgId = token.orgId;
        session.user.orgRole = token.orgRole;
      }
      return session;
    },
  },
};

export const auth = cache(async () => getServerSession(authOptions));

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return session.user;
}

export async function requireOrgUser() {
  const user = await requireUser();
  if (!user.orgId) redirect("/onboarding");
  return user as typeof user & { orgId: string; orgRole: OrgRole };
}

export async function requireOrgRole(...allowed: OrgRole[]) {
  const user = await requireOrgUser();
  if (!user.orgRole || !allowed.includes(user.orgRole)) redirect("/dashboard");
  return user;
}
