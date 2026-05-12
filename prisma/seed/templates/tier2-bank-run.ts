import type { ScenarioTemplate } from "../types";

export const tier2BankRun: ScenarioTemplate = {
  slug: "tier2-viral-social-media-bank-run",
  title: "Viral Social-Media-Fuelled Bank Run",
  category: "Other",
  tier: "TIER_2",
  firmProfile: "Digital Challenger Bank",
  background:
    "A digital challenger bank faces a rapidly escalating deposit outflow triggered by misinformation (or partial-truth) circulating on social media. Tests the firm's liquidity, decision-making, and crisis-communication response in the speed-of-the-internet era — the SVB scenario applied to a Tier 2 firm.",
  agenda:
    "Day 0 16:00 First viral post\nDay 0 18:00 First withdrawal spike\nDay 0 23:00 Overnight liquidity assessment\nDay 1 09:00 Pre-market: regulator engagement\nDay 1 10:00 Run accelerates",
  dDayDate: "2026-03-09T16:00:00Z",
  durationMin: 240,

  cause:
    "A widely-followed influencer or competitor posts a thread on Twitter/X suggesting (with partial accuracy) that the firm's liquidity position is weak. The thread is amplified by algorithmic newsfeed mechanics, including misleading screenshots and out-of-context regulatory filings. Withdrawals can be initiated in seconds via the firm's own app.",
  impactNarrative:
    "Within 4 hours, withdrawal volume reaches 8x baseline. Within 24 hours, ~15% of customer deposits have been withdrawn — far exceeding any historic stress test. App-initiated transfers to other banks via Faster Payments hit the bank's daily FPS limit; customers begin tweeting that 'they're stopping people from leaving' which adds fuel. The interbank deposit market reacts; the firm's funding costs spike. The board faces an overnight decision: take emergency action (e.g. emergency capital, take-private statement, acquisition outreach) or risk a self-fulfilling collapse.",
  characteristics: [
    "Speed unprecedented — SVB lost $42B in deposits in under 24 hours.",
    "Self-amplifying — every operational constraint becomes new evidence of weakness.",
    "Social-media-driven — traditional crisis-comms playbooks too slow.",
    "Sector-wide secondary effects — competitors implicated by association.",
  ],
  assumptions: [
    "The trigger may have a partial factual basis (e.g. an unrealised loss in the firm's bond book).",
    "The firm's liquidity buffer is sized for traditional, branch-based bank runs (days, not hours).",
    "FPS daily limits will be hit within hours.",
  ],
  compoundScenarioNotes:
    "Compounds catastrophically with: a coincident systems outage (perceived as 'they're stopping us'), an analyst downgrade, a regulator request for information that leaks. Sector-wide if multiple challengers face similar pressure.",
  takeaways:
    "SVB (March 2023): $42B of deposits withdrawn in under 24 hours; the bank failed the next day. First-ever 'speed-of-the-internet' bank run. Highlighted that liquidity-stress assumptions designed for in-person runs are obsolete, and that uninsured-deposit concentration is a structural risk.",
  caseStudy: {
    title: "Silicon Valley Bank Collapse (March 2023)",
    causation:
      "SVB announced it had sold $21B of securities at a $1.8B loss and was raising capital. Tech-sector founders and VCs coordinated withdrawal advice on group chats. Withdrawals snowballed.",
    impactScale:
      "$42B of deposits withdrawn on March 9, 2023 alone (a quarter of total deposits). FDIC took over the bank the next morning. Several Tier-2 US regional banks placed under stress; First Republic failed weeks later.",
    duration:
      "From announcement to receivership: ~36 hours. Sector-wide stress persisted for months. Regulatory reforms ongoing.",
  },
  stressVariables: [
    { name: "Trigger credibility", options: ["Misinformation only", "Partial truth", "Material fact"] },
    { name: "Speed of outflow (24h)", options: ["5%", "10%", "15%", "25%", ">25%"] },
    { name: "Sector context", options: ["Stable", "Nervous", "Multiple failures recent"] },
    { name: "FPS limit hit", options: ["Within 4h", "Within 12h", "Within 24h", "Not hit"] },
  ],
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: false,
    dataIntegrity: false,
    thirdParty: false,
  },

  ibsList: [
    { code: "IBS_01", name: "Faster Payments — Outbound", description: "Customer-initiated FPS payments to other banks.", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Deposit Withdrawal", description: "Customer ability to access and move their deposits.", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Liquidity Management", description: "Treasury's ability to forecast and manage intraday liquidity.", impactToleranceMin: 120, criticality: "CRITICAL" },
    { code: "IBS_04", name: "Crisis Communications", description: "External messaging through all channels.", impactToleranceMin: 30, criticality: "HIGH" },
    { code: "IBS_05", name: "Regulator Engagement", description: "Real-time data sharing with PRA and FCA.", impactToleranceMin: 60, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "16:00",
      title: "Viral post detected — first withdrawal spike",
      description:
        "A widely-followed fintech commentator posts a thread on Twitter/X suggesting the firm has a 'serious unrealised loss problem' alongside screenshots of regulatory filings. The thread is liked 30,000 times within an hour. Customer withdrawal volume via the app rises to 3x baseline within 15 minutes and 8x within an hour.",
      expectedActions: [
        "Activate Liquidity Major Incident protocol",
        "Brief CEO, CFO, CRO and board chair",
        "Engage external counsel on disclosure obligations",
        "Begin drafting public response — facts, not panic",
      ],
      objectives: [
        "Test rapid liquidity-incident activation",
        "Validate executive escalation",
        "Assess legal-and-comms balance under speed",
      ],
      senderRoleTitle: "Treasury Lead",
      toRoleTitles: ["CEO", "CFO", "CRO"],
      ccRoleTitles: ["Comms Lead"],
    },
    {
      eventNo: 2,
      scheduledTime: "20:00",
      title: "Evening: outflow reaches 12% of deposits",
      description:
        "By 8pm, ~12% of customer deposits have left the firm in 4 hours. FPS daily-limit caps are starting to bite — customers see error messages on transfers; this becomes a new viral thread ('they're trapping us in'). Treasury reports the firm will breach its internal liquidity-coverage ratio within 14 hours at current outflow rate.",
      expectedActions: [
        "Decide on FPS limit posture — keep, raise, communicate",
        "Engage PRA Liquidity Desk before close-of-business",
        "Begin emergency funding arrangements (sister-firm support, central-bank liquidity)",
        "Prepare CEO video statement",
      ],
      objectives: [
        "Test operational-decision-vs-perception tradeoff",
        "Validate PRA Liquidity Desk engagement",
        "Assess emergency-funding access",
      ],
      senderRoleTitle: "CEO",
      toRoleTitles: ["CFO", "CRO", "Treasury Lead", "Comms Lead"],
      ccRoleTitles: ["Chair"],
    },
    {
      eventNo: 3,
      scheduledTime: "09:00",
      isScheduled: false,
      title: "Day 1 — pre-market regulator decision",
      description:
        "Overnight outflows continued. Total 24h withdrawal: 18% of deposits. The PRA convenes a 7am call with the firm, alternative resolution paths, and a holding-company entity. Board must decide before 9am open whether to: continue trading, take protective action (e.g. pre-emptive PRA capital injection request, take-private), or invoke a planned acquirer-of-last-resort arrangement.",
      expectedActions: [
        "Make pre-market strategic decision",
        "Coordinate any market-disclosure obligations",
        "Brief customers and staff on outcome",
        "Coordinate sector messaging via CMORG",
      ],
      objectives: [
        "Test pre-market strategic decisioning under crisis",
        "Validate market-disclosure obligations",
        "Assess staff and customer messaging",
      ],
      senderRoleTitle: "Chair",
      toRoleTitles: ["CEO", "CFO", "CRO"],
      ccRoleTitles: ["Comms Lead", "Treasury Lead"],
    },
    {
      eventNo: 4,
      scheduledTime: "12:00",
      isScheduled: false,
      title: "Day 1 — sector contagion concerns",
      description:
        "Two other Tier-2 challengers see customer deposits dropping by 4-6% as nervous depositors broadly de-risk. CMORG opens a sector-coordination call. The PRA asks the firm to coordinate messaging to avoid market panic. The chair must balance the firm's own survival with sector-stability obligations.",
      expectedActions: [
        "Participate in CMORG sector call",
        "Coordinate sector messaging",
        "Decide on stronger public statement (financial backing, FSCS reassurance)",
        "Plan post-crisis customer retention",
      ],
      objectives: [
        "Test sector-coordination posture",
        "Validate FSCS-messaging consistency",
        "Assess crisis-to-recovery transition",
      ],
      senderRoleTitle: "CEO",
      toRoleTitles: ["Chair", "Comms Lead"],
      ccRoleTitles: ["CFO", "CRO"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "17:30",
      summary: "Competitor 'analyst' posts a deep-dive thread",
      description:
        "A second influential account posts what appears to be a detailed credit analysis of the firm, including data that could only have come from confidential filings. The accuracy is mixed, but the appearance of insider-quality detail amplifies the panic.",
      relation:
        "Compounds Event #1. Tests rumour-management and information-warfare response.",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO", "CRO"],
      ccRoleTitles: ["Chair"],
    },
    {
      injectNo: 2,
      scheduledTime: "06:00",
      isScheduled: false,
      summary: "Morning newspaper front page",
      description:
        "FT and a major UK tabloid both front-page the situation. The tabloid headline is alarmist ('IS YOUR MONEY SAFE?'). The PRA Governor is doorstepped on the way into the office and gives a 30-second reassurance soundbite. The board must decide whether to use this in their own messaging.",
      relation:
        "Cuts across Event #3. Tests media-cycle response.",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO", "Chair"],
      ccRoleTitles: ["CRO"],
    },
  ],

  facilitatorQuestions: [
    { category: "Liquidity", text: "What is your real-time view of intraday liquidity and how fast can you produce a confidence-grade number for the regulator?" },
    { category: "Comms", text: "Who has authority to make public statements during a run? How fast can a CEO statement reach customers?" },
    { category: "FPS Limits", text: "How would you communicate about scheme-imposed FPS limits without triggering more panic?" },
    { category: "Sector", text: "Do you have a credible sector-coordination plan for when contagion threatens? Tested with PRA?" },
    { category: "Pre-positioning", text: "Have you pre-arranged emergency funding lines that you can draw on within hours?" },
    { category: "Resolution", text: "Does your firm have an acquirer-of-last-resort arrangement? Activated how?" },
  ],
  debriefQuestions: [
    { category: "Speed", text: "Were liquidity-decisioning processes fast enough for a speed-of-the-internet run?" },
    { category: "Comms", text: "Was the public response credible and timely?" },
    { category: "Regulator", text: "How was the relationship with the PRA Liquidity Desk during the event?" },
    { category: "Lessons", text: "What single change would make the biggest difference next time?" },
  ],
};
