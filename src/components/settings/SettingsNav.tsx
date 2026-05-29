"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  Image as ImageIcon,
  Layers,
  ListChecks,
  ScrollText,
  ShieldCheck,
  User2,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; hint: string; icon: LucideIcon };

const ITEMS: Item[] = [
  { href: "/settings/profile", label: "Profile", hint: "Name + tier", icon: User2 },
  { href: "/settings/brand", label: "Brand", hint: "Logo + accent", icon: ImageIcon },
  { href: "/settings/presets", label: "Presets", hint: "Tier starter pack", icon: Layers },
  {
    href: "/settings/decision-types",
    label: "Decisions",
    hint: "Org-specific war-room decisions",
    icon: ListChecks,
  },
  { href: "/settings/exercise-rates", label: "Exercise cost", hint: "Per-role hourly rates", icon: Coins },
  {
    href: "/settings/resilience",
    label: "Attestation",
    hint: "SMF + board + cycle",
    icon: ShieldCheck,
  },
  { href: "/audit", label: "Audit log", hint: "Regulator-ready trace", icon: ScrollText },
];

/**
 * Per-section settings sidebar. Sits to the left of every /settings
 * sub-page so the admin can flit between profile, brand, decisions,
 * rates, presets and the audit log without losing context.
 *
 * Active state is computed off `usePathname` rather than passed in,
 * so the layout doesn't have to thread it through every page.
 */
export default function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Settings sections"
      className="lg:sticky lg:top-4 lg:self-start"
    >
      <ul className="flex flex-wrap gap-1 lg:flex-col">
        {ITEMS.map((it) => {
          const active =
            pathname === it.href || pathname.startsWith(`${it.href}/`);
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-all ${
                  active
                    ? "bg-gradient-brand text-white shadow-[var(--shadow-card)]"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{it.label}</span>
                  <span
                    className={`block truncate text-[10px] ${
                      active ? "text-white/80" : "text-soft"
                    }`}
                  >
                    {it.hint}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
