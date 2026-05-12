import type { ScenarioTemplate } from "../types";

export const tier2CardSchemeOutage: ScenarioTemplate = {
  slug: "tier2-card-scheme-sponsor-outage",
  title: "Card Scheme / Sponsor BIN Outage",
  category: "Third Party",
  tier: "TIER_2",
  firmProfile: "Digital Challenger Bank",
  background:
    "A digital challenger bank operates on a sponsor-BIN model with a third-party card scheme processor. A multi-hour outage at either the sponsor bank or the processor renders the firm's debit card unusable — affecting every customer purchase and cash withdrawal. Tests the challenger's resilience to single-vendor dependency.",
  agenda:
    "T+0 Outage onset (retail-peak hours)\nT+30m Customer impact peaks\nT+1h Vendor liaison + customer comms\nT+3h Restoration begins\nT+24h Reconciliation + customer redress",
  dDayDate: "2026-12-21T18:00:00Z",
  durationMin: 150,

  cause:
    "The bank's sole card-processor partner experiences a major service outage caused by a database failover that fails to converge cleanly. Authorisation requests time out at the card-scheme network level. The processor's mobile authentication service is also affected.",
  impactNarrative:
    "100% of debit-card transactions decline across the entire customer base — at peak retail trading time (e.g. holiday shopping period or pay-day evening). ATM withdrawals fail. Apple Pay / Google Pay declines. App-driven push notifications stop, removing the firm's main customer-comms channel. Social media erupts within minutes; #BankNameDown trends. Customers stranded at petrol stations and supermarkets. Vulnerable customers and those reliant on the bank as a sole account particularly impacted.",
  characteristics: [
    "Rapid onset.",
    "Complete service loss — no degraded modes available.",
    "Single-vendor dependency — no instant failover possible.",
    "Direct, visible customer impact.",
    "Social-media amplification within minutes.",
  ],
  assumptions: [
    "The bank has no second card processor wired up (typical for Tier 2).",
    "The sponsor bank/processor major-incident contact is slow to respond outside business hours.",
    "Outage occurs at retail-peak time (Friday evening, pre-Christmas).",
  ],
  compoundScenarioNotes:
    "Compounds with: media break that the bank is also having other issues; a coincident cyber-incident at the processor; a competitor having a different but similar problem (sector-wide news).",
  takeaways:
    "TSB Migration 2018: poorly executed migration caused 1.9M customers locked out for weeks. Highlighted the systemic risk of single-platform dependency and how digital-first banks have no offline fallback. Customer trust eroded rapidly via social media — recovery took years.",
  caseStudy: {
    title: "TSB IT Migration Failure (April 2018)",
    causation:
      "TSB migrated 5.4M customer accounts to a new core-banking platform built by Sabadell (its Spanish parent). The migration was poorly planned and tested; on go-live, customers were locked out and many saw incorrect balances or other customers' details.",
    impactScale:
      "1.9M customers affected; chronic issues for 3+ months. £330M direct cost. CEO resigned. FCA / PRA imposed £49M fine. Branch and call-centre overwhelmed for months.",
    duration:
      "Acute issues for weeks; full normalisation took 6+ months. Reputational impact and customer attrition lasted years.",
  },
  stressVariables: [
    { name: "Outage duration", options: ["1h", "2h", "4h", "8h", ">24h"] },
    { name: "Timing", options: ["Quiet day", "Pay-day", "Pre-Christmas", "Black Friday"] },
    { name: "Customer base impacted", options: ["All", "Premium only", "Specific BIN range"] },
    { name: "Sponsor failover available", options: ["Yes — fast", "Yes — slow", "No"] },
  ],
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: true,
    dataIntegrity: false,
    thirdParty: true,
  },

  ibsList: [
    { code: "IBS_01", name: "Card Authorisation", description: "Real-time approval of debit-card transactions.", impactToleranceMin: 15, criticality: "CRITICAL" },
    { code: "IBS_02", name: "ATM Withdrawal", description: "Customer cash access via partner ATM networks.", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Mobile Banking", description: "App-driven customer self-service and money movement.", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_04", name: "Customer Notifications", description: "Push, SMS, and in-app messaging — primary comms.", impactToleranceMin: 30, criticality: "HIGH" },
    { code: "IBS_05", name: "Faster Payments — Outbound", description: "Customer-initiated FPS payments to other banks.", impactToleranceMin: 30, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "18:00",
      title: "Card declines spike to 100%",
      description:
        "Real-time monitoring shows card-authorisation success rate dropping from 99.4% to 12% over 90 seconds. Within 5 minutes it is effectively 0%. The processor's status page initially reports 'investigating'. Customers begin tweeting within 3 minutes; the bank's social-media handle receives 200 mentions in the first 5 minutes. Push notifications are also down — the bank's primary customer-comms channel is broken in the exact moment it's needed most.",
      expectedActions: [
        "Activate Major Incident protocol",
        "Engage processor major-incident desk",
        "Issue status banner on web + open-banking-aggregator partners",
        "Brief CEO and CTO immediately",
      ],
      objectives: [
        "Test sub-5-minute incident detection and activation",
        "Validate out-of-band comms channels (web, partner APIs)",
        "Assess CEO/CTO escalation",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CEO", "Head of Operations", "Comms Lead"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 2,
      scheduledTime: "18:30",
      title: "Social-media virality and media pickup",
      description:
        "#[BankName]Down is trending on Twitter/X with 14,000+ posts. The Sun, Mirror and Mail Online all run live stories within 30 minutes. A high-profile fintech commentator posts a video. The Treasury Select Committee chair tweets asking 'when will this be fixed?'. Customer-facing teams are overwhelmed; the chat channel queue is 2,400 customers deep.",
      expectedActions: [
        "Issue first formal customer statement",
        "Brief national media",
        "Coordinate with sponsor bank / processor on joint messaging",
        "Surge customer-support capacity (partner overflow)",
      ],
      objectives: [
        "Test rapid public-statement capability",
        "Validate joint-vendor messaging coordination",
        "Assess customer-support surge",
      ],
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO", "CTO"],
      ccRoleTitles: ["CRO", "Head of Operations"],
    },
    {
      eventNo: 3,
      scheduledTime: "20:30",
      title: "Vendor confirms RCA — 4-hour estimated restoration",
      description:
        "The processor confirms the root cause (a database control-plane issue) and estimates a 4-hour restoration. Service will return in phases. The firm must decide whether to: keep customers in the dark beyond 'we're working on it', begin proactive customer reach-out (e.g. SMS via independent channel), or offer goodwill payments. Concurrent: regulator (FCA Consumer Duty) asks for an impact assessment.",
      expectedActions: [
        "Update customer messaging with realistic ETA",
        "Authorise goodwill-payment framework",
        "Send out-of-band SMS via backup channel",
        "Respond to FCA Consumer Duty inquiry",
      ],
      objectives: [
        "Test customer-redress decisioning",
        "Validate out-of-band SMS capability",
        "Assess Consumer Duty response",
      ],
      senderRoleTitle: "CEO",
      toRoleTitles: ["Comms Lead", "Head of Operations", "CRO"],
      ccRoleTitles: ["CTO"],
    },
    {
      eventNo: 4,
      scheduledTime: "23:30",
      title: "Restoration and reconciliation",
      description:
        "Authorisation rate climbs back to normal over 30 minutes. Several thousand customers report duplicate or stuck transactions during the outage; some customers were also wrongly declined the next morning. The team must reconcile the period and decide which transactions to bust, refund or compensate.",
      expectedActions: [
        "Process duplicate-transaction reconciliation",
        "Execute compensation framework",
        "Confirm 'all clear' customer messaging",
        "Capture lessons-learned",
      ],
      objectives: [
        "Test reconciliation process",
        "Validate compensation execution",
        "Assess customer-trust recovery messaging",
      ],
      senderRoleTitle: "Head of Operations",
      toRoleTitles: ["CTO", "CRO", "Customer Ops Lead"],
      ccRoleTitles: ["CEO", "Comms Lead"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "19:15",
      summary: "Competitor bank tweets that they're 'fully operational'",
      description:
        "A major competitor's official Twitter/X account tweets 'Just a reminder — we're fully operational.' The post goes viral. Customer-attrition risk surges; switching-service signups spike.",
      relation:
        "Compounds Event #2. Tests competitor-aware messaging and trust-defence.",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO"],
      ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 2,
      scheduledTime: "21:00",
      summary: "Vulnerable customer can't pay for emergency taxi",
      description:
        "Customer service receives a credible report from a customer who cannot pay for an emergency taxi to A&E. Local press picks up the story. Duty of care, Consumer Duty, and reputational dimensions converge.",
      relation:
        "Cuts across Event #3. Tests vulnerable-customer duty-of-care under outage.",
      senderRoleTitle: "Customer Ops Lead",
      toRoleTitles: ["CEO", "CRO"],
      ccRoleTitles: ["Comms Lead"],
    },
  ],

  facilitatorQuestions: [
    { category: "Vendor Dependency", text: "What is your true single-point-of-failure exposure on card processing? Do you have a credible failover?" },
    { category: "Detection", text: "How fast can you detect a 100% card decline event and activate major incident?" },
    { category: "Comms", text: "When your primary customer-comms channel (push) is down, what's the fallback? Tested?" },
    { category: "Consumer Duty", text: "Under Consumer Duty, what proactive steps must you take for vulnerable customers during a service-loss event?" },
    { category: "Redress", text: "What is your goodwill-payment framework? What's the per-customer cap?" },
    { category: "Sector", text: "Have you ever sat down with your competitor banks to coordinate joint messaging when a shared vendor fails?" },
  ],
  debriefQuestions: [
    { category: "Speed", text: "Did the firm act fast enough in the first 15 minutes?" },
    { category: "Comms", text: "Were customer communications consistent across all channels?" },
    { category: "Trust", text: "How long did the trust impact persist after restoration?" },
    { category: "Lessons", text: "What is the top investment to reduce single-vendor dependency?" },
  ],
};
