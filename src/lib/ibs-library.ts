import type { FirmTier, ImpactLevel } from "@/generated/prisma/enums";

/**
 * Pre-built IBS library. Drives the /ibs/library catalogue page: admins
 * browse, filter by tier or category, and one-click "Add to register" so
 * they don't have to author every IBS from scratch.
 *
 * Each entry mirrors the OrganizationIBS shape with sensible defaults.
 * Codes here are slugs — they get re-coded with the org's IBS_NN sequence
 * on add.
 */

export type LibraryIBS = {
  slug: string;
  /** Suggested code; replaced with IBS_NN on add. */
  code: string;
  name: string;
  outcome: string;
  category: string;
  tiers: FirmTier[]; // which firm profiles this is typical for
  toleranceMin: number;
  fcaToleranceMin?: number;
  praToleranceMin?: number;
  criticality: ImpactLevel;
  description?: string;
  customerJourneys?: string[];
  productsCovered?: string[];
  technology?: string[];
  thirdParties?: string[];
  information?: string[];
  processes?: string[];
  coversPeople?: boolean;
  coversProperty?: boolean;
  coversTechnology?: boolean;
  coversDataAvailability?: boolean;
  coversDataIntegrity?: boolean;
  coversThirdParty?: boolean;
};

export const IBS_CATEGORIES = [
  "Payments",
  "Customer access",
  "Cards & ATM",
  "Lending",
  "Onboarding",
  "Trading",
  "Insurance",
  "Support",
  "Branch & cash",
  "Treasury",
] as const;

export type IBSCategory = (typeof IBS_CATEGORIES)[number];

export const IBS_LIBRARY: LibraryIBS[] = [
  // ─── Payments ──────────────────────────────────────────────────────────
  {
    slug: "faster-payments",
    code: "FPS_OUT",
    name: "Domestic payments (Faster Payments / BACS / CHAPS)",
    outcome: "Existing customers can make and receive same-day GBP payments.",
    category: "Payments",
    tiers: ["TIER_1", "TIER_2", "TIER_3"],
    toleranceMin: 120,
    fcaToleranceMin: 240,
    praToleranceMin: 360,
    criticality: "CRITICAL",
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    technology: ["Core ledger", "Payments switch", "FPS gateway"],
    thirdParties: ["Pay.UK / FPS", "ClearBank"],
    information: ["Payment instructions", "Account balances"],
    processes: ["Payment authorisation", "Fraud screening"],
    customerJourneys: ["Customer sends a one-off payment", "Customer schedules standing order"],
  },
  {
    slug: "international-payments",
    code: "INT_PAY",
    name: "International payments (SWIFT / SEPA)",
    outcome: "Customers can send and receive cross-border payments.",
    category: "Payments",
    tiers: ["TIER_1", "TIER_2"],
    toleranceMin: 240,
    fcaToleranceMin: 480,
    criticality: "HIGH",
    coversTechnology: true,
    coversThirdParty: true,
    technology: ["Payments switch", "SWIFT gateway"],
    thirdParties: ["SWIFT", "Correspondent bank"],
  },
  {
    slug: "direct-debits",
    code: "DD",
    name: "Direct debits & standing orders",
    outcome: "Outbound automated payments execute on schedule.",
    category: "Payments",
    tiers: ["TIER_1", "TIER_2", "TIER_3"],
    toleranceMin: 1440,
    criticality: "HIGH",
    coversTechnology: true,
    coversThirdParty: true,
  },

  // ─── Customer access ──────────────────────────────────────────────────
  {
    slug: "online-mobile-banking",
    code: "OMB",
    name: "Online and mobile banking",
    outcome: "Customers can authenticate, see balances and move money via app/web.",
    category: "Customer access",
    tiers: ["TIER_1", "TIER_2"],
    toleranceMin: 60,
    fcaToleranceMin: 120,
    criticality: "CRITICAL",
    coversTechnology: true,
    coversDataAvailability: true,
    technology: ["Mobile API", "Web app", "Identity service"],
    information: ["Account balances", "Transaction history"],
    customerJourneys: ["Customer logs in", "Customer checks balance", "Customer sends payment"],
  },
  {
    slug: "customer-authentication",
    code: "AUTH",
    name: "Customer authentication",
    outcome: "Customers can sign in and step up via 2FA across all channels.",
    category: "Customer access",
    tiers: ["TIER_1", "TIER_2", "TIER_3"],
    toleranceMin: 30,
    criticality: "CRITICAL",
    coversTechnology: true,
    coversThirdParty: true,
    technology: ["Identity service", "OTP service"],
    thirdParties: ["Auth0 / Okta", "Twilio"],
  },
  {
    slug: "balance-access",
    code: "BAL",
    name: "Providing access to balances",
    outcome: "Mobile and online channels surface account balances and statements.",
    category: "Customer access",
    tiers: ["TIER_1", "TIER_2"],
    toleranceMin: 60,
    criticality: "CRITICAL",
    coversTechnology: true,
    coversDataAvailability: true,
  },

  // ─── Cards & ATM ──────────────────────────────────────────────────────
  {
    slug: "card-authorisation",
    code: "CARD_AUTH",
    name: "Card transaction authorisation",
    outcome: "Cardholders can make purchases and ATM withdrawals.",
    category: "Cards & ATM",
    tiers: ["TIER_1", "TIER_2"],
    toleranceMin: 60,
    fcaToleranceMin: 120,
    criticality: "CRITICAL",
    coversTechnology: true,
    coversThirdParty: true,
    technology: ["Card auth", "Token vault"],
    thirdParties: ["Visa", "Mastercard", "Marqeta", "Worldpay"],
  },
  {
    slug: "atm-network",
    code: "ATM",
    name: "ATM network access",
    outcome: "Customers can withdraw cash from owned and partner ATMs.",
    category: "Cards & ATM",
    tiers: ["TIER_1"],
    toleranceMin: 180,
    criticality: "HIGH",
    coversProperty: true,
    coversTechnology: true,
    coversThirdParty: true,
  },

  // ─── Lending ──────────────────────────────────────────────────────────
  {
    slug: "mortgage-issuance",
    code: "MTG",
    name: "Issuing and completing a secured loan (mortgage)",
    outcome: "Mortgage applications are processed through to completion.",
    category: "Lending",
    tiers: ["TIER_1", "TIER_2"],
    toleranceMin: 480,
    criticality: "HIGH",
    coversTechnology: true,
    coversThirdParty: true,
  },
  {
    slug: "unsecured-lending",
    code: "LOAN",
    name: "Unsecured lending originations",
    outcome: "New consumer or small-business loans can be applied for and decisioned.",
    category: "Lending",
    tiers: ["TIER_1", "TIER_2", "TIER_3"],
    toleranceMin: 480,
    criticality: "MEDIUM",
  },

  // ─── Onboarding ───────────────────────────────────────────────────────
  {
    slug: "deposit-account-opening",
    code: "DEP_OPEN",
    name: "Deposit account opening",
    outcome: "New deposit accounts (savings, fixed-term) can be opened and funded.",
    category: "Onboarding",
    tiers: ["TIER_1", "TIER_2", "TIER_3"],
    toleranceMin: 240,
    criticality: "HIGH",
    coversThirdParty: true,
    customerJourneys: [
      "Customer applies online",
      "ID&V check passes",
      "Account is created and funded",
    ],
  },
  {
    slug: "kyc-onboarding",
    code: "KYC",
    name: "Customer onboarding (KYC / KYB)",
    outcome: "New customers can complete identity & sanctions checks and be approved.",
    category: "Onboarding",
    tiers: ["TIER_1", "TIER_2", "TIER_3"],
    toleranceMin: 480,
    criticality: "MEDIUM",
    coversThirdParty: true,
    thirdParties: ["Onfido", "ComplyAdvantage", "Sumsub"],
    processes: ["Identity verification", "AML screening", "Sanctions screening"],
    information: ["Customer PII", "KYC documentation"],
  },

  // ─── Trading ──────────────────────────────────────────────────────────
  {
    slug: "wholesale-market",
    code: "WMI",
    name: "Wholesale market access",
    outcome: "Trading desks can execute hedges and access wholesale liquidity.",
    category: "Trading",
    tiers: ["TIER_1"],
    toleranceMin: 60,
    praToleranceMin: 240,
    criticality: "CRITICAL",
    coversTechnology: true,
    coversThirdParty: true,
  },
  {
    slug: "t1-settlement",
    code: "STL",
    name: "Trade settlement (T+1)",
    outcome: "Same- or next-day trade settlement to CSDs and counterparties.",
    category: "Trading",
    tiers: ["TIER_1"],
    toleranceMin: 120,
    praToleranceMin: 240,
    criticality: "CRITICAL",
  },

  // ─── Insurance ────────────────────────────────────────────────────────
  {
    slug: "claims-fnol",
    code: "FNOL",
    name: "Claims first-notification-of-loss",
    outcome: "Customers can report a claim and get an acknowledgement.",
    category: "Insurance",
    tiers: ["TIER_3"],
    toleranceMin: 240,
    criticality: "CRITICAL",
    coversPeople: true,
    coversTechnology: true,
  },
  {
    slug: "claims-payment",
    code: "CLM_PAY",
    name: "Claims payment",
    outcome: "Claims can be settled and paid to the customer's account.",
    category: "Insurance",
    tiers: ["TIER_3"],
    toleranceMin: 1440,
    criticality: "HIGH",
    coversThirdParty: true,
  },
  {
    slug: "policy-quote-bind",
    code: "QUOTE",
    name: "Quote and bind",
    outcome: "New customers can be quoted and bound to a policy.",
    category: "Insurance",
    tiers: ["TIER_3"],
    toleranceMin: 720,
    criticality: "MEDIUM",
  },
  {
    slug: "policy-renewal",
    code: "RENEW",
    name: "Policy renewal",
    outcome: "Renewal notices issued on time, customers can act on them.",
    category: "Insurance",
    tiers: ["TIER_3"],
    toleranceMin: 4320,
    criticality: "MEDIUM",
  },

  // ─── Support ──────────────────────────────────────────────────────────
  {
    slug: "customer-support",
    code: "SUP",
    name: "Customer support contact centre",
    outcome: "Inbound customer support across voice, chat and in-app.",
    category: "Support",
    tiers: ["TIER_1", "TIER_2", "TIER_3"],
    toleranceMin: 240,
    criticality: "HIGH",
    coversPeople: true,
  },
  {
    slug: "urgent-customer-comms",
    code: "URG_COMMS",
    name: "Urgent customer communications channel",
    outcome: "Authoritative outbound channel for urgent customer notifications.",
    category: "Support",
    tiers: ["TIER_1", "TIER_2", "TIER_3"],
    toleranceMin: 120,
    criticality: "HIGH",
    coversTechnology: true,
    coversThirdParty: true,
  },

  // ─── Branch & cash ────────────────────────────────────────────────────
  {
    slug: "branch-counter",
    code: "BRANCH",
    name: "Branch counter services",
    outcome: "Customers can withdraw cash, deposit cheques and seek help in-branch.",
    category: "Branch & cash",
    tiers: ["TIER_1"],
    toleranceMin: 240,
    criticality: "HIGH",
    coversPeople: true,
    coversProperty: true,
    coversTechnology: true,
  },
  {
    slug: "cash-network",
    code: "CASH_NET",
    name: "Cash supply network",
    outcome: "Cash is replenished at branches and ATMs.",
    category: "Branch & cash",
    tiers: ["TIER_1"],
    toleranceMin: 720,
    criticality: "MEDIUM",
    coversThirdParty: true,
  },

  // ─── Treasury ─────────────────────────────────────────────────────────
  {
    slug: "liquidity-management",
    code: "LIQ",
    name: "Intraday liquidity management",
    outcome: "Treasury monitors and adjusts intraday liquidity positions.",
    category: "Treasury",
    tiers: ["TIER_1", "TIER_2"],
    toleranceMin: 60,
    praToleranceMin: 240,
    criticality: "CRITICAL",
  },
];

/** Heuristic — surface the "best matches" for a firm tier first. */
export function relevanceScore(ibs: LibraryIBS, orgTier: FirmTier | null): number {
  if (!orgTier) return 0;
  if (ibs.tiers.includes(orgTier)) return 0; // top
  return 1;
}
