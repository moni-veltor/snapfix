import type { ScenarioTemplate } from "../types";

export const tier2ViralRun: ScenarioTemplate = {
  slug: "tier2-viral-run",
  title: "Viral Influencer-Fuelled Run + 10× Traffic Spike",
  category: "Technology & Data (Cyber)",
  tier: "TIER_2",
  srrRef: "3.6, 3.7",
  firmProfile: "Digital challenger / fintech with active social presence",
  background:
    "A consumer-finance influencer with 2.4M followers posts a viral TikTok at 19:30 on Sunday evening titled 'I'm taking my money out — here's why' citing unconfirmed (and inaccurate) rumours about your firm's solvency. Within 90 minutes the video has 800k views. By Monday market-open, your outbound payment volume is 12× normal and login attempts are 6× normal. You're simultaneously dealing with infrastructure load AND a slow-motion bank-run optic.",
  agenda: "Sun 19:30 Viral video posted\nSun 21:00 Initial traffic spike\nMon 06:00 Markets open\nMon 09:00 Outbound payment cap proposed\nMon 14:00 Press response\nTue 09:00 Liquidity briefing",
  dDayDate: "2026-12-13T19:30:00Z",
  durationMin: 240,
  cause:
    "An influencer with a track record of unfounded financial 'analysis' posts a video claiming your firm is 'about to fail'. The content is technically not actionable misinformation but is presented as confident analysis. Other influencers and Twitter accounts amplify within hours. Two consumer-rights organisations RT it.",
  impactNarrative:
    "Customers begin withdrawing funds at 10× normal rate. Faster Payments outbound load is 12× normal. Mobile login attempts spike 6×. Your auto-scaling holds for now but you're approaching account-level quota limits with your hyperscaler. Treasury is monitoring the liquidity buffer hourly. The CEO is on holiday and reachable by phone but not in-person. A Sky News reporter calls the press line at 21:15 asking 'is everything OK?'.",
  characteristics: [
    "Reputation event > technology event, but technology is the immediate failure mode.",
    "Out-of-hours onset.",
    "Misinformation-driven — the cause has no technical fault.",
    "Liquidity dimension layered on top of operational stress.",
  ],
  assumptions: [
    "Auto-scaling can handle 5-8× traffic without intervention.",
    "Faster Payments outbound is capped at sponsor-bank's contracted rate.",
    "Treasury has overnight liquidity facilities but they're not unlimited.",
  ],
  takeaways:
    "Modern bank-run dynamics are measured in hours, not days. The Silicon Valley Bank collapse showed how social media + mobile banking creates a faster, more concentrated run mechanic. Pre-prepared, plausibly-honest, fast comms beat well-crafted slow comms.",
  stressVariables: [
    { name: "Withdrawal multiple", options: ["3×", "10×", "30×", "100×"] },
    { name: "Liquidity buffer", options: ["3 days", "1 day", "12 hours", "Stressed"] },
    { name: "CEO availability", options: ["In room", "Phone-reachable", "On a flight", "Unreachable"] },
  ],
  caseStudy: {
    title: "Silicon Valley Bank — March 2023",
    causation:
      "SVB's announcement of a capital raise triggered concern. Concern travelled via VC group chats and Twitter. Customers requested withdrawals at unprecedented speed enabled by mobile banking.",
    impactScale: "$42 billion in withdrawal requests in a single day. FDIC took over the bank within 48 hours.",
    duration: "From first rumour to FDIC takeover: ~36 hours.",
  },
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: true, dataIntegrity: false, thirdParty: false },

  ibsList: [
    { code: "IBS_01", name: "Domestic payments (Faster Payments)", impactToleranceMin: 90, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Mobile banking", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Customer support contact centre", impactToleranceMin: 240, criticality: "HIGH" },
    { code: "IBS_04", name: "Intraday liquidity management", impactToleranceMin: 60, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1, scheduledTime: "19:30",
      title: "Viral video posted",
      description:
        "The TikTok is posted. Within 45 minutes the firm's social listening tool flags it (low-priority alert). At 21:00 it has 800k views.",
      expectedActions: ["Activate out-of-hours crisis team", "Assess factual basis"],
      objectives: ["Test out-of-hours response activation"],
      senderRoleTitle: "Head of External Affairs", toRoleTitles: ["CCO", "Comms Lead"], ccRoleTitles: ["CEO", "CRO"],
    },
    {
      eventNo: 2, scheduledTime: "21:00",
      title: "Withdrawal surge begins",
      description:
        "Outbound payment volume is 4× normal at 21:00, 8× by 23:00. Treasury monitors. The sponsor bank notices the traffic and emails to check everything is in order.",
      expectedActions: ["Begin hourly liquidity-position checks", "Engage sponsor bank proactively"],
      objectives: ["Test treasury / 3rd-party rapid coordination"],
      senderRoleTitle: "Treasury Lead", toRoleTitles: ["CFO", "CRO"], ccRoleTitles: ["CTO"],
    },
    {
      eventNo: 3, scheduledTime: "Mon 06:00",
      title: "Markets open — multiplier",
      description:
        "By Monday market-open, withdrawal rate is 12× normal. Customer service is overwhelmed. Mobile app load is 6× normal but holding. The IMT must decide: outbound rate-cap, full transparency comms, or both.",
      expectedActions: ["IMT formal decision on cap and comms", "Customer-facing message approved"],
      objectives: ["Test high-stakes decision under sustained pressure"],
      senderRoleTitle: "CEO", toRoleTitles: ["CRO", "CCO", "CFO"], ccRoleTitles: [],
    },
    {
      eventNo: 4, scheduledTime: "Mon 14:00",
      title: "Press response + influencer engagement",
      description:
        "CEO records a 90-second video addressing the rumours directly. CFO issues a public statement on liquidity position. Press calls slow. By end of Monday, withdrawal rate is 3× normal and falling.",
      expectedActions: ["Sustain comms cadence (hourly updates)", "Plan Tuesday board / regulator briefing"],
      objectives: ["Test the slow phase of regaining trust"],
      senderRoleTitle: "CEO", toRoleTitles: ["CCO", "Head of External Affairs"], ccRoleTitles: ["CRO"],
    },
  ],

  injects: [
    {
      injectNo: 1, scheduledTime: "Sun 22:30", kind: "TECHNICAL",
      summary: "AWS service quotas at 78% capacity",
      description:
        "Your AWS Service Quotas dashboard shows the EC2 instance limit in your primary region is at 78%. At current scale rate you'll hit it in 4-6 hours. Quota increase requests take 24-72 hours.",
      relation: "Adds a hyperscaler-side ceiling to the auto-scaling story.",
      senderRoleTitle: "Sn.TPM", toRoleTitles: ["CTO"], ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 2, scheduledTime: "Sun 23:15", kind: "TECHNICAL",
      summary: "Faster Payments throughput cap reached",
      description:
        "The sponsor bank emails: you've hit 95% of the contracted outbound Faster Payments per-second rate. Requests above the cap are being queued. The queue is growing 200 transactions per second.",
      relation: "Layer of 3rd-party constraint.",
      senderRoleTitle: "Treasury Lead", toRoleTitles: ["CFO", "CTO"], ccRoleTitles: [],
    },
    {
      injectNo: 3, scheduledTime: "Mon 07:30", kind: "BUSINESS",
      summary: "FCA / PRA wake up",
      description:
        "FCA Op Resilience desk and PRA both email separately within 15 minutes asking for a verbal briefing within 2 hours. They've seen the social-media activity and the customer reports.",
      relation: "Dual-regulator pressure.",
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: [],
    },
    {
      injectNo: 4, scheduledTime: "Mon 09:00", kind: "BUSINESS",
      summary: "Class-action lawyer email",
      description:
        "A claims-management law firm emails offering to 'represent affected customers'. They CC a Sun journalist on the email.",
      relation: "Layer of legal-press pressure.",
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: [],
    },
    {
      injectNo: 5, scheduledTime: "Mon 11:00", kind: "TECHNICAL",
      summary: "Database read-replica lag warnings",
      description:
        "The read replicas for customer-balance reads are showing growing replication lag (now 8 seconds, normal is <1s). The mobile app is sometimes showing stale balances which fuels customer panic.",
      relation: "Operational fault under load makes the optics worse.",
      senderRoleTitle: "Sn.TPM", toRoleTitles: ["CTO"], ccRoleTitles: ["Sn. DA/E"],
    },
    {
      injectNo: 6, scheduledTime: "Mon 13:00", kind: "BUSINESS",
      summary: "Influencer continues posting",
      description:
        "The original influencer posts a follow-up video claiming the firm's silence proves the rumours. Their initial video is now at 4.5M views.",
      relation: "Tests whether comms team has a 'reply or not' framework.",
      senderRoleTitle: "Head of External Affairs", toRoleTitles: ["CCO"], ccRoleTitles: ["CEO"],
    },
  ],

  facilitatorQuestions: [
    { category: "Comms", text: "What's your pre-prepared playbook for influencer-driven misinformation about your solvency?" },
    { category: "Treasury", text: "What's your overnight liquidity buffer, and how does the IMT learn its real-time status?" },
    { category: "Scale", text: "Have you load-tested at 10× normal traffic, and are you confident in the result?" },
  ],
  debriefQuestions: [
    { category: "Detection", text: "How long from first viral post to IMT activation?" },
    { category: "Comms", text: "Did the firm's first comms reach customers before the second wave of social pressure?" },
  ],
};
