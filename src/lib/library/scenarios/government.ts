import type { LibraryScenario } from "./types";

/**
 * Government & public-sector scenarios — central government departments,
 * local authorities, arm's-length bodies, public services (DWP, HMRC,
 * DVLA, Companies House, Land Registry, local councils).
 */
export const GOVERNMENT_SCENARIOS: LibraryScenario[] = [
  {
    slug: "central-gov-ransomware",
    title: "Ransomware against a central-government department's case-management estate",
    sectors: ["government"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_1",
    background:
      "Ransomware encrypts the principal case-management system of a high-volume central-government department. Citizens cannot progress applications. NCSC engaged. Cabinet Office COBR consultation pending. Ministerial brief required. The department's permanent secretary must balance recovery, public communication and Parliamentary accountability simultaneously.",
    characteristics: [
      "Cabinet-level political accountability",
      "Mass-citizen-service impact",
      "Multi-week recovery with daily ministerial scrutiny",
    ],
    assumptions: [
      "Backups are recoverable but require validation cycles",
      "Disclosure timing is coordinated with the Cabinet Office",
      "Press cycle is multi-week and severe",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "local-authority-cyber",
    title: "Local-authority cyber incident takes down services for 4 weeks",
    sectors: ["government"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_2",
    background:
      "A medium-sized local council is hit by ransomware. Council Tax billing, benefits payments, planning applications, social care case-management — all offline. Residents (especially vulnerable ones) cannot reach services. National Cyber Security Centre and MHCLG are involved. Members are publicly demanding answers. Recovery estimate 3-5 weeks.",
    characteristics: [
      "Mass-citizen-service disruption at council level",
      "Vulnerable-resident welfare front-and-centre",
      "Members and elected councillors politically exposed",
    ],
    assumptions: [
      "Cyber-insurance covers most of the recovery cost",
      "Some services have manual fallback; many do not",
      "MHCLG offers commissioner support if recovery falters",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 180,
    caseStudy: {
      title: "Hackney Council cyber attack (October 2020)",
      causation: "Pysa ransomware",
      impactScale: "Services degraded for over a year, £12M+ recovery",
    },
  },
  {
    slug: "data-breach-citizen-records-gov",
    title: "Mass-citizen-data breach via a misconfigured public dataset",
    sectors: ["government"],
    category: "Technology & Data (Cyber)",
    background:
      "A dataset published via the department's open-data programme is found to contain personal data on ~2.8M citizens that should have been anonymised. A researcher discovers it; it has been live for 4 months. ICO involvement is automatic. Affected citizens include vulnerable cohorts (asylum seekers, sanctioned individuals).",
    characteristics: [
      "Open-data-programme governance failure",
      "Special-category-data exposure",
      "Politically-sensitive citizen-cohorts",
    ],
    assumptions: [
      "Dataset can be withdrawn quickly",
      "Already-downloaded copies cannot be retrieved",
      "ICO will scrutinise the publication-approval process",
    ],
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 150,
  },
  {
    slug: "benefits-payment-failure",
    title: "Benefits-payment run fails — 1.4M payments delayed",
    sectors: ["government"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_1",
    background:
      "The weekly benefits-payment batch fails to complete. ~1.4M payments — Universal Credit, PIP, ESA — don't reach claimants on the expected date. Many recipients have nothing in their accounts for groceries or rent. Foodbanks are inundated. Press coverage is immediate and severe. Decision needed on emergency-payment route, public-comms tone, and root-cause investigation in parallel.",
    characteristics: [
      "Direct vulnerable-citizen financial harm",
      "Emergency-payment fallback operationally complex",
      "Political accountability at Secretary-of-State level",
    ],
    assumptions: [
      "Emergency-payment route exists but is slow and limited",
      "Re-run of the batch is feasible within 24 hours",
      "Parliamentary Urgent Question is likely",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 180,
  },
  {
    slug: "election-day-system-outage",
    title: "Voter-registration verification service fails during a general election",
    sectors: ["government"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_1",
    background:
      "On polling day, the voter-registration verification service (used by polling stations for queries) fails at 11:00. Polling clerks must rely on printed registers. Some voters are challenged and turned away pending verification. Cabinet Office and Electoral Commission engaged. Restoration ETA uncertain. The integrity of the election is becoming the news story.",
    characteristics: [
      "Democratic-integrity event with constitutional consequences",
      "Mass-voter impact at a once-every-5-years moment",
      "Parliamentary-and-press response on a knife edge",
    ],
    assumptions: [
      "Printed registers exist but are imperfect",
      "Affected voters can return later",
      "Electoral Commission has formal-recovery powers",
    ],
    coversTechnology: true,
    coversPeople: true,
    coversDataAvailability: true,
    durationMin: 180,
  },
  {
    slug: "border-control-systems-outage",
    title: "Border-control systems outage causes airport queues to spill into terminals",
    sectors: ["government", "aviation-transport"],
    category: "Technology & Data (Cyber)",
    background:
      "The Border Force e-passport / verification system fails at Heathrow, Gatwick and other UK airports. Manual processing slows queues to 4+ hours. Travellers are stranded in terminals. Airlines are diverting. Home Office, DfT, airport operators and airlines coordinate. The Home Secretary will brief Parliament. Restoration estimate 6-10 hours.",
    characteristics: [
      "Multi-agency CNI incident",
      "Mass-public visibility (queues, photos, video)",
      "International-press coverage",
    ],
    assumptions: [
      "Manual processing throughput is 1/8th of normal",
      "Surge-staffing helps but doesn't solve the queue",
      "Restoration timing depends on vendor and Home Office",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 150,
    caseStudy: {
      title: "UK e-gates outage (May 2024)",
      causation: "Border Force e-passport-gate failure",
      impactScale: "Mass queues at major UK airports for hours",
    },
  },
  {
    slug: "hmrc-tax-return-deadline-outage",
    title: "Tax-return online filing system fails on 31 January deadline",
    sectors: ["government"],
    category: "Technology & Data (Cyber)",
    background:
      "HMRC's online self-assessment filing system slows to a crawl on the evening of 31 January. Approximately 2.4M filers leave it to the last day. Penalties for late filing are £100 minimum. Decisions on penalty-waiver, deadline-extension, technical-recovery and public-comms run in parallel. The Chancellor's office is calling.",
    characteristics: [
      "Foreseeable peak under-provisioned",
      "Mass-citizen-financial impact (penalties)",
      "Treasury / HMRC political accountability",
    ],
    assumptions: [
      "Capacity bump within 90 minutes feasible but visible",
      "Deadline extension requires ministerial sign-off",
      "Penalty-waiver is operationally complex post-hoc",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    durationMin: 120,
  },
  {
    slug: "land-registry-fraud-pattern",
    title: "Land-registry property-fraud pattern detected at scale",
    sectors: ["government"],
    category: "People",
    background:
      "Internal analytics detects ~140 suspicious property-transfer applications over 6 weeks — a likely organised fraud-ring exploiting weak identity-checks on the digital service. Some transfers have completed; victims' property has been mortgaged. Compensation scheme will be triggered. Investigation, victim-comms, control-tightening and SFO-engagement all run in parallel.",
    characteristics: [
      "Organised-fraud against citizens via state-provided service",
      "State liability and compensation",
      "Multi-agency criminal-investigation overlay",
    ],
    assumptions: [
      "Compensation scheme funded but bureaucratic",
      "SFO / police engagement is multi-month",
      "Control-tightening risks slowing legitimate transactions",
    ],
    coversPeople: true,
    coversDataIntegrity: true,
    durationMin: 150,
  },
  {
    slug: "dvla-driving-licence-database-outage",
    title: "DVLA database outage stops new driving-licence issuance",
    sectors: ["government"],
    category: "Technology & Data (Cyber)",
    background:
      "A storage-array failure at DVLA Swansea takes the driving-licence database offline for 14 hours. New licence applications, renewals and HGV/PSV checks all stop. Hauliers cannot dispatch drivers needing licence checks. Driver Theory Test centres pause. Recovery estimated 14-24 hours. Multi-stakeholder pressure builds.",
    characteristics: [
      "Critical-infrastructure outage with logistics-sector spillover",
      "Foreseeable-but-rare hardware failure",
      "Press and trade-press coverage",
    ],
    assumptions: [
      "Storage failover exists but is slow",
      "Manual licence-status verification is limited",
      "DfT engaged for hauliers' representations",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    durationMin: 120,
  },
  {
    slug: "passport-office-backlog",
    title: "Passport-Office backlog reaches crisis levels in summer-holiday season",
    sectors: ["government"],
    category: "People",
    background:
      "Post-pandemic demand surge plus a strike-action sequence leaves the Passport Office with a 14-week backlog at peak summer-holiday demand. Citizens cancelling holidays; MPs flooded with constituent casework; press coverage daily. Decisions on emergency-processing prioritisation, surge-staffing and refund-of-fees mechanism all in play.",
    characteristics: [
      "Workforce-and-process compound stress",
      "Mass-customer-financial impact (cancelled holidays)",
      "Political-constituency dimension",
    ],
    assumptions: [
      "Surge-staffing requires cross-departmental loans",
      "Emergency processing prioritisation is gameable",
      "Refund-of-fees mechanism requires Treasury sign-off",
    ],
    coversPeople: true,
    coversTechnology: true,
    durationMin: 150,
  },
  {
    slug: "nca-disclosure-leak",
    title: "Sensitive law-enforcement disclosure leak from internal-share misconfiguration",
    sectors: ["government"],
    category: "Technology & Data (Cyber)",
    background:
      "An internal SharePoint site containing pre-disclosure law-enforcement intelligence is found to have been accessible to non-cleared staff for 6 weeks. Some content relates to live operations and witness identities. Operational fallout includes possible witness-protection escalation and prosecution-disclosure issues. National-Security & internal-security pathways activate.",
    characteristics: [
      "Operational-security incident with safety-of-life implications",
      "Live-operation impact, not just data privacy",
      "Multi-investigatory pathway activation",
    ],
    assumptions: [
      "Affected witnesses require immediate review",
      "Disclosure to ICO is necessary but timing controlled",
      "Press cycle is high-risk; injunctions possible",
    ],
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 180,
  },
  {
    slug: "council-tax-billing-error",
    title: "Council-tax billing error mis-bills 240,000 households",
    sectors: ["government"],
    category: "Technology & Data (Cyber)",
    background:
      "A pricing-band update is misapplied; ~240,000 council-tax bills go out with wrong bands. Some bills are too high, some too low. Direct-debit cycles are 7 days away. Members are receiving constituent complaints. The CFO has to balance financial-impact, customer-fairness and technical-remediation.",
    characteristics: [
      "Mass-customer-financial impact via state-bill",
      "Member / councillor political exposure",
      "Direct-debit cycle clock running",
    ],
    assumptions: [
      "Re-billing technically feasible within 5 working days",
      "Direct debits can be paused with Council approval",
      "Press cycle is local and persistent",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 120,
  },
];
