import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppSidebar from "@/components/AppSidebar";
import CommandPalette from "@/components/CommandPalette";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const org = session?.user?.orgId
    ? await prisma.organization.findUnique({
        where: { id: session.user.orgId },
        select: { name: true, logoBlobUrl: true },
      })
    : null;
  const canManageOrg =
    session?.user?.orgRole === "OWNER" || session?.user?.orgRole === "ADMIN";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {session?.user && (
        <AppSidebar
          user={{ name: session.user.name, email: session.user.email }}
          orgName={org?.name ?? null}
          orgLogoUrl={org?.logoBlobUrl ?? null}
          canManageOrg={canManageOrg}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500">
          SnapFix Simulator · part of the SnapFix platform
        </footer>
      </div>
      {session?.user && <CommandPalette />}
    </div>
  );
}
