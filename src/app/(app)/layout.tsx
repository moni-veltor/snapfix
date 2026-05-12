import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppSidebar from "@/components/AppSidebar";

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
      )?.name ?? null
    : null;
  const canManageOrg =
    session?.user?.orgRole === "OWNER" || session?.user?.orgRole === "ADMIN";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {session?.user && (
        <AppSidebar
          user={{ name: session.user.name, email: session.user.email }}
          orgName={orgName}
          canManageOrg={canManageOrg}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          SnapFix Simulator · part of the SnapFix platform
        </footer>
      </div>
    </div>
  );
}
