/**
 * Pure helpers for the analytics page's URL-driven filter state.
 * Imported by both server components (analytics/page.tsx) and the client
 * FilterBar, so this module deliberately has NO React or DB imports.
 */

export const RANGE_PRESETS: { key: string; label: string; days: number | null }[] = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "1y", label: "Last 12 months", days: 365 },
  { key: "ytd", label: "Year to date", days: null },
  { key: "all", label: "All time", days: null },
];

export type DateRange = { from: Date | null; to: Date; label: string };

/** Resolve the date range from URL params for use by server-side queries. */
export function resolveDateRange(rangeKey: string | undefined | null): DateRange {
  const to = new Date();
  if (!rangeKey || rangeKey === "all") return { from: null, to, label: "All time" };
  if (rangeKey === "ytd") {
    const from = new Date(to.getFullYear(), 0, 1);
    return { from, to, label: "Year to date" };
  }
  const preset = RANGE_PRESETS.find((p) => p.key === rangeKey);
  if (!preset || !preset.days) return { from: null, to, label: "All time" };
  const from = new Date(to.getTime() - preset.days * 24 * 60 * 60 * 1000);
  return { from, to, label: preset.label };
}

export type AnalyticsFilters = {
  range: string;
  jurisdiction: string;
  classification: string;
  ibsIds: string[];
};

export function parseFiltersFromSearchParams(sp: Record<string, string | string[] | undefined>): AnalyticsFilters {
  const s = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    range: s("range") ?? "1y",
    jurisdiction: s("jurisdiction") ?? "",
    classification: s("classification") ?? "",
    ibsIds: (s("ibsIds") ?? "")
      .split(",")
      .filter(Boolean),
  };
}
