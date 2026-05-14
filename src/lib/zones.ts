/**
 * Semantic colour zones per page family. Each route in the (app) shell maps
 * to one zone; the zone class swaps `--accent` + `--accent-soft` so links,
 * focus rings, and chart strokes shift hue without rebuilding components.
 *
 *   control    indigo   — daily console (dashboard, action-items, calendar)
 *   exercise   amber    — the heat (exercises, scenarios, templates)
 *   intel      cyan     — analytical (analytics, audit, ibs)
 *   governance violet   — formal (org, settings, vendors)
 *
 * Default = control. Marketing site is its own dark night theme — not
 * covered by zones.
 */

export type Zone = "control" | "exercise" | "intel" | "governance";

export type ZoneTone = {
  label: string;
  cssClass: string;
  accent: string;
  accentSoft: string;
  ring: string;
  chip: string;
};

export const ZONE_TONE: Record<Zone, ZoneTone> = {
  control: {
    label: "Control",
    cssClass: "zone-control",
    accent: "var(--accent)",
    accentSoft: "var(--accent-soft)",
    ring: "ring-indigo-400/30",
    chip: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  },
  exercise: {
    label: "Exercise",
    cssClass: "zone-exercise",
    accent: "#f59e0b",
    accentSoft: "rgba(245, 158, 11, 0.12)",
    ring: "ring-amber-400/30",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  },
  intel: {
    label: "Intelligence",
    cssClass: "zone-intel",
    accent: "#06b6d4",
    accentSoft: "rgba(6, 182, 212, 0.12)",
    ring: "ring-cyan-400/30",
    chip: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  },
  governance: {
    label: "Governance",
    cssClass: "zone-governance",
    accent: "#8b5cf6",
    accentSoft: "rgba(139, 92, 246, 0.12)",
    ring: "ring-violet-400/30",
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  },
};

const ROUTE_PREFIX_TO_ZONE: { prefix: string; zone: Zone }[] = [
  { prefix: "/exercises", zone: "exercise" },
  { prefix: "/scenarios", zone: "exercise" },
  { prefix: "/templates", zone: "exercise" },

  { prefix: "/analytics", zone: "intel" },
  { prefix: "/audit", zone: "intel" },
  { prefix: "/ibs", zone: "intel" },
  { prefix: "/tech-recovery", zone: "intel" },

  { prefix: "/org", zone: "governance" },
  { prefix: "/settings", zone: "governance" },
  { prefix: "/vendors", zone: "governance" },

  { prefix: "/dashboard", zone: "control" },
  { prefix: "/action-items", zone: "control" },
  { prefix: "/calendar", zone: "control" },
  { prefix: "/onboarding", zone: "control" },
];

export function zoneForPath(pathname: string): Zone {
  for (const r of ROUTE_PREFIX_TO_ZONE) {
    if (pathname.startsWith(r.prefix)) return r.zone;
  }
  return "control";
}
