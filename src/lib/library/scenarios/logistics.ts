import type { LibraryScenario } from "./types";

/**
 * Logistics & shipping scenarios — couriers, freight forwarders,
 * 3PL warehouses, last-mile, port operators.
 */
export const LOGISTICS_SCENARIOS: LibraryScenario[] = [
  {
    slug: "wms-outage-peak",
    title: "Warehouse-management system outage during a peak fulfilment day",
    sectors: ["logistics", "retail-ecommerce"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_2",
    background:
      "The WMS at the firm's principal fulfilment centre fails at 10:00 on a peak shipping day. ~40,000 orders queue. Conveyor automation halts; staff revert to paper-and-radio picking at 1/4 of normal throughput. Client retailers' SLAs are breaching by the hour. The vendor's support team is on the bridge but ETA is unclear.",
    characteristics: [
      "Throughput-collapse during a peak day",
      "Multi-customer SLA exposure",
      "Manual fallback feasible but slow",
    ],
    assumptions: [
      "Vendor recovery is 4-8 hours",
      "Manual operation cannot scale to peak demand",
      "Client retailers will recharge SLA breaches",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 120,
  },
  {
    slug: "port-cyber-attack",
    title: "Cyber attack against the firm's port terminal management system",
    sectors: ["logistics"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_2",
    background:
      "Ransomware encrypts the terminal-operating system at the firm's container port. Container moves halt. Ships at anchor cannot discharge; outbound trucks queue on access roads. Maritime and Coastguard Agency, DfT and NCSC engaged. Recovery is 5-10 days. Cargo backlog will take weeks to clear.",
    characteristics: [
      "CNI cyber attack with international supply-chain impact",
      "Multi-week backlog recovery",
      "Multi-agency response",
    ],
    assumptions: [
      "Manual TOS feasible at 10% capacity",
      "Adjacent ports can absorb 30% of diverted traffic",
      "Cyber insurance covers most of the recovery",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
    caseStudy: {
      title: "Maersk NotPetya impact (June 2017)",
      causation: "Wiper-malware via Ukrainian tax software",
      impactScale: "$300M+ damages, 10-day shipping disruption",
    },
  },
  {
    slug: "courier-network-strike",
    title: "Wildcat courier-driver strike disrupts last-mile delivery for a week",
    sectors: ["logistics"],
    category: "People",
    background:
      "Self-employed delivery drivers stage a wildcat strike over pay-and-conditions. ~5,000 drivers affected; ~14M parcels are queued nationwide. Customers and retailers complain. Press cycle is unforgiving (gig-economy framing). Operations need to balance backfill cost, employee-rights legal advice and customer-comms.",
    characteristics: [
      "Industrial-action without notice",
      "Gig-economy reputational angle",
      "Multi-day backlog recovery",
    ],
    assumptions: [
      "Strike length 5-7 days based on similar precedents",
      "Backfill via competing couriers at 2-3x cost",
      "Settlement negotiation complicated by self-employed status",
    ],
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "warehouse-fire-3pl",
    title: "Warehouse fire destroys 30% of client inventory",
    sectors: ["logistics"],
    category: "Property",
    background:
      "A fire in a 3PL warehouse destroys ~30% of client inventory. Multiple retail clients affected. Fire-safety investigation will close the building for 4-8 weeks. Insurance, client-claims, alternative-warehouse-onboarding all in parallel. Some clients have JIT-only inventory; their consumer-facing impact will be acute.",
    characteristics: [
      "Mass-inventory destruction",
      "Multi-client recovery sequencing",
      "Multi-week site closure",
    ],
    assumptions: [
      "Insurance covers inventory replacement-cost basis",
      "Alternative warehouses can be onboarded in 10-14 days",
      "Larger clients will negotiate priority",
    ],
    coversProperty: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "customs-declaration-system-outage",
    title: "Customs declaration system outage blocks freight at borders",
    sectors: ["logistics", "government"],
    category: "Third Party",
    background:
      "HMRC's CDS (Customs Declaration Service) suffers an outage. Inbound and outbound freight at ports cannot lodge declarations. Customers queue. Perishables risk spoiling. The firm has limited operational levers — HMRC controls recovery. DfT, Cabinet Office and Treasury are coordinating. Industry-wide.",
    characteristics: [
      "Government-platform-dependent operation",
      "Time-sensitive cargo (perishables)",
      "Industry-wide event — coordination opportunity",
    ],
    assumptions: [
      "Manual workaround exists but throughput is low",
      "HMRC restoration ETA uncertain",
      "Perishable cargo can be prioritised by exception",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "fuel-shortage-haulier",
    title: "Diesel shortage during a refinery disruption",
    sectors: ["logistics"],
    category: "Climate & Environment",
    background:
      "A refinery disruption tightens diesel supply across the UK. Wholesale prices spike; fuel-stations ration; queues form. The firm's HGV fleet faces 30% reduced operating window. Customer-deliveries reprioritised; some routes suspended. Press attention is intense.",
    characteristics: [
      "Fuel-supply shock as logistics-input cost",
      "Operational-prioritisation under capacity constraint",
      "Public-comms in a charged-news cycle",
    ],
    assumptions: [
      "Refinery restoration 5-10 days",
      "Bulk-fuel contracts insulate the firm partly",
      "Customer-promise downgrade is necessary",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "courier-data-breach-tracking",
    title: "Tracking-service breach exposes 12M parcel-tracking records",
    sectors: ["logistics"],
    category: "Technology & Data (Cyber)",
    background:
      "A misconfigured API exposes 12M tracking-records including sender, recipient, address, parcel-description and signature image. ICO 72-hour clock starts. Affected recipients receive immediate-fraud risk targeting. Customer-comms at scale required. Class-action interest.",
    characteristics: [
      "Mass-PII breach with personal-safety implications",
      "Multi-channel customer-notification",
      "ICO and class-action exposure",
    ],
    assumptions: [
      "API can be patched within hours",
      "Already-downloaded data cannot be recovered",
      "Notification process can be parallelised",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "supply-chain-suez-blockage",
    title: "Major shipping route closure disrupts inbound containers for weeks",
    sectors: ["logistics", "manufacturing", "retail-ecommerce"],
    category: "Geopolitical & Macro",
    background:
      "A Suez-Canal-class blockage closes a major shipping route. Container reroutes via Cape of Good Hope add 14 days transit. Inventory shortages for Christmas-peak. Client retailers and manufacturers face availability gaps. Maritime-insurance market reprices. Logistics-and-operations replanning weeks long.",
    characteristics: [
      "Geopolitical-event with weeks-long impact",
      "Inventory and pricing strategy",
      "Multi-client coordination",
    ],
    assumptions: [
      "Route closure is 1-3 weeks",
      "Reroute adds 30-50% to transit time",
      "Pricing-and-allocation conversations with clients are tense",
    ],
    coversProperty: true,
    coversThirdParty: true,
    durationMin: 120,
    caseStudy: {
      title: "Ever Given Suez blockage (March 2021)",
      causation: "Grounded container ship",
      impactScale: "6-day blockage, $54B daily trade impact",
    },
  },
  {
    slug: "tms-routing-error",
    title: "Transport-management system mis-routes 6,000 shipments overnight",
    sectors: ["logistics"],
    category: "Technology & Data (Cyber)",
    background:
      "A configuration error in the TMS overnight routes ~6,000 shipments to wrong distribution centres. Discovery happens at 06:30 as drivers begin loading. Mass-rerouting is feasible but adds 4-8 hours per shipment. Customer-promise breaches across multiple client retailers. SLA-credit exposure significant.",
    characteristics: [
      "Internal-system configuration error",
      "Multi-client SLA impact",
      "Time-critical recovery window",
    ],
    assumptions: [
      "Re-routing logic can be applied centrally within 2 hours",
      "Some shipments will miss promised delivery window regardless",
      "SLA credits across all affected clients = mid-six-figures",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "ev-fleet-battery-fire",
    title: "EV-fleet battery fire grounds the entire fleet for safety inspection",
    sectors: ["logistics"],
    category: "Property",
    background:
      "A delivery van's battery catches fire at a depot overnight. Fleet-wide safety inspection imposed by the manufacturer; ~400 EV vans grounded for 5-10 days. Operations fall back on hire / contractor capacity. Press coverage of EV-safety concerns amplifies.",
    characteristics: [
      "Manufacturer-driven safety grounding",
      "Multi-week operational impact",
      "EV-safety press narrative",
    ],
    assumptions: [
      "Hire capacity covers 60% of fleet at premium",
      "Manufacturer inspection 5-10 days",
      "Insurance covers some of the cost",
    ],
    coversProperty: true,
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "container-mass-theft",
    title: "Organised container theft from a UK distribution hub",
    sectors: ["logistics"],
    category: "People",
    background:
      "An organised gang penetrates the perimeter of a major UK distribution hub overnight and removes 14 containers including high-value electronics shipments. Insurance, police, security-review and client-comms all in parallel. Trade-press picks up the story; client confidence damaged.",
    characteristics: [
      "Physical-security event with criminal-investigation overlay",
      "Insurance and police coordination",
      "Trade-press reputational impact",
    ],
    assumptions: [
      "Police investigation is multi-month",
      "Insurance covers most of the loss subject to security-control review",
      "Client-facing security audit will be requested",
    ],
    coversPeople: true,
    coversProperty: true,
    coversThirdParty: true,
    durationMin: 120,
  },
];
