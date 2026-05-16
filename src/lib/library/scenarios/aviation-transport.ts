import type { LibraryScenario } from "./types";

/**
 * Aviation & transport scenarios — airlines, airports, rail operators,
 * urban transit, ATC providers. Calibrated to CAA / NATS / ORR / DfT
 * regulatory frameworks.
 */
export const AVIATION_TRANSPORT_SCENARIOS: LibraryScenario[] = [
  {
    slug: "atc-systems-failure",
    title: "ATC flight-plan processing system failure halts UK airspace",
    sectors: ["aviation-transport"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_1",
    background:
      "NATS's flight-plan processing system fails at 08:30. UK airspace defaults to a tactical-only mode; arrivals and departures throttled to safe-manual rates. Knock-on cancellations cascade across airlines. Heathrow, Gatwick, Manchester, Edinburgh all impacted. Passengers stranded; aircraft and crews mis-positioned for days. CAA, DfT and PM's office engaged.",
    characteristics: [
      "National-airspace level disruption",
      "Multi-airline / multi-airport cascade",
      "Multi-day passenger and crew recovery",
    ],
    assumptions: [
      "Restoration within 4-8 hours feasible",
      "Cascade effects last 48-72 hours",
      "CAA expects detailed RCA within 30 days",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 180,
    caseStudy: {
      title: "NATS flight-planning failure (August 2023)",
      causation: "Flight-plan data caused processing failure",
      impactScale: "2,000+ flights cancelled, 700,000+ passengers affected",
    },
  },
  {
    slug: "airline-system-outage-bank-holiday",
    title: "Airline reservation system outage on a bank-holiday weekend",
    sectors: ["aviation-transport"],
    category: "Technology & Data (Cyber)",
    background:
      "The airline's PSS / reservation system fails on a bank-holiday Friday. Check-in stalls; boarding queues build; flights delay and then cancel. The airline's published EU261 / UK261 obligations kick in for delays past 3 hours. Customer-comms channels are overwhelmed. Crew schedules disintegrate; recovery will take 5+ days.",
    characteristics: [
      "Peak-day passenger-stranding event",
      "EU261 / UK261 financial-liability exposure",
      "Multi-day crew / aircraft repositioning",
    ],
    assumptions: [
      "Restoration in 6-12 hours",
      "Customer compensation runs into eight figures",
      "Press coverage is sustained and severe",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversPeople: true,
    durationMin: 180,
  },
  {
    slug: "airline-cyber-attack-passenger-data",
    title: "Airline cyber attack exposes 5M passenger records",
    sectors: ["aviation-transport"],
    category: "Technology & Data (Cyber)",
    background:
      "A web-skimming attack on the airline's booking flow has been exfiltrating passenger data (name, passport, payment-card, travel-route) for 3 weeks before detection. 5M records affected. ICO 72-hour clock starts. Class-action firms engaged. Customer-confidence and immediate-fraud risk both real.",
    characteristics: [
      "Long-dwell-time skimming attack",
      "Special-category data (passport) plus payment cards",
      "Class-action and regulatory exposure",
    ],
    assumptions: [
      "Attack vector clearly identified post-discovery",
      "Customer notification at scale takes 3-5 days",
      "Brand trust impact persists for quarters",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
    caseStudy: {
      title: "British Airways data breach (2018)",
      causation: "Magecart-style script injection",
      impactScale: "380,000 transactions, £20M ICO fine",
    },
  },
  {
    slug: "fuel-supply-disruption-airport",
    title: "Airport jet-fuel supply disruption grounds outbound flights",
    sectors: ["aviation-transport"],
    category: "Property",
    background:
      "A burst pipeline at a major UK airport disrupts jet-fuel supply. Onsite reserves are 24-36 hours. Refuelling restrictions imposed; long-haul flights cancelled first to conserve fuel. Repair will take 5-7 days. Airlines reroute via other UK airports; rail and coach demand spikes. DfT and CAA coordinate.",
    characteristics: [
      "Physical-infrastructure failure with logistics-cascade",
      "Multi-day disruption with rolling impact",
      "Multi-airport reallocation",
    ],
    assumptions: [
      "Pipeline repair is 5-7 days",
      "Truck-delivered fuel can backfill at premium",
      "DfT will not declare a national-emergency",
    ],
    coversProperty: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 120,
  },
  {
    slug: "rail-signalling-failure",
    title: "Rail signalling system failure halts a region for the morning peak",
    sectors: ["aviation-transport"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_2",
    background:
      "A signalling failure at a major junction halts trains across the South-East commuter network during the morning peak. ~80,000 passengers stuck. ORR (Office of Rail and Road) on notice. TOCs and Network Rail coordinate the response. Recovery and crew-resumption will take 6-10 hours. Passenger-compensation under Delay Repay is triggered.",
    characteristics: [
      "Cross-operator infrastructure failure",
      "Mass-commuter impact during peak",
      "ORR scrutiny and Delay Repay liability",
    ],
    assumptions: [
      "Rail-replacement bus service is slow to mobilise",
      "Crew-positions disrupted, knock-on for afternoon peak",
      "Press coverage is local-and-national",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 150,
  },
  {
    slug: "drone-incursion-airport",
    title: "Drone incursion forces airport closure during peak operations",
    sectors: ["aviation-transport"],
    category: "People",
    background:
      "Multiple drone sightings near runways force the airport into closed-airspace mode. Inbound flights divert; outbound flights hold. CAA, police, counter-drone teams engaged. The drone operator is not yet identified; closure could be 6 hours or 30 hours depending on whether the operator is found. Passengers, airlines and ground-handling all affected.",
    characteristics: [
      "Security event with uncertain duration",
      "Multi-agency law-enforcement response",
      "Cascading airline / passenger disruption",
    ],
    assumptions: [
      "Counter-drone equipment is on site but coverage is partial",
      "Police investigation is the long pole",
      "Passenger-comms cadence is hourly",
    ],
    coversProperty: true,
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 120,
    caseStudy: {
      title: "Gatwick drone closure (December 2018)",
      causation: "Persistent drone sightings, perpetrator never identified",
      impactScale: "140,000 passengers affected over 36 hours",
    },
  },
  {
    slug: "iata-bsp-platform-outage",
    title: "IATA BSP platform outage stops airline-ticket settlement",
    sectors: ["aviation-transport"],
    category: "Third Party",
    background:
      "The IATA Billing & Settlement Plan platform suffers an outage. Travel-agency ticketing for the next settlement period cannot be reconciled. Cash-flow for the airline shifts. Multiple airlines affected globally; coordinated escalation underway. Treasury teams scramble to model the impact.",
    characteristics: [
      "Concentrated third-party with industry-wide impact",
      "Treasury / cash-flow management",
      "Cross-carrier coordination",
    ],
    assumptions: [
      "IATA technical recovery is hours not days",
      "Cash-flow buffer absorbs 2-3 days of delay",
      "Customer-impact is invisible but back-office is intense",
    ],
    coversThirdParty: true,
    coversDataIntegrity: true,
    durationMin: 90,
  },
  {
    slug: "airline-strike-ground-staff",
    title: "Ground-handler strike disrupts hub operations for 3 days",
    sectors: ["aviation-transport"],
    category: "People",
    background:
      "A ground-handler at a hub airport calls a wildcat strike for 3 days. Baggage, fuelling, push-back, de-icing all degraded. Flights delay; some cancel. Airlines respond differently — some take legal action against the union, others negotiate. Passengers stranded; press cycle is severe.",
    characteristics: [
      "Industrial-action disruption with no easy fix",
      "Multi-airline competitive-asymmetry",
      "Mass-passenger impact",
    ],
    assumptions: [
      "Strike length is 3 days (notified)",
      "Alternative handlers can absorb 30% at premium cost",
      "Passenger-rights under EU261/UK261 apply",
    ],
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "ev-charging-network-outage",
    title: "EV charging-network outage strands drivers on a holiday weekend",
    sectors: ["aviation-transport", "energy-utilities"],
    category: "Technology & Data (Cyber)",
    background:
      "A bank-holiday Friday: the firm's EV charging-network back-end fails. ~6,000 chargers nationally are unable to authenticate users or process payment. Drivers strand without alternatives nearby. Press is immediate. Ofgem and DfT are watching. Resolution may take hours; in the meantime, free-vending workarounds are proposed.",
    characteristics: [
      "EV-infrastructure-dependency exposed",
      "Strand-event with safety implications",
      "Rapid public-comms required",
    ],
    assumptions: [
      "Free-vending workaround technically feasible",
      "Driver-comms via app / SMS available",
      "Recovery within 6-12 hours",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 120,
  },
  {
    slug: "channel-tunnel-incident",
    title: "Channel Tunnel incident closes Eurotunnel and Eurostar for 24 hours",
    sectors: ["aviation-transport"],
    category: "Property",
    background:
      "A vehicle fire or technical incident inside the Channel Tunnel closes services for ~24 hours. Eurotunnel shuttle and Eurostar both halted. Passengers and freight diverted via ferries (slow, weather-dependent) or DFDS short-sea. Multi-government engagement, multi-operator coordination.",
    characteristics: [
      "Critical fixed-link disruption",
      "Multi-country, multi-operator response",
      "Freight + passenger impact",
    ],
    assumptions: [
      "Closure window 12-36 hours",
      "Ferry capacity can absorb 60% of diverted traffic",
      "Compensation regimes vary by operator",
    ],
    coversProperty: true,
    coversTechnology: true,
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "transit-cyber-extortion",
    title: "Cyber-extortion against a transit operator's revenue-collection",
    sectors: ["aviation-transport"],
    category: "Technology & Data (Cyber)",
    background:
      "A ransomware actor encrypts the transit operator's revenue-collection back-end. Travel cards / contactless payment continue working at gates (failsafe-open mode), but the operator can't bill for travel. Daily revenue exposure ~£8M. NCSC and TfL-class authorities engaged. Decision on ransom-payment and recovery posture.",
    characteristics: [
      "Revenue-impact-only cyber incident",
      "Failsafe-open keeps the service running but loses money",
      "Recovery vs. ransom trade-off",
    ],
    assumptions: [
      "Failsafe-open mode safe to maintain for days",
      "Backups recoverable in 5-7 days",
      "Sanctions check on ransom-wallet is multi-day",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "weather-disruption-rail",
    title: "Severe-weather rail disruption: heat / flood / leaves-on-line",
    sectors: ["aviation-transport"],
    category: "Climate & Environment",
    background:
      "A heatwave (or flooding, or autumn-leaves) imposes speed-restrictions and line-closures across a network operator's region. Multi-day disruption. Commuter and freight impact. Network Rail and TOCs coordinate. Climate-resilience investment under public discussion.",
    characteristics: [
      "Foreseeable climate event with structural exposure",
      "Multi-day, multi-modal disruption",
      "Long-term investment / political dimension",
    ],
    assumptions: [
      "Speed restrictions cut throughput 30-50%",
      "Alternative-modes are inadequate at scale",
      "Climate-adaptation programme is multi-year",
    ],
    coversProperty: true,
    coversTechnology: true,
    coversPeople: true,
    durationMin: 90,
  },
];
