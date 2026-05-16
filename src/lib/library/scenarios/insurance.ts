import type { LibraryScenario } from "./types";

/** Insurance — general, life, health-payer, MGA. */
export const INSURANCE_SCENARIOS: LibraryScenario[] = [
  {
    slug: "cat-event-claims-surge",
    title: "Named-storm CAT event triggers a 30-day surge in claims volume",
    sectors: ["insurance"],
    category: "Climate & Environment",
    background:
      "A named winter storm hits the south-east of England with 90mph gusts and widespread flooding. The firm expects ~28,000 first-notification-of-loss claims in 72 hours — 14x normal volume. The claims-handling platform and contact centre are sized for 3x peak. Loss-adjuster availability is the binding constraint, not technology.",
    characteristics: [
      "Volumetric surge against a sized-for-BAU operating model",
      "Loss-adjuster capacity is the bottleneck",
      "Vulnerable-customer exposure: flood victims need help quickly",
    ],
    assumptions: [
      "Reinsurance treaties attach at predictable triggers",
      "Surge-staffing arrangements exist with two BPO partners",
      "FCA expects Consumer Duty handling for vulnerable customers",
    ],
    coversPeople: true,
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "claims-system-ransomware",
    title: "Claims platform encrypted by ransomware mid-CAT-season",
    sectors: ["insurance"],
    category: "Technology & Data (Cyber)",
    background:
      "Ransomware encrypts the claims-handling platform on the third day of a CAT event. The firm cannot accept new FNOLs, cannot pay interim payments, and cannot communicate claim status. Brokers are escalating. Affected policyholders are vulnerable post-flood. The CRO must decide between paying the ransom (sanctions-questionable), restoring from backup (48 hours), or running claims via spreadsheets.",
    characteristics: [
      "Cyber compounding a CAT operational stress",
      "Critical-customer-harm cohort already disclosed",
      "Manual fallback feasible but slow",
    ],
    assumptions: [
      "Immutable backup is 18 hours old",
      "Loss-adjuster handheld devices are independent of the platform",
      "Brokers can lodge claims via email if needed",
    ],
    coversPeople: true,
    coversTechnology: true,
    coversDataAvailability: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "actuarial-model-error",
    title: "Material error discovered in the live pricing actuarial model",
    sectors: ["insurance"],
    category: "Technology & Data (Cyber)",
    background:
      "An actuary in routine review discovers a sign-error in the catastrophe-loading parameter of the live motor-pricing model. The error has been priced into ~340,000 policies issued since June. Some customers were under-priced (book exposure), others over-priced (FCA Consumer Duty exposure). The firm must decide on remediation scope, refund posture and regulator engagement.",
    characteristics: [
      "Slow-burn issue, not an incident — but with hard regulatory cliff",
      "Customer-redress sizing and funding",
      "Reputational risk if surfaced publicly before the firm's narrative is ready",
    ],
    assumptions: [
      "Model error is genuine and reproducible",
      "FCA expects proactive disclosure",
      "Refunds cannot be issued without legal sign-off on materiality and quantum",
    ],
    coversDataIntegrity: true,
    durationMin: 150,
  },
  {
    slug: "broker-portal-outage",
    title: "Broker portal outage during quarter-end renewal volume",
    sectors: ["insurance"],
    category: "Third Party",
    background:
      "The broker self-service portal goes down at the busiest renewal window of the year. Brokers have policies on cover that need to be renewed-or-cancelled within 24 hours. They cannot get quotes or bind via the digital channel. The contact-centre underwriters are being mobbed. The largest broker partner is threatening to flag concentration risk.",
    characteristics: [
      "B2B channel failure, broker-driven escalation",
      "Underwriter capacity is the manual-fallback bottleneck",
      "Concentration-of-distribution risk surfaced under stress",
    ],
    assumptions: [
      "Portal vendor is single-source",
      "Underwriters can quote via email/phone but only at 1/8 the throughput",
      "Large brokers have direct relationships with the CEO",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "fraud-ring-detected",
    title: "Organised motor-claims fraud ring detected — concurrent live claims",
    sectors: ["insurance"],
    category: "People",
    background:
      "Fraud analytics flags a probable organised ring linked to ~180 motor claims across the past 8 months, total exposure £4.2M. Several of those claims are still live in adjudication. Some claimants are now threatening complaint-to-FOS or media exposure if their claims are paused. The firm needs a coordinated investigation, payment-strategy and comms response.",
    characteristics: [
      "Organised fraud with sophisticated cover stories",
      "Concurrent claimant adjudication on a clock",
      "Risk of FOS or media weaponisation by the ring itself",
    ],
    assumptions: [
      "Police are interested but slow to engage at scale",
      "Insurance Fraud Bureau (IFB) referral is the right channel",
      "Some genuine claimants will be inside the cohort by coincidence",
    ],
    coversPeople: true,
    coversDataIntegrity: true,
    durationMin: 150,
  },
  {
    slug: "reinsurance-counterparty-default",
    title: "Reinsurer counterparty downgrade mid-CAT-season",
    sectors: ["insurance"],
    category: "Geopolitical & Macro",
    background:
      "S&P downgrades a reinsurer holding ~22% of the firm's CAT treaty programme from A to BBB. PRA expects engagement within 24 hours. Recoverables on existing claims are technically still due but practical doubt is rising. The firm must consider re-balancing the panel, hedging the exposure, and the capital impact of any prudent assumption change.",
    characteristics: [
      "External counterparty stress, not internal failure",
      "Capital-and-PRA-led response",
      "Need for confidential market intelligence before acting",
    ],
    assumptions: [
      "Alternative reinsurer capacity is available at premium",
      "PRA expects scenario-test evidence under SS5/14",
      "Other UK insurers face the same counterparty",
    ],
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "data-breach-medical-info",
    title: "Health-insurance customer-data exfiltration including medical info",
    sectors: ["insurance", "healthcare"],
    category: "Technology & Data (Cyber)",
    background:
      "A misconfigured BI tool exposes a dataset of 480,000 health-insurance customers including underwriting medical-history responses. Researcher reports it; logs show external IPs accessed it. ICO notification is unavoidable; class-action risk is significant. Some customers' employer relationships could be affected if the breach becomes public before they're informed.",
    characteristics: [
      "Special-category data under UK GDPR Article 9",
      "ICO and class-action exposure",
      "Customer-employer sensitivities",
    ],
    assumptions: [
      "Researcher cooperated and held disclosure",
      "ICO 72-hour clock has effectively started",
      "PR firm capable of notification-mailing at scale is retained on standby",
    ],
    coversDataIntegrity: true,
    durationMin: 150,
  },
  {
    slug: "fos-mass-complaint",
    title: "FOS mass-complaint pattern triggers a portfolio-wide review",
    sectors: ["insurance"],
    category: "People",
    background:
      "The Financial Ombudsman Service signals a pattern in complaints about the firm's life-protection claims-handling — particularly around vulnerable customers. They request a portfolio-wide review and skilled-person evidence pack within 8 weeks. Internal evidence suggests the pattern is real but worse than the headline complaints suggest. Disclosure strategy is the principal decision.",
    characteristics: [
      "Regulator-adjacent stress, multi-month timeline",
      "Internal-evidence-vs-disclosure tension",
      "Vulnerable-customer harm cohort, Consumer Duty in play",
    ],
    assumptions: [
      "FOS has informal escalation routes the firm has used before",
      "Skilled person will likely cost £600k-1.2M",
      "Senior accountability under SMCR is in scope",
    ],
    coversPeople: true,
    coversDataIntegrity: true,
    durationMin: 150,
  },
  {
    slug: "policy-issuance-batch-failure",
    title: "Overnight policy-issuance batch fails silently for 48 hours",
    sectors: ["insurance"],
    category: "Technology & Data (Cyber)",
    background:
      "The overnight policy-issuance batch fails silently for two consecutive nights. ~9,400 customers who renewed yesterday and the day before have no live policy on the books. Some have driven; some have made claims. The firm must reconstruct cover retrospectively and decide whether to fully cover the loss-events for goodwill or take a strict-terms position.",
    characteristics: [
      "Silent-failure scenario — monitoring gap",
      "Customer-cover ambiguity for the retroactive window",
      "Reputational vs. balance-sheet trade-off",
    ],
    assumptions: [
      "Monitoring of batch success has historically been by-exception only",
      "FCA expects a clear customer-fairness narrative",
      "Re-issuance is operationally feasible within 48 hours",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    durationMin: 120,
  },
  {
    slug: "pet-insurance-vet-network",
    title: "Direct-claim vet network refuses to process — payment terms dispute",
    sectors: ["insurance"],
    category: "Third Party",
    background:
      "A nationwide vet chain that processes ~30% of the insurer's pet-claims via direct-claim arrangement withdraws from the agreement citing payment-term delays. Customers are now caught at the till: pay-and-claim rather than direct-claim. Customer experience and the network-relationship are both at stake.",
    characteristics: [
      "Channel-partner relationship breakdown",
      "Customer point-of-sale impact",
      "Press / customer-trust dimension",
    ],
    assumptions: [
      "Alternative vet network exists but at lower coverage",
      "Pay-and-claim adds friction but works",
      "Settlement of payment-terms dispute will resolve, eventually",
    ],
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "telematics-pricing-controversy",
    title: "Telematics-pricing finding sparks discrimination complaint and FCA review",
    sectors: ["insurance"],
    category: "Geopolitical & Macro",
    background:
      "An investigative-journalism piece alleges the firm's telematics-based pricing systematically disadvantages young drivers in certain postcodes — and the postcodes correlate with ethnicity. FCA Consumer Duty engaged; the Equality Act questions raised. Internal review needs to be fast, transparent and defensible.",
    characteristics: [
      "Algorithmic-pricing fairness allegation",
      "Equality Act / discrimination overlay",
      "Press cycle multi-week",
    ],
    assumptions: [
      "Internal data-science review can reproduce the finding",
      "FCA expects a credible remediation plan within 30 days",
      "Customer-facing language matters as much as the technical fix",
    ],
    coversPeople: true,
    coversDataIntegrity: true,
    durationMin: 180,
  },
  {
    slug: "annuity-purchase-system-fail",
    title: "Annuity-purchase platform outage on the last day of the tax year",
    sectors: ["insurance", "asset-wealth"],
    category: "Technology & Data (Cyber)",
    background:
      "On 5 April afternoon, the annuity-purchase platform fails. Hundreds of retirees attempting to lock in rates before the tax-year close cannot transact. HMRC, FCA and customer complaints all converge. Some customers will miss the deadline and lose money.",
    characteristics: [
      "Tax-year-deadline regulatory clock",
      "Vulnerable-customer cohort (retirees)",
      "Direct financial harm if not resolved fast",
    ],
    assumptions: [
      "Recovery in 2-6 hours feasible",
      "Some customers can be quoted by phone in parallel",
      "Press cycle: 'retirees lose out as insurer crashes'",
    ],
    coversTechnology: true,
    coversPeople: true,
    durationMin: 120,
  },
  {
    slug: "guidewire-cloud-outage",
    title: "Core PAS vendor (Guidewire / Duck Creek) cloud outage",
    sectors: ["insurance"],
    category: "Third Party",
    background:
      "The firm's core policy-administration-system vendor's cloud platform suffers a multi-region outage. Issuance, endorsements and claims-decisioning all stop. The vendor's status page initially understates the impact; the firm's CIO is one of multiple insurers escalating simultaneously. DORA critical-third-party scrutiny is in the air.",
    characteristics: [
      "Concentrated-vendor outage shared across multiple insurers",
      "Cross-firm pressure on vendor escalation",
      "Manual underwriting fallback is feasible but slow",
    ],
    assumptions: [
      "Vendor RTO commitments are best-effort, not contractual",
      "Underwriters can quote without the platform for a day, not a week",
      "PRA and FCA are reading the same vendor status page you are",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    durationMin: 150,
  },
];
