import type { LibraryScenario } from "./types";

/**
 * Telecoms scenarios — fixed-line, mobile, ISP, wholesale.
 * Calibrated to Ofcom General Conditions, NIS Regulations and the
 * Telecommunications (Security) Act 2021.
 */
export const TELECOMS_SCENARIOS: LibraryScenario[] = [
  {
    slug: "mobile-network-core-outage",
    title: "Mobile network core-signalling outage takes voice and 4G/5G down for 6 hours",
    sectors: ["telecoms"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_1",
    background:
      "At 06:50 the mobile-core HSS / UDM cluster fails after a vendor-software upgrade went wrong overnight. Voice, SMS and mobile data are degraded for ~12 million subscribers. 999 calls fail-over to the legacy interconnect but with audible voice-quality issues. Ofcom and the Cabinet Office have already called. The press has photographs of crowds at train stations who can't pay contactless.",
    characteristics: [
      "Critical national infrastructure failure",
      "999 / emergency-services impact under Ofcom General Conditions",
      "Multi-stakeholder pressure: government, regulator, MNO peers, customers",
    ],
    assumptions: [
      "Vendor patch ETA is uncertain (4-12 hours)",
      "Roll-back has its own ~90 minute restore window",
      "Cabinet Office expects briefings every 30 minutes",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    durationMin: 180,
    caseStudy: {
      title: "BT 999 outage (June 2023)",
      causation: "Mitel software upgrade fault",
      impactScale: "~14,000 999 calls failed, parliamentary scrutiny followed",
    },
  },
  {
    slug: "fibre-cable-cut",
    title: "Backhaul fibre cut by construction work degrades a region overnight",
    sectors: ["telecoms"],
    category: "Property",
    tier: "TIER_2",
    background:
      "A construction crew cuts a primary backhaul fibre bundle outside Manchester at 02:30. Diverse routing exists but the secondary path is at 70% utilisation and now saturates. 1.2M broadband customers see degraded speeds; 200+ business customers including a hospital trust have SLAs at risk. Repair team mobilises but estimates 8-14 hours splicing.",
    characteristics: [
      "Physical-infrastructure failure outside the firm's control",
      "Diversity-of-routing assumptions stress-tested",
      "Mixed customer-impact: consumer brand damage + B2B SLA breaches",
    ],
    assumptions: [
      "Field-engineering team can be on site within 2 hours",
      "Some traffic can be rebalanced through peer interconnects",
      "Hospital trust will demand priority and may escalate to NHSE",
    ],
    coversProperty: true,
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "ddos-isp-customer-access",
    title: "Volumetric DDoS against authoritative DNS knocks customers offline",
    sectors: ["telecoms", "technology-saas"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_2",
    background:
      "A 1.4 Tbps DDoS attack hits the ISP's authoritative DNS servers. Consumer customers can't resolve domain names; the user experience is 'internet is broken' even though packets flow fine. The scrubbing partner is engaged but the attack is rotating vectors faster than the rules. CISO must decide whether to absorb, blackhole the target IP or shift customers to a public resolver.",
    characteristics: [
      "Adaptive, multi-vector attack",
      "DNS-layer impact looks indistinguishable from total outage to the customer",
      "Mitigation-vendor performance under attack-scale stress",
    ],
    assumptions: [
      "Scrubbing partner has contractual SLA but can't promise recovery time",
      "Switching customers to a third-party resolver is a config change but visible",
      "Press and consumer forums know what 'DNS' is now",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "billing-system-corrupts-charges",
    title: "Billing system over-charges 800,000 customers on a single cycle",
    sectors: ["telecoms"],
    category: "Technology & Data (Cyber)",
    background:
      "A rating-engine deployment introduces an error: monthly out-of-bundle charges are calculated against pre-tax base, then VAT is applied a second time. 800,000 customers receive bills 20% inflated. Direct debits are due in 6 days. Refunds can't be auto-issued without a manual write-off. Ofcom rule on bill correctness applies and Citizens Advice routes complaints fast.",
    characteristics: [
      "Mass customer-financial-impact event with mandatory remediation",
      "Direct-debit clock running",
      "Ofcom General Conditions A2 compliance question",
    ],
    assumptions: [
      "Direct debits can be paused organisation-wide within 24 hours",
      "Mass refund / re-bill takes 2-3 working days",
      "Press cycle is 'phone giant fleeces customers'",
    ],
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 120,
  },
  {
    slug: "sim-swap-fraud-wave",
    title: "Coordinated SIM-swap fraud wave drains bank accounts",
    sectors: ["telecoms", "banking", "payments-fintech"],
    category: "Technology & Data (Cyber)",
    background:
      "Over 48 hours, ~2,400 customers report SIM-swap fraud — fraudulent porting of their numbers, followed by bank-account compromise via SMS OTP. The fraud team identifies inside knowledge: a contractor with retail-store-system access. Banks are escalating; some are threatening to block SMS-OTP from this MNO until controls are demonstrably tightened.",
    characteristics: [
      "Insider-collusion-driven fraud at scale",
      "Cross-industry coordination (telco + banks)",
      "Regulatory and contractual fallout",
    ],
    assumptions: [
      "Contractor identified; HR and police are engaged",
      "Bank SMS-OTP block would be commercially serious",
      "ICO interest depends on PII exposure scope",
    ],
    coversPeople: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "cni-supplier-compromise-telco",
    title: "Network-equipment vendor supply-chain compromise discovered",
    sectors: ["telecoms"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_1",
    background:
      "NCSC privately notifies the firm that a network-equipment vendor used in the access network has been compromised; firmware on ~14,000 deployed devices is suspect. Replacement programme will take months. In the meantime, NCSC and DSIT want assurance that nation-state surveillance risk is contained. Public disclosure is being coordinated cross-government.",
    characteristics: [
      "Telecommunications (Security) Act 2021 implications",
      "Government / NCSC / DSIT coordination",
      "Long-tail remediation programme",
    ],
    assumptions: [
      "Replacement budget unbudgeted, ~£40-80M scale",
      "Disclosure timing is dictated by HMG, not the firm",
      "Press will speculate even with no public disclosure",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "openreach-exchange-fire",
    title: "Openreach exchange fire wipes out a town's connectivity for days",
    sectors: ["telecoms"],
    category: "Property",
    background:
      "A fire at an Openreach exchange in a market town destroys the building. ~14,000 lines (residential and business) are out — fixed-line, broadband, ATM lines, hospital admin, alarm-monitoring. Repair / rebuild is 5-7 days minimum. Local MP is on the phone. The firm is the LLU operator with the largest base in that town.",
    characteristics: [
      "Physical-asset destruction with weeks-long remediation",
      "Vulnerable-customer impact (alarm-monitoring, telecare)",
      "Local political pressure",
    ],
    assumptions: [
      "Openreach handles the rebuild; the firm coordinates customer comms",
      "Mobile-rerouting feasible but not universal",
      "Some lines are critical-national-infrastructure (CNI)",
    ],
    coversProperty: true,
    coversTechnology: true,
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "mvno-wholesale-outage",
    title: "MVNO wholesale partner outage shuts down sub-brand customers",
    sectors: ["telecoms"],
    category: "Third Party",
    background:
      "The firm's MVNO sub-brand (~600,000 customers) sits on a wholesale agreement with another MNO. That MNO is having a core-network incident. Sub-brand customers are offline. The firm has no operational levers; it's reduced to a comms function. The press is asking whether sub-brands' customers know which MNO they're really on.",
    characteristics: [
      "Wholesale-dependency surfaced under stress",
      "No operational levers, only comms",
      "Brand vs. operator distinction blurred for the customer",
    ],
    assumptions: [
      "Wholesale partner provides updates but slowly",
      "SLA recovery is contractual but financially small",
      "Customer-comms tone matters more than technical detail",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "data-breach-customer-records-telco",
    title: "Customer-record breach: 11M records including PII and call metadata",
    sectors: ["telecoms"],
    category: "Technology & Data (Cyber)",
    background:
      "A misconfigured API at a partner CRM provider exposes 11M customer records including name, address, DOB, and partial call/SMS metadata. The breach surfaces via researcher email. ICO 72-hour clock is running. Affected-customer notification at scale will take days. Class-action firms are already retweeting.",
    characteristics: [
      "Third-party-channel breach with first-party liability",
      "Partial special-category data implicated (call metadata as PII)",
      "Mass-notification operation",
    ],
    assumptions: [
      "Partner accepts responsibility but contractually limited",
      "ICO will treat this as a Tier-1 incident",
      "Customer-acquisition and brand impact persist for quarters",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
    caseStudy: {
      title: "Optus customer-data breach (September 2022)",
      causation: "Unauthenticated API endpoint",
      impactScale: "10M+ records, government scrutiny, class actions",
    },
  },
  {
    slug: "999-call-routing-fail",
    title: "Emergency-call routing logic mis-classifies 999 traffic for 40 minutes",
    sectors: ["telecoms"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_1",
    background:
      "A scheduled config change in the call-routing platform introduces a bug: 999 calls from one regional pool route to a non-emergency queue. ~1,800 calls in 40 minutes are misclassified before detection. The Cabinet Office, Ofcom, BT (as the 999 platform operator) and the police force concerned are all calling at once.",
    characteristics: [
      "Direct safety-of-life impact",
      "Cabinet Office / Ofcom / police multi-stakeholder",
      "Internal change-control post-mortem inevitable",
    ],
    assumptions: [
      "Roll-back is fast (5-10 minutes) once root-caused",
      "Affected callers cannot be retroactively contacted by the firm",
      "Public inquiry is plausible",
    ],
    coversTechnology: true,
    coversPeople: true,
    durationMin: 180,
  },
  {
    slug: "5g-spectrum-regulatory-shock",
    title: "Regulator imposes emergency spectrum-restriction with 30-day notice",
    sectors: ["telecoms"],
    category: "Geopolitical & Macro",
    background:
      "Following a security review, Ofcom and DSIT issue an emergency restriction on operations in a specific 5G spectrum band — citing national-security concerns over a vendor's involvement. The firm has 30 days to reduce reliance on that band. Network capacity in affected regions will drop ~20%. CapEx replanning, customer impact and commercial-negotiation strands run in parallel.",
    characteristics: [
      "Regulator-imposed CNI policy change",
      "Multi-year programme telescoped into 30 days",
      "Coordination with HMG and vendor",
    ],
    assumptions: [
      "Alternative spectrum / refarming is technically feasible but slow",
      "Customer-experience degradation visible at peak hours",
      "Competitor MNOs face the same restriction; coordination useful but limited",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "geomagnetic-storm-comms-degradation",
    title: "Geomagnetic storm degrades satellite-backhaul on rural routes",
    sectors: ["telecoms"],
    category: "Climate & Environment",
    background:
      "A severe geomagnetic storm degrades satellite-backhaul links serving rural areas. ~80,000 customers lose connectivity for 36-72 hours. Some areas have terrestrial fallback at lower capacity, some have nothing. Customer-vulnerable cohort (telecare, alarm-monitoring) prioritised. Ofcom and DCMS engaged.",
    characteristics: [
      "Space-weather-driven CNI degradation",
      "Vulnerable-customer prioritisation",
      "Rural-versus-urban differential impact",
    ],
    assumptions: [
      "Recovery 36-72 hours based on storm-decay forecasts",
      "Telecare welfare visits coordinated with local authorities",
      "Press cycle is sympathetic but persistent",
    ],
    coversProperty: true,
    coversTechnology: true,
    coversPeople: true,
    durationMin: 150,
  },
  {
    slug: "submarine-cable-fault",
    title: "Multiple submarine-cable fault degrades international traffic",
    sectors: ["telecoms"],
    category: "Property",
    background:
      "Two trans-Atlantic submarine cables go down within 12 hours of each other — coincidence or coordinated sabotage is uncertain. Latency to North America increases sharply; voice and video conferencing degrades for business customers. Repair-ship schedule means resolution is 5-10 days. Geopolitical implications are escalating.",
    characteristics: [
      "Critical-infrastructure failure with security dimension",
      "Multi-day recovery with no rapid alternative",
      "Geopolitical / intelligence-community involvement",
    ],
    assumptions: [
      "Cable owner is consortium; comms cadence is via consortium",
      "Re-routing via Pacific and other paths costs latency",
      "NCSC and HMG are interested in cause-not-just-effect",
    ],
    coversProperty: true,
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 150,
  },
];
