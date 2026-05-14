import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppSidebar from "@/components/AppSidebar";
import CommandPalette from "@/components/CommandPalette";
import ZoneFrame from "@/components/ZoneFrame";

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
    <div className="flex min-h-screen bg-surface-0 text-ink">
      {session?.user && (
        <AppSidebar
          user={{ name: session.user.name, email: session.user.email }}
          orgName={org?.name ?? null}
          orgLogoUrl={org?.logoBlobUrl ?? null}
          canManageOrg={canManageOrg}
        />
      )}
      <ZoneFrame>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-line bg-surface-1 py-4 text-center text-xs text-soft">
          SnapFix Simulator · part of the SnapFix platform
        </footer>
      </ZoneFrame>
      {session?.user && <CommandPalette />}
    </div>
  );
}
