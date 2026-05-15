import type {
  TechFailoverKind,
  TechSystemKind,
  TechSystemTier,
} from "@/generated/prisma/enums";

/**
 * Pre-built tech-system library — opinionated catalogue of systems that
 * support an IBS stack in a UK bank or fintech. Drives /tech-recovery/library
 * so admins can one-click-add the systems they actually run instead of
 * typing them all by hand.
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
];

export function libSystemBySlug(slug: string): LibrarySystem | null {
  return SYSTEM_LIBRARY.find((s) => s.slug === slug) ?? null;
}
