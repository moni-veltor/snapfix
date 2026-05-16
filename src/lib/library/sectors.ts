/**
 * Cross-library sector taxonomy. Library entries (scenarios, IBSs,
 * vendors) tag themselves with one or more sectors so customers can
 * filter the catalogue to what's actually relevant to their firm.
 *
 * Pharmaceuticals deliberately excluded — out of scope for SnapFix's
 * current positioning.
 */

export const SECTORS = [
  "banking",
  "insurance",
  "asset-wealth",
  "payments-fintech",
  "telecoms",
  "energy-utilities",
  "retail-ecommerce",
  "healthcare",
  "government",
  "aviation-transport",
  "logistics",
  "media-broadcasting",
  "higher-ed",
  "manufacturing",
  "technology-saas",
  "legal-professional",
] as const;

export type Sector = (typeof SECTORS)[number];

export const SECTOR_LABEL: Record<Sector, string> = {
  banking: "Banking & capital markets",
  insurance: "Insurance",
  "asset-wealth": "Asset & wealth management",
  "payments-fintech": "Payments & fintech",
  telecoms: "Telecoms",
  "energy-utilities": "Energy & utilities",
  "retail-ecommerce": "Retail & e-commerce",
  healthcare: "Healthcare providers",
  government: "Government & public sector",
  "aviation-transport": "Aviation & transport",
  logistics: "Logistics & shipping",
  "media-broadcasting": "Media & broadcasting",
  "higher-ed": "Higher education",
  manufacturing: "Manufacturing",
  "technology-saas": "Technology & SaaS",
  "legal-professional": "Legal & professional services",
};

export const SECTOR_SHORT_LABEL: Record<Sector, string> = {
  banking: "Banking",
  insurance: "Insurance",
  "asset-wealth": "Asset & wealth",
  "payments-fintech": "Payments",
  telecoms: "Telecoms",
  "energy-utilities": "Energy",
  "retail-ecommerce": "Retail",
  healthcare: "Healthcare",
  government: "Government",
  "aviation-transport": "Aviation",
  logistics: "Logistics",
  "media-broadcasting": "Media",
  "higher-ed": "Higher ed",
  manufacturing: "Manufacturing",
  "technology-saas": "Tech / SaaS",
  "legal-professional": "Legal",
};

/**
 * Per-sector pill tone. Library cards show the most-relevant sector as
 * a tinted pill so the visual scan tells you "this is for energy" at
 * a glance.
 */
export const SECTOR_TONE: Record<Sector, string> = {
  banking: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  insurance: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  "asset-wealth": "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-200",
  "payments-fintech": "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  telecoms: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  "energy-utilities": "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
  "retail-ecommerce": "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200",
  healthcare: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  government: "bg-slate-200 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200",
  "aviation-transport": "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  logistics: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  "media-broadcasting": "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200",
  "higher-ed": "bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-200",
  manufacturing: "bg-stone-200 text-stone-800 dark:bg-stone-800/60 dark:text-stone-200",
  "technology-saas": "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200",
  "legal-professional": "bg-zinc-200 text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200",
};

/**
 * Quick-pick groupings used by library grid filter bars. Each group is a
 * one-click way to filter to a cluster of related sectors. The library
 * filter switches into "multi-select" mode when a group is applied —
 * each underlying sector chip becomes a togglable refinement.
 */
export const SECTOR_GROUPS: Array<{ id: string; label: string; sectors: Sector[] }> = [
  {
    id: "financial-services",
    label: "Financial services",
    sectors: ["banking", "insurance", "asset-wealth", "payments-fintech"],
  },
  {
    id: "cni",
    label: "Critical national infrastructure",
    sectors: ["energy-utilities", "telecoms", "aviation-transport", "healthcare"],
  },
  {
    id: "public-sector",
    label: "Public sector",
    sectors: ["government", "healthcare", "higher-ed"],
  },
  {
    id: "consumer",
    label: "Consumer-facing",
    sectors: ["retail-ecommerce", "media-broadcasting"],
  },
  {
    id: "industrial",
    label: "Industrial & supply chain",
    sectors: ["manufacturing", "logistics"],
  },
  {
    id: "tech-professional",
    label: "Tech & professional services",
    sectors: ["technology-saas", "legal-professional"],
  },
];

/**
 * Sectors that lean on similar regulators / threat models — used by the
 * grid to suggest "if you're in X, also consider Y" filter chips.
 */
export const SECTOR_NEIGHBOURS: Partial<Record<Sector, Sector[]>> = {
  banking: ["payments-fintech", "asset-wealth", "insurance"],
  "payments-fintech": ["banking", "retail-ecommerce"],
  insurance: ["banking", "asset-wealth"],
  "asset-wealth": ["banking", "insurance"],
  "energy-utilities": ["telecoms", "manufacturing"],
  telecoms: ["energy-utilities", "media-broadcasting"],
  "retail-ecommerce": ["logistics", "payments-fintech"],
  healthcare: ["government"],
  "aviation-transport": ["logistics", "government"],
  logistics: ["aviation-transport", "manufacturing"],
};
