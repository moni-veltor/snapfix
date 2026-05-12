import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SessionWidget from "@/components/SessionWidget";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const orgName = session?.user?.orgId
    ? (
        await prisma.organization.findUnique({
          where: { id: session.user.orgId },
          select: { name: true },
        })
      )?.name
    : null;
  const canManageOrg =
    session?.user?.orgRole === "OWNER" || session?.user?.orgRole === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link
            href={session?.user?.orgId ? "/dashboard" : "/"}
            className="flex items-baseline gap-2 font-semibold tracking-tight"
          >
            <span className="text-indigo-700">SnapFix</span>
            {orgName && (
              <span className="text-xs font-normal text-slate-500">· {orgName}</span>
            )}
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            {session?.user?.orgId && (
              <>
                <Link href="/dashboard" className="hover:underline">
                  Dashboard
                </Link>
                <Link href="/templates" className="hover:underline">
                  Library
                </Link>
                <Link href="/scenarios" className="hover:underline">
                  Scenarios
                </Link>
                <Link href="/exercises" className="hover:underline">
                  Exercises
                </Link>
                <Link href="/calendar" className="hover:underline">
                  Calendar
                </Link>
                <Link href="/ibs" className="hover:underline">
                  IBS
                </Link>
                <Link href="/action-items" className="hover:underline">
                  Actions
                </Link>
                <Link href="/analytics" className="hover:underline">
                  Analytics
                </Link>
                {canManageOrg && (
                  <>
                    <Link href="/org" className="hover:underline">
                      Organisation
                    </Link>
                    <Link href="/audit" className="text-slate-500 hover:underline">
                      Audit
                    </Link>
                    <Link href="/settings" className="text-slate-500 hover:underline">
                      Settings
                    </Link>
                  </>
                )}
              </>
            )}
            <SessionWidget session={session} />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        SnapFix Simulator · part of the SnapFix platform
      </footer>
    </div>
  );
}
