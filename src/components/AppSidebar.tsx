"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookMarked,
  FileText,
  Target,
  Calendar,
  CheckSquare,
  Building2,
  Boxes,
  Server,
  BarChart3,
  Users,
  ScrollText,
  Settings,
  Award,
  Gift,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { signOutAction } from "@/app/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";
import ComposeMenu from "@/components/ComposeMenu";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  match?: (pathname: string) => boolean;
};

const PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/templates", label: "Library", icon: BookMarked },
  { href: "/scenarios", label: "Scenarios", icon: FileText },
  { href: "/exercises", label: "Exercises", icon: Target },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/action-items", label: "Action items", icon: CheckSquare },
];

const REGISTRY: NavItem[] = [
  { href: "/ibs", label: "IBS register", icon: Building2 },
  { href: "/vendors", label: "Vendors", icon: Boxes },
  { href: "/tech-recovery", label: "Tech recovery", icon: Server },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const ADMIN: NavItem[] = [
  { href: "/org", label: "Organisation", icon: Users },
  { href: "/audit", label: "Audit log", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

const CULTURE: NavItem[] = [
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/wrapped", label: "Wrapped", icon: Gift },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppSidebar({
  user,
  orgName,
  orgLogoUrl,
  canManageOrg,
}: {
  user: { name: string | null | undefined; email: string };
  orgName: string | null;
  orgLogoUrl?: string | null;
  canManageOrg: boolean;
}) {
  const pathname = usePathname() ?? "/dashboard";
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Hydrate persisted state
  useEffect(() => {
    try {
      const stored = localStorage.getItem("snapfix.sidebar.collapsed");
      if (stored === "1") setCollapsed(true);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("snapfix.sidebar.collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <>
      {/* Mobile top bar (visible on small screens) */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface-1 px-4 py-2 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo size={22} tone="brand" />
          <span className="text-sm font-semibold tracking-tight">SnapFix</span>
        </Link>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-md border border-line-strong px-2 py-1 text-xs"
          aria-label="Toggle menu"
        >
          Menu
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-surface-1 transition-[width,transform] duration-200 ease-out dark:border-slate-800 dark:bg-slate-950 md:sticky md:top-0 md:h-screen ${
          collapsed ? "w-[68px]" : "w-[240px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Top: logo + collapse toggle */}
        <div className="flex h-16 shrink-0 items-center justify-between px-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 overflow-hidden"
            onClick={() => setMobileOpen(false)}
          >
            {orgLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orgLogoUrl}
                alt={orgName ?? "Organisation"}
                className="h-7 w-7 shrink-0 rounded object-contain"
              />
            ) : (
              <Logo size={26} tone="brand" />
            )}
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="truncate text-sm font-semibold tracking-tight text-ink dark:text-slate-100">
                  {orgName ?? "SnapFix"}
                </div>
                <div className="truncate text-[11px] text-muted dark:text-soft">
                  {orgName ? "SnapFix" : "Operational resilience"}
                </div>
              </div>
            )}
          </Link>
          <button
            onClick={toggle}
            className="hidden h-7 w-7 items-center justify-center rounded-md text-soft hover:bg-surface-2 hover:text-ink dark:hover:bg-slate-800 dark:hover:text-slate-200 md:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        {/* Global compose / "+ New" entry-point */}
        {!collapsed && (
          <div className="px-2 pt-2">
            <ComposeMenu canManage={canManageOrg} />
          </div>
        )}

        {/* Sections */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2">
          <NavSection collapsed={collapsed} items={PRIMARY} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <SectionDivider collapsed={collapsed} label="Resilience" />
          <NavSection collapsed={collapsed} items={REGISTRY} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          {canManageOrg && (
            <>
              <SectionDivider collapsed={collapsed} label="Admin" />
              <NavSection collapsed={collapsed} items={ADMIN} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </>
          )}
          <SectionDivider collapsed={collapsed} label="Culture" />
          <NavSection collapsed={collapsed} items={CULTURE} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </nav>

        {/* Bottom: user */}
        <div className="border-t border-line p-2 dark:border-slate-800">
          <div
            className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {initials(user.name ?? user.email)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-ink dark:text-slate-100">
                  {user.name ?? user.email}
                </div>
                <div className="truncate text-[11px] text-muted dark:text-soft">{user.email}</div>
              </div>
            )}
          </div>
          <div className="mt-1">
            <ThemeToggle collapsed={collapsed} />
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className={`mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted hover:bg-surface-2 hover:text-ink dark:text-soft dark:hover:bg-slate-800 dark:hover:text-slate-100 ${
                collapsed ? "justify-center" : ""
              }`}
              title="Sign out"
            >
              <LogOut size={14} />
              {!collapsed && <span>Sign out</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function NavSection({
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors ${
              active
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                : "text-ink hover:bg-surface-2 dark:text-slate-300 dark:hover:bg-slate-800"
            } ${collapsed ? "justify-center px-2" : ""}`}
            title={collapsed ? item.label : undefined}
          >
            <Icon size={16} strokeWidth={active ? 2.4 : 2} />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {active && !collapsed && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

function SectionDivider({ collapsed, label }: { collapsed: boolean; label: string }) {
  if (collapsed) return <div className="my-1 h-px bg-surface-2 dark:bg-slate-800" />;
  return (
    <div className="mt-3 px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-soft dark:text-muted">
      {label}
    </div>
  );
}

function initials(s: string): string {
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (s[0] ?? "?").toUpperCase();
}
