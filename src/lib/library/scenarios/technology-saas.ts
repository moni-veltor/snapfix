import type { LibraryScenario } from "./types";

/**
 * Technology / SaaS scenarios — B2B SaaS providers, cloud platforms,
 * developer-tools companies, marketplaces. Distinctive risks around
 * multi-tenancy, customer-data isolation, and concentration in cloud
 * dependencies.
 */
export const TECHNOLOGY_SAAS_SCENARIOS: LibraryScenario[] = [
  {
    slug: "multi-tenant-data-leak",
    title: "Multi-tenant boundary failure exposes Customer A data to Customer B",
    sectors: ["technology-saas"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_2",
    background:
      "A bug in the access-control layer briefly exposes data from Customer A to Customer B during a peak-load period. ~40 minutes of cross-tenant data exposure. Affected customers include high-profile enterprise clients. Breach-disclosure obligations vary by customer contract; ICO interest universal.",
    characteristics: [
      "Multi-tenancy-boundary failure — most-dreaded SaaS event",
      "Per-customer breach-notification obligations",
      "Trust-and-contract recovery long tail",
    ],
    assumptions: [
      "Affected-tenant-pairs are identifiable from logs",
      "Notification at scale takes 3-5 days",
      "Enterprise-customer contract renewals at risk",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "cloud-provider-region-outage",
    title: "Cloud-provider region outage takes the SaaS platform offline globally",
    sectors: ["technology-saas"],
    category: "Third Party",
    background:
      "AWS / Azure / GCP region outage takes the SaaS platform offline. Customers globally affected. Multi-region failover exists but never tested at production load. Status-page communication frequency under scrutiny. SLA-credits triggered for enterprise customers; revenue impact in the millions per hour.",
    characteristics: [
      "Concentration in hyperscaler region",
      "Untested multi-region failover under pressure",
      "Per-customer SLA-credit clock running",
    ],
    assumptions: [
      "Hyperscaler restoration is hours not days",
      "Multi-region failover takes 30-90 minutes to execute",
      "Press cycle is sector-tech-press",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "supply-chain-npm-compromise",
    title: "Supply-chain attack via compromised npm dependency",
    sectors: ["technology-saas"],
    category: "Technology & Data (Cyber)",
    background:
      "A popular npm dependency used in the firm's build is found to contain malicious code. The package's compromised version was published 14 days ago and has been included in production builds since. Forensic investigation of what data the malicious code exfiltrated is ongoing. NCSC and security-research community engaged.",
    characteristics: [
      "Long-dwell-time supply-chain compromise",
      "Build-pipeline integrity question",
      "Industry-wide investigation",
    ],
    assumptions: [
      "Removal and rebuild can be done in days",
      "Forensic-scope is broad (everything the affected build touched)",
      "Insurance treats supply-chain compromise as covered",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "enterprise-customer-data-export",
    title: "Enterprise customer cancels and demands GDPR data-export within 30 days",
    sectors: ["technology-saas"],
    category: "Geopolitical & Macro",
    background:
      "A large enterprise customer (£8M ARR) terminates and demands full GDPR data-export. Data-export tooling is partial; manual extraction required. Customer signals they're moving to a competitor. Sales / Customer-Success efforts to renegotiate are too late. Operational and commercial response in parallel.",
    characteristics: [
      "Concentrated-customer churn risk realised",
      "Data-export tooling-gap exposed",
      "Multi-week operational effort",
    ],
    assumptions: [
      "GDPR Article 20 export obligations are 30 days",
      "Data-extraction takes 80-120 person-hours",
      "Competitor-onboarding is the customer's clock not the firm's",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "api-key-leak-customer",
    title: "Customer's API-key leaked on GitHub used to exfiltrate their data",
    sectors: ["technology-saas"],
    category: "Technology & Data (Cyber)",
    background:
      "Anomaly-detection flags unusual API-volume from one customer's account. Investigation shows their API-key was inadvertently committed to a public GitHub repo 2 weeks ago. Attacker has been exfiltrating data via API. Customer notification, key-rotation, and customer-side investigation parallel.",
    characteristics: [
      "Customer-caused breach, vendor responsibility ambiguous",
      "API-rate-limit / anomaly-detection adequacy review",
      "Industry-pattern (secrets-in-repos)",
    ],
    assumptions: [
      "Key-rotation feasible within an hour",
      "Affected-data-scope is identifiable from API logs",
      "Customer-contract assigns most liability to customer",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "ai-model-poisoning",
    title: "ML training-data poisoning affects in-product recommendations",
    sectors: ["technology-saas"],
    category: "Technology & Data (Cyber)",
    background:
      "Adversarial-poisoning of the public datasets used to retrain the firm's recommendation model causes the model to behave erratically for certain queries. Customers notice and complain on social. Model rollback to previous version possible but loses 6 weeks of improvements. Investigation of dataset provenance and pipeline-hardening required.",
    characteristics: [
      "Adversarial-ML threat surface",
      "Trust-and-safety implications",
      "Pipeline-hardening multi-quarter programme",
    ],
    assumptions: [
      "Rollback is feasible within 24 hours",
      "Pipeline-hardening is multi-quarter",
      "Customer-comms emphasises responsible-AI",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    durationMin: 120,
  },
];
