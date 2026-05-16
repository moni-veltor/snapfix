import type { LibraryScenario } from "./types";

/** Retail & e-commerce — bricks-and-clicks, pure-play, marketplaces. */
export const RETAIL_ECOMMERCE_SCENARIOS: LibraryScenario[] = [
  {
    slug: "black-friday-checkout-meltdown",
    title: "Checkout meltdown during the first hour of Black Friday",
    sectors: ["retail-ecommerce"],
    category: "Technology & Data (Cyber)",
    background:
      "At 00:14 on Black Friday, the checkout service's database connection pool exhausts under load. ~62% of carts fail at the payment step. Marketing spend is driving £2M/hour of traffic. The site stays up but conversion craters. The CTO must decide between an emergency hot-fix deploy (risky), aggressive throttling (annoys customers) or running on a slower fallback path (worse UX but stable).",
    characteristics: [
      "Revenue-loss meter ticking visibly",
      "Marketing spend amplifying the customer-impact",
      "Trade-off between availability, conversion and stability",
    ],
    assumptions: [
      "Marketing can pause spend in 15 minutes but partner-agencies need notification",
      "Hot-fix has been done before but at lower traffic",
      "Customer-service team are about to be overrun",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    durationMin: 120,
  },
  {
    slug: "warehouse-fire-peak-season",
    title: "Primary fulfilment warehouse fire on the last weekend before Christmas",
    sectors: ["retail-ecommerce", "logistics"],
    category: "Property",
    background:
      "A fire in the racking of the primary fulfilment centre forces evacuation and a multi-day closure. ~38% of orders due for last-Christmas-delivery cannot be fulfilled from this site. Secondary fulfilment centres can pick up some volume; some SKUs are exclusively at the burning site. Customer-comms strategy and refund-vs-promise-of-delivery decisions need to land in hours, not days.",
    characteristics: [
      "Physical-property catastrophe with seasonal urgency",
      "Multi-site fallback partial",
      "Customer-emotional impact: missed Christmas presents",
    ],
    assumptions: [
      "Insurance covers business interruption from day one",
      "Some inventory destroyed; some recoverable post-clearance",
      "Press will pick this up given timing",
    ],
    coversPeople: true,
    coversProperty: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "magecart-skimmer",
    title: "Magecart-style payment-skimmer found on the checkout JavaScript",
    sectors: ["retail-ecommerce", "payments-fintech"],
    category: "Technology & Data (Cyber)",
    background:
      "Security finds a minified obfuscated skimmer injected into checkout.js eight days ago via a compromised npm package. ~190,000 card numbers are likely exfiltrated. ICO 72-hour clock has effectively started. Card schemes will levy fines. Customers will need to be notified and offered credit-monitoring; the firm must coordinate with acquirer and schemes for card-reissuance.",
    characteristics: [
      "Supply-chain compromise upstream in the front-end stack",
      "PII + payment-data combined exposure",
      "Multi-stakeholder coordination at speed",
    ],
    assumptions: [
      "Skimmer can be removed within an hour; clean-up of past pages is harder",
      "Acquirer will require independent forensic confirmation",
      "Class-action risk is material",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
    caseStudy: {
      title: "British Airways Magecart breach (Sept 2018)",
      causation: "Compromised script injected into checkout flow",
      impactScale: "380k customers exposed, £20M ICO fine",
    },
  },
  {
    slug: "loyalty-program-credential-stuffing",
    title: "Loyalty-program credential stuffing drains points balances",
    sectors: ["retail-ecommerce"],
    category: "Technology & Data (Cyber)",
    background:
      "A credential-stuffing campaign hits the loyalty programme overnight. Attackers convert points balances into gift cards for ~14,000 accounts. The gift cards are mostly already redeemed at high-velocity. Customers wake up to drained balances. The contact centre is being overrun. Loyalty programme makes up 22% of the firm's customer-lifetime-value metric.",
    characteristics: [
      "Non-monetary asset with real cash value",
      "Velocity of attack outpaced detection",
      "Customer-trust hit in a loyalty franchise",
    ],
    assumptions: [
      "Gift-card velocity controls can be tightened immediately",
      "Customers who lost points expect 100% restoration",
      "Some genuine redemptions are in the cohort",
    ],
    coversPeople: true,
    coversDataIntegrity: true,
    durationMin: 90,
  },
  {
    slug: "epos-pos-network-down",
    title: "EPOS / in-store POS network outage on a Bank-Holiday weekend",
    sectors: ["retail-ecommerce"],
    category: "Technology & Data (Cyber)",
    background:
      "On Saturday morning of the August bank holiday, the in-store POS network goes down across all UK stores. Cash-only operation in some sites, complete closure in others. Customer queues are long; some staff are improvising with manual entry on phones. The vendor's status page took 40 minutes to update; vendor support is a queue-based ticket system on a Saturday.",
    characteristics: [
      "Physical-channel failure on a peak retail day",
      "Vendor-support-tempo doesn't match retail-tempo",
      "Staff-driven improvisation good for goodwill, bad for controls",
    ],
    assumptions: [
      "Cards-can-be-stored-and-processed-later via mobile POS",
      "Some stores have no cash float",
      "Press will visit the largest London flagship",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    coversProperty: true,
    durationMin: 120,
  },
  {
    slug: "pricing-error-cascade",
    title: "Pricing-engine error lists premium SKUs at near-zero prices",
    sectors: ["retail-ecommerce"],
    category: "Technology & Data (Cyber)",
    background:
      "A unit-conversion bug in the pricing engine lists ~2,800 premium SKUs at 1/100th of their intended price for 28 minutes. Social media catches on; ~14,000 orders are placed. Operations halt order release. The question becomes: honour the orders (loss ~£14M), cancel and refund (reputational hit, possible CMA complaint) or honour with a goodwill discount?",
    characteristics: [
      "Self-inflicted, fast-moving event",
      "Customer-rights ambiguity (display-error doctrine)",
      "Brand-vs-bottom-line trade-off",
    ],
    assumptions: [
      "CMA / ASA may take an interest if cancellation is the path",
      "Some customers will keep screenshots and pursue chargebacks",
      "Honouring may set a precedent",
    ],
    coversDataIntegrity: true,
    durationMin: 90,
  },
  {
    slug: "carrier-strike",
    title: "National carrier strike during the firm's biggest delivery window",
    sectors: ["retail-ecommerce", "logistics"],
    category: "Geopolitical & Macro",
    background:
      "A national carrier strike is called with 36 hours' notice during the firm's busiest delivery window. ~64% of outbound orders use this carrier. Alternative carriers have capacity but at premium rates and slower SLAs. Customer-promise SLAs were set before the strike was known. Operations need to triage orders, switch carriers, and manage customer expectations.",
    characteristics: [
      "Industrial-relations event outside firm's control",
      "Carrier-concentration risk made real",
      "Customer-promise breaches at scale",
    ],
    assumptions: [
      "Some carriers won't take last-minute large-volume diversion",
      "Premium pricing erodes margin during the affected window",
      "Press will frame this as a logistics failure",
    ],
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "negative-influencer-storm",
    title: "Viral negative-influencer video targets a flagship product line",
    sectors: ["retail-ecommerce"],
    category: "People",
    background:
      "A consumer-rights influencer (4.2M followers) posts a viral video alleging quality issues in the flagship-line product. The claims are partially true. Within 12 hours, sales of the line drop 60%. Customer-service is overwhelmed. The legal team wants a hard rebuttal; the brand team wants a humble owning-it response. Time to land a position is hours, not days.",
    characteristics: [
      "Brand-led crisis without operational failure",
      "Truth-and-narrative complexity",
      "Speed-vs-quality trade-off in response",
    ],
    assumptions: [
      "Influencer is reachable but unlikely to retract",
      "Recall is operationally feasible but expensive",
      "Press will follow the influencer's framing",
    ],
    coversPeople: true,
    durationMin: 120,
  },
  {
    slug: "marketplace-seller-fraud",
    title: "Marketplace seller-fraud at scale exposes the firm's brand",
    sectors: ["retail-ecommerce"],
    category: "People",
    background:
      "Investigation surfaces that ~340 marketplace sellers, accounting for 4% of GMV last quarter, have been running counterfeit operations. Customers are receiving fake goods. Brand-owners are threatening legal action against the firm itself. The marketplace-onboarding process clearly failed. Vendor-vetting overhaul will take months.",
    characteristics: [
      "Slow-burn issue with cliff-edge legal exposure",
      "Brand-owner-litigation risk",
      "Operational overhaul vs. short-term remediation",
    ],
    assumptions: [
      "Sellers can be suspended within hours; refund-and-recall takes weeks",
      "Customers expect full refund; some demand prosecution of sellers",
      "Brand-owners have legal teams that move fast",
    ],
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "ecommerce-platform-vendor-outage",
    title: "Ecommerce platform vendor (Shopify / Adobe / commercetools) outage",
    sectors: ["retail-ecommerce", "technology-saas"],
    category: "Third Party",
    background:
      "The firm's ecommerce platform vendor experiences a multi-hour outage. The site is up but checkout, cart and product-detail-pages return inconsistent errors. Vendor's status page is slow to update. Other retailers using the same platform are also affected — competitors are running ads pointing customers to themselves. The CEO wants to know contractual remedies and engineering options.",
    characteristics: [
      "Platform-as-a-service single-vendor dependency",
      "Competitor capitalising in real time",
      "Limited engineering options",
    ],
    assumptions: [
      "Vendor RTO commitments are best-effort",
      "Static-cache fallback can serve product pages but not transactions",
      "Customers will switch to competitors if outage lasts >2 hours",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "epos-firmware-bricks-tills",
    title: "EPOS firmware update bricks ~40% of tills mid-Saturday",
    sectors: ["retail-ecommerce", "payments-fintech"],
    category: "Technology & Data (Cyber)",
    background:
      "A vendor-pushed firmware update to chip-and-PIN terminals bricks ~40% of units across the firm's estate during peak Saturday lunchtime. Cash-only operation in affected lanes; queues form; revenue drops. Vendor's remote rescue capability is partial; many units need engineer visits. Multi-day recovery.",
    characteristics: [
      "Vendor-firmware bricking event with field-engineering remediation",
      "Estate-wide visibility on a peak day",
      "Customer queues and abandonment",
    ],
    assumptions: [
      "Engineer-visit capacity 200 units / day",
      "Cash floats can be expanded but not infinitely",
      "Vendor liability under contract is meaningful but capped",
    ],
    coversTechnology: true,
    coversProperty: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "marketplace-counterfeit-injunction",
    title: "Court injunction demands marketplace removes 800 listings within 48 hours",
    sectors: ["retail-ecommerce"],
    category: "Geopolitical & Macro",
    background:
      "A luxury IP-holder obtains a court injunction requiring removal of ~800 counterfeit listings within 48 hours, banning the implicated sellers and freezing their balances. Trust-and-safety scrambles. Some flagged listings are false-positives. Legal-and-operational pressure simultaneous.",
    characteristics: [
      "Court-ordered takedown with hard deadline",
      "Rights-holder over-blocking risk",
      "Seller-relationship management at scale",
    ],
    assumptions: [
      "Court deadline is firm; contempt-of-court risk",
      "Some flagged listings are genuine",
      "Press cycle is either 'counterfeits sold' or 'innocent sellers banned'",
    ],
    coversPeople: true,
    coversThirdParty: true,
    coversDataIntegrity: true,
    durationMin: 120,
  },
];
