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
        select: { name: true, logoBlobUrl: true, accentHex: true },
      })
    : null;
  const accentStyle = accentVars(org?.accentHex ?? null);
  const canManageOrg =
    session?.user?.orgRole === "OWNER" || session?.user?.orgRole === "ADMIN";

  // Notifications feed for the sidebar bell — derived from existing data.
  const notifications = session?.user?.orgId
    ? await loadNotifications(session.user.id, session.user.orgId, { limit: 12 })
    : [];

  return (
    <div
      className="flex min-h-screen bg-surface-0 text-ink"
      style={accentStyle}
    >
      {session?.user && (
        <AppSidebar
          user={{ name: session.user.name, email: session.user.email }}
          orgId={session.user.orgId ?? null}
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
      {/* Skip-to-content link for keyboard users — visually hidden until focused. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-indigo-600 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <ZoneFrame>
        <main
          id="main-content"
          aria-label="Main content"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
        >
          {children}
        </main>
        <footer className="border-t border-line bg-surface-1 py-4 text-center text-xs text-soft">
          SnapFix Simulator · part of the SnapFix platform
        </footer>
      </ZoneFrame>
      {session?.user && <CommandPalette />}
    </div>
  );
}

/**
 * Convert a hex accent colour ("#1f7a8c") into an inline CSS-variable
 * override that retints the brand --accent + --accent-soft tokens.
 * Returns an empty object if no accent is set so the brand defaults
 * apply.
 */
function accentVars(hex: string | null): React.CSSProperties {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return {};
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    ["--accent" as string]: hex,
    ["--accent-soft" as string]: `rgba(${r}, ${g}, ${b}, 0.12)`,
  } as React.CSSProperties;
}
