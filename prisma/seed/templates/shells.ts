// CMORG DSL scenarios authored as "shells": full briefing-grade metadata
// from the source PDF, with a minimal MSEL seed for admins to expand.

import type { ScenarioTemplate } from "../types";

export const supplyChainAttack: ScenarioTemplate = {
  slug: "cyber-supply-chain",
  title: "Cyber Attack — Supply-Chain Compromise",
  category: "Technology & Data (Cyber)",
  background:
    "A sophisticated supply-chain attack at a software provider results in compromised software being delivered to customers (including Financial Services firms), enabling compromise of customer systems. Impacts IBS across multiple firms simultaneously.",
  dDayDate: "2026-09-15T08:00:00Z",
  cause:
    "The threat actor infiltrates a software provider and deploys malicious code into a software product commonly used by core IT systems. The compromised software is delivered through the trusted vendor update channel.",
  impactNarrative:
    "Multiple firms identify unusual traffic in core IT systems following a recent update of a commonly used software product. Some firms take potentially compromised systems offline for investigation, resulting in multi-IBS disruption. Services remain unavailable at end-of-day; software fix not available until Day 2.",
  characteristics: [
    "Rapid onset.",
    "Low predictability / highly changeable.",
    "High persistence.",
    "Uncertain duration.",
    "Information asymmetry.",
    "Disrupted communication.",
    "Higher scrutiny.",
  ],
  assumptions: [
    "Incident on a peak/significant trading day.",
    "Compromised software is widely deployed across firms.",
    "Highly capable threat actor; recovery requires rebuild + reconciliation.",
  ],
  takeaways:
    "SolarWinds Orion (Dec 2020): supply-chain attack hit 18,000 customers via an automated-update mechanism. Demonstrated that nth-party security materially affects firm resilience.",
  caseStudy: {
    title: "SolarWinds Orion (December 2020)",
    causation:
      "Threat actor compromised the build pipeline of SolarWinds Orion IT management software, embedding a backdoor distributed via the automated update channel.",
    impactScale:
      "18,000 SolarWinds customers received the compromised update, including Fortune 500 firms and multiple US government agencies. The Orion product is used by 33,000 organisations worldwide.",
    duration:
      "Backdoor active for months before public disclosure. Initial vulnerability updates released 14–15 December 2020; remediation continued for many months.",
  },
  stressVariables: [
    { name: "Servers impacted", options: ["60%", "70%", "80%", "90%", "100%"] },
    { name: "Platforms", options: ["Windows", "Linux", "Midrange", "Mainframe"] },
  ],
  riskCoverage: { people: true, property: false, technology: true, dataAvailability: true, dataIntegrity: true, thirdParty: true },
  events: [
    { eventNo: 1, scheduledTime: "08:00", title: "Vendor advisory issued", description: "Software provider publishes a security advisory: a recent update contains malicious code; investigation underway.", expectedActions: ["Activate Cyber IRT", "Inventory affected systems", "Engage vendor"], objectives: ["Test vendor-advisory response"], senderRoleTitle: "ISM", toRoleTitles: ["CTO", "Sn.TPM"], ccRoleTitles: ["CRO"] },
  ],
};

export const poorlyExecutedChange: ScenarioTemplate = {
  slug: "poorly-executed-change",
  title: "Poorly Executed Change",
  category: "Technology & Data (Non-Cyber)",
  srrRef: "9.1",
  background:
    "Significant data-corruption event following a poorly executed (routine or emergency) change that impacts critical storage infrastructure supporting multiple IBS. Roll-back fails; recovery via tape backup with reconciliation required.",
  dDayDate: "2026-04-22T06:00:00Z",
  cause:
    "Following an overnight emergency change, post-change technical check-out detects abnormalities. Decision is made to roll back to the original version, but a mistake in the roll-back process results in significant data corruption.",
  impactNarrative:
    "High volume of users report abnormal and inconsistent data, including customer-account and transaction data, across internal and customer-facing applications. Customer enquiries overwhelm channels. With little confidence in data integrity, only remaining option is to shut down impacted systems for full recovery from tape backups, with technical and business reconciliation required.",
  characteristics: [
    "Rapid onset.",
    "Uncertain duration of investigation, containment and recovery.",
    "Higher scrutiny.",
    "Infrastructure failures manifest in previously unknown ways; concurrent IT issues may be conflated.",
  ],
  assumptions: [
    "Incident ahead of a peak trading day.",
    "Technology change controls have failed.",
    "No cyber activity associated.",
  ],
  takeaways:
    "CrowdStrike (19 Jul 2024) showed how a poorly-tested third-party change can impact ~8.5 million systems across multiple sectors. Robustness of own controls to manage third-party software updates is key.",
  caseStudy: {
    title: "CrowdStrike Falcon Sensor (19 July 2024)",
    causation:
      "CrowdStrike distributed a faulty update to its Falcon Sensor security software, resulting in widespread unavailability of MS Windows systems.",
    impactScale:
      "~8.5 million systems impacted across financial services, transport, healthcare and public-sector organisations worldwide.",
    duration:
      "Fix released within hours; manual remediation extended outage for many systems over several days.",
  },
  stressVariables: [
    { name: "Duration of outage", options: ["3 days", "4 days", "1 week", "2 weeks", ">2 weeks"] },
    { name: "Type of data impacted", options: ["Personal", "Financial", "Sensitive"] },
  ],
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: true, dataIntegrity: true, thirdParty: false },
  events: [
    { eventNo: 1, scheduledTime: "06:00", title: "Post-change failure detected", description: "Routine post-change validation flags abnormalities in core storage. Decision: roll back to the previous version.", expectedActions: ["Halt user traffic", "Initiate roll-back", "Notify CRO"], objectives: ["Test change-failure protocol"], senderRoleTitle: "CTO", toRoleTitles: ["Sn.TPM", "TPM"], ccRoleTitles: ["CRO"] },
  ],
};

export const maraudingArmedIntruders: ScenarioTemplate = {
  slug: "marauding-armed-intruders",
  title: "Terrorism — Marauding Armed Intruders",
  category: "Physical Security",
  background:
    "Single/multiple armed intruders launch an attack in a densely populated area within close proximity to financial-services buildings. Tests duty-of-care, building lockdown, comms during a fast-moving physical-safety incident.",
  dDayDate: "2026-10-08T11:00:00Z",
  cause:
    "Armed intruders exploit element of surprise to move freely around an area near financial-services buildings before emergency services neutralise the threat.",
  impactNarrative:
    "Despite lockdown protocols, intruders may enter buildings causing property damage and risk to life. Firms struggle to establish situational awareness and account for staff, hampered by public-comms channels taken offline for emergency-responder bandwidth. Cordons remain post-incident for up to 14 days. Transport networks disrupted. 20% of staff (incl. critical IBS personnel) unable to return to work due to direct/indirect impact.",
  characteristics: [
    "Rapid onset.",
    "Low predictability / threat actor adapts.",
    "Information asymmetry.",
    "Disrupted communication.",
    "Elevated staff anxiety — actual or perceived threat to safety.",
    "High persistence — secondary attacks possible.",
  ],
  assumptions: [
    "Incident ahead of a peak trading day.",
    "Event has profound impact on workforce mental health.",
  ],
  takeaways:
    "Mumbai 2008: 175 killed across 3 days of coordinated attacks. Highlighted soft-target vulnerability, information overload during crises, and need for improved intelligence-sharing and rapid-response training.",
  caseStudy: {
    title: "Mumbai Attacks (26–29 November 2008)",
    causation:
      "Coordinated series of 12 attacks across Mumbai by 10 members of Lashkar-e-Taiba, targeting hotels, transport links and a hospital.",
    impactScale:
      "175 deaths (incl. 9 attackers), >300 injured. Hotels, transport links, hospital (Cama) targeted.",
    duration:
      "3 days of active attacks; impacts persisted beyond due to fear of secondary attacks.",
  },
  stressVariables: [
    { name: "Secondary attacks", options: ["Yes", "No"] },
    { name: "Impacted sites", options: ["Single", "Multiple", "Campus", "Country-wide"] },
    { name: "Building unavailability", options: ["1-2 days", "3-5 days", "5-14 days", "14-30 days", "30 days+"] },
    { name: "Staff absence", options: ["20%", "30%", "40%", "50%", "50%+"] },
  ],
  riskCoverage: { people: true, property: true, technology: false, dataAvailability: false, dataIntegrity: false, thirdParty: true },
  events: [
    { eventNo: 1, scheduledTime: "11:00", title: "Building lockdown declared", description: "Reports of armed individuals in the vicinity. Emergency services advise immediate lockdown of all sites in the area.", expectedActions: ["Activate lockdown", "Account for all staff", "Restrict comms"], objectives: ["Test lockdown protocol"], senderRoleTitle: "COO", toRoleTitles: ["CEO", "CRO"], ccRoleTitles: ["Comms Lead"] },
  ],
};

export const massDestruction: ScenarioTemplate = {
  slug: "mass-destruction",
  title: "Terrorism — Mass Destruction",
  category: "Physical Security",
  background:
    "Terrorism mass-destruction attack directed at Financial Services, resulting in total loss of the impacted building(s) and unavailability of core teams supporting IBS.",
  dDayDate: "2026-10-08T11:00:00Z",
  cause:
    "Terrorists detonate large improvised explosive device(s) directly outside or in close proximity to a firm location, resulting in building damage and risk to life.",
  impactNarrative:
    "Extensive damage to buildings in the immediate vicinity of the blast and surrounding buildings within ~500m radius. Emergency cordons raised; routes closed for evacuations. Critical staff supporting IBS unaccounted for; direct casualties expected. Long-term workspace loss requiring full alternate-site invocation.",
  characteristics: [
    "Rapid onset.",
    "Information asymmetry.",
    "Disrupted communication.",
    "Elevated staff anxiety.",
    "Other — total property loss requires alternate-site invocation.",
  ],
  assumptions: [
    "Profound impact on workforce mental health.",
    "Workspace lost for extended period.",
  ],
  riskCoverage: { people: true, property: true, technology: true, dataAvailability: false, dataIntegrity: false, thirdParty: true },
  events: [
    { eventNo: 1, scheduledTime: "11:00", title: "Explosion — building total loss", description: "Reports of a large explosion at or near the primary headquarters building. Emergency services responding.", expectedActions: ["Activate alternate-site recovery", "Account for staff", "Engage with emergency services"], objectives: ["Test alternate-site invocation"], senderRoleTitle: "CEO", toRoleTitles: ["COO", "CTO", "CRO"], ccRoleTitles: ["Comms Lead"] },
  ],
};

export const civilUnrest: ScenarioTemplate = {
  slug: "civil-unrest",
  title: "Civil Unrest",
  category: "Physical Security",
  background:
    "Widespread civil unrest in major UK cities impacts staff access to offices, branch operations, and customer safety. Tests building security, branch closures, and continuity under elevated physical risk.",
  dDayDate: "2026-08-03T13:00:00Z",
  cause:
    "Sustained civil unrest following a triggering social/political event, with protest and riot activity in central locations of major UK cities.",
  impactNarrative:
    "Branch closures in affected city centres. Staff unable or unwilling to travel to office locations. Cash logistics disrupted. Some social-media-driven escalation impacts customer safety. Heightened security posture at key sites.",
  characteristics: [
    "Slower onset with potential for rapid escalation.",
    "Information asymmetry — fragmented social-media-driven information.",
    "Elevated staff anxiety.",
    "Conflicting priorities.",
  ],
  assumptions: [
    "Unrest concentrated in specific city centres.",
    "Affected period 3–14 days.",
  ],
  riskCoverage: { people: true, property: true, technology: false, dataAvailability: false, dataIntegrity: false, thirdParty: true },
  events: [
    { eventNo: 1, scheduledTime: "13:00", title: "City-centre branches close early", description: "Following advice from local police, all city-centre branches close at 13:00 today.", expectedActions: ["Issue customer comms", "Stand down city-centre staff", "Adjust cash logistics"], objectives: ["Test rapid branch-closure decisioning"], senderRoleTitle: "COO", toRoleTitles: ["Customer Ops Lead", "Comms Lead"], ccRoleTitles: ["CEO", "CRO"] },
  ],
};

export const undersaCables: ScenarioTemplate = {
  slug: "undersea-cables",
  title: "Disruption to Undersea Cables",
  category: "Geopolitical",
  srrRef: "13.1",
  background:
    "Damage to multiple undersea internet/telecoms cables results in widespread connectivity disruption between regions, impacting international payments, cross-border trading and intra-firm site connectivity.",
  dDayDate: "2026-05-19T07:00:00Z",
  cause:
    "Suspicious marine activity damages multiple undersea cables in a region. Repair timelines for undersea cables can extend to weeks. Connectivity is partially maintained via alternative routings at degraded capacity.",
  impactNarrative:
    "Cross-border internet/telecoms capacity reduced significantly. International payment systems degraded. Inter-DC connectivity for firms operating across multiple geographies reduced. Trading desks experience increased latency. Settlement systems may fall back to alternative routing with reduced throughput.",
  characteristics: [
    "Slower onset — disruption builds as backup capacity is consumed.",
    "Uncertain duration — repair timelines can extend weeks.",
    "Geopolitical context — potential state-actor involvement.",
  ],
  assumptions: [
    "Alternative routing exists but at degraded throughput.",
    "Repair vessels take days to arrive on station.",
  ],
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: true, dataIntegrity: false, thirdParty: true },
  events: [
    { eventNo: 1, scheduledTime: "07:00", title: "Cable damage reported", description: "Major cable operator reports loss of capacity on multiple submarine cable segments. Connectivity degraded for cross-border services.", expectedActions: ["Invoke alternative routing", "Brief trading desk on latency impact", "Engage telecoms providers on priority"], objectives: ["Test cross-border resilience"], senderRoleTitle: "CTO", toRoleTitles: ["Sn.TPM"], ccRoleTitles: ["CEO", "CRO"] },
  ],
};

export const spaceWeather: ScenarioTemplate = {
  slug: "space-weather",
  title: "Space Weather (Severe Solar Storm)",
  category: "Natural Hazards & Public Health",
  background:
    "1-in-100+ year severe space-weather event (Carrington-class) impacts global communications, navigation, energy and transportation systems. Tests the firm's preparedness for compound infrastructure loss with very-low-frequency, very-high-impact characteristics.",
  dDayDate: "2026-07-21T14:00:00Z",
  cause:
    "Solar-maximum coronal mass ejection (CME) impacts earth's atmosphere with unprecedented intensity due to pervasive technology dependency on space-based systems.",
  impactNarrative:
    "Widespread damage to global satellite systems; regional power outages from grid damage; significant disruption to GNSS-dependent transport and timing systems. MiFID II clock-synchronisation requirements at risk. Trading may be suspended in some markets. Recovery measured in days (satellite) to weeks (power).",
  characteristics: [
    "Slower onset (15–24 hours' warning from space-weather agencies).",
    "Wide-area impact — affects all resource types simultaneously.",
    "Information asymmetry — extent of ground-based damage unclear.",
  ],
  assumptions: [
    "Built-in mitigations are partially effective; some satellites and power infrastructure damaged anyway.",
    "Repairs to power infrastructure can take weeks.",
  ],
  caseStudy: {
    title: "Quebec / Toronto Geomagnetic Storms (March, August, October 1989)",
    causation:
      "Series of geomagnetic storms (CMEs) impacted earth in 1989, causing power loss, technology unavailability and financial-market disruption.",
    impactScale:
      "March 1989: blackout across Quebec, 9 million people without power, hydroelectric system offline. August 1989: Toronto stock market halted trading after microchip damage.",
    duration:
      "Quebec: 9 hours of power loss. Toronto exchange: hours.",
  },
  riskCoverage: { people: true, property: false, technology: true, dataAvailability: true, dataIntegrity: false, thirdParty: true },
  events: [
    { eventNo: 1, scheduledTime: "14:00", title: "Space-weather alert — CME inbound", description: "Space-weather monitoring agencies issue an alert for a strong CME expected to impact earth within 15–24 hours.", expectedActions: ["Notify exec sponsor", "Brief technology teams on potential satellite/GNSS impact", "Review MiFID II timing-resilience plan"], objectives: ["Test space-weather alert response"], senderRoleTitle: "CTO", toRoleTitles: ["Sn.TPM", "CRO"], ccRoleTitles: ["CEO"] },
  ],
};

export const lossOfFmi: ScenarioTemplate = {
  slug: "loss-of-fmi",
  title: "Loss of a Financial Market Infrastructure (FMI)",
  category: "Third Party",
  srrRef: "6.1, 6.2",
  background:
    "Loss of a critical Financial Market Infrastructure (FMI) such as a clearing house, central securities depository, or payments scheme. Tests the firm's ability to operate without a critical, often single-point-of-failure, market utility.",
  dDayDate: "2026-06-30T09:00:00Z",
  cause:
    "Technical or operational failure at a critical FMI causes core service outage. Could be triggered by a software defect, cyber attack, or operational error at the FMI itself.",
  impactNarrative:
    "Inability to settle securities/payments while the FMI is down. Build-up of unsettled transactions. Liquidity strain if the FMI provides credit/netting. Customer-facing services that depend on settled transactions (e.g. real-time payments) degraded or unavailable.",
  characteristics: [
    "Rapid onset.",
    "Low predictability.",
    "Uncertain duration.",
    "Higher scrutiny — sector-wide impact draws regulator and media attention immediately.",
  ],
  assumptions: [
    "Incident on a peak settlement/trading day.",
    "FMI fall-back arrangements may be insufficient for full volume.",
  ],
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: true, dataIntegrity: false, thirdParty: true },
  events: [
    { eventNo: 1, scheduledTime: "09:00", title: "FMI declares major incident", description: "Critical FMI announces a service outage of indeterminate duration. Settlement halted for affected products.", expectedActions: ["Activate FMI-loss playbook", "Coordinate with sector via CMORG", "Brief Treasury on liquidity impact"], objectives: ["Test FMI-loss playbook"], senderRoleTitle: "CTO", toRoleTitles: ["Treasury Lead", "Sn.TPM"], ccRoleTitles: ["CEO", "CRO"] },
  ],
};

export const allShells: ScenarioTemplate[] = [
  supplyChainAttack,
  poorlyExecutedChange,
  maraudingArmedIntruders,
  massDestruction,
  civilUnrest,
  undersaCables,
  spaceWeather,
  lossOfFmi,
];
