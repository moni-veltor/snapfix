import type { Sector } from "@/lib/library/sectors";
import type { FirmTier } from "@/generated/prisma/enums";

/**
 * Library scenario "shell". Holds the framing, sector tagging and risk
 * coverage flags — not the full event/inject script. Cloning a shell
 * creates a stub Scenario row in the org; the facilitator authors the
 * MSEL events using the existing scenario editor.
 *
 * For scenarios that ship with starter events, populate `seedEvents`
 * (clone action then materialises them as Event rows). Leave empty for
 * pure shells.
 */
export type LibraryScenario = {
  slug: string;
  title: string;
  sectors: Sector[];
  /**
   * Free-text category aligned with the existing Scenario.category convention
   * (e.g. "Technology & Data (Cyber)", "Third Party", "People", "Property",
   * "CNI", "Geopolitical & Macro", "Climate & Environment").
   */
  category: string;
  /** 1-3 paragraphs — what's happening, why it matters, scope of the test. */
  background: string;
  /** Optional firm-tier calibration (banking-style scale: T1 / T2 / T3). */
  tier?: FirmTier;
  /** Bullet-form scenario characteristics. */
  characteristics: string[];
  /** Bullet-form planning assumptions. */
  assumptions: string[];
  /** 6-box CMORG risk-coverage matrix. */
  coversPeople?: boolean;
  coversProperty?: boolean;
  coversTechnology?: boolean;
  coversDataAvailability?: boolean;
  coversDataIntegrity?: boolean;
  coversThirdParty?: boolean;
  /** Suggested exercise length, minutes. Defaults to 120 if omitted. */
  durationMin?: number;
  /** One-line wrap-up the facilitator can use to close. */
  takeaways?: string;
  /** Strategic-Risk-Register reference (e.g. "3.1", "8.2") if applicable. */
  srrRef?: string;
  /** Real-world reference incident the scenario is patterned on. */
  caseStudy?: {
    title: string;
    causation?: string;
    impactScale?: string;
    duration?: string;
    sourceUrl?: string;
  };
  /**
   * Optional starter events — if present, the clone action materialises
   * these as `Event` rows on the new Scenario. Keep small (≤5); the
   * facilitator fleshes the rest out themselves.
   */
  seedEvents?: Array<{
    eventNo: number;
    scheduledTime: string; // HH:MM
    title: string;
    description: string;
    expectedActions?: string[];
    objectives?: string[];
  }>;
};
