import type { FirmTier, ImpactLevel, VendorTier } from "@/generated/prisma/enums";

/**
 * Industry presets — opinionated starter packs that seed an org with a
 * realistic role catalogue + IBS register + vendor list for a given firm
 * profile. Applied non-destructively: existing rows by name/abbreviation
 * are skipped, never overwritten.
 *
 * The three presets cover the dominant SnapFix customer profiles:
 *   - tier1-bank        — global universal / tier-1 systemic bank
 *   - tier2-fintech     — digital challenger / BaaS-dependent fintech
 *   - tier3-insurer     — small-mid insurer or building society
 */

export type PresetId = "tier1-bank" | "tier2-fintech" | "tier3-insurer";

export type PresetRole = {
  abbreviation: string;
  title: string;
  responsibility: string;
  isSMF: boolean;
  isExecutive: boolean;
  deputyOf?: string;
};

export type PresetIBS = {
  code: string;
  name: string;
  outcome: string;
  toleranceMin: number;
  fcaToleranceMin?: number;
  praToleranceMin?: number;
  criticality: ImpactLevel;
  coversPeople?: boolean;
  coversProperty?: boolean;
  coversTechnology?: boolean;
  coversDataAvailability?: boolean;
  coversDataIntegrity?: boolean;
  coversThirdParty?: boolean;
  technology?: string[];
  thirdParties?: string[];
};

export type PresetVendor = {
  name: string;
  description?: string;
  serviceKind?: string;
  tier: VendorTier;
  isDoraCritical?: boolean;
  hyperscaler?: string;
  region?: string;
  assuranceKind?: string;
};

export type PresetTechSystem = {
  name: string;
  kind: "APPLICATION" | "INFRASTRUCTURE" | "DATABASE" | "NETWORK" | "AUTH" | "OBSERVABILITY" | "OTHER";
  tier: "CRITICAL" | "ESSENTIAL" | "IMPORTANT" | "ROUTINE";
  description?: string;
  rtoMin?: number;
  rpoMin?: number;
  mtpdMin?: number;
  primaryRegion?: string;
  failoverRegion?: string;
  failoverKind?: "ACTIVE_ACTIVE" | "ACTIVE_PASSIVE" | "WARM_STANDBY" | "COLD_RESTORE" | "NONE";
};

export type Preset = {
  id: PresetId;
  label: string;
  firmTier: FirmTier;
  pitch: string;
  description: string;
  iconEmoji: string;
  roles: PresetRole[];
  ibs: PresetIBS[];
  vendors: PresetVendor[];
  techSystems: PresetTechSystem[];
};

// Shared executive role list — reused with small variations across presets.
const EXEC_BASE: PresetRole[] = [
  {
    abbreviation: "CEO",
    title: "Chief Executive Officer",
    responsibility: "Incident Leader. Chairs the IMT. Final approver on regulator notifications and crisis comms.",
    isSMF: true,
    isExecutive: true,
  },
  {
    abbreviation: "CRO",
    title: "Chief Risk Officer",
    responsibility: "Incident Manager. Runs the process. Owns regulator-facing notifications.",
    isSMF: true,
    isExecutive: true,
    deputyOf: "CEO",
  },
  {
    abbreviation: "CTO",
    title: "Chief Technology Officer",
    responsibility: "Technology lead in the IMT. Authorises infrastructure / system decisions.",
    isSMF: true,
    isExecutive: true,
  },
  {
    abbreviation: "COO",
    title: "Chief Operating Officer",
    responsibility: "People and operational continuity. Coordinates customer ops, BCP activation, premises.",
    isSMF: true,
    isExecutive: true,
  },
];

export const PRESETS: Preset[] = [
  // ────────────────────────────────────────────────────────────────────────
  // Tier-1 Bank — global universal, broad IBS surface, deep regulatory load
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "tier1-bank",
    label: "Tier-1 Bank",
    firmTier: "TIER_1",
    iconEmoji: "🏦",
    pitch: "Global universal / systemic bank — broad IBS surface, deep regulatory load.",
    description:
      "Pre-seeds 12 IMT roles, 8 canonical IBSs (payments, cards, branch, ATM, trading…), the usual tier-1 vendor stack, and a 6-system technical recovery register.",
    roles: [
      ...EXEC_BASE,
      {
        abbreviation: "CFO",
        title: "Chief Financial Officer",
        responsibility: "Financial impact, liquidity, regulatory capital.",
        isSMF: true,
        isExecutive: true,
      },
      {
        abbreviation: "CCO",
        title: "Chief Customer Officer",
        responsibility: "Customer-facing harm assessment. Approves customer comms.",
        isSMF: false,
        isExecutive: true,
      },
      {
        abbreviation: "Head of Compliance",
        title: "Head of Compliance",
        responsibility: "Regulator-facing compliance lead. Drafts notifications.",
        isSMF: true,
        isExecutive: false,
      },
      {
        abbreviation: "Head of External Affairs",
        title: "Head of External Affairs",
        responsibility: "Press, government, social media. Joint sign-off on customer comms with CCO.",
        isSMF: false,
        isExecutive: false,
      },
      {
        abbreviation: "ISM",
        title: "Information Security Manager",
        responsibility: "Cyber lead in the IMT. Coordinates with CTO on technical containment.",
        isSMF: false,
        isExecutive: false,
      },
      {
        abbreviation: "Sn.TPM",
        title: "Senior Technical Programme Manager",
        responsibility: "Coordinates technical workstreams across engineering teams.",
        isSMF: false,
        isExecutive: false,
      },
      {
        abbreviation: "Customer Ops Lead",
        title: "Customer Operations Lead",
        responsibility: "Contact centre, branch operations, customer-facing rotation.",
        isSMF: false,
        isExecutive: false,
      },
      {
        abbreviation: "Treasury Lead",
        title: "Treasury Lead",
        responsibility: "Manages liquidity and PSP funding lines during disruption.",
        isSMF: false,
        isExecutive: false,
      },
    ],
    ibs: [
      {
        code: "IBS_01",
        name: "Domestic payments (Faster Payments / BACS / CHAPS)",
        outcome: "Existing customers can make and receive same-day GBP payments.",
        toleranceMin: 120,
        fcaToleranceMin: 240,
        praToleranceMin: 360,
        criticality: "CRITICAL",
        coversTechnology: true,
        coversDataAvailability: true,
        coversThirdParty: true,
        technology: ["Core ledger", "Payments switch", "FPS gateway"],
        thirdParties: ["Pay.UK / FPS", "ClearBank", "AWS eu-west-2"],
      },
      {
        code: "IBS_02",
        name: "Card transactions (debit / credit auth & clearing)",
        outcome: "Cardholders can make purchases and ATM withdrawals.",
        toleranceMin: 60,
        fcaToleranceMin: 120,
        criticality: "CRITICAL",
        coversTechnology: true,
        coversThirdParty: true,
        technology: ["Card auth", "Token vault"],
        thirdParties: ["Visa", "Mastercard", "Worldpay"],
      },
      {
        code: "IBS_03",
        name: "Branch counter services",
        outcome: "Customers can withdraw cash, deposit cheques and seek help in-branch.",
        toleranceMin: 240,
        criticality: "HIGH",
        coversPeople: true,
        coversProperty: true,
        coversTechnology: true,
      },
      {
        code: "IBS_04",
        name: "ATM network",
        outcome: "Customers can withdraw cash from owned and partner ATMs.",
        toleranceMin: 180,
        criticality: "HIGH",
        coversProperty: true,
        coversTechnology: true,
        coversThirdParty: true,
      },
      {
        code: "IBS_05",
        name: "Online and mobile banking",
        outcome: "Customers can authenticate, see balances, move money.",
        toleranceMin: 60,
        fcaToleranceMin: 120,
        criticality: "CRITICAL",
        coversTechnology: true,
        coversDataAvailability: true,
        technology: ["Mobile API", "Web app", "Identity service"],
      },
      {
        code: "IBS_06",
        name: "Wholesale market access",
        outcome: "Trading desks can execute hedges and access wholesale liquidity.",
        toleranceMin: 60,
        praToleranceMin: 240,
        criticality: "CRITICAL",
        coversTechnology: true,
        coversThirdParty: true,
      },
      {
        code: "IBS_07",
        name: "Lending originations",
        outcome: "New mortgages and loans can be applied for and decisioned.",
        toleranceMin: 480,
        criticality: "MEDIUM",
      },
      {
        code: "IBS_08",
        name: "Customer onboarding (KYC / KYB)",
        outcome: "New customers can complete onboarding and be approved.",
        toleranceMin: 480,
        criticality: "MEDIUM",
        coversThirdParty: true,
        thirdParties: ["Onfido", "ComplyAdvantage"],
      },
    ],
    vendors: [
      { name: "AWS", serviceKind: "Cloud platform", tier: "TIER_1", isDoraCritical: true, hyperscaler: "AWS", region: "eu-west-2", assuranceKind: "SOC2_TYPE_2" },
      { name: "Thought Machine", serviceKind: "Core banking", tier: "TIER_1", isDoraCritical: true, hyperscaler: "GCP", assuranceKind: "SOC2_TYPE_2" },
      { name: "ClearBank", serviceKind: "Agency banking / FPS", tier: "TIER_1", isDoraCritical: true, assuranceKind: "ISAE3402" },
      { name: "Visa", serviceKind: "Card network", tier: "TIER_1", isDoraCritical: true, assuranceKind: "SOC2_TYPE_2" },
      { name: "Mastercard", serviceKind: "Card network", tier: "TIER_1", isDoraCritical: true },
      { name: "Onfido", serviceKind: "KYC", tier: "TIER_2", hyperscaler: "AWS", region: "eu-west-1" },
      { name: "ComplyAdvantage", serviceKind: "AML screening", tier: "TIER_2", hyperscaler: "AWS" },
      { name: "Twilio", serviceKind: "SMS / OTP", tier: "TIER_2" },
      { name: "Salesforce", serviceKind: "CRM", tier: "TIER_3" },
      { name: "ServiceNow", serviceKind: "Incident management", tier: "TIER_3" },
    ],
    techSystems: [
      {
        name: "Core ledger",
        kind: "DATABASE",
        tier: "CRITICAL",
        rtoMin: 30,
        rpoMin: 1,
        mtpdMin: 240,
        primaryRegion: "eu-west-2",
        failoverRegion: "eu-west-1",
        failoverKind: "ACTIVE_PASSIVE",
      },
      {
        name: "Payments switch",
        kind: "APPLICATION",
        tier: "CRITICAL",
        rtoMin: 30,
        rpoMin: 0,
        mtpdMin: 120,
        primaryRegion: "eu-west-2",
        failoverRegion: "eu-west-1",
        failoverKind: "ACTIVE_ACTIVE",
      },
      {
        name: "Identity & access",
        kind: "AUTH",
        tier: "CRITICAL",
        rtoMin: 15,
        rpoMin: 5,
        failoverKind: "ACTIVE_ACTIVE",
      },
      {
        name: "Mobile banking API",
        kind: "APPLICATION",
        tier: "ESSENTIAL",
        rtoMin: 60,
        rpoMin: 5,
        failoverKind: "ACTIVE_PASSIVE",
      },
      {
        name: "Data warehouse",
        kind: "DATABASE",
        tier: "IMPORTANT",
        rtoMin: 720,
        rpoMin: 60,
        failoverKind: "WARM_STANDBY",
      },
      {
        name: "Observability stack",
        kind: "OBSERVABILITY",
        tier: "ESSENTIAL",
        rtoMin: 60,
        failoverKind: "ACTIVE_PASSIVE",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // Tier-2 Fintech — digital challenger / BaaS-dependent fintech
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "tier2-fintech",
    label: "Tier-2 Fintech",
    firmTier: "TIER_2",
    iconEmoji: "📱",
    pitch: "Digital challenger or BaaS-dependent fintech — narrower IBS surface, deep 3rd-party reliance.",
    description: "Pre-seeds 9 lean IMT roles, 5 product-led IBSs, the typical BaaS vendor stack and a 4-system tech-recovery register.",
    roles: [
      ...EXEC_BASE,
      {
        abbreviation: "CCO",
        title: "Chief Customer Officer",
        responsibility: "Customer harm assessment. Approves customer comms.",
        isSMF: false,
        isExecutive: true,
      },
      {
        abbreviation: "Head of Compliance",
        title: "Head of Compliance",
        responsibility: "Regulator-facing lead.",
        isSMF: true,
        isExecutive: false,
      },
      {
        abbreviation: "ISM",
        title: "Information Security Manager",
        responsibility: "Cyber lead in the IMT.",
        isSMF: false,
        isExecutive: false,
      },
      {
        abbreviation: "Comms Lead",
        title: "Communications Lead",
        responsibility: "Customer-facing comms, social media, status page.",
        isSMF: false,
        isExecutive: false,
      },
      {
        abbreviation: "Customer Ops Lead",
        title: "Customer Operations Lead",
        responsibility: "In-app support, chat, complaints triage.",
        isSMF: false,
        isExecutive: false,
      },
    ],
    ibs: [
      {
        code: "IBS_01",
        name: "Domestic payments (Faster Payments)",
        outcome: "Customers can send and receive same-day GBP payments.",
        toleranceMin: 90,
        fcaToleranceMin: 240,
        criticality: "CRITICAL",
        coversTechnology: true,
        coversThirdParty: true,
        thirdParties: ["ClearBank", "Modulr"],
      },
      {
        code: "IBS_02",
        name: "Card transactions",
        outcome: "Customers can spend on their debit card.",
        toleranceMin: 60,
        criticality: "CRITICAL",
        coversThirdParty: true,
        thirdParties: ["Visa", "Marqeta"],
      },
      {
        code: "IBS_03",
        name: "Mobile app authentication",
        outcome: "Customers can sign in and use the app.",
        toleranceMin: 30,
        criticality: "CRITICAL",
        coversTechnology: true,
      },
      {
        code: "IBS_04",
        name: "Account opening",
        outcome: "New customers can complete onboarding and be approved.",
        toleranceMin: 720,
        criticality: "MEDIUM",
        coversThirdParty: true,
      },
      {
        code: "IBS_05",
        name: "In-app support",
        outcome: "Customers can reach a human in chat.",
        toleranceMin: 240,
        criticality: "HIGH",
        coversPeople: true,
      },
    ],
    vendors: [
      { name: "AWS", serviceKind: "Cloud platform", tier: "TIER_1", isDoraCritical: true, hyperscaler: "AWS", region: "eu-west-2", assuranceKind: "SOC2_TYPE_2" },
      { name: "ClearBank", serviceKind: "BaaS / FPS", tier: "TIER_1", isDoraCritical: true, assuranceKind: "ISAE3402" },
      { name: "Marqeta", serviceKind: "Card issuing", tier: "TIER_1", isDoraCritical: true },
      { name: "Modulr", serviceKind: "Payments infrastructure", tier: "TIER_2" },
      { name: "Onfido", serviceKind: "KYC", tier: "TIER_2", hyperscaler: "AWS" },
      { name: "Twilio", serviceKind: "SMS / OTP", tier: "TIER_2" },
      { name: "Intercom", serviceKind: "Customer support", tier: "TIER_3" },
      { name: "Mixpanel", serviceKind: "Product analytics", tier: "TIER_3" },
    ],
    techSystems: [
      {
        name: "Core ledger (Bauplan)",
        kind: "APPLICATION",
        tier: "CRITICAL",
        rtoMin: 60,
        rpoMin: 5,
        primaryRegion: "eu-west-2",
        failoverRegion: "eu-west-1",
        failoverKind: "ACTIVE_PASSIVE",
      },
      {
        name: "Mobile API",
        kind: "APPLICATION",
        tier: "CRITICAL",
        rtoMin: 30,
        failoverKind: "ACTIVE_ACTIVE",
      },
      {
        name: "Identity service",
        kind: "AUTH",
        tier: "CRITICAL",
        rtoMin: 15,
        failoverKind: "ACTIVE_ACTIVE",
      },
      {
        name: "Customer DB (Postgres)",
        kind: "DATABASE",
        tier: "ESSENTIAL",
        rtoMin: 120,
        rpoMin: 1,
        failoverKind: "ACTIVE_PASSIVE",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // Tier-3 Insurer — small-mid insurer or building society
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "tier3-insurer",
    label: "Tier-3 Insurer / Building Society",
    firmTier: "TIER_3",
    iconEmoji: "🏠",
    pitch: "Small-to-mid insurer or mutual — moderate IBS surface, longer tolerances, customer-comms heavy.",
    description: "Pre-seeds 8 IMT roles tuned for non-bank firms, 5 insurance-relevant IBSs (claims, quote, renewal…), the typical underwriting vendor stack and a 3-system tech-recovery register.",
    roles: [
      ...EXEC_BASE,
      {
        abbreviation: "Head of Claims",
        title: "Head of Claims",
        responsibility: "Owns claims service. First lead during a claims-handling outage.",
        isSMF: false,
        isExecutive: true,
      },
      {
        abbreviation: "Head of Underwriting",
        title: "Head of Underwriting",
        responsibility: "Owns the quote engine and risk-acceptance pipeline.",
        isSMF: false,
        isExecutive: true,
      },
      {
        abbreviation: "Head of Compliance",
        title: "Head of Compliance",
        responsibility: "Regulator-facing compliance lead.",
        isSMF: true,
        isExecutive: false,
      },
      {
        abbreviation: "Comms Lead",
        title: "Communications Lead",
        responsibility: "Customer comms, social, broker partner comms.",
        isSMF: false,
        isExecutive: false,
      },
    ],
    ibs: [
      {
        code: "IBS_01",
        name: "Claims first-notification-of-loss",
        outcome: "Customers can report a claim and get an acknowledgement.",
        toleranceMin: 240,
        criticality: "CRITICAL",
        coversPeople: true,
        coversTechnology: true,
      },
      {
        code: "IBS_02",
        name: "Claims payment",
        outcome: "Claims can be settled and paid to the customer's account.",
        toleranceMin: 1440,
        criticality: "HIGH",
        coversThirdParty: true,
      },
      {
        code: "IBS_03",
        name: "Quote and bind",
        outcome: "New customers can be quoted and bound to a policy.",
        toleranceMin: 720,
        criticality: "MEDIUM",
      },
      {
        code: "IBS_04",
        name: "Policy servicing",
        outcome: "Customers can change cover, address, payment details.",
        toleranceMin: 1440,
        criticality: "MEDIUM",
      },
      {
        code: "IBS_05",
        name: "Renewals",
        outcome: "Renewal notices issued on time, customers can act on them.",
        toleranceMin: 4320,
        criticality: "MEDIUM",
      },
    ],
    vendors: [
      { name: "Azure", serviceKind: "Cloud platform", tier: "TIER_1", isDoraCritical: true, hyperscaler: "Azure", region: "uksouth", assuranceKind: "SOC2_TYPE_2" },
      { name: "Guidewire", serviceKind: "Core policy & claims", tier: "TIER_1", isDoraCritical: true },
      { name: "ClearBank", serviceKind: "Claims payments", tier: "TIER_2" },
      { name: "Verisk", serviceKind: "Risk data", tier: "TIER_2" },
      { name: "DocuSign", serviceKind: "Electronic signature", tier: "TIER_3" },
      { name: "Zendesk", serviceKind: "Customer service", tier: "TIER_3" },
    ],
    techSystems: [
      {
        name: "Policy admin (Guidewire)",
        kind: "APPLICATION",
        tier: "CRITICAL",
        rtoMin: 240,
        rpoMin: 30,
        primaryRegion: "uksouth",
        failoverRegion: "ukwest",
        failoverKind: "ACTIVE_PASSIVE",
      },
      {
        name: "Claims portal",
        kind: "APPLICATION",
        tier: "ESSENTIAL",
        rtoMin: 240,
        failoverKind: "ACTIVE_PASSIVE",
      },
      {
        name: "Data warehouse",
        kind: "DATABASE",
        tier: "IMPORTANT",
        rtoMin: 1440,
        rpoMin: 1440,
        failoverKind: "WARM_STANDBY",
      },
    ],
  },
];

export function presetById(id: string): Preset | null {
  return PRESETS.find((p) => p.id === id) ?? null;
}
