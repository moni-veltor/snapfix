import type { LibraryScenario } from "./types";

/**
 * Energy & utilities scenarios — electricity, gas, water, district heating.
 * Calibrated to Ofgem / Ofwat licence obligations and NIS Regulations
 * for Operators of Essential Services.
 */
export const ENERGY_UTILITIES_SCENARIOS: LibraryScenario[] = [
  {
    slug: "billing-system-failure-energy",
    title: "Energy-supplier billing system outage on a price-cap-change day",
    sectors: ["energy-utilities"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_2",
    background:
      "On the day Ofgem's new price cap takes effect, the firm's billing-and-tariff platform fails to apply the change. ~3.1M direct-debit notifications are delayed. Customer-facing pricing on the app and website continues to show old rates. Customers calling for clarity get hours-long queues. Ofgem licence condition requires accurate billing; press coverage is unforgiving.",
    characteristics: [
      "Regulator-imposed event-day failure",
      "Customer-facing pricing inconsistency",
      "Contact-centre and IT response in parallel",
    ],
    assumptions: [
      "Cap-change can be re-run in <24 hours once fixed",
      "Customer-comms must explain the delay without admitting incompetence",
      "Ofgem expects same-day notification",
    ],
    coversDataIntegrity: true,
    coversTechnology: true,
    durationMin: 120,
  },
  {
    slug: "scada-cyber-attack-grid",
    title: "Targeted cyber attack against substation SCADA estate",
    sectors: ["energy-utilities"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_1",
    background:
      "Anomalous commands are observed against substation SCADA in the East Anglia region. NCSC confirms indicators-of-compromise consistent with a nation-state actor. No customer-affecting events yet but the attacker is positioned to cause one. Isolation of the affected SCADA segment is technically possible but risks operational stability. ESO, Ofgem, NCSC, NCA, DESNZ all on the line.",
    characteristics: [
      "Nation-state intrusion with latent-impact potential",
      "Operational-isolation vs. continued-monitoring trade-off",
      "Multi-agency / cross-government coordination",
    ],
    assumptions: [
      "Power-system operability degrades if isolation happens at peak",
      "NCSC provides classified guidance",
      "Public disclosure controlled by HMG, not the firm",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "smart-meter-rollout-mass-failure",
    title: "Smart-meter mass-failure after a firmware push goes wrong",
    sectors: ["energy-utilities"],
    category: "Technology & Data (Cyber)",
    background:
      "An over-the-air firmware push to 140,000 smart meters introduces a bricking bug. Meters stop transmitting readings; some won't reconnect at all. DCC interface logs the failure trend. Customers face estimated bills for weeks. Engineers required for site visits to physically reset units. Vulnerable-customer cohort (prepayment users) face disruption first.",
    characteristics: [
      "Mass-IoT-device failure with field-engineering remediation",
      "Vulnerable-customer prepayment impact",
      "DCC and SECAS scrutiny on data-quality and rollout-control",
    ],
    assumptions: [
      "Field-engineering capacity is the binding constraint",
      "DCC's traceability proves the cause clearly",
      "Press will pick this up if it persists past a week",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "gas-supply-disruption-cold-snap",
    title: "Gas-supply disruption during a cold-snap demand spike",
    sectors: ["energy-utilities"],
    category: "Climate & Environment",
    tier: "TIER_2",
    background:
      "A North-Sea pipeline outage coincides with sub-zero temperatures forecast for the next 5 days. National Grid Gas issues a Gas Balancing Notification. The firm's wholesale-procurement position is short; spot-prices spike. Customer-impact decisions span from interruptible-contract activation to potential I&C demand response. Ofgem's SoLR-related discussions begin.",
    characteristics: [
      "Climate-and-geopolitics compound shock",
      "Wholesale market stress and supply-chain physical constraint",
      "Vulnerable-customer protection under cold weather rules",
    ],
    assumptions: [
      "Cold spell forecast 5-7 days",
      "Interruptible customers can be invoked but resist publicly",
      "DESNZ may consider escalation if shortages persist",
    ],
    coversPeople: true,
    coversProperty: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "water-contamination-event",
    title: "Cryptosporidium detected in regional water supply",
    sectors: ["energy-utilities", "healthcare"],
    category: "Climate & Environment",
    background:
      "Routine sampling detects cryptosporidium in the water supply to ~120,000 households. UK Health Security Agency and DWI involved. Boil-water notice issued. Bottled-water distribution in progress. Customers (especially vulnerable ones, immunocompromised) need clear comms quickly. Source investigation ongoing — possibly catchment contamination, possibly treatment-works failure.",
    characteristics: [
      "Public-health-imperative event with strict statutory framework",
      "Mass-distribution logistics for bottled water",
      "Vulnerable-customer prioritisation",
    ],
    assumptions: [
      "Bottled-water capacity can scale rapidly via supplier-partners",
      "DWI / UKHSA / local authority coordination is formalised",
      "Press cycle is multi-day and intense",
    ],
    coversPeople: true,
    coversProperty: true,
    coversDataIntegrity: true,
    durationMin: 180,
    caseStudy: {
      title: "Devon cryptosporidium outbreak (May 2024)",
      causation: "Storage tank contamination",
      impactScale: "16,000 households boil-water notice for weeks",
    },
  },
  {
    slug: "electricity-distribution-storm-damage",
    title: "Storm damage takes 200,000 customers off supply",
    sectors: ["energy-utilities"],
    category: "Climate & Environment",
    background:
      "A major storm fells trees across overhead lines in the firm's distribution area. ~200,000 customers lose supply. Restoration estimate: 3-7 days for the worst-affected. Customer Guaranteed Standards of Performance payments will be substantial. Vulnerable-customer cohort (medical-equipment users) needs prioritised welfare visits. Ofgem and Energy UK are monitoring response.",
    characteristics: [
      "Multi-day weather-driven outage",
      "Field-crew capacity and mutual-aid coordination",
      "Vulnerable-customer welfare prioritisation",
    ],
    assumptions: [
      "Mutual-aid agreements with neighbouring DNOs are active",
      "Welfare-team door-knocks medical-customers within 24h",
      "Guaranteed Standards payments are statutory minimums",
    ],
    coversProperty: true,
    coversTechnology: true,
    coversPeople: true,
    durationMin: 150,
  },
  {
    slug: "smart-meter-data-breach",
    title: "Smart-meter consumption data leaked via partner-analytics breach",
    sectors: ["energy-utilities"],
    category: "Technology & Data (Cyber)",
    background:
      "An analytics partner used to model consumption profiles is breached. Granular 30-minute consumption data for 800,000 households is exposed — which can reveal household occupancy patterns. ICO 72-hour clock starts. Affected customers are concerned about burglary risk. Media interest is high given the privacy implications.",
    characteristics: [
      "Privacy-sensitive consumption-pattern data",
      "Real-world-safety dimension (burglary risk)",
      "Partner-driven incident with first-party customer relationship",
    ],
    assumptions: [
      "Partner accepts liability subject to contractual limits",
      "ICO interest is high; mandatory customer notification",
      "Customer-trust impact is broad and persistent",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "wholesale-trading-platform-outage",
    title: "Wholesale-trading platform outage during a peak-trading window",
    sectors: ["energy-utilities"],
    category: "Technology & Data (Cyber)",
    background:
      "Trayport / ICE platform outage during a volatile day-ahead market. The firm's traders can't access positions or hedge new exposure. Risk-limits may breach without active rebalancing. ETRM connectivity to the exchanges is degraded. Recovery point uncertain; traders consider voice-trading fallback (slow, error-prone, expensive).",
    characteristics: [
      "Concentrated vendor in commodity trading",
      "Market-volatility coincidence",
      "Voice-trading fallback at scale",
    ],
    assumptions: [
      "Voice-trading fallback covers 30% of normal flow",
      "Risk limits can be temporarily increased with C-suite sign-off",
      "Exchange-platform restoration ETA unclear",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "renewables-grid-stress-event",
    title: "Renewables forecast misses by 5GW during a peak-demand evening",
    sectors: ["energy-utilities"],
    category: "Climate & Environment",
    background:
      "An unexpected calm and overcast period reduces forecast wind+solar generation by ~5GW just as the evening peak builds. The ESO issues a Capacity Market Notice; balancing-mechanism prices spike. The firm holds a short imbalance position. Trading desks have to rebalance fast; gas-plant operators are paid to switch on.",
    characteristics: [
      "Forecast / weather model error with market exposure",
      "Balancing-mechanism cost spike",
      "Real-time decisioning under uncertainty",
    ],
    assumptions: [
      "Imbalance-price exposure is significant but manageable",
      "Backup-generation contracts can be invoked rapidly",
      "ESO comms cadence is via the IS / EMR system",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "ransomware-water-treatment",
    title: "Ransomware attack against water-treatment SCADA",
    sectors: ["energy-utilities"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_1",
    background:
      "Ransomware encrypts business-IT but propagates to the OT segment via an inadequately segmented engineer's laptop. Three water-treatment works have lost remote monitoring. On-site operators can run manually but visibility is degraded. UKHSA, DWI, NCSC and Defra all on the call. Decision on ransom payment (sanctions-checked) plus continued safe operation are the principal threads.",
    characteristics: [
      "IT/OT boundary breach with public-health implications",
      "Multi-agency coordination",
      "Manual-operation feasible but degraded",
    ],
    assumptions: [
      "Manual operation safe but high-cost for days, not weeks",
      "OFAC sanctions check delays any ransom decision",
      "Press will pick this up within 24 hours",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "supplier-collapse-energy",
    title: "Small energy-supplier collapses — SoLR appointment imminent",
    sectors: ["energy-utilities"],
    category: "Third Party",
    background:
      "A small competitor (~200,000 customers) collapses overnight. Ofgem indicates the firm will likely be appointed Supplier of Last Resort. The firm has 48 hours to scope the customer-migration operation: data ingestion, contact-strategy, hedging cost, balance-sheet impact. Customer-experience matters — these are scared customers.",
    characteristics: [
      "Regulator-driven inorganic customer acquisition",
      "Mass-data migration with quality unknowns",
      "Hedging and balance-sheet impact",
    ],
    assumptions: [
      "Customer-data quality variable",
      "Hedging cost is recoverable via mutualisation",
      "Customer experience during transfer is highly scrutinised",
    ],
    coversThirdParty: true,
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 150,
  },
  {
    slug: "balancing-mechanism-bug",
    title: "Algorithmic-bidding bug triggers £4M of balancing-mechanism loss",
    sectors: ["energy-utilities"],
    category: "Technology & Data (Cyber)",
    background:
      "A deployment to the algorithmic-bidding logic for the balancing mechanism introduces an error: the bid-price floor is mis-set. Over 4 hours, the firm submits bids well below cost. Trading desk realises mid-window. ESO can claw back some but not all. Estimated loss £4M. Internal audit and operational-risk reviews begin.",
    characteristics: [
      "Algo-trading deployment failure",
      "Live financial loss",
      "Control-narrative for FCA-style scrutiny (Ofgem-equivalent)",
    ],
    assumptions: [
      "Roll-back possible within minutes once root-caused",
      "ESO clawback partial and contested",
      "Audit Committee will demand explanation",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    durationMin: 90,
  },
];
