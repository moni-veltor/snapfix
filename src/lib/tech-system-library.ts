import type {
  TechFailoverKind,
  TechSystemKind,
  TechSystemTier,
} from "@/generated/prisma/enums";

/**
 * Pre-built tech-system library — opinionated catalogue of systems that
 * support an IBS stack in a UK bank or fintech. Drives the LibraryBrowser
 * drawer launched from /tech-recovery so admins can one-click-add the
 * systems they actually run instead of typing them all by hand.
 *
 * Each entry mirrors the TechSystem model shape with sensible defaults you
 * would refine post-add (regions, backup validation date, owner).
 */

export type LibrarySystem = {
  slug: string;
  name: string;
  kind: TechSystemKind;
  suggestedTier: TechSystemTier;
  description: string;
  /** Suggested objectives in minutes. Tight for tier-1 ledgers, looser for routine. */
  rtoMin: number;
  rpoMin: number;
  mtpdMin: number;
  suggestedFailoverKind: TechFailoverKind;
  /** Example default regions — admins refine to their actual deployment. */
  primaryRegion?: string;
  failoverRegion?: string;
  /** Industry-typical backup posture. */
  backupFrequency?: string;
  backupRetentionDays?: number;
};

export const SYSTEM_LIBRARY: LibrarySystem[] = [
  // ─── Application ────────────────────────────────────────────────────────
  {
    slug: "core-banking-ledger",
    name: "Core banking ledger",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "The source-of-truth ledger holding customer balances and posting all financial transactions. The system every IBS ultimately depends on.",
    rtoMin: 30,
    rpoMin: 1,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    primaryRegion: "eu-west-2",
    failoverRegion: "eu-west-1",
    backupFrequency: "continuous",
    backupRetentionDays: 2555,
  },
  {
    slug: "payments-engine",
    name: "Payments engine",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "Routes outbound and inbound payment instructions to scheme rails (Faster Payments, BACS, SEPA, CHAPS, SWIFT).",
    rtoMin: 30,
    rpoMin: 0,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    primaryRegion: "eu-west-2",
    failoverRegion: "eu-west-1",
    backupFrequency: "continuous",
    backupRetentionDays: 2555,
  },
  {
    slug: "card-authorisation",
    name: "Card authorisation service",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "Real-time authorisation engine handling card-present and card-not-present transactions; latency-sensitive, 24/7.",
    rtoMin: 15,
    rpoMin: 0,
    mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    primaryRegion: "eu-west-2",
    failoverRegion: "eu-west-1",
    backupFrequency: "continuous",
    backupRetentionDays: 365,
  },
  {
    slug: "mobile-app",
    name: "Mobile banking app",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "iOS + Android mobile banking experience — login, balance, transfers, card management, support chat.",
    rtoMin: 60,
    rpoMin: 5,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "eu-west-2",
    failoverRegion: "eu-west-1",
    backupFrequency: "hourly",
    backupRetentionDays: 90,
  },
  {
    slug: "internet-banking",
    name: "Internet banking",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Web-based banking portal — primary channel for older demographics and corporate customers.",
    rtoMin: 60,
    rpoMin: 5,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "eu-west-2",
    failoverRegion: "eu-west-1",
    backupFrequency: "hourly",
    backupRetentionDays: 90,
  },
  {
    slug: "onboarding-kyc",
    name: "Customer onboarding & KYC",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Identity verification, sanctions screening and document capture for new-customer applications.",
    rtoMin: 120,
    rpoMin: 15,
    mtpdMin: 720,
    suggestedFailoverKind: "WARM_STANDBY",
    primaryRegion: "eu-west-2",
    backupFrequency: "hourly",
    backupRetentionDays: 2555,
  },
  {
    slug: "crm",
    name: "CRM (customer service)",
    kind: "APPLICATION",
    suggestedTier: "IMPORTANT",
    description:
      "Agent-facing case management used by the contact centre and complaints team.",
    rtoMin: 240,
    rpoMin: 60,
    mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
    backupFrequency: "hourly",
    backupRetentionDays: 365,
  },
  {
    slug: "statement-generator",
    name: "Statement & document generator",
    kind: "APPLICATION",
    suggestedTier: "IMPORTANT",
    description:
      "Periodic statement, tax document and contractual notice generation; batch + on-demand reprints.",
    rtoMin: 480,
    rpoMin: 60,
    mtpdMin: 2880,
    suggestedFailoverKind: "WARM_STANDBY",
    backupFrequency: "daily",
    backupRetentionDays: 2555,
  },
  {
    slug: "treasury-platform",
    name: "Treasury & liquidity platform",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Cash, FX and liquidity management — settlement files, intraday positions, regulatory liquidity reporting.",
    rtoMin: 120,
    rpoMin: 15,
    mtpdMin: 480,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "eu-west-2",
    failoverRegion: "eu-west-1",
    backupFrequency: "hourly",
    backupRetentionDays: 2555,
  },
  {
    slug: "reconciliations",
    name: "Reconciliations platform",
    kind: "APPLICATION",
    suggestedTier: "IMPORTANT",
    description:
      "Nostro/scheme/internal reconciliations — proves every payment in matches a payment out.",
    rtoMin: 480,
    rpoMin: 60,
    mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
    backupFrequency: "daily",
    backupRetentionDays: 2555,
  },

  // ─── Infrastructure ─────────────────────────────────────────────────────
  {
    slug: "aws-primary-region",
    name: "AWS primary region (eu-west-2)",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Primary hyperscaler region hosting customer-facing workloads. Multi-AZ deployments inside.",
    rtoMin: 60,
    rpoMin: 5,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "eu-west-2",
    failoverRegion: "eu-west-1",
  },
  {
    slug: "aws-failover-region",
    name: "AWS failover region (eu-west-1)",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Warm hyperscaler region used as the regional failover target for the customer-facing stack.",
    rtoMin: 60,
    rpoMin: 5,
    mtpdMin: 240,
    suggestedFailoverKind: "WARM_STANDBY",
    primaryRegion: "eu-west-1",
  },
  {
    slug: "kubernetes-prod",
    name: "Kubernetes (prod cluster)",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Production container orchestration plane running most application workloads.",
    rtoMin: 60,
    rpoMin: 5,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    primaryRegion: "eu-west-2",
    failoverRegion: "eu-west-1",
  },
  {
    slug: "edge-cdn",
    name: "Edge / CDN (Cloudflare)",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Edge platform handling TLS termination, WAF, bot management and static asset delivery.",
    rtoMin: 30,
    rpoMin: 5,
    mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "secrets-vault",
    name: "Secrets vault",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Centralised secrets, certificate and key management — runtime applications cannot start without it.",
    rtoMin: 30,
    rpoMin: 1,
    mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    primaryRegion: "eu-west-2",
    failoverRegion: "eu-west-1",
    backupFrequency: "hourly",
    backupRetentionDays: 2555,
  },
  {
    slug: "ci-cd",
    name: "CI/CD pipeline",
    kind: "INFRASTRUCTURE",
    suggestedTier: "IMPORTANT",
    description:
      "Source-control + build + deploy pipeline. Loss blocks new releases but not running services.",
    rtoMin: 480,
    rpoMin: 60,
    mtpdMin: 2880,
    suggestedFailoverKind: "WARM_STANDBY",
    backupFrequency: "daily",
    backupRetentionDays: 365,
  },

  // ─── Database ───────────────────────────────────────────────────────────
  {
    slug: "customer-master",
    name: "Customer master database",
    kind: "DATABASE",
    suggestedTier: "CRITICAL",
    description:
      "Customer demographic, KYC and consent data. Source of truth for entitlements.",
    rtoMin: 30,
    rpoMin: 1,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "eu-west-2",
    failoverRegion: "eu-west-1",
    backupFrequency: "continuous",
    backupRetentionDays: 2555,
  },
  {
    slug: "ledger-db",
    name: "Ledger database",
    kind: "DATABASE",
    suggestedTier: "CRITICAL",
    description:
      "Posting database backing the core ledger. Multi-AZ + cross-region replication.",
    rtoMin: 30,
    rpoMin: 1,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "eu-west-2",
    failoverRegion: "eu-west-1",
    backupFrequency: "continuous",
    backupRetentionDays: 2555,
  },
  {
    slug: "transactions-db",
    name: "Transactions database",
    kind: "DATABASE",
    suggestedTier: "CRITICAL",
    description:
      "Time-series store for transaction history, used by mobile, internet banking and reporting.",
    rtoMin: 60,
    rpoMin: 5,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "eu-west-2",
    failoverRegion: "eu-west-1",
    backupFrequency: "continuous",
    backupRetentionDays: 2555,
  },
  {
    slug: "data-warehouse",
    name: "Data warehouse",
    kind: "DATABASE",
    suggestedTier: "IMPORTANT",
    description:
      "Analytics / reporting warehouse — regulatory reporting, MI, finance. Re-buildable from source if needed.",
    rtoMin: 1440,
    rpoMin: 240,
    mtpdMin: 4320,
    suggestedFailoverKind: "COLD_RESTORE",
    backupFrequency: "daily",
    backupRetentionDays: 2555,
  },
  {
    slug: "redis-cache",
    name: "Redis cache cluster",
    kind: "DATABASE",
    suggestedTier: "ESSENTIAL",
    description:
      "Session, rate-limit and hot-key cache. Loss degrades user experience but not data.",
    rtoMin: 30,
    rpoMin: 60,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },

  // ─── Network ────────────────────────────────────────────────────────────
  {
    slug: "swift-gateway",
    name: "SWIFTNet gateway",
    kind: "NETWORK",
    suggestedTier: "CRITICAL",
    description:
      "SWIFT messaging gateway (Alliance Access / Gateway) — cross-border payments, FIN/MX messaging.",
    rtoMin: 60,
    rpoMin: 0,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "faster-payments-connector",
    name: "Faster Payments connector",
    kind: "NETWORK",
    suggestedTier: "CRITICAL",
    description:
      "Pay.UK Faster Payments scheme connector — sub-second customer transfers, 24/7.",
    rtoMin: 30,
    rpoMin: 0,
    mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "bacs-connector",
    name: "Bacs / direct debits connector",
    kind: "NETWORK",
    suggestedTier: "ESSENTIAL",
    description:
      "Bacs Direct Credit + Direct Debit scheme connectivity — batch payment cycles.",
    rtoMin: 240,
    rpoMin: 60,
    mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "chaps-connector",
    name: "CHAPS gateway",
    kind: "NETWORK",
    suggestedTier: "ESSENTIAL",
    description:
      "Bank of England CHAPS high-value sterling settlement; strict scheme operating hours.",
    rtoMin: 60,
    rpoMin: 0,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "corporate-vpn",
    name: "Corporate VPN",
    kind: "NETWORK",
    suggestedTier: "IMPORTANT",
    description:
      "Remote-access VPN used by staff to reach internal tooling.",
    rtoMin: 120,
    rpoMin: 0,
    mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "internet-edge",
    name: "Internet edge (firewalls)",
    kind: "NETWORK",
    suggestedTier: "CRITICAL",
    description:
      "Perimeter firewalls and DDoS protection sitting in front of customer-facing properties.",
    rtoMin: 30,
    rpoMin: 0,
    mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },

  // ─── Auth ───────────────────────────────────────────────────────────────
  {
    slug: "customer-idp",
    name: "Customer identity provider",
    kind: "AUTH",
    suggestedTier: "CRITICAL",
    description:
      "Customer login and session — without it the mobile app and internet banking cannot authenticate users.",
    rtoMin: 30,
    rpoMin: 5,
    mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "employee-sso",
    name: "Employee SSO (Okta / Entra)",
    kind: "AUTH",
    suggestedTier: "ESSENTIAL",
    description:
      "Staff identity, conditional access and MFA across internal SaaS estate.",
    rtoMin: 60,
    rpoMin: 15,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "mfa-service",
    name: "MFA / step-up service",
    kind: "AUTH",
    suggestedTier: "CRITICAL",
    description:
      "Push, OTP and biometric step-up for high-risk customer journeys (payments, profile change).",
    rtoMin: 30,
    rpoMin: 5,
    mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "privileged-access",
    name: "Privileged access management",
    kind: "AUTH",
    suggestedTier: "ESSENTIAL",
    description:
      "Vaulted admin credentials and just-in-time elevation for production access.",
    rtoMin: 120,
    rpoMin: 15,
    mtpdMin: 480,
    suggestedFailoverKind: "WARM_STANDBY",
  },

  // ─── Observability ──────────────────────────────────────────────────────
  {
    slug: "apm-metrics",
    name: "APM / metrics (Datadog)",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Application performance monitoring and metrics. Loss blinds engineering during an incident.",
    rtoMin: 60,
    rpoMin: 15,
    mtpdMin: 480,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "log-aggregation",
    name: "Log aggregation (Splunk / ELK)",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Centralised application + security logs. Required for incident forensics and audit.",
    rtoMin: 240,
    rpoMin: 60,
    mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
    backupFrequency: "continuous",
    backupRetentionDays: 2555,
  },
  {
    slug: "pagerduty",
    name: "Paging & on-call (PagerDuty)",
    kind: "OBSERVABILITY",
    suggestedTier: "CRITICAL",
    description:
      "Alert routing and on-call rotation. Without it major incidents go unowned.",
    rtoMin: 15,
    rpoMin: 5,
    mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "siem",
    name: "SIEM",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Security event correlation and detection — feeds the SOC.",
    rtoMin: 240,
    rpoMin: 60,
    mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
    backupFrequency: "continuous",
    backupRetentionDays: 2555,
  },

  // ─── Other ──────────────────────────────────────────────────────────────
  {
    slug: "email-gateway",
    name: "Customer email gateway",
    kind: "OTHER",
    suggestedTier: "IMPORTANT",
    description:
      "Transactional and marketing email delivery (OTP, statements ready, fraud alerts).",
    rtoMin: 240,
    rpoMin: 60,
    mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "sms-gateway",
    name: "SMS gateway",
    kind: "OTHER",
    suggestedTier: "ESSENTIAL",
    description:
      "SMS OTP delivery and fraud notifications — critical for step-up auth on customer journeys.",
    rtoMin: 60,
    rpoMin: 15,
    mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },

  // ─── Application · Lending + cards ──────────────────────────────────────
  {
    slug: "loan-origination",
    name: "Loan origination platform",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "End-to-end consumer-loan application, decisioning, document collection and disbursement workflow.",
    rtoMin: 240, rpoMin: 15, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "eu-west-2", failoverRegion: "eu-west-1",
    backupFrequency: "hourly", backupRetentionDays: 2555,
  },
  {
    slug: "mortgage-platform",
    name: "Mortgage application platform",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Mortgage origination + servicing — long-lived applications with broker, valuation and conveyancing touchpoints.",
    rtoMin: 240, rpoMin: 30, mtpdMin: 2880,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "eu-west-2", failoverRegion: "eu-west-1",
    backupFrequency: "hourly", backupRetentionDays: 2555,
  },
  {
    slug: "card-management",
    name: "Card management system",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "PAN lifecycle, BIN sponsorship, card production orchestration and 3DS challenge step-up flow.",
    rtoMin: 60, rpoMin: 5, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    primaryRegion: "eu-west-2", failoverRegion: "eu-west-1",
    backupFrequency: "continuous", backupRetentionDays: 2555,
  },
  {
    slug: "tokenisation-service",
    name: "Card tokenisation service",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "PCI-DSS scope-reducing tokenisation for stored PAN data — used by mobile, web and merchant flows.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    primaryRegion: "eu-west-2", failoverRegion: "eu-west-1",
  },
  {
    slug: "bnpl-platform",
    name: "Buy-now-pay-later platform",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Merchant-integrated BNPL decisioning + repayment scheduling, with affordability checks.",
    rtoMin: 240, rpoMin: 15, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "eu-west-2", failoverRegion: "eu-west-1",
  },
  {
    slug: "merchant-acquiring",
    name: "Merchant acquiring platform",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "Merchant onboarding, terminal-management and acceptance settlement for card-acquiring services.",
    rtoMin: 60, rpoMin: 5, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "wire-processing",
    name: "Wire processing engine",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "Outbound + inbound wire instructions, FX-leg handling, sanctions stop-list integration.",
    rtoMin: 60, rpoMin: 5, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "atm-management",
    name: "ATM management system",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "ATM estate monitoring, cash-handling reconciliation, fault routing and dispense authorisation.",
    rtoMin: 240, rpoMin: 30, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },

  // ─── Application · Trading + markets ────────────────────────────────────
  {
    slug: "trading-platform",
    name: "Trading platform (equities)",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "Order-entry, smart-order-routing and execution-management for equity desks; low-latency, market-hours-critical.",
    rtoMin: 15, rpoMin: 0, mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "fx-trading-desk",
    name: "FX trading desk",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "Spot, forward and swap pricing + execution; tight latency budget, integrates with EBS/Reuters Matching.",
    rtoMin: 15, rpoMin: 0, mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "derivatives-engine",
    name: "Derivatives pricing engine",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Monte-Carlo and analytic pricing for options, swaps and structured products; feeds risk + P&L.",
    rtoMin: 120, rpoMin: 30, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "wealth-management",
    name: "Wealth management platform",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Discretionary + advisory portfolio management, rebalancing and reporting for retail/HNW clients.",
    rtoMin: 240, rpoMin: 30, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "robo-advisor",
    name: "Robo-advisor",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Automated portfolio construction + glide-path management for retail wealth customers.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "market-data-feed",
    name: "Market data feed handler",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "Real-time market-data normalisation (Bloomberg B-Pipe, Refinitiv RTD) feeding trading + risk systems.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "risk-engine",
    name: "Market + credit risk engine",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "VaR, sensitivities, counterparty exposure and stress-test calculations; intraday + EOD batches.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },

  // ─── Application · Insurance ────────────────────────────────────────────
  {
    slug: "insurance-underwriting",
    name: "Insurance underwriting platform",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Risk acceptance, pricing and policy issuance — typically integrated with broker portals and rating engines.",
    rtoMin: 240, rpoMin: 30, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "claims-platform",
    name: "Claims management platform",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "FNOL capture, adjuster workflow, reserves, fraud screening and payment release for insurance claims.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "policy-admin",
    name: "Policy administration system",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Policy lifecycle of record — endorsements, renewals, mid-term adjustments and cancellation handling.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },

  // ─── Application · Risk + compliance ────────────────────────────────────
  {
    slug: "fraud-detection",
    name: "Real-time fraud detection",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "ML-driven scoring of payments + card auths against fraud rules; blocks or step-ups transactions inline.",
    rtoMin: 15, rpoMin: 0, mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aml-monitoring",
    name: "AML transaction monitoring",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Behaviour-based AML monitoring, SAR generation and case-management workflow.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "sanctions-screening",
    name: "Sanctions screening",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "Real-time name screening against OFAC/HMT/EU/UN lists for payments, onboarding and counterparty checks.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "transaction-screening",
    name: "Transaction screening",
    kind: "APPLICATION",
    suggestedTier: "CRITICAL",
    description:
      "Real-time payment-leg screening against sanctions and high-risk indicators before scheme submission.",
    rtoMin: 15, rpoMin: 0, mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "regulatory-reporting",
    name: "Regulatory reporting platform",
    kind: "APPLICATION",
    suggestedTier: "IMPORTANT",
    description:
      "MIFID, EMIR, COREP/FINREP and SFTR submissions; calendarised and reconciled to source.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "kyc-refresh",
    name: "Periodic KYC refresh",
    kind: "APPLICATION",
    suggestedTier: "IMPORTANT",
    description:
      "Risk-rated periodic-review workflow for existing customers; document re-collection + screening.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "document-signing",
    name: "Document e-signature",
    kind: "APPLICATION",
    suggestedTier: "IMPORTANT",
    description:
      "Customer + counterparty e-signature on agreements, mandates and credit documents.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "complaints-management",
    name: "Complaints management",
    kind: "APPLICATION",
    suggestedTier: "IMPORTANT",
    description:
      "Customer-complaint intake, FCA-clock tracking and resolution workflow with FOS escalation.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },

  // ─── Application · Workforce ────────────────────────────────────────────
  {
    slug: "agent-desktop",
    name: "Customer-service agent desktop",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Unified screen for contact-centre agents — customer view, case history, comms, knowledge base.",
    rtoMin: 240, rpoMin: 30, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "contact-centre-cti",
    name: "Contact-centre telephony (CTI)",
    kind: "APPLICATION",
    suggestedTier: "ESSENTIAL",
    description:
      "Voice + chat routing, IVR and call recording for the contact centre; integrates with the agent desktop.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "ticketing-system",
    name: "Internal ticketing system",
    kind: "APPLICATION",
    suggestedTier: "IMPORTANT",
    description:
      "ITSM tool for incident, change and request tickets; integrates with PagerDuty + chat.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "hrms",
    name: "HRMS / people platform",
    kind: "APPLICATION",
    suggestedTier: "IMPORTANT",
    description:
      "HR system of record — employee directory, joiner-mover-leaver, leave + access provisioning source.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },

  // ─── Infrastructure · AWS ───────────────────────────────────────────────
  {
    slug: "aws-ec2-compute",
    name: "AWS EC2 compute estate",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Long-running EC2 instances backing legacy workloads, batch jobs and bare-metal databases.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "eu-west-2", failoverRegion: "eu-west-1",
  },
  {
    slug: "aws-eks",
    name: "AWS EKS clusters",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Managed Kubernetes for stateless services, microservices mesh and batch workers.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    primaryRegion: "eu-west-2", failoverRegion: "eu-west-1",
  },
  {
    slug: "aws-ecs-fargate",
    name: "AWS ECS / Fargate",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Serverless containers for utility services + scheduled tasks; lower-ops alternative to EKS.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "aws-lambda",
    name: "AWS Lambda",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Event-driven serverless functions handling webhooks, glue logic and async event processing.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-step-functions",
    name: "AWS Step Functions",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Managed state-machine orchestration for multi-step workflows (onboarding, ETL, claims).",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "aws-s3-buckets",
    name: "AWS S3 — primary buckets",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Object storage for evidence packs, customer documents, system backups and data-lake landing zone.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    primaryRegion: "eu-west-2", failoverRegion: "eu-west-1",
    backupFrequency: "continuous", backupRetentionDays: 2555,
  },
  {
    slug: "aws-ebs",
    name: "AWS EBS volumes",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Persistent block storage attached to EC2 + EKS; snapshot policy drives RPO for stateful pods.",
    rtoMin: 120, rpoMin: 60, mtpdMin: 720,
    suggestedFailoverKind: "WARM_STANDBY",
    backupFrequency: "hourly", backupRetentionDays: 90,
  },
  {
    slug: "aws-efs",
    name: "AWS EFS shared filesystem",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Multi-AZ shared filesystem for CMS uploads, evidence collections and legacy app file stores.",
    rtoMin: 120, rpoMin: 60, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-direct-connect",
    name: "AWS Direct Connect",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Dedicated private circuit between data centre and AWS — underpins low-latency hybrid workloads.",
    rtoMin: 60, rpoMin: 0, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-transit-gateway",
    name: "AWS Transit Gateway",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Hub-and-spoke routing between VPCs, on-prem and partner networks across the AWS estate.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-route53",
    name: "AWS Route 53 (DNS)",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Authoritative DNS + health-checked failover routing for public customer endpoints.",
    rtoMin: 15, rpoMin: 0, mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-cloudfront",
    name: "AWS CloudFront CDN",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Global edge cache + DDoS-protected entry point for web + mobile traffic.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-waf",
    name: "AWS WAF",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Layer-7 web-application firewall protecting CloudFront + ALB endpoints from common attack patterns.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-shield",
    name: "AWS Shield Advanced",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Managed DDoS protection for the public-facing AWS estate; comes with the AWS DDoS response team.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-secrets-manager",
    name: "AWS Secrets Manager",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Rotating secret store for database creds, API keys and 3rd-party tokens; KMS-encrypted.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-kms",
    name: "AWS KMS",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Customer-managed-key store for envelope encryption across S3, EBS, RDS and application data.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-cloudtrail",
    name: "AWS CloudTrail",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Account-wide API call audit log feeding SIEM and forensic-incident review.",
    rtoMin: 240, rpoMin: 15, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    backupFrequency: "continuous", backupRetentionDays: 2555,
  },
  {
    slug: "aws-config",
    name: "AWS Config",
    kind: "INFRASTRUCTURE",
    suggestedTier: "IMPORTANT",
    description:
      "Resource-config drift detection + compliance evaluation across the AWS estate.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "aws-eventbridge",
    name: "AWS EventBridge",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Event bus for fan-out between AWS services and internal microservices.",
    rtoMin: 60, rpoMin: 5, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-sqs",
    name: "AWS SQS",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Managed FIFO + standard queue service for decoupling async work between services.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-sns",
    name: "AWS SNS",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Pub/sub topic service for fan-out notifications (email, SMS, downstream services).",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-kinesis",
    name: "AWS Kinesis Data Streams",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Managed streaming pipeline for clickstream, audit and real-time analytics ingestion.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aws-glue",
    name: "AWS Glue",
    kind: "INFRASTRUCTURE",
    suggestedTier: "IMPORTANT",
    description:
      "Serverless ETL + data-catalog for the analytics estate; jobs scheduled out of EventBridge.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "aws-backup",
    name: "AWS Backup",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Cross-region, cross-account backup orchestration for RDS, EBS, EFS, DynamoDB, S3 and FSx.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    backupFrequency: "continuous", backupRetentionDays: 2555,
  },
  {
    slug: "aws-ecr",
    name: "AWS ECR (container registry)",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Container-image registry feeding EKS + ECS deployments; scan-on-push enabled.",
    rtoMin: 240, rpoMin: 30, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },

  // ─── Infrastructure · Azure / GCP ───────────────────────────────────────
  {
    slug: "azure-vms",
    name: "Azure Virtual Machines",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Azure IaaS estate hosting Windows workloads, legacy .NET applications and SQL Server.",
    rtoMin: 120, rpoMin: 30, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "uksouth", failoverRegion: "ukwest",
  },
  {
    slug: "azure-aks",
    name: "Azure Kubernetes Service",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Managed Kubernetes on Azure for services that need tight Azure-AD or Entra integration.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    primaryRegion: "uksouth", failoverRegion: "ukwest",
  },
  {
    slug: "azure-functions",
    name: "Azure Functions",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Event-driven serverless compute on Azure — typical for Power Platform and Logic Apps glue.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "azure-blob",
    name: "Azure Blob Storage",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Object storage on Azure — typically backing analytics estates and document archives.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    backupFrequency: "continuous", backupRetentionDays: 2555,
  },
  {
    slug: "azure-key-vault",
    name: "Azure Key Vault",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Key + secret store for the Azure estate; mirrors AWS KMS for cross-cloud workloads.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "azure-expressroute",
    name: "Azure ExpressRoute",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Private circuit between data centre and Azure — equivalent of Direct Connect for the Azure footprint.",
    rtoMin: 60, rpoMin: 0, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "gcp-gke",
    name: "GCP GKE clusters",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Managed Kubernetes on GCP — typically used where data engineering or BigQuery proximity matters.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    primaryRegion: "europe-west2", failoverRegion: "europe-west1",
  },
  {
    slug: "gcp-cloud-functions",
    name: "GCP Cloud Functions",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Serverless compute on GCP for event-driven glue between BigQuery, Pub/Sub and downstream apps.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "gcp-cloud-storage",
    name: "GCP Cloud Storage",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Object storage on GCP — landing zone for analytics workloads and model artefacts.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    backupFrequency: "continuous", backupRetentionDays: 2555,
  },
  {
    slug: "gcp-pubsub",
    name: "GCP Pub/Sub",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Managed message bus for streaming + event-driven workloads on GCP.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },

  // ─── Infrastructure · Orchestration + messaging ─────────────────────────
  {
    slug: "temporal-workflows",
    name: "Temporal workflow engine",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Durable execution engine for long-running, retry-safe workflows — payments, onboarding, exit-process.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "airflow",
    name: "Apache Airflow",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "DAG-based scheduler for ETL jobs, daily reconciliations and analytics pipelines.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "dagster",
    name: "Dagster",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Asset-aware data-orchestration platform with strong dev-loop ergonomics.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "prefect",
    name: "Prefect",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Python-native workflow orchestration with cloud + self-hosted backends.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "camunda",
    name: "Camunda BPMN engine",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "BPMN-modelled business-process engine — typical for KYC, complaints, claim and dispute flows.",
    rtoMin: 120, rpoMin: 15, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "kafka",
    name: "Apache Kafka cluster",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Event-streaming backbone for change-data-capture, audit, payments fan-out and analytics.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "kafka-connect",
    name: "Kafka Connect",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Source + sink connectors between Kafka topics and external systems (Postgres CDC, S3, Snowflake).",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "schema-registry",
    name: "Confluent schema registry",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Avro/Protobuf schema store for Kafka topics; enforces evolution + compatibility rules.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "rabbitmq",
    name: "RabbitMQ broker",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "AMQP broker for task queues + RPC-style messaging where Kafka isn't a fit.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "nats",
    name: "NATS messaging",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Lightweight, low-latency pub/sub + request/reply message system.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "activemq",
    name: "ActiveMQ broker",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "JMS broker — often present where legacy Java applications still rely on JMS semantics.",
    rtoMin: 120, rpoMin: 30, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "service-mesh-istio",
    name: "Istio service mesh",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "mTLS + traffic-shaping mesh on Kubernetes; controls east-west traffic + retry/timeout policy.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "helm-charts",
    name: "Helm chart repository",
    kind: "INFRASTRUCTURE",
    suggestedTier: "IMPORTANT",
    description:
      "Internal Helm registry distributing chart versions to EKS/AKS/GKE clusters.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "terraform-cloud",
    name: "Terraform Cloud / Enterprise",
    kind: "INFRASTRUCTURE",
    suggestedTier: "IMPORTANT",
    description:
      "Remote state + plan execution for the platform IaC; gates production infra changes.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "vault-secrets",
    name: "HashiCorp Vault",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Centralised secret + dynamic-credential broker; many services unable to start without it.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "github-enterprise",
    name: "GitHub Enterprise",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Source-of-truth Git hosting; outage halts every deploy + most engineering work.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "gitlab-self-hosted",
    name: "GitLab (self-hosted)",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Self-hosted Git + CI alternative — common in regulated estates that can't egress to SaaS.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "github-actions",
    name: "GitHub Actions runners",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Self-hosted CI runners executing build + test + deploy pipelines for the platform.",
    rtoMin: 240, rpoMin: 30, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "argocd",
    name: "ArgoCD",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "GitOps continuous-delivery for Kubernetes; reconciles cluster state to repo manifests.",
    rtoMin: 240, rpoMin: 30, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "jenkins",
    name: "Jenkins CI",
    kind: "INFRASTRUCTURE",
    suggestedTier: "IMPORTANT",
    description:
      "Legacy CI server still owning some build pipelines; outage blocks affected deployments.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "artifact-registry",
    name: "Artifact registry (Maven/npm/PyPI)",
    kind: "INFRASTRUCTURE",
    suggestedTier: "ESSENTIAL",
    description:
      "Internal package mirror + proxy for upstream registries; outage breaks build reproducibility.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "feature-flags",
    name: "Feature-flag service",
    kind: "INFRASTRUCTURE",
    suggestedTier: "CRITICAL",
    description:
      "Runtime flag evaluation (LaunchDarkly / Unleash) controlling kill-switches, rollouts and circuit breakers.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },

  // ─── Database · Engines ─────────────────────────────────────────────────
  {
    slug: "postgres-primary",
    name: "PostgreSQL primary",
    kind: "DATABASE",
    suggestedTier: "CRITICAL",
    description:
      "Primary OLTP Postgres instances for application-tier services — typically multi-AZ with sync replicas.",
    rtoMin: 30, rpoMin: 1, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    backupFrequency: "continuous", backupRetentionDays: 2555,
  },
  {
    slug: "postgres-replica",
    name: "PostgreSQL read replicas",
    kind: "DATABASE",
    suggestedTier: "ESSENTIAL",
    description:
      "Read-only replicas absorbing reporting + analytics traffic to spare the primary.",
    rtoMin: 60, rpoMin: 5, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "aurora-postgres",
    name: "Aurora PostgreSQL",
    kind: "DATABASE",
    suggestedTier: "CRITICAL",
    description:
      "AWS-managed Postgres with separated compute + storage; common pattern for new microservices.",
    rtoMin: 30, rpoMin: 1, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    backupFrequency: "continuous", backupRetentionDays: 2555,
  },
  {
    slug: "aurora-mysql",
    name: "Aurora MySQL",
    kind: "DATABASE",
    suggestedTier: "CRITICAL",
    description:
      "AWS-managed MySQL — legacy ecommerce-style schemas and CRM-adjacent stores.",
    rtoMin: 30, rpoMin: 1, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    backupFrequency: "continuous", backupRetentionDays: 2555,
  },
  {
    slug: "mysql-self-hosted",
    name: "MySQL (self-hosted)",
    kind: "DATABASE",
    suggestedTier: "ESSENTIAL",
    description:
      "Legacy MySQL instances on EC2/VM — pre-Aurora, typically Galera or async-replica HA.",
    rtoMin: 120, rpoMin: 15, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "sql-server",
    name: "SQL Server",
    kind: "DATABASE",
    suggestedTier: "ESSENTIAL",
    description:
      "Microsoft SQL Server — typical for legacy actuarial, finance and HR data marts.",
    rtoMin: 120, rpoMin: 15, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    backupFrequency: "hourly", backupRetentionDays: 2555,
  },
  {
    slug: "oracle-db",
    name: "Oracle DB",
    kind: "DATABASE",
    suggestedTier: "CRITICAL",
    description:
      "Oracle clusters still hosting core ledgers, treasury or legacy underwriting workloads.",
    rtoMin: 60, rpoMin: 1, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    backupFrequency: "continuous", backupRetentionDays: 2555,
  },
  {
    slug: "mongodb",
    name: "MongoDB cluster",
    kind: "DATABASE",
    suggestedTier: "ESSENTIAL",
    description:
      "Document store for catalogue, profile and event-history use cases.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "dynamodb",
    name: "AWS DynamoDB",
    kind: "DATABASE",
    suggestedTier: "CRITICAL",
    description:
      "Managed key-value + document store with single-ms latency; backs session, idempotency and rate-limit data.",
    rtoMin: 15, rpoMin: 0, mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
    backupFrequency: "continuous", backupRetentionDays: 365,
  },
  {
    slug: "cassandra",
    name: "Cassandra cluster",
    kind: "DATABASE",
    suggestedTier: "ESSENTIAL",
    description:
      "Wide-column store for time-series, telemetry or high-write workloads needing multi-DC writes.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "scylla",
    name: "ScyllaDB",
    kind: "DATABASE",
    suggestedTier: "ESSENTIAL",
    description:
      "Cassandra-compatible store with lower-latency profile; same use cases as Cassandra.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "cosmos-db",
    name: "Azure Cosmos DB",
    kind: "DATABASE",
    suggestedTier: "ESSENTIAL",
    description:
      "Globally-distributed multi-model database on Azure — typical for cross-region session stores.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "elasticsearch",
    name: "ElasticSearch / OpenSearch",
    kind: "DATABASE",
    suggestedTier: "ESSENTIAL",
    description:
      "Search + log analytics cluster — powers customer search, audit retrieval and SIEM indexes.",
    rtoMin: 120, rpoMin: 30, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "clickhouse",
    name: "ClickHouse",
    kind: "DATABASE",
    suggestedTier: "IMPORTANT",
    description:
      "Columnar analytics store for real-time reporting and product analytics.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "neo4j",
    name: "Neo4j graph DB",
    kind: "DATABASE",
    suggestedTier: "IMPORTANT",
    description:
      "Graph store for entity-resolution, AML link analysis and fraud-ring detection.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "memcached",
    name: "Memcached",
    kind: "DATABASE",
    suggestedTier: "IMPORTANT",
    description:
      "In-memory key/value cache for legacy services that pre-date Redis adoption.",
    rtoMin: 240, rpoMin: 0, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "snowflake",
    name: "Snowflake data warehouse",
    kind: "DATABASE",
    suggestedTier: "IMPORTANT",
    description:
      "Cloud data warehouse — backs FP&A, regulatory reporting marts and exec dashboards.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "bigquery",
    name: "GCP BigQuery",
    kind: "DATABASE",
    suggestedTier: "IMPORTANT",
    description:
      "Serverless analytics warehouse — common where data engineering centred on GCP.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "redshift",
    name: "AWS Redshift",
    kind: "DATABASE",
    suggestedTier: "IMPORTANT",
    description:
      "Managed MPP warehouse on AWS; typically a stepping-stone before Snowflake adoption.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "databricks",
    name: "Databricks lakehouse",
    kind: "DATABASE",
    suggestedTier: "IMPORTANT",
    description:
      "Spark + Delta-Lake-backed analytics + ML platform for data engineering and model training.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "feature-store",
    name: "ML feature store",
    kind: "DATABASE",
    suggestedTier: "ESSENTIAL",
    description:
      "Online + offline feature store (Feast/Tecton) serving features into fraud + credit-decision models.",
    rtoMin: 60, rpoMin: 5, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "vector-db",
    name: "Vector database",
    kind: "DATABASE",
    suggestedTier: "IMPORTANT",
    description:
      "Vector index (pgvector / Pinecone / Weaviate) backing semantic search + RAG features.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },

  // ─── Network · Edge + connectivity ──────────────────────────────────────
  {
    slug: "cloudflare-edge",
    name: "Cloudflare edge",
    kind: "NETWORK",
    suggestedTier: "CRITICAL",
    description:
      "DNS + WAF + bot-management + DDoS-mitigation entry point for public customer endpoints.",
    rtoMin: 15, rpoMin: 0, mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "api-gateway-kong",
    name: "API gateway (Kong)",
    kind: "NETWORK",
    suggestedTier: "CRITICAL",
    description:
      "North-south API gateway for partner + customer APIs; enforces auth, rate-limits and quotas.",
    rtoMin: 15, rpoMin: 0, mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "alb-nlb",
    name: "Application + network load balancers",
    kind: "NETWORK",
    suggestedTier: "CRITICAL",
    description:
      "Layer-4 + layer-7 LBs in front of EKS/EC2 services; health-checked, scale-out by default.",
    rtoMin: 15, rpoMin: 0, mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "dns-internal",
    name: "Internal DNS (Route 53 private)",
    kind: "NETWORK",
    suggestedTier: "CRITICAL",
    description:
      "Private-zone DNS resolving service discovery across VPCs and hybrid network segments.",
    rtoMin: 15, rpoMin: 0, mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "bastion-host",
    name: "Bastion / jump hosts",
    kind: "NETWORK",
    suggestedTier: "ESSENTIAL",
    description:
      "Short-lived SSH/RDP jump-hosts for break-glass admin access into production estates.",
    rtoMin: 60, rpoMin: 60, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "network-firewall",
    name: "Network firewall",
    kind: "NETWORK",
    suggestedTier: "CRITICAL",
    description:
      "Perimeter + east-west firewall — Palo Alto / Cisco / AWS Network Firewall.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "sd-wan",
    name: "SD-WAN",
    kind: "NETWORK",
    suggestedTier: "ESSENTIAL",
    description:
      "Branch + remote-site WAN overlay typically used for branch offices and contact-centres.",
    rtoMin: 60, rpoMin: 0, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "ipam",
    name: "IPAM / DDI",
    kind: "NETWORK",
    suggestedTier: "ESSENTIAL",
    description:
      "IP address management + DNS/DHCP integrated platform (Infoblox / similar) for the enterprise.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "vpn-concentrator",
    name: "Remote-access VPN concentrator",
    kind: "NETWORK",
    suggestedTier: "ESSENTIAL",
    description:
      "Remote-worker SSL/IPSec VPN termination — outage blocks staff access to internal systems.",
    rtoMin: 120, rpoMin: 0, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "ztna",
    name: "Zero-trust network access",
    kind: "NETWORK",
    suggestedTier: "ESSENTIAL",
    description:
      "Identity-aware proxy / ZTNA (Cloudflare Access / Zscaler) replacing legacy VPN for internal apps.",
    rtoMin: 60, rpoMin: 0, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },

  // ─── Auth · Identity providers ──────────────────────────────────────────
  {
    slug: "okta-workforce",
    name: "Okta (workforce IdP)",
    kind: "AUTH",
    suggestedTier: "CRITICAL",
    description:
      "Workforce identity provider with SAML/OIDC SSO to every SaaS and internal application.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "auth0-customer",
    name: "Auth0 / Okta CIAM",
    kind: "AUTH",
    suggestedTier: "CRITICAL",
    description:
      "Customer-identity service — typically backs mobile + web login when not self-built.",
    rtoMin: 15, rpoMin: 0, mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "entra-id",
    name: "Microsoft Entra ID",
    kind: "AUTH",
    suggestedTier: "CRITICAL",
    description:
      "Azure-AD-derived workforce IdP; integrates tightly with M365 and Azure-hosted apps.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "ldap-ad",
    name: "Active Directory / LDAP",
    kind: "AUTH",
    suggestedTier: "CRITICAL",
    description:
      "On-prem directory still authoritative for legacy server-room logins and Windows estate.",
    rtoMin: 60, rpoMin: 5, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "hsm",
    name: "Hardware security module",
    kind: "AUTH",
    suggestedTier: "CRITICAL",
    description:
      "FIPS-140 HSM signing card transactions, WebAuth challenges and root-CA keys.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "ca-pki",
    name: "Internal Certificate Authority",
    kind: "AUTH",
    suggestedTier: "ESSENTIAL",
    description:
      "PKI issuing TLS + mTLS certificates for internal services; outage halts new service-to-service trust.",
    rtoMin: 120, rpoMin: 60, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "webauthn-passkeys",
    name: "WebAuthn / passkey service",
    kind: "AUTH",
    suggestedTier: "ESSENTIAL",
    description:
      "Passkey enrolment + verification backing FIDO-based customer + workforce auth.",
    rtoMin: 60, rpoMin: 5, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "saml-federation",
    name: "SAML federation gateway",
    kind: "AUTH",
    suggestedTier: "ESSENTIAL",
    description:
      "Federation bridge translating between internal IdP and external partner SAML protocols.",
    rtoMin: 120, rpoMin: 30, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "oauth-introspect",
    name: "OAuth token introspection",
    kind: "AUTH",
    suggestedTier: "ESSENTIAL",
    description:
      "Internal token-validation endpoint that downstream services hit to confirm OAuth token validity.",
    rtoMin: 60, rpoMin: 0, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },

  // ─── Observability · Metrics, logs, traces ──────────────────────────────
  {
    slug: "datadog",
    name: "Datadog (APM + logs)",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Primary observability SaaS — APM, logs, metrics, RUM, synthetics across the production estate.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "new-relic",
    name: "New Relic",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Application + infrastructure observability SaaS — typical alternative to Datadog.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "dynatrace",
    name: "Dynatrace",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Full-stack observability with on-prem and SaaS deployments — common in regulated estates.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "prometheus",
    name: "Prometheus",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Self-hosted time-series metrics + alert evaluation for Kubernetes workloads.",
    rtoMin: 120, rpoMin: 30, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "grafana",
    name: "Grafana",
    kind: "OBSERVABILITY",
    suggestedTier: "IMPORTANT",
    description:
      "Dashboard + alerting front-end over Prometheus / Loki / Tempo / external sources.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "loki",
    name: "Grafana Loki",
    kind: "OBSERVABILITY",
    suggestedTier: "IMPORTANT",
    description:
      "Log-aggregation store paired with Grafana — alternative to ELK for K8s-native logging.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "splunk-platform",
    name: "Splunk platform",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Enterprise log platform — typically authoritative for forensic + audit retention.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
    backupFrequency: "continuous", backupRetentionDays: 2555,
  },
  {
    slug: "elk-stack",
    name: "ELK stack (Elastic / Logstash / Kibana)",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Self-hosted log analytics for environments without Splunk; serves SIEM ingestion too.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "otel-collector",
    name: "OpenTelemetry collector",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Edge collector translating OTLP telemetry into the chosen backend (Datadog / Prometheus / Tempo).",
    rtoMin: 120, rpoMin: 30, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "jaeger-tempo",
    name: "Distributed tracing (Jaeger / Tempo)",
    kind: "OBSERVABILITY",
    suggestedTier: "IMPORTANT",
    description:
      "Trace backend for cross-service request inspection during incident triage.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "sentry",
    name: "Sentry (error tracking)",
    kind: "OBSERVABILITY",
    suggestedTier: "IMPORTANT",
    description:
      "Front-end + back-end error aggregation; outage delays bug triage but doesn't stop service.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "pingdom",
    name: "Synthetic monitoring (Pingdom / Catchpoint)",
    kind: "OBSERVABILITY",
    suggestedTier: "IMPORTANT",
    description:
      "External synthetics monitoring customer endpoints — outage hides external-perspective incidents.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "rum",
    name: "Real-user monitoring",
    kind: "OBSERVABILITY",
    suggestedTier: "IMPORTANT",
    description:
      "JS-injected RUM capturing real customer browser performance + JS errors.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "opsgenie",
    name: "Opsgenie",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "On-call routing + escalation policy alternative to PagerDuty.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "victorops",
    name: "Splunk On-Call (VictorOps)",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Splunk-aligned on-call routing tool typically used where Splunk is the SIEM.",
    rtoMin: 60, rpoMin: 15, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "statuspage",
    name: "Statuspage / external comms",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Customer-facing status site updated during incidents and scheduled maintenance windows.",
    rtoMin: 60, rpoMin: 30, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "chaos-platform",
    name: "Chaos engineering platform",
    kind: "OBSERVABILITY",
    suggestedTier: "ROUTINE",
    description:
      "Game-day fault-injection tooling (Gremlin / LitmusChaos) — usually run on-demand, not 24/7.",
    rtoMin: 4320, rpoMin: 1440, mtpdMin: 10080,
    suggestedFailoverKind: "NONE",
  },
  {
    slug: "vuln-scanner",
    name: "Vulnerability scanner (Snyk / Qualys)",
    kind: "OBSERVABILITY",
    suggestedTier: "IMPORTANT",
    description:
      "SCA + IaC vulnerability scanner gating deploys + raising findings into ticketing.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "ids-ips",
    name: "IDS / IPS",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Network intrusion detection + prevention feeding SOC alerts; SIEM-correlated.",
    rtoMin: 120, rpoMin: 15, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "edr-endpoints",
    name: "EDR (endpoint detection + response)",
    kind: "OBSERVABILITY",
    suggestedTier: "CRITICAL",
    description:
      "Agent-based endpoint telemetry feeding the SOC + auto-isolating infected workstations.",
    rtoMin: 60, rpoMin: 5, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "dlp",
    name: "Data loss prevention",
    kind: "OBSERVABILITY",
    suggestedTier: "ESSENTIAL",
    description:
      "Egress + email DLP enforcement on PII, PAN and customer-data exfil patterns.",
    rtoMin: 240, rpoMin: 30, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },

  // ─── Other · Regulatory + integrations ──────────────────────────────────
  {
    slug: "swift-gpi",
    name: "SWIFT GPI tracker",
    kind: "OTHER",
    suggestedTier: "ESSENTIAL",
    description:
      "End-to-end payment-tracking layer on top of SWIFT; UETR-based status lookups.",
    rtoMin: 240, rpoMin: 30, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "iso20022-translator",
    name: "ISO 20022 message translator",
    kind: "OTHER",
    suggestedTier: "CRITICAL",
    description:
      "Translation layer between legacy MT and ISO 20022 MX message formats for cross-border payments.",
    rtoMin: 60, rpoMin: 5, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "open-banking",
    name: "Open Banking API gateway",
    kind: "OTHER",
    suggestedTier: "CRITICAL",
    description:
      "OBIE-conformant API gateway for AIS + PIS TPP traffic; subject to the regulator's API availability SLAs.",
    rtoMin: 30, rpoMin: 0, mtpdMin: 120,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "confirmation-of-payee",
    name: "Confirmation of Payee",
    kind: "OTHER",
    suggestedTier: "CRITICAL",
    description:
      "Real-time CoP responder + requester for inbound + outbound transfer name-checking.",
    rtoMin: 15, rpoMin: 0, mtpdMin: 60,
    suggestedFailoverKind: "ACTIVE_ACTIVE",
  },
  {
    slug: "bacs-direct-debit",
    name: "BACS Direct Debit ledger",
    kind: "OTHER",
    suggestedTier: "ESSENTIAL",
    description:
      "Mandate, reject, indemnity-claim workflow tied to the BACS processing window.",
    rtoMin: 240, rpoMin: 30, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "bank-of-england-rtgs",
    name: "Bank of England RTGS",
    kind: "OTHER",
    suggestedTier: "CRITICAL",
    description:
      "Settlement-account integration with the Bank of England RTGS service (incl. CHAPS).",
    rtoMin: 60, rpoMin: 5, mtpdMin: 240,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "fca-connect",
    name: "FCA Connect (reporting portal)",
    kind: "OTHER",
    suggestedTier: "IMPORTANT",
    description:
      "Submission gateway for FCA returns + change-of-control notifications.",
    rtoMin: 1440, rpoMin: 1440, mtpdMin: 10080,
    suggestedFailoverKind: "NONE",
  },
  {
    slug: "kyc-vendor-adapter",
    name: "KYC vendor adapter (Onfido / Jumio)",
    kind: "OTHER",
    suggestedTier: "ESSENTIAL",
    description:
      "Abstraction layer over the chosen identity-verification vendor for document + biometric checks.",
    rtoMin: 120, rpoMin: 30, mtpdMin: 720,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "sanctions-list-provider",
    name: "Sanctions list provider (Refinitiv / Dow Jones)",
    kind: "OTHER",
    suggestedTier: "ESSENTIAL",
    description:
      "Source-of-truth list feed for sanctions + PEP lookups used by screening engines.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "ACTIVE_PASSIVE",
  },
  {
    slug: "fatca-crs-reporting",
    name: "FATCA / CRS reporting",
    kind: "OTHER",
    suggestedTier: "IMPORTANT",
    description:
      "US-IRS + OECD tax-residency reporting platform — annual cycle with HMRC submission gateway.",
    rtoMin: 4320, rpoMin: 1440, mtpdMin: 10080,
    suggestedFailoverKind: "NONE",
  },
  {
    slug: "tax-engine",
    name: "Tax calculation engine",
    kind: "OTHER",
    suggestedTier: "IMPORTANT",
    description:
      "Real-time VAT + income-tax-withholding calculation for invoices, payouts and statements.",
    rtoMin: 240, rpoMin: 60, mtpdMin: 1440,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "general-ledger",
    name: "General ledger (finance)",
    kind: "OTHER",
    suggestedTier: "ESSENTIAL",
    description:
      "Finance system of record (Oracle Fusion / NetSuite / SAP) — books the firm's own P&L.",
    rtoMin: 480, rpoMin: 60, mtpdMin: 4320,
    suggestedFailoverKind: "WARM_STANDBY",
  },
  {
    slug: "expense-management",
    name: "Expense management",
    kind: "OTHER",
    suggestedTier: "ROUTINE",
    description:
      "Internal expense capture + reimbursement (Concur / Expensify). Outage is annoying, not customer-affecting.",
    rtoMin: 4320, rpoMin: 1440, mtpdMin: 10080,
    suggestedFailoverKind: "NONE",
  },
  {
    slug: "procurement",
    name: "Procurement / P2P",
    kind: "OTHER",
    suggestedTier: "ROUTINE",
    description:
      "Procure-to-pay platform handling supplier onboarding, POs and 3-way match.",
    rtoMin: 4320, rpoMin: 1440, mtpdMin: 10080,
    suggestedFailoverKind: "NONE",
  },
];

export function libSystemBySlug(slug: string): LibrarySystem | null {
  return SYSTEM_LIBRARY.find((s) => s.slug === slug) ?? null;
}
