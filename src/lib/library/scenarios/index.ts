import type { LibraryScenario } from "./types";
import { BANKING_SCENARIOS } from "./banking";
import { INSURANCE_SCENARIOS } from "./insurance";
import { PAYMENTS_FINTECH_SCENARIOS } from "./payments-fintech";
import { RETAIL_ECOMMERCE_SCENARIOS } from "./retail-ecommerce";

/**
 * Flattened catalogue of all library scenarios across sectors. Authored
 * sector-by-sector in `./{sector}.ts` and re-exported here.
 *
 * Slugs are unique across the whole catalogue (the action looks up by
 * slug); duplicates would silently shadow each other.
 */
export const LIBRARY_SCENARIOS: LibraryScenario[] = [
  ...BANKING_SCENARIOS,
  ...INSURANCE_SCENARIOS,
  ...PAYMENTS_FINTECH_SCENARIOS,
  ...RETAIL_ECOMMERCE_SCENARIOS,
];

export function libraryScenarioBySlug(slug: string): LibraryScenario | null {
  return LIBRARY_SCENARIOS.find((s) => s.slug === slug) ?? null;
}

export type { LibraryScenario } from "./types";
