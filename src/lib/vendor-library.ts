import type { VendorTier } from "@/generated/prisma/enums";

/**
 * Pre-built vendor library — opinionated catalogue of vendors active in
 * UK banking + fintech. Drives the /vendors/library page so admins can
 * one-click-add the providers they actually use instead of typing them
 * by hand.
 *
 * Each entry mirrors the Vendor model shape; fields beyond name +
 * service-kind + suggested tier are best-effort defaults you'd want to
 * refine post-add (contract dates, assurance, exit plan). DORA-critical
 * is marked true for tier-1 rails and core providers.
 */

export type LibraryVendor = {
  slug: string;
  name: string;
  serviceKind: string;
  category: VendorCategory;
  description: string;
  suggestedTier: VendorTier;
  isDoraCritical: boolean;
  hyperscaler?: string;
  region?: string;
  /** Industry-typical assurance — admins refine to the specific report. */
  assuranceKind?: "SOC2_TYPE_2" | "SOC2_TYPE_1" | "ISAE3402" | "ISO27001";
  statusUrl?: string;
};

export const VENDOR_CATEGORIES = [
  "Core banking",
  "Payments",
  "Card issuing",
  "Open banking",
  "KYC / Identity",
  "AML / Sanctions",
  "Fraud",
  "Reconciliations",
  "Documents & e-sign",
  "Cloud & infra",
  "Communications",
  "Customer & CRM",
  "Treasury",
] as const;

export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export const VENDOR_LIBRARY: LibraryVendor[] = [
  // ─── Core banking ─────────────────────────────────────────────────────
  {
    slug: "thought-machine",
    name: "Thought Machine",
    serviceKind: "Cloud-native core banking (Vault)",
    category: "Core banking",
    description:
      "Smart-contract-based core banking ledger. Used by Lloyds, Standard Chartered, JP Morgan and Atom Bank.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
    hyperscaler: "GCP",
    assuranceKind: "SOC2_TYPE_2",
    statusUrl: "https://status.thoughtmachine.io",
  },
  {
    slug: "mambu",
    name: "Mambu",
    serviceKind: "SaaS composable core banking",
    category: "Core banking",
    description:
      "Cloud banking platform used by digital-first banks (N26, OakNorth, Western Union). Multi-product ledger.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
    hyperscaler: "AWS",
  },
  {
    slug: "temenos",
    name: "Temenos",
    serviceKind: "Core banking suite (Transact, Infinity)",
    category: "Core banking",
    description:
      "Established core banking provider with deep functional coverage; multi-deployment (on-prem, SaaS, cloud).",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
  },
  {
    slug: "10x-banking",
    name: "10x Banking",
    serviceKind: "Cloud-native banking platform",
    category: "Core banking",
    description:
      "UK-built next-gen banking platform; powers Westpac Australia and Chase UK. Real-time ledger.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
    hyperscaler: "AWS",
  },
  {
    slug: "tuum",
    name: "Tuum",
    serviceKind: "Modular core banking",
    category: "Core banking",
    description: "Estonian core banking platform; modular product suite, EU/UK focus.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
  },
  {
    slug: "finastra",
    name: "Finastra",
    serviceKind: "Banking & trade-finance platform",
    category: "Core banking",
    description: "Global financial software — Fusion suite for banking, trade, lending and treasury.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
  },
  {
    slug: "pismo",
    name: "Pismo",
    serviceKind: "Cloud-native processing platform",
    category: "Core banking",
    description: "Brazilian-origin processing platform; cards + core banking, owned by Visa.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
    hyperscaler: "AWS",
  },

  // ─── Payments ─────────────────────────────────────────────────────────
  {
    slug: "clearbank",
    name: "ClearBank",
    serviceKind: "Agency banking / Faster Payments / CHAPS",
    category: "Payments",
    description:
      "UK agency clearing bank — direct Faster Payments, BACS and CHAPS access for non-clearing fintechs.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
    assuranceKind: "ISAE3402",
  },
  {
    slug: "modulr",
    name: "Modulr",
    serviceKind: "Embedded payments + accounts API",
    category: "Payments",
    description:
      "FCA-regulated payments infrastructure — Faster Payments, BACS, SEPA, virtual accounts. UK + Europe.",
    suggestedTier: "TIER_2",
    isDoraCritical: true,
    hyperscaler: "AWS",
  },
  {
    slug: "form3",
    name: "Form3",
    serviceKind: "Cloud-native payments processing",
    category: "Payments",
    description: "API-first payments processor for FPS, BACS, SEPA Inst, CHAPS. Used by Goldman Sachs, Nationwide.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
  },
  {
    slug: "stripe",
    name: "Stripe",
    serviceKind: "Card acquiring + payments platform",
    category: "Payments",
    description: "Global card acquirer + payments orchestration. Wide-ranging product surface.",
    suggestedTier: "TIER_1",
    isDoraCritical: false,
    hyperscaler: "AWS",
    assuranceKind: "SOC2_TYPE_2",
    statusUrl: "https://status.stripe.com",
  },
  {
    slug: "adyen",
    name: "Adyen",
    serviceKind: "Unified commerce + acquiring",
    category: "Payments",
    description: "Global acquirer with EU banking licence; multi-channel (online, in-store, embedded).",
    suggestedTier: "TIER_1",
    isDoraCritical: false,
  },
  {
    slug: "gocardless",
    name: "GoCardless",
    serviceKind: "Direct-debit collections",
    category: "Payments",
    description: "Recurring payments collection across BACS / SEPA / ACH. UK-headquartered.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
    hyperscaler: "AWS",
  },
  {
    slug: "swift",
    name: "SWIFT",
    serviceKind: "International payments messaging",
    category: "Payments",
    description: "Global financial-messaging network. Underpins international correspondent banking.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
    assuranceKind: "ISAE3402",
  },
  {
    slug: "pay-uk-fps",
    name: "Pay.UK / FPS",
    serviceKind: "Faster Payments scheme operator",
    category: "Payments",
    description: "UK retail payments operator — Faster Payments Service, BACS, Cheque Image Clearing.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
  },
  {
    slug: "visa",
    name: "Visa",
    serviceKind: "Card network",
    category: "Payments",
    description: "Global card network — auth, clearing, settlement.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
  },
  {
    slug: "mastercard",
    name: "Mastercard",
    serviceKind: "Card network",
    category: "Payments",
    description: "Global card network — auth, clearing, settlement.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
  },

  // ─── Card issuing ─────────────────────────────────────────────────────
  {
    slug: "marqeta",
    name: "Marqeta",
    serviceKind: "Modern card issuing",
    category: "Card issuing",
    description: "Open-API card issuing — used by Klarna, Revolut, Affirm.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
    hyperscaler: "AWS",
  },
  {
    slug: "enfuce",
    name: "Enfuce",
    serviceKind: "Card issuing + processing",
    category: "Card issuing",
    description: "EU card-issuing fintech; commonly used by mid-market issuers in the Nordics.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
  {
    slug: "stripe-issuing",
    name: "Stripe Issuing",
    serviceKind: "Card issuing",
    category: "Card issuing",
    description: "Programmatic virtual + physical card issuing via Stripe.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
    hyperscaler: "AWS",
  },

  // ─── Open banking ─────────────────────────────────────────────────────
  {
    slug: "truelayer",
    name: "TrueLayer",
    serviceKind: "Open Banking payments + data",
    category: "Open banking",
    description: "UK-leading PSD2 / Open Banking API — payments + account data aggregation.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
    hyperscaler: "AWS",
  },
  {
    slug: "tink",
    name: "Tink",
    serviceKind: "Open Banking platform (EU)",
    category: "Open banking",
    description: "Swedish-origin Open Banking aggregator now owned by Visa.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
  {
    slug: "plaid",
    name: "Plaid",
    serviceKind: "Financial data network",
    category: "Open banking",
    description: "Account aggregation + data network — global presence, big in US, growing in EU/UK.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
  {
    slug: "yapily",
    name: "Yapily",
    serviceKind: "Headless Open Banking API",
    category: "Open banking",
    description: "API-only Open Banking provider; used by fintechs needing a clean infra layer.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },

  // ─── KYC / Identity ───────────────────────────────────────────────────
  {
    slug: "onfido",
    name: "Onfido",
    serviceKind: "Identity verification (KYC / IDV)",
    category: "KYC / Identity",
    description: "UK-built ID&V — document scan + selfie biometrics + liveness. Used by Revolut, Monzo and many more.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
    hyperscaler: "AWS",
    region: "eu-west-1",
  },
  {
    slug: "sumsub",
    name: "Sumsub",
    serviceKind: "KYC / KYB / transaction monitoring",
    category: "KYC / Identity",
    description: "All-in-one verification platform — KYC, KYB and ongoing monitoring.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
  {
    slug: "veriff",
    name: "Veriff",
    serviceKind: "Identity verification",
    category: "KYC / Identity",
    description: "Estonian-built IDV with broad document and language coverage.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
  {
    slug: "jumio",
    name: "Jumio",
    serviceKind: "Identity verification",
    category: "KYC / Identity",
    description: "Established AI-powered IDV with broad global presence.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },

  // ─── AML / Sanctions ──────────────────────────────────────────────────
  {
    slug: "complyadvantage",
    name: "ComplyAdvantage",
    serviceKind: "AML screening + transaction monitoring",
    category: "AML / Sanctions",
    description: "UK-built financial-crime risk data + transaction monitoring.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
  {
    slug: "refinitiv-world-check",
    name: "Refinitiv World-Check",
    serviceKind: "Sanctions + PEP screening",
    category: "AML / Sanctions",
    description: "Industry-standard sanctions + PEP + adverse-media data feed.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
  {
    slug: "nice-actimize",
    name: "NICE Actimize",
    serviceKind: "AML + financial-crime suite",
    category: "AML / Sanctions",
    description: "Tier-1 AML + fraud detection suite used by large banks.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
  },
  {
    slug: "quantexa",
    name: "Quantexa",
    serviceKind: "Entity-resolution + financial-crime",
    category: "AML / Sanctions",
    description: "UK-headquartered entity-resolution + graph analytics; widely used in tier-1 banks.",
    suggestedTier: "TIER_1",
    isDoraCritical: false,
  },

  // ─── Fraud ────────────────────────────────────────────────────────────
  {
    slug: "featurespace",
    name: "Featurespace",
    serviceKind: "Real-time fraud + AML decisioning",
    category: "Fraud",
    description: "UK-built ARIC platform — used by HSBC, NatWest, TSB.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
  },
  {
    slug: "forter",
    name: "Forter",
    serviceKind: "E-commerce fraud detection",
    category: "Fraud",
    description: "Real-time fraud-prevention platform for digital commerce.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },

  // ─── Reconciliations ──────────────────────────────────────────────────
  {
    slug: "duco",
    name: "Duco",
    serviceKind: "Data reconciliation",
    category: "Reconciliations",
    description: "Self-service reconciliation platform — used widely in capital markets and treasury.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
  {
    slug: "autorek",
    name: "AutoRek",
    serviceKind: "Financial reconciliation + reporting",
    category: "Reconciliations",
    description: "UK-built reconciliations + regulatory reporting (CASS, FRC) platform.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
  {
    slug: "smartstream",
    name: "SmartStream",
    serviceKind: "Reconciliation + reference data",
    category: "Reconciliations",
    description: "Enterprise TLM reconciliations + reference-data utilities.",
    suggestedTier: "TIER_1",
    isDoraCritical: false,
  },

  // ─── Documents & e-sign ───────────────────────────────────────────────
  {
    slug: "docusign",
    name: "DocuSign",
    serviceKind: "E-signature + agreement",
    category: "Documents & e-sign",
    description: "Industry-standard e-signature + agreement cloud.",
    suggestedTier: "TIER_3",
    isDoraCritical: false,
    statusUrl: "https://status.docusign.com",
  },
  {
    slug: "adobe-sign",
    name: "Adobe Sign",
    serviceKind: "E-signature",
    category: "Documents & e-sign",
    description: "Adobe's e-signature offering; popular in regulated workflows.",
    suggestedTier: "TIER_3",
    isDoraCritical: false,
  },

  // ─── Cloud & infra ────────────────────────────────────────────────────
  {
    slug: "aws",
    name: "AWS",
    serviceKind: "Hyperscaler cloud platform",
    category: "Cloud & infra",
    description: "Amazon Web Services — most-common bank/fintech hyperscaler in the UK.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
    hyperscaler: "AWS",
    region: "eu-west-2",
    assuranceKind: "SOC2_TYPE_2",
    statusUrl: "https://health.aws.amazon.com/health/status",
  },
  {
    slug: "azure",
    name: "Microsoft Azure",
    serviceKind: "Hyperscaler cloud platform",
    category: "Cloud & infra",
    description: "Microsoft Azure — common in insurer and enterprise banking estates.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
    hyperscaler: "Azure",
    region: "uksouth",
    assuranceKind: "SOC2_TYPE_2",
    statusUrl: "https://status.azure.com",
  },
  {
    slug: "gcp",
    name: "Google Cloud (GCP)",
    serviceKind: "Hyperscaler cloud platform",
    category: "Cloud & infra",
    description: "Google Cloud — strong in data + AI workloads; underpins Thought Machine.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
    hyperscaler: "GCP",
    region: "europe-west2",
    assuranceKind: "SOC2_TYPE_2",
    statusUrl: "https://status.cloud.google.com",
  },
  {
    slug: "cloudflare",
    name: "Cloudflare",
    serviceKind: "Edge / CDN / DDoS protection",
    category: "Cloud & infra",
    description: "Edge network + WAF + DDoS protection in front of customer-facing services.",
    suggestedTier: "TIER_2",
    isDoraCritical: true,
    statusUrl: "https://www.cloudflarestatus.com",
  },
  {
    slug: "datadog",
    name: "Datadog",
    serviceKind: "Observability (metrics / logs / APM)",
    category: "Cloud & infra",
    description: "Observability platform — metrics, logs, traces, RUM.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
    statusUrl: "https://status.datadoghq.com",
  },

  // ─── Communications ───────────────────────────────────────────────────
  {
    slug: "twilio",
    name: "Twilio",
    serviceKind: "SMS / voice / OTP",
    category: "Communications",
    description: "Communications API — SMS, OTP, voice, WhatsApp Business.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
    statusUrl: "https://status.twilio.com",
  },
  {
    slug: "sendgrid",
    name: "SendGrid (Twilio)",
    serviceKind: "Transactional + marketing email",
    category: "Communications",
    description: "Transactional email at scale; part of Twilio.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
  {
    slug: "auth0",
    name: "Auth0 (Okta)",
    serviceKind: "Identity-as-a-service (IdP)",
    category: "Communications",
    description: "Customer + workforce IdP. Often the auth backbone for fintech apps.",
    suggestedTier: "TIER_1",
    isDoraCritical: true,
    statusUrl: "https://status.auth0.com",
  },

  // ─── Customer & CRM ───────────────────────────────────────────────────
  {
    slug: "salesforce",
    name: "Salesforce",
    serviceKind: "CRM / customer data",
    category: "Customer & CRM",
    description: "Enterprise CRM — common in branch / commercial banking.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
  {
    slug: "zendesk",
    name: "Zendesk",
    serviceKind: "Customer support + ticketing",
    category: "Customer & CRM",
    description: "Multi-channel customer support platform — voice, email, chat, social.",
    suggestedTier: "TIER_3",
    isDoraCritical: false,
  },
  {
    slug: "intercom",
    name: "Intercom",
    serviceKind: "In-app messaging + support",
    category: "Customer & CRM",
    description: "Conversational support + in-app messaging — common in fintech apps.",
    suggestedTier: "TIER_3",
    isDoraCritical: false,
  },

  // ─── Treasury ─────────────────────────────────────────────────────────
  {
    slug: "kyriba",
    name: "Kyriba",
    serviceKind: "Treasury management",
    category: "Treasury",
    description: "Cloud-based treasury, risk and payments suite.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
  {
    slug: "ion-treasury",
    name: "ION Treasury",
    serviceKind: "Treasury & risk management",
    category: "Treasury",
    description: "Enterprise treasury technology used by large banks.",
    suggestedTier: "TIER_2",
    isDoraCritical: false,
  },
];

export function vendorBySlug(slug: string): LibraryVendor | null {
  return VENDOR_LIBRARY.find((v) => v.slug === slug) ?? null;
}
