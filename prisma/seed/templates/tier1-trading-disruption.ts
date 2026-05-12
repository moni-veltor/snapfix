import type { ScenarioTemplate } from "../types";

export const tier1TradingDisruption: ScenarioTemplate = {
  slug: "tier1-multi-region-trading-disruption",
  title: "Multi-Region Trading Disruption",
  category: "Technology & Data (Non-Cyber)",
  tier: "TIER_1",
  firmProfile: "Global Universal Bank",
  background:
    "This scenario explores a major disruption to a Tier 1 firm's global market-making platforms, affecting FX, equities and fixed-income trading desks across London, New York and Hong Kong simultaneously. Tests the firm's ability to maintain orderly markets, manage client positions, and coordinate across regions and regulators during a multi-jurisdictional incident.",
  agenda:
    "T+0 LON open disruption\nT+1h NY pre-market triage\nT+4h Asia close + LON close decisions\nT+6h Regulator engagement (BoE / FCA / SEC / SFC)\nT+24h Recovery and client reconciliation",
  dDayDate: "2026-10-19T07:00:00Z",
  durationMin: 240,

  cause:
    "A latent defect in the firm's globally-deployed pricing and order-routing platform — exposed by a high-volatility event in Asia overnight — produces erroneous quotes and stuck order states. The platform's failover is degraded because the same defect affects both primary and secondary regions.",
  impactNarrative:
    "Market-making desks across FX, equities, and fixed income produce off-market quotes for the first 20 minutes of LON open. Algorithmic clients see stuck order states and inconsistent fill confirmations. Client portal and electronic-execution channels degrade. Volume on regulated venues triggers market-conduct surveillance alerts. Three sell-side clients raise concerns over duplicate fills; two corporate-treasury clients escalate to senior management. Regulators in multiple jurisdictions request immediate impact statements.",
  characteristics: [
    "Rapid onset triggered by Asia-overnight volatility.",
    "Multi-region — primary and secondary regions both affected.",
    "Regulatory complexity — at least 4 simultaneously interested regulators.",
    "Market-conduct dimension — potential manipulation flags from erroneous quotes.",
    "Client-impact: institutional, corporate and retail wealth all simultaneously affected.",
  ],
  assumptions: [
    "Incident overlaps with a major economic-data release (US NFP or BoE rate decision).",
    "Failover to secondary region is partial; not a clean cutover.",
    "Cross-border data-sharing constraints add friction to multi-regulator engagement.",
  ],
  compoundScenarioNotes:
    "Compounds catastrophically with a cyber attack (would the firm be blamed?), an FMI outage (CHAPS/CHIPS unable to settle the day), or a major counterparty default coinciding with the platform issue.",
  takeaways:
    "Knight Capital (2012): 45 minutes of erroneous automated trading caused $440M loss, $7B in unintended positions, and effectively ended the firm. Highlights the speed at which algorithmic-trading failures can be terminal, and the importance of pre-defined kill switches.",
  caseStudy: {
    title: "Knight Capital (1 August 2012)",
    causation:
      "Deployment of new SMARS routing software left an obsolete 'Power Peg' module active on one of eight servers. When the NYSE opened, that server began executing millions of erroneous orders before the firm could intervene.",
    impactScale:
      "$440M trading loss, 4M+ erroneous trades, $7B unintended positions. The firm was effectively insolvent within hours; sold to Getco within months.",
    duration:
      "Active disruption: ~45 minutes. Total firm impact: company-ending.",
  },
  stressVariables: [
    { name: "Affected products", options: ["FX only", "Equities only", "Fixed Income only", "All asset classes"] },
    { name: "Regions affected", options: ["LON only", "LON + NY", "LON + NY + HKG", "All regions"] },
    { name: "Erroneous orders before halt", options: ["10s", "100s", "1,000s", "10,000s+"] },
    { name: "Concurrent market event", options: ["Quiet day", "Data release", "Major volatility", "Crisis"] },
  ],
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: true,
    dataIntegrity: true,
    thirdParty: true,
  },

  ibsList: [
    { code: "IBS_01", name: "Electronic Execution — Institutional", description: "Direct-market-access and algorithmic order routing for institutional clients.", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Market-Making — FX", description: "Streaming FX prices and execution to multi-dealer venues and direct clients.", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Market-Making — Equities", description: "Continuous quotes on regulated equity venues including LSE, NYSE.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_04", name: "Client Portal — Wealth & Corporate Treasury", description: "Web/app channels for wealth-management and corporate-treasury clients.", impactToleranceMin: 120, criticality: "HIGH" },
    { code: "IBS_05", name: "Trade Confirmations & Settlement Instructions", description: "Outbound confirmations and downstream settlement messaging.", impactToleranceMin: 240, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "07:05",
      title: "LON open — erroneous quote spike detected",
      description:
        "Within 5 minutes of London open, internal market-surveillance alerts fire on the FX desk: a major pair has streamed quotes 50bps off the indicative mid for over 30 seconds. The equities desk reports similar behaviour on FTSE 100 names. The platform's pre-trade controls did not stop the quotes. Several algorithmic clients have already executed against off-market prices.",
      expectedActions: [
        "Activate trading-floor major-incident protocol",
        "Halt affected market-making algorithms",
        "Notify exchanges of incident in progress",
        "Begin assessment of affected orders and fills",
      ],
      objectives: [
        "Validate market-surveillance detection speed",
        "Test trading-halt decisioning",
        "Assess venue-notification timeliness",
      ],
      senderRoleTitle: "Head of Markets",
      toRoleTitles: ["CTO", "Sn.TPM", "Head of Risk"],
      ccRoleTitles: ["CEO", "Head of Compliance"],
    },
    {
      eventNo: 2,
      scheduledTime: "07:45",
      title: "Failover to secondary region — partial recovery only",
      description:
        "The team initiates failover of the market-making platform to the secondary region (Amsterdam). The cutover completes but the secondary region exhibits the same erroneous-quote behaviour for a subset of products. Investigation suggests a shared library or pricing-source dependency. Decision required: continue degraded, halt market-making entirely, or attempt rollback to an earlier release.",
      expectedActions: [
        "Halt market-making entirely for affected products",
        "Engage core platform vendor on RCA",
        "Begin client-affected-trade analysis",
        "Brief Compliance on regulatory notification timing",
      ],
      objectives: [
        "Test failover-strategy decisioning under partial information",
        "Validate vendor-engagement playbook",
        "Assess client-impact analysis capacity",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Head of Markets", "Sn.TPM"],
      ccRoleTitles: ["Head of Risk", "Head of Compliance"],
    },
    {
      eventNo: 3,
      scheduledTime: "09:30",
      title: "Major institutional client escalation",
      description:
        "Three sell-side clients raise emergency escalation with their relationship managers. One claims $12M of inadvertent loss due to off-market fills. Another threatens regulatory complaint. A corporate-treasury client cannot reconcile their FX hedging programme. The Markets MD must decide how to handle commercial discussions while the technical recovery is incomplete.",
      expectedActions: [
        "Stand up client-affected-trade desk",
        "Make initial good-faith offer to bust off-market trades",
        "Coordinate consistent client messaging across regions",
        "Capture all client commitments for legal review",
      ],
      objectives: [
        "Test trade-bust decisioning at speed",
        "Validate consistent client messaging",
        "Assess legal-and-compliance involvement",
      ],
      senderRoleTitle: "Head of Markets",
      toRoleTitles: ["CEO", "Head of Risk", "Head of Compliance"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 4,
      scheduledTime: "12:00",
      title: "NY pre-market — multi-regulator engagement",
      description:
        "BoE Markets Desk has formally requested a written incident impact assessment by close of business. The FCA has separately asked for a market-conduct briefing. With NY pre-market in two hours, the firm must decide whether to open markets in NY today. The SEC will be online within an hour. Coordinated disclosure across regulators is required to avoid contradiction.",
      expectedActions: [
        "Submit BoE Markets Desk impact statement",
        "Hold consolidated regulator call (BoE, FCA, SEC, SFC)",
        "Decide on NY open posture",
        "Confirm market disclosure language",
      ],
      objectives: [
        "Test multi-regulator engagement",
        "Validate cross-region decision-making",
        "Assess market-disclosure consistency",
      ],
      senderRoleTitle: "Head of Compliance",
      toRoleTitles: ["CEO", "Head of Markets", "CRO"],
      ccRoleTitles: ["CTO"],
    },
    {
      eventNo: 5,
      scheduledTime: "16:30",
      title: "LON close — confirmations and reconciliation",
      description:
        "The platform is partially restored on a patched build with monitoring increased. LON close approaches. Settlement-instruction messages are queued for the day's executed trades but include the affected period — the team must decide which trades to confirm, which to amend or bust, and which to escalate to Risk. SETTLE T+1 deadlines for CREST/EUREX/JASDEC settle the question of bookable vs cancelable.",
      expectedActions: [
        "Decide on trade-by-trade confirmation policy",
        "Engage market-utility customer success teams for amendments",
        "Confirm public statement",
        "Brief board on financial-impact estimate",
      ],
      objectives: [
        "Test settlement-decisioning under incident conditions",
        "Validate market-utility coordination",
        "Assess board-level briefing quality",
      ],
      senderRoleTitle: "Head of Operations",
      toRoleTitles: ["CEO", "Head of Markets", "Head of Risk"],
      ccRoleTitles: ["CTO", "Head of Compliance"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "08:15",
      summary: "Bloomberg headline goes out",
      description:
        "Bloomberg headlines the firm as 'experiencing technical issues affecting market-making'. The share price ticks 1.2% lower in pre-market. Compliance and PR need a joint statement within 30 minutes.",
      relation:
        "Compounds Event #2. Tests rapid corporate-communication response.",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO", "Head of Markets"],
      ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 2,
      scheduledTime: "10:30",
      summary: "Sister business unit reports correlated issue",
      description:
        "The Securities Lending desk reports irregularities on auto-pricing for stock-borrow rates, possibly using the same underlying pricing library. If correlated, the impact widens to a fifth product line.",
      relation:
        "Tests cross-business root-cause coordination during Event #3.",
      senderRoleTitle: "Head of Markets",
      toRoleTitles: ["CTO", "Head of Risk"],
      ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 3,
      scheduledTime: "13:00",
      summary: "Activist shareholder press release",
      description:
        "An activist shareholder issues a press release demanding the resignation of the CTO and citing 'years of underinvestment in core platforms'. Media follow-up is intense; the chair calls the CEO directly.",
      relation:
        "Tests reputational-management between Event #4 and #5.",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO"],
      ccRoleTitles: ["CTO", "Head of Risk"],
    },
  ],

  facilitatorQuestions: [
    { category: "Trading Halts", text: "What is your defined kill-switch authority and how fast can it be invoked across regions?" },
    { category: "Cross-Region", text: "How do you coordinate trading-halt decisions between LON, NY and HKG when the issue spans all three?" },
    { category: "Regulators", text: "Walk through the simultaneous notification of BoE, FCA, SEC and SFC. Who owns it?" },
    { category: "Client Handling", text: "What is your trade-bust authority and how do you ensure consistent treatment across clients?" },
    { category: "Public Markets", text: "How does the firm avoid creating a market-manipulation case while disclosing the issue?" },
    { category: "Capital", text: "What is the immediate capital implication and how is the CFO involved?" },
  ],
  debriefQuestions: [
    { category: "General", text: "Was the cross-regulator coordination realistic for your firm's complexity?" },
    { category: "Capability", text: "Did the firm have a credible cross-regional kill-switch?" },
    { category: "Reputation", text: "How quickly could you neutralise the share-price impact?" },
    { category: "Lessons Learned", text: "What is your top investment in platform resilience as a result of this scenario?" },
  ],
};
