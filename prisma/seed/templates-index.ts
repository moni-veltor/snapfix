import type { PrismaClient } from "../../src/generated/prisma/client";
import { upsertTemplate } from "./types";
// CMORG (tier-agnostic)
import { cyberRansomware } from "./templates/cyber-ransomware";
import { insiderDataExfil } from "./templates/insider-data-exfil";
import { lossOfCsp } from "./templates/loss-of-csp";
import { nationalPowerOutage } from "./templates/national-power-outage";
import { severeWeather } from "./templates/severe-weather";
import { lossOfTelecoms } from "./templates/loss-of-telecoms";
import { globalPandemic } from "./templates/global-pandemic";
import { allShells } from "./templates/shells";
// Tier-specific
import { tier1TradingDisruption } from "./templates/tier1-trading-disruption";
import { tier1DataLeak } from "./templates/tier1-data-leak";
import { tier2CardSchemeOutage } from "./templates/tier2-card-scheme-outage";
import { tier2BankRun } from "./templates/tier2-bank-run";
import { tier3BaasFailure } from "./templates/tier3-baas-failure";
import { tier3AcquisitionSurge } from "./templates/tier3-acquisition-surge";
import { allTierShells } from "./templates/tier-shells";

/**
 * Seed all system-level scenario templates. Idempotent — each template is
 * identified by title and replaced if found.
 */
export async function seedSystemTemplates(prisma: PrismaClient): Promise<void> {
  console.log("Seeding scenario templates (CMORG + tier-specific)…");
  const templates = [
    // CMORG library (applies to all tiers)
    cyberRansomware,
    insiderDataExfil,
    lossOfCsp,
    nationalPowerOutage,
    severeWeather,
    lossOfTelecoms,
    globalPandemic,
    ...allShells,
    // Tier-specific
    tier1TradingDisruption,
    tier1DataLeak,
    tier2CardSchemeOutage,
    tier2BankRun,
    tier3BaasFailure,
    tier3AcquisitionSurge,
    ...allTierShells,
  ];
  for (const t of templates) {
    await upsertTemplate(prisma, t);
    console.log(`  ✓ ${t.title}${t.tier ? ` [${t.tier}]` : ""}`);
  }
  console.log(`✓ ${templates.length} templates seeded.`);
}
