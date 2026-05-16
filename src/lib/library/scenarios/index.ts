import type { LibraryScenario } from "./types";
import { BANKING_SCENARIOS } from "./banking";
import { INSURANCE_SCENARIOS } from "./insurance";
import { PAYMENTS_FINTECH_SCENARIOS } from "./payments-fintech";
import { RETAIL_ECOMMERCE_SCENARIOS } from "./retail-ecommerce";
import { TELECOMS_SCENARIOS } from "./telecoms";
import { ENERGY_UTILITIES_SCENARIOS } from "./energy-utilities";
import { HEALTHCARE_SCENARIOS } from "./healthcare";
import { GOVERNMENT_SCENARIOS } from "./government";
import { AVIATION_TRANSPORT_SCENARIOS } from "./aviation-transport";
import { LOGISTICS_SCENARIOS } from "./logistics";
import { ASSET_WEALTH_SCENARIOS } from "./asset-wealth";
import { MEDIA_BROADCASTING_SCENARIOS } from "./media-broadcasting";
import { HIGHER_ED_SCENARIOS } from "./higher-ed";
import { MANUFACTURING_SCENARIOS } from "./manufacturing";
import { TECHNOLOGY_SAAS_SCENARIOS } from "./technology-saas";
import { LEGAL_PROFESSIONAL_SCENARIOS } from "./legal-professional";

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
  ...TELECOMS_SCENARIOS,
  ...ENERGY_UTILITIES_SCENARIOS,
  ...HEALTHCARE_SCENARIOS,
  ...GOVERNMENT_SCENARIOS,
  ...AVIATION_TRANSPORT_SCENARIOS,
  ...LOGISTICS_SCENARIOS,
  ...ASSET_WEALTH_SCENARIOS,
  ...MEDIA_BROADCASTING_SCENARIOS,
  ...HIGHER_ED_SCENARIOS,
  ...MANUFACTURING_SCENARIOS,
  ...TECHNOLOGY_SAAS_SCENARIOS,
  ...LEGAL_PROFESSIONAL_SCENARIOS,
];

export function libraryScenarioBySlug(slug: string): LibraryScenario | null {
  return LIBRARY_SCENARIOS.find((s) => s.slug === slug) ?? null;
}

export type { LibraryScenario } from "./types";
