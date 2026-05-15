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
// Modern resilience pack
import { awsRegionOutage } from "./templates/aws-region-outage";
import { dnsProviderCompromise } from "./templates/dns-provider-compromise";
import { cascadingMicroserviceFailure } from "./templates/cascading-microservice-failure";
import { certificateExpiry } from "./templates/certificate-expiry";
import { badDeploy } from "./templates/bad-deploy";
import { ddosAuth } from "./templates/ddos-auth";
import { supplyChainNpm } from "./templates/supply-chain-npm";
import { databaseCorruption } from "./templates/database-corruption";
import { keyPersonAbsence } from "./templates/key-person-absence";
import { fourthPartyCascade } from "./templates/fourth-party-cascade";
// Tier-specific
import { tier1TradingDisruption } from "./templates/tier1-trading-disruption";
import { tier1DataLeak } from "./templates/tier1-data-leak";
import { tier2CardSchemeOutage } from "./templates/tier2-card-scheme-outage";
import { tier2BankRun } from "./templates/tier2-bank-run";
import { tier3BaasFailure } from "./templates/tier3-baas-failure";
import { tier3AcquisitionSurge } from "./templates/tier3-acquisition-surge";
import { allTierShells } from "./templates/tier-shells";
// New tier-2 scenarios with business + technical injects
import { tier2BaasSoftFail } from "./templates/tier2-baas-soft-fail";
import { tier2MobileCertPin } from "./templates/tier2-mobile-cert-pin";
import { tier2AiFraudFalsePositive } from "./templates/tier2-ai-fraud-false-positive";
import { tier2ViralRun } from "./templates/tier2-viral-run";
// New tier-3 scenarios with business + technical injects
import { tier3ReinsurerDispute } from "./templates/tier3-reinsurer-dispute";
import { tier3BordereauFailure } from "./templates/tier3-bordereau-failure";
import { tier3UnderwritingDrift } from "./templates/tier3-underwriting-drift";
import { tier3AgmDisruption } from "./templates/tier3-agm-disruption";
// AI & algorithmic risk (tier-agnostic)
import { aiPromptInjection } from "./templates/ai-prompt-injection";
import { aiModelBias } from "./templates/ai-model-bias";
import { aiTransparencyFailure } from "./templates/ai-transparency-failure";

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
    // Modern resilience pack — cloud, microservices, supply chain, data, people
    awsRegionOutage,
    dnsProviderCompromise,
    cascadingMicroserviceFailure,
    certificateExpiry,
    badDeploy,
    ddosAuth,
    supplyChainNpm,
    databaseCorruption,
    keyPersonAbsence,
    fourthPartyCascade,
    // Tier-specific
    tier1TradingDisruption,
    tier1DataLeak,
    tier2CardSchemeOutage,
    tier2BankRun,
    tier3BaasFailure,
    tier3AcquisitionSurge,
    ...allTierShells,
    // Tier-2 with business + technical injects
    tier2BaasSoftFail,
    tier2MobileCertPin,
    tier2AiFraudFalsePositive,
    tier2ViralRun,
    // Tier-3 with business + technical injects
    tier3ReinsurerDispute,
    tier3BordereauFailure,
    tier3UnderwritingDrift,
    tier3AgmDisruption,
    // AI & algorithmic risk
    aiPromptInjection,
    aiModelBias,
    aiTransparencyFailure,
  ];
  for (const t of templates) {
    await upsertTemplate(prisma, t);
    console.log(`  ✓ ${t.title}${t.tier ? ` [${t.tier}]` : ""}`);
  }
  console.log(`✓ ${templates.length} templates seeded.`);
}
