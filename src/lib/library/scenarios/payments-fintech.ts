import type { LibraryScenario } from "./types";

/**
 * Payments & fintech — BaaS providers, e-money, acquirers, processors,
 * open-banking AISPs/PISPs.
 */
export const PAYMENTS_FINTECH_SCENARIOS: LibraryScenario[] = [
  {
    slug: "baas-partner-bank-failure",
    title: "BaaS partner-bank suspension halts the fintech's customer accounts",
    sectors: ["payments-fintech", "banking"],
    category: "Third Party",
    background:
      "The fintech's BaaS partner-bank is hit by an FCA s55 supervisory action and must restrict new account opening and outbound payments. The fintech's entire customer base — 1.4M users — sit on segregated client-money accounts at that bank. Customers are messaging in real time. Treasury, Comms, Legal and Product need a coordinated response that doesn't undermine the partner-bank or accidentally signal insolvency.",
    characteristics: [
      "Existential reliance on a single partner-bank",
      "Customer-money is technically segregated but optically conflated",
      "Comms have to be truthful without panicking",
    ],
    assumptions: [
      "Partner-bank is solvent — issue is supervisory, not credit",
      "Customer FAQ has been drafted but never tested",
      "Alternative BaaS providers exist but onboarding is 4-6 months",
    ],
    coversPeople: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    durationMin: 180,
    caseStudy: {
      title: "Synapse / Evolve Bank collapse (April 2024)",
      causation: "BaaS middleware bankruptcy, reconciliation chaos",
      impactScale: "$85M of customer funds frozen, weeks of disruption",
    },
  },
  {
    slug: "stablecoin-depeg",
    title: "Stablecoin partner de-pegs during a crypto market stress event",
    sectors: ["payments-fintech"],
    category: "Geopolitical & Macro",
    background:
      "A major USD stablecoin held in the firm's customer-funds rail de-pegs from $1.00 to $0.78 in 11 minutes. Customers who hold balances see losses crystallise. The firm's reserves backing the rail also drop in dollar terms. Liquidity-management workflows are designed for fiat, not for stablecoin volatility.",
    characteristics: [
      "Novel-asset volatility outside traditional risk models",
      "Customer-funds depletion in real time",
      "Cross-border regulatory unclear (FCA, US Treasury)",
    ],
    assumptions: [
      "Stablecoin issuer claims it's redeemable at par but redemption queue is hours-long",
      "Fiat off-ramps still functional",
      "Customers can lock their balance but at the depressed rate",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 120,
    caseStudy: {
      title: "USDC SVB-exposure depeg (March 2023)",
      causation: "Circle revealed $3.3bn at SVB; USDC fell to $0.87",
      impactScale: "Mass redemption, recovered within 72 hours",
    },
  },
  {
    slug: "acquirer-pci-suspension",
    title: "Acquirer PCI-DSS suspension forces traffic onto backup acquirer",
    sectors: ["payments-fintech", "retail-ecommerce"],
    category: "Third Party",
    background:
      "The primary acquirer suspends the firm's MID after a PCI-DSS finding (unencrypted card-pan in a logging path). Card traffic must immediately reroute to the backup acquirer. The backup MID has been provisioned but the firm has never live-tested at production volume. Merchants notice differences in approval rates and fees.",
    characteristics: [
      "Mandatory rerouting under pressure",
      "Backup capacity unproven at scale",
      "Customer (merchant) impact in approval rates",
    ],
    assumptions: [
      "Failover takes 4-8 hours operationally",
      "Backup pricing terms are worse, eroding margin during the window",
      "Card schemes are informed via the suspending acquirer",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    coversDataIntegrity: true,
    durationMin: 150,
  },
  {
    slug: "open-banking-aisp-outage",
    title: "Open-banking AISP API connector fails for top-3 banks simultaneously",
    sectors: ["payments-fintech"],
    category: "Third Party",
    background:
      "The firm's open-banking AISP integration fails to retrieve account data from the three biggest UK banks at the same time. Customer flows that depend on aggregated balance (lending decisioning, affordability) stall. The AISP vendor blames the banks; the banks blame the AISP. The OBL technical helpdesk takes 4 hours to respond.",
    characteristics: [
      "Distributed-system failure across multiple counterparties",
      "Blame-game during recovery wastes time",
      "Customer-facing flows depend on data that can't be retrieved",
    ],
    assumptions: [
      "Manual statement-upload fallback exists but kills conversion",
      "OBL escalation path is documented but slow",
      "Each bank's TPP-incident-channel is different",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "wallet-app-store-takedown",
    title: "App-store removes the firm's wallet app after a false-flag complaint",
    sectors: ["payments-fintech"],
    category: "Third Party",
    background:
      "At 23:40 Apple removes the wallet app from the App Store citing 'reports of fraudulent behaviour'. The complaint appears to be a competitor or troll. Customers cannot download or update the app overnight. Customer-acquisition spend continues to drive traffic to a dead listing. Apple's developer-support is asynchronous and slow.",
    characteristics: [
      "Single-vendor existential dependency",
      "Adversary-led takedown (intentional or accidental)",
      "Customer-acquisition spend wasting in real time",
    ],
    assumptions: [
      "Apple takes 24-72 hours to investigate and respond",
      "Existing installs continue to work",
      "Marketing can pause spend but lose creative cycles",
    ],
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "card-bin-attack",
    title: "Card-BIN enumeration attack triggers global card-scheme blocking",
    sectors: ["payments-fintech", "banking"],
    category: "Technology & Data (Cyber)",
    background:
      "A coordinated BIN-enumeration attack hits the firm's card programme. Tens of thousands of fraudulent test-charges arrive in 90 minutes. Visa's risk team escalates and threatens BIN-level blocking. Real customers' legitimate transactions get caught in the crossfire. The fraud team's tooling is sized for steady-state, not surge.",
    characteristics: [
      "Surge against fraud-controls capacity",
      "Scheme-imposed BIN-blocking risk",
      "False-positives degrade legitimate customer experience",
    ],
    assumptions: [
      "Velocity rules can throttle but at risk of false-positives",
      "Visa expects rapid demonstrable response or risks scheme action",
      "Card-issuance partner can reissue at speed if needed",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "kyt-vendor-data-poisoning",
    title: "Transaction-monitoring rules degraded by poisoned vendor feed",
    sectors: ["payments-fintech", "banking"],
    category: "Technology & Data (Cyber)",
    background:
      "The KYT (know-your-transaction) sanctions/PEPs vendor's reference feed degrades silently: a malformed update suppresses 14% of historical hit-types. Over a weekend, the firm processes ~2.1M transactions with degraded screening. The vendor patches Monday morning; the firm discovers Tuesday. Retrospective screening shows ~80 likely-missed-hits. FCA SUP 15 clock starts when the firm becomes aware.",
    characteristics: [
      "Silent data-feed degradation",
      "Retrospective remediation across a weekend's traffic",
      "Sanctions exposure with criminal-liability dimension",
    ],
    assumptions: [
      "Vendor will acknowledge but contractually limit liability",
      "Sanctions-list updates have audit-trail",
      "Customer freeze actions need legal sign-off",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "savings-rate-comparison-rush",
    title: "Best-buy-table inclusion triggers application surge past capacity",
    sectors: ["payments-fintech", "banking"],
    category: "Geopolitical & Macro",
    background:
      "MoneySavingExpert promotes the firm's new savings rate as a best-buy. Within 6 hours the firm sees 18x normal application volume. Onboarding workflows queue. Some applications time out and are abandoned. Funding limits are being hit. Treasury wants to pull the rate to slow inflow; Product worries about the brand damage of a 'we don't want your money' message.",
    characteristics: [
      "Marketing-led, not adversary-led, surge",
      "Funding-limit and operational-capacity collide",
      "Brand decision about how to slow the inflow gracefully",
    ],
    assumptions: [
      "Funding limit can be raised but only with treasury sign-off",
      "Rate-pull takes effect at 24-hour notice",
      "MoneySavingExpert will note the rate-pull and may chase the story",
    ],
    coversTechnology: true,
    coversPeople: true,
    durationMin: 90,
  },
  {
    slug: "developer-laptop-compromised",
    title: "Engineering laptop compromise — production credentials exposed",
    sectors: ["payments-fintech", "technology-saas"],
    category: "Technology & Data (Cyber)",
    background:
      "A backend engineer's laptop is compromised via a malicious npm package. The attacker exfiltrates a kubeconfig that grants production cluster admin. The breach is detected 6 hours after the foothold via anomaly detection on outbound traffic. Every secret the laptop ever touched is in scope for rotation. The engineer was on the on-call rotation that night.",
    characteristics: [
      "Supply-chain compromise upstream in the dev toolchain",
      "Production-blast-radius equal to whatever the developer had",
      "Mass-rotation operation against the clock",
    ],
    assumptions: [
      "Vault audit logs identify exactly which secrets the laptop read",
      "Rotation tooling is partial — some secrets need manual rotation",
      "Customers should not be impacted directly; comms are about disclosure not service",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "merchant-acquirer-mass-chargebacks",
    title: "Single merchant onboarded triggers a chargeback storm",
    sectors: ["payments-fintech"],
    category: "People",
    background:
      "A merchant onboarded last week (high-risk vertical, weak underwriting) generates a flood of chargebacks. The firm's reserve doesn't cover the exposure. Card scheme starts auditing the firm's merchant-onboarding process and threatens a fine. Internal review shows underwriting overrides made by a senior staffer who's now on holiday.",
    characteristics: [
      "Single-onboarding decision with portfolio impact",
      "Card-scheme audit posture",
      "People-and-process accountability dimension",
    ],
    assumptions: [
      "Merchant has effectively gone dark",
      "Reserve top-up needed from treasury",
      "Internal review will surface SMCR-style accountability questions",
    ],
    coversPeople: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "cryptocurrency-onramp-fraud",
    title: "Crypto on-ramp partner's KYC bypass exploited at scale",
    sectors: ["payments-fintech"],
    category: "Technology & Data (Cyber)",
    background:
      "The firm's crypto on-ramp partner experiences a KYC-bypass exploit. Synthetic identities have purchased ~$8M of crypto from the firm's wallet customers in 48 hours. The funds are mixed and gone. The firm carries the loss; the partner's contract caps liability at $250k. Sanctions exposure is unclear — some wallets may be on OFAC lists.",
    characteristics: [
      "Partner-exploit with limited contractual recourse",
      "Mixed-fund tracing is best-effort",
      "Sanctions exposure compounds the financial loss",
    ],
    assumptions: [
      "Crypto loss is unrecoverable",
      "Sanctions-screening retrospective check is feasible",
      "FCA expects same-day notification per SUP 15",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "bnpl-affordability-finding",
    title: "BNPL provider's affordability model produces FCA-troubling outcomes",
    sectors: ["payments-fintech"],
    category: "Geopolitical & Macro",
    background:
      "FCA's review of the firm's BNPL affordability decisioning finds a 4% cohort of approved customers who default within 90 days — and a chunk of those are flagged as vulnerable. Consumer Duty implications, model-governance review, customer-redress sizing all in parallel. Press cycle is sustained.",
    characteristics: [
      "Algorithmic-credit-decisioning finding",
      "Vulnerable-customer harm dimension",
      "FCA Consumer Duty remediation",
    ],
    assumptions: [
      "Model can be retuned in 4-8 weeks",
      "Customer redress sizing is contested",
      "Press cycle compares to historic Klarna / FCA tensions",
    ],
    coversPeople: true,
    coversDataIntegrity: true,
    durationMin: 150,
  },
  {
    slug: "rt-payments-rail-launch",
    title: "Real-time payments scheme cutover lands worse than planned",
    sectors: ["payments-fintech", "banking"],
    category: "Third Party",
    background:
      "The firm participates in a Pay.UK / NPA-style real-time payments scheme cutover. Migration weekend reveals reconciliation gaps; ~30,000 customer payments are in 'pending' for over 24 hours. Customers calling, regulator and scheme operator on the bridge. Other participating firms have similar problems.",
    characteristics: [
      "Industry-wide scheme cutover with shared failure mode",
      "Reconciliation gap across multiple firms",
      "Multi-firm coordination via scheme operator",
    ],
    assumptions: [
      "Roll-back is not feasible at this point — scheme has cut over",
      "Reconciliation can be patched within 72 hours",
      "Customer redress for missed-payment harm is required",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    coversDataIntegrity: true,
    durationMin: 180,
  },
  {
    slug: "ato-credential-stuffing",
    title: "Credential-stuffing wave triggers mass account takeovers",
    sectors: ["payments-fintech", "banking", "retail-ecommerce"],
    category: "Technology & Data (Cyber)",
    background:
      "A credential-stuffing attack using a leaked third-party data dump hits the firm overnight. ~3,400 accounts are taken over before MFA-enforcement step-ups kick in. Funds have been moved from ~1,100 of them. The firm must lock affected accounts, reach customers, reverse fraudulent transfers and tighten controls without alienating legitimate users.",
    characteristics: [
      "Customer-side credential failure, not the firm's",
      "Bulk-remediation effort with customer-comms scale",
      "Friction-cost trade-off in tightened controls",
    ],
    assumptions: [
      "MFA-enforcement step-up is feasible portfolio-wide within 4 hours",
      "Fraud-recall is bilateral and partial",
      "Have I Been Pwned can confirm the dump source",
    ],
    coversPeople: true,
    coversTechnology: true,
    coversDataIntegrity: true,
    durationMin: 120,
  },
];
