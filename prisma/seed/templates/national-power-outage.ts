import type { ScenarioTemplate } from "../types";

export const nationalPowerOutage: ScenarioTemplate = {
  slug: "national-power-outage",
  title: "National Power Outage",
  category: "Critical National Infrastructure",
  srrRef: "2.1",
  background:
    "This scenario explores a national power outage for a prolonged period, resulting in a complete failure of both power and telecoms across the country, leading to a cascading failure of water, sewerage and transport services. Most modern WFH/hybrid contingencies become unavailable.",
  agenda:
    "T+0:00 Outage onset & emergency protocols\nT+0:30 Building evacuations / safe shutdown\nT+2:00 Establish manual contact with key personnel\nT+6:00 BBC Emergency Broadcast monitoring & decisioning\nT+24:00 Partial restoration & re-entry planning",
  dDayDate: "2026-11-12T10:00:00Z",
  durationMin: 240,

  cause:
    "Physical or network-infrastructure damage triggers a national-level outage of the electricity grid. No advance notice; restoration expected up to 7 days with intermittent power for several days after.",
  impactNarrative:
    "Power loss is complete and country-wide. The only available communication channel is BBC Emergency Service one-way broadcast. UPS/generators allow safe shutdown only; data centres cannot be reached. Internet, mobile networks and most fixed-line services degrade rapidly. Health-and-safety issues exist whether staff are kept on-site or attempt to travel home. Staff anxiety is elevated due to societal impact and uncertainty over family welfare. The financial sector is effectively offline.",
  characteristics: [
    "Rapid onset — no-notice; little time to put additional mitigations in place.",
    "Disrupted communication — internal and external channels are impaired by the nature of the incident.",
    "Elevated staff anxiety — actual or perceived threat to safety of staff and family members.",
    "Conflicting priorities — caring responsibilities limit staff ability to support the firm's response.",
  ],
  assumptions: [
    "Incident happens during the working day.",
    "UPS/generators work as expected for safe shutdown and evacuation only — not sustained operations.",
    "Restoration is non-linear; intermittent power for several days post-restoration.",
  ],
  compoundScenarioNotes:
    "Compounds with civil unrest (NPO + 5–95% sickness post-restoration), severe weather (storm-induced grid loss), or cyber attack on the grid operator. Most contingencies that assume WFH or alternative-site working break.",
  takeaways:
    "Superstorm Sandy highlighted that power resilience built into individual buildings does not address staff transport, public-transport disruption, or supply-chain failure. Pure WFH contingencies fail when home internet/power is also down. Manual, paper-based fallbacks for the very-highest-priority activities should be designed and drilled.",
  stressVariables: [
    { name: "Outage duration", options: ["2 days", "3 days", "4 days", "7 days", "10 days"] },
    { name: "Civil unrest", options: ["5%", "15%", "25%", "75%", "Complete societal breakdown"] },
    { name: "Sickness after restoration", options: ["5%", "15%", "25%", "75%", "95%"] },
  ],
  caseStudy: {
    title: "Superstorm Sandy (29 October 2012)",
    causation:
      "Hurricane-force winds and storm surge struck New Jersey and New York City, damaging power infrastructure and underground vaults across a wide region.",
    impactScale:
      "Damaged 165 electric substations, several large power plants, 7,000 transformers and 15,000 electrical poles. >8 million people in 21 states without power. NYSE and NASDAQ closed for 2 days. Several firms lost data centres entirely.",
    duration:
      "Markets reopened after 2 days; power restoration ranged from days to weeks across the affected states. Some firms experienced ongoing operational disruption for months.",
  },
  riskCoverage: {
    people: true,
    property: true,
    technology: true,
    dataAvailability: true,
    dataIntegrity: false,
    thirdParty: true,
  },

  ibsList: [
    { code: "IBS_01", name: "Branch Banking — Cash Withdrawal", description: "Customer in-branch cash withdrawal. Cash demand spikes during outages.", impactToleranceMin: 120, criticality: "CRITICAL" },
    { code: "IBS_02", name: "ATM Network", description: "Standalone ATMs and partner-network ATMs.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Card Payments", description: "Acceptance of card transactions at merchant terminals.", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_04", name: "Contact Centre", description: "Inbound customer telephony and case management.", impactToleranceMin: 240, criticality: "HIGH" },
    { code: "IBS_05", name: "Critical Treasury & Settlement", description: "End-of-day settlement, regulatory reporting.", impactToleranceMin: 480, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "10:00",
      title: "National grid loss declared",
      description:
        "The National Grid Operator declares a country-wide loss of supply. UPS protection kicks in at all primary sites. BBC issues an emergency-service announcement asking the public not to travel unless critical. Initial estimates from the grid operator suggest restoration within 24–72 hours but with intermittent supply during that period. Mobile network providers report congestion and cell-site battery exhaustion within 4–8 hours.",
      expectedActions: [
        "Activate national-incident response protocol",
        "Move to BBC-broadcast-monitoring posture",
        "Initiate safe-shutdown of non-critical systems",
        "Account for all staff via warden network",
      ],
      objectives: [
        "Validate national-incident activation",
        "Test alternate-comms posture",
        "Assess warden/people-safety processes",
      ],
      senderRoleTitle: "CEO",
      toRoleTitles: ["CTO", "CRO", "COO"],
      ccRoleTitles: ["Comms Lead", "Customer Ops Lead"],
    },
    {
      eventNo: 2,
      scheduledTime: "11:30",
      title: "Branches and contact centres going dark",
      description:
        "All retail branches are dropping off the network as their telecoms-provider backhaul fails. The main contact centre runs on UPS for another 90 minutes before sites must close. Customers attempting to use card payments are being declined as merchant terminals lose connectivity. ATM network availability has dropped to 22% nationally.",
      expectedActions: [
        "Decide whether to close all branches",
        "Issue safe-shutdown order for contact centres",
        "Brief Treasury on payment-scheme exception process",
        "Coordinate cross-firm sector messaging via available radio/satphone",
      ],
      objectives: [
        "Test physical-site safe-shutdown",
        "Validate cash logistics during outage",
        "Assess sector-wide coordination without internet",
      ],
      senderRoleTitle: "COO",
      toRoleTitles: ["CEO", "CTO", "Customer Ops Lead"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 3,
      scheduledTime: "16:00",
      isScheduled: false,
      title: "Day 1 close-out — what is recoverable?",
      description:
        "End-of-day approaches with most systems unreachable. The firm has missed CHAPS and Bacs cut-offs. Treasury must produce a manual close-of-business position based on intraday data captured before the outage. Senior managers must decide whether to invoke the firm's Business Recovery Plan in full, including alternate-site activation for D+1.",
      expectedActions: [
        "Produce manual close-of-business position",
        "Invoke Business Recovery Plan",
        "Identify the minimum critical workforce for D+1",
        "File regulatory non-compliance notification",
      ],
      objectives: [
        "Test manual-fallback processes",
        "Validate D+1 surge plan",
        "Assess regulatory-disclosure pathway",
      ],
      senderRoleTitle: "CRO",
      toRoleTitles: ["CEO", "CTO", "COO"],
      ccRoleTitles: ["Comms Lead"],
    },
    {
      eventNo: 4,
      scheduledTime: "08:00",
      isScheduled: false,
      title: "D+1 — partial restoration with intermittent supply",
      description:
        "Power has been partially restored in major cities, but supply is unstable with rolling cuts of 20–40 minutes per hour expected. The firm's primary data centre is back online but its secondary is still down. Many staff cannot travel to office locations due to ongoing transport disruption. The contact centre comes back up with skeleton staffing.",
      expectedActions: [
        "Decide order of IBS restoration",
        "Surge available staff to highest-priority IBS",
        "Issue first major customer communication",
        "Begin two-week recovery and reconciliation programme",
      ],
      objectives: [
        "Test prioritised IBS-restoration playbook",
        "Validate workforce-surge plan",
        "Assess customer-communications cadence",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Sn.TPM", "TPM", "Customer Ops Lead"],
      ccRoleTitles: ["CRO", "CEO"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "12:30",
      summary: "Mobile network congestion: emergency calls only",
      description:
        "Mobile operators announce emergency-call-only status across the affected regions to preserve battery and capacity. Internal staff distribution lists (SMS-based) and conference-bridge dial-ins are inoperable. Only satphone, two-way radio, and physical runners between sites are available.",
      relation:
        "Cuts across Event #2. Tests the firm's truly-out-of-band comms (satphones, runners).",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO", "CTO", "COO"],
      ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 2,
      scheduledTime: "14:30",
      summary: "Cash demand spike — branch queues",
      description:
        "BBC broadcast confirms widespread card-payment failure. Members of the public are queueing outside major retail branches demanding cash. Some branches still have UPS power and physical safes accessible but no IT systems. Staff are concerned about queue management, safety, and the bank's standard limits on no-IT teller transactions.",
      relation:
        "Compounds Event #2. Tests retail-branch contingency without core banking.",
      senderRoleTitle: "Customer Ops Lead",
      toRoleTitles: ["COO", "CRO"],
      ccRoleTitles: ["CEO"],
    },
  ],

  facilitatorQuestions: [
    { category: "Physical Safety", text: "What is your warden-network activation, and how do you account for all staff under no-power, no-telecoms conditions?" },
    { category: "Workforce Continuity", text: "Who is on your emergency-essential-workforce list, and how do you reach them?" },
    { category: "Communications", text: "What out-of-band comms (satphone, radio, in-person) do you genuinely exercise?" },
    { category: "Customer Impact", text: "How do you communicate with customers when all digital channels and most call-centre infrastructure are unavailable?" },
    { category: "Regulatory", text: "Walk through your sector-wide and regulator notifications under conditions where email is unavailable." },
    { category: "Workforce Continuity", text: "What proportion of staff would actually be physically available if a national outage extended to 7 days?" },
  ],
  debriefQuestions: [
    { category: "General", text: "Did the scenario test your true national-event preparedness, or did the exercise reveal hidden dependencies?" },
    { category: "Communications", text: "Which out-of-band comms options worked? Which failed?" },
    { category: "Workforce", text: "Could you have run for 72 hours without rest cycles for key people? What is the plan?" },
    { category: "Lessons Learned", text: "What is the single highest-priority investment in your operational-resilience programme as a result of this exercise?" },
  ],
};
