import type { LibraryScenario } from "./types";

/**
 * Asset & wealth-management scenarios — investment managers, fund admins,
 * platforms, custodians, family offices. Calibrated to FCA / PRA / SEC
 * cross-border regulatory frameworks.
 */
export const ASSET_WEALTH_SCENARIOS: LibraryScenario[] = [
  {
    slug: "fund-pricing-error",
    title: "Material fund-pricing error discovered after NAV publication",
    sectors: ["asset-wealth"],
    category: "Technology & Data (Cyber)",
    background:
      "A fund-administrator error produces an incorrect NAV for a £4.2bn equity fund. The error of ~£0.08 per unit overstates value. Investors transacted at the wrong price. FCA SUP 15 notification clock starts. Compensation scheme triggered. Some redemption-trades were also at the wrong price — claw-back or top-up required per investor.",
    characteristics: [
      "NAV-integrity event with mass-investor impact",
      "FCA SUP 15 and Investment-Management material-error rules",
      "Per-investor compensation calculation",
    ],
    assumptions: [
      "Error is reproducible and root-causable",
      "Compensation can be funded from manager-firm",
      "Press cycle is sector-press not consumer-press",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "platform-trading-outage",
    title: "Wealth platform trading-engine outage during market open",
    sectors: ["asset-wealth"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_2",
    background:
      "The wealth-platform's trading engine fails at market open (08:00 London). ~800,000 retail customers cannot execute trades. Volatile market day; missed-trade exposure is real. FCA's COBS rules require best-execution; customers will demand price-protection. App is up but trade-button greyed out. Press coverage immediate.",
    characteristics: [
      "Market-window-critical outage",
      "Customer-trade-loss exposure",
      "Best-execution compliance question",
    ],
    assumptions: [
      "Recovery within 60-120 minutes feasible",
      "Customers expect price-protection guarantees",
      "FCA expects materiality assessment same-day",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    durationMin: 120,
  },
  {
    slug: "custodian-cyber-attack",
    title: "Custodian-bank cyber incident locks down investor assets",
    sectors: ["asset-wealth", "banking"],
    category: "Third Party",
    tier: "TIER_1",
    background:
      "The custodian holding £18bn of customer assets across multiple funds is hit by a ransomware attack. Settlement, corporate-actions and cash-movement all stop. The asset manager has direct view of holdings via mirror-systems but cannot transact. Investors are calling. FCA, PRA and multiple international regulators engaged.",
    characteristics: [
      "Concentration in a custodian dependency",
      "Multi-day settlement disruption",
      "Cross-border regulatory complexity",
    ],
    assumptions: [
      "Custodian restoration 5-10 days",
      "Asset-positions are recoverable from mirror records",
      "Insurance disputes likely between manager and custodian",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "fund-redemption-gate",
    title: "Liquidity squeeze forces a property fund to gate redemptions",
    sectors: ["asset-wealth"],
    category: "Geopolitical & Macro",
    background:
      "A property-fund holds illiquid assets; redemption requests have spiked 8x normal following negative market news. The fund's liquidity buffer is exhausted; a redemption-gate must be invoked. Investors will be unhappy. FCA expects clear comms. Other property funds in the market are watching closely.",
    characteristics: [
      "Liquidity-mismatch event with reputational fallout",
      "Investor-comms in a charged-news environment",
      "Cross-firm contagion potential",
    ],
    assumptions: [
      "Gate length 30-90 days",
      "Asset-disposals at fire-sale prices possible",
      "Press cycle compares to previous property-fund gates (Woodford-era)",
    ],
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 150,
    caseStudy: {
      title: "M&G Property Portfolio fund gating (December 2019)",
      causation: "Brexit / illiquidity / Woodford contagion",
      impactScale: "£2.5bn gated, multi-month redemption suspension",
    },
  },
  {
    slug: "data-breach-hnw-client",
    title: "Wealth-platform data breach exposes HNW client portfolios",
    sectors: ["asset-wealth"],
    category: "Technology & Data (Cyber)",
    background:
      "A misconfigured reporting tool exposes ~3,500 HNW client portfolios — names, addresses, asset-totals. ICO involvement, plus a real personal-safety angle: published net-worth makes clients targets for fraud, kidnap, social-engineering. Comms must be sensitive to safety implications.",
    characteristics: [
      "HNW privacy breach with personal-safety dimension",
      "Sensitive client-segment with high churn risk",
      "Press / class-action exposure",
    ],
    assumptions: [
      "Existing data-exposure window approximated",
      "Safety briefings to HNW clients are necessary",
      "Churn cost will exceed regulatory fine",
    ],
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 150,
  },
  {
    slug: "model-portfolio-mass-rebalance",
    title: "Model-portfolio mass-rebalance triggers an FCA Best-Execution query",
    sectors: ["asset-wealth"],
    category: "Technology & Data (Cyber)",
    background:
      "A model-portfolio change is applied to ~200,000 client portfolios simultaneously. Execution-impact moves the market on the targeted asset; clients near the front of the queue get better fills than those at the back. FCA Best-Execution rules engaged. Compensation modelling and process-control review run in parallel.",
    characteristics: [
      "Algorithmic-trading impact on market microstructure",
      "Best-execution and fairness scrutiny",
      "Compensation across a large client base",
    ],
    assumptions: [
      "Compensation modelling is data-rich but contested",
      "FCA review will take months",
      "Process control change is unavoidable",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 120,
  },
  {
    slug: "kyc-aml-mass-suspension",
    title: "AML-screening false-positive wave freezes 5,000 client accounts",
    sectors: ["asset-wealth", "payments-fintech"],
    category: "Technology & Data (Cyber)",
    background:
      "A KYT vendor's screening-rules update fires 5,000 false-positives. Client accounts are auto-frozen pending review. Clients can't trade or transact. Vendor concedes the error within hours but the firm must unfreeze and reassure 5,000 clients individually. Some are HNW; some are institutional. Press will pick up on the affected-institutional-clients angle.",
    characteristics: [
      "Vendor-driven mass-customer-impact",
      "Reputational risk amplified by client-segment",
      "Process-recovery at scale",
    ],
    assumptions: [
      "Vendor accepts liability subject to contractual limits",
      "Manual unfreeze takes 6-8 hours of operations time",
      "Client-comms tone matters more than process explanation",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 120,
  },
  {
    slug: "private-equity-portfolio-valuation",
    title: "Private-equity portfolio valuation challenged by an audit firm",
    sectors: ["asset-wealth"],
    category: "People",
    background:
      "An auditor disputes the fair-value methodology for ~£800M of unlisted PE holdings. The valuation impacts NAV calculations and management-fees. Auditor and IM-firm relationship under strain. Compensation, restatement and FCA notification questions emerge. Confidentiality of disputed valuations is a sensitive issue.",
    characteristics: [
      "Audit-driven control event, not technology incident",
      "Multi-month resolution timeline",
      "Confidentiality vs. transparency tension",
    ],
    assumptions: [
      "Auditor methodology is defensible but conservative",
      "Restatement would impact annual fees",
      "FCA expects materiality assessment",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "platform-tax-reporting-fail",
    title: "Year-end CGT tax-reporting pipeline produces wrong cost-bases",
    sectors: ["asset-wealth"],
    category: "Technology & Data (Cyber)",
    background:
      "The annual capital-gains-tax statements sent to retail investors include wrong cost-bases for ~80,000 customers. HMRC self-assessment deadline is 4 weeks out. Customers calling, accountants escalating. Re-issue across the whole book is operationally complex; partial re-issue risks visible inequity.",
    characteristics: [
      "Tax-reporting-pipeline integrity event",
      "Customer financial-impact (potentially over or under tax)",
      "HMRC and FCA both interested",
    ],
    assumptions: [
      "Reproduction of correct cost-bases takes days",
      "Mass communication needs to be precise and reassuring",
      "Accountant relationships will amplify the story",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "depo-corporate-action-misprocessed",
    title: "Corporate action mis-processed across multiple funds",
    sectors: ["asset-wealth"],
    category: "Third Party",
    background:
      "A scrip-dividend corporate action is mis-applied across multiple funds — some investors receive cash where they elected scrip, some vice versa. Custodian and asset-manager point at each other. ~£14M of incorrect entitlements need to be reversed and re-processed. FCA Best-Execution and operational-risk reviews follow.",
    characteristics: [
      "Custodian-vs-IM accountability question",
      "Multi-fund retrospective remediation",
      "Investor trust impact",
    ],
    assumptions: [
      "Reversal is operationally feasible but slow",
      "Investor-comms needs to make whole, not just inform",
      "FCA expects materiality assessment",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "platform-margin-call-cascade",
    title: "CFD platform margin-call cascade during a volatile market",
    sectors: ["asset-wealth"],
    category: "Geopolitical & Macro",
    background:
      "An overnight commodity move triggers a wave of margin calls on the firm's CFD / spread-betting platform. Some retail customers face losses larger than their account balances (negative-balance event). Liability question + complaint surge + ESMA/FCA scrutiny on retail-leveraged products.",
    characteristics: [
      "Market-volatility-event with retail-customer-harm primacy",
      "Negative-balance protection vs. firm-liability trade-off",
      "Regulator scrutiny on retail-leveraged-product model",
    ],
    assumptions: [
      "Negative-balance protection applies under ESMA / FCA rules",
      "Liquidity to absorb the protection cost is available",
      "Press coverage compares to historic CHF / Swiss-franc episode",
    ],
    coversTechnology: true,
    coversPeople: true,
    coversDataIntegrity: true,
    durationMin: 150,
    caseStudy: {
      title: "CHF de-pegging (January 2015)",
      causation: "SNB removed EUR/CHF peg, FX crashed",
      impactScale: "Multiple retail-FX brokers insolvent within hours",
    },
  },
  {
    slug: "esg-greenwashing-allegation",
    title: "Investigative journalists allege ESG-fund greenwashing",
    sectors: ["asset-wealth"],
    category: "Geopolitical & Macro",
    background:
      "A long-read alleges the firm's flagship ESG fund holds material exposure to tobacco / fossil-fuel / arms suppliers via opaque structuring. FCA's anti-greenwashing rules apply. Retail-investor exodus risk; class-action firms organising. Investor-comms, fund-restructuring and regulator-response all in parallel.",
    characteristics: [
      "ESG-marketing integrity attack with regulator overlay",
      "Multi-channel investor-trust impact",
      "Long-tail commercial damage",
    ],
    assumptions: [
      "Some allegations are accurate; others are framing",
      "FCA anti-greenwashing rules apply since May 2024",
      "Press cycle is sustained",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
  },
];
