import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppSidebar from "@/components/AppSidebar";
import CommandPalette from "@/components/CommandPalette";
import ZoneFrame from "@/components/ZoneFrame";
import { loadNotifications } from "@/lib/notifications";

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

  // Notifications feed for the sidebar bell — derived from existing data.
  const notifications = session?.user?.orgId
    ? await loadNotifications(session.user.id, session.user.orgId, { limit: 12 })
    : [];

  return (
    <div className="flex min-h-screen bg-surface-0 text-ink">
      {session?.user && (
        <AppSidebar
          user={{ name: session.user.name, email: session.user.email }}
          orgName={org?.name ?? null}
          orgLogoUrl={org?.logoBlobUrl ?? null}
          canManageOrg={canManageOrg}
          notifications={notifications.map((n) => ({
            id: n.id,
            kind: n.kind,
            title: n.title,
            body: n.body,
            href: n.href,
            at: n.at.toISOString(),
            weight: n.weight,
          }))}
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
