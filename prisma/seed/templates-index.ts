import type { PrismaClient } from "../../src/generated/prisma/client";
import { upsertTemplate } from "./types";
import { cyberRansomware } from "./templates/cyber-ransomware";
import { lossOfCsp } from "./templates/loss-of-csp";
import { nationalPowerOutage } from "./templates/national-power-outage";
import { severeWeather } from "./templates/severe-weather";
import { lossOfTelecoms } from "./templates/loss-of-telecoms";
import { globalPandemic } from "./templates/global-pandemic";
import { allShells } from "./templates/shells";

/**
 * Seed all CMORG DSL templates. Idempotent — each template is identified by its
 * title and replaced if found.
 */
export async function seedSystemTemplates(prisma: PrismaClient): Promise<void> {
  console.log("Seeding CMORG DSL system templates…");
  const templates = [
    cyberRansomware,
    lossOfCsp,
    nationalPowerOutage,
    severeWeather,
    lossOfTelecoms,
    globalPandemic,
    ...allShells,
  ];
  for (const t of templates) {
    await upsertTemplate(prisma, t);
    console.log(`  ✓ ${t.title}`);
  }
  console.log(`✓ ${templates.length} templates seeded.`);
}
