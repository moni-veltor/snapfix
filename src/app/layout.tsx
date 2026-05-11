import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SessionWidget from "@/components/SessionWidget";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SnapFix — Operational Resilience",
  description:
    "Plan, run, and learn from operational resilience exercises. Multi-tenant workspace for incident management, scenario design, and after-action reporting.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const orgName = session?.user?.orgId
    ? (await prisma.organization.findUnique({
        where: { id: session.user.orgId },
        select: { name: true },
      }))?.name
    : null;
  const canManageOrg = session?.user?.orgRole === "OWNER" || session?.user?.orgRole === "ADMIN";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-baseline gap-2 font-semibold tracking-tight">
              <span>SnapFix</span>
              {orgName && <span className="text-xs font-normal text-slate-500">· {orgName}</span>}
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              {session?.user?.orgId && (
                <>
                  <Link href="/scenarios" className="hover:underline">
                    Scenarios
                  </Link>
                  <Link href="/runs" className="hover:underline">
                    Runs
                  </Link>
                  {canManageOrg && (
                    <Link href="/org" className="hover:underline">
                      Organisation
                    </Link>
                  )}
                </>
              )}
              <SessionWidget session={session} />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          SnapFix · Operational resilience exercise platform
        </footer>
      </body>
    </html>
  );
}
