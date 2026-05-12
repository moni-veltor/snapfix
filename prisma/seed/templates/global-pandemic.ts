import type { ScenarioTemplate } from "../types";

export const globalPandemic: ScenarioTemplate = {
  slug: "global-pandemic",
  title: "Global Pandemic",
  category: "Natural Hazards & Public Health",
  srrRef: "4.1",
  background:
    "This scenario explores the impact of a global infectious-disease pandemic, resulting in widespread governmental interventions to contain spread including local and/or country-wide lockdowns, travel restrictions and healthcare rationing. The progression is non-linear with multiple waves over many months. Compared to point-in-time disruptions, the pandemic is chronic and tests sustainability of recovery strategies.",
  agenda:
    "Week 0 First domestic cases\nWeek 2 Local restrictions, school closures\nWeek 4 National lockdown\nMonth 3 Wave-2 peak; staff absence stress\nMonth 6+ Sustainable WFH posture",
  dDayDate: "2026-09-01T09:00:00Z",
  durationMin: 240,

  cause:
    "A novel infectious disease of unknown origin spreads more rapidly than previous pandemics, with cases confirmed across all UK regions within weeks. The progression is non-linear with 2–3 waves of 12–15 weeks each, with differing severity.",
  impactNarrative:
    "Staff absentee rates reach significantly elevated levels for a sustained time. At its height, several locations experience 30–35% absence across 2–3 weeks within larger teams, and up to 50% in smaller teams. Base minimum of 20% across all teams. The move to predominantly remote working puts heavy reliance on local power/telecoms infrastructure and the firm's remote-access networks; cyber risks elevated. Increased risk to vulnerable customers as branches/call-centres restrict. Equal impacts on third parties.",
  characteristics: [
    "Slow(er) onset — longer lead time provides potential for pre-onset actions.",
    "Chronic by nature — places greater emphasis on sustainability of recovery strategies.",
    "Elevated staff anxiety — threat to safety of staff and family members.",
    "Conflicting priorities — caring responsibilities limit staff availability.",
    "Pan-regional impacts may limit transference strategies.",
  ],
  assumptions: [
    "Incident happens ahead of a peak/significant trading day with above-average volume.",
    "All IBS locations are in some level of lockdown; only essential-economy staff allowed in office.",
    "Even-absence assumption across regions, despite uneven peaks.",
    "Number of vulnerable customers is elevated due to financial and personal vulnerability under lockdown.",
  ],
  compoundScenarioNotes:
    "Pandemic-driven home-working can be compounded by technology issues that disrupt the contingencies invoked (network disruption). Failure of a third party provides another avenue to explore compound impacts. COVID showed both primary and secondary contingencies could be impacted across multiple geographic locations.",
  takeaways:
    "COVID accelerated unprecedented transformation. It altered work traditions and challenged long-held assumptions on severity and plausibility of scenarios. It emphasised capacity and sustainability planning within teams (illness, caring responsibilities) in contingency settings. It also altered the resource mix that underpins service delivery, with increased reliance on technology to support remote working.",
  stressVariables: [
    { name: "Staff absence (all teams)", options: ["20%", "35%", "50%"] },
    { name: "Staff absence (most-impacted)", options: ["35%", "50%", "50-60%", "60-70%", ">70%"] },
    { name: "Duration of lockdowns", options: ["2-4 weeks", "4-8 weeks", "8-12 weeks", "6 months", "1 year"] },
    { name: "Movement restrictions", options: ["No cross-border", "No intra-state", "Full"] },
    { name: "Third-party service impact", options: ["<25%", "25-50%", "50%", "50-75%", "Stressed exit"] },
  ],
  caseStudy: {
    title: "COVID-19 (2019–2022)",
    causation:
      "Novel coronavirus first reported in China in December 2019; WHO declared pandemic 11 March 2020. UK schools closed 20 March 2020; lockdown regulations from 26 March 2020.",
    impactScale:
      "25% of UK companies temporarily closed during COVID; home-working doubled to 9.9 million. Total factor productivity in the UK private sector dropped up to 5%. Critical sectors continued from premises where essential; remote working implemented at pace.",
    duration:
      "Global health emergency March 2020 – May 2023. UK had two lockdowns: March–June 2020 and December 2020 – March 2021. Restrictions including social distancing until April 2022.",
  },
  riskCoverage: {
    people: true,
    property: true,
    technology: true,
    dataAvailability: false,
    dataIntegrity: false,
    thirdParty: true,
  },

  ibsList: [
    { code: "IBS_01", name: "Contact Centre", description: "Inbound customer telephony and webchat.", impactToleranceMin: 240, criticality: "HIGH" },
    { code: "IBS_02", name: "Branch Banking — Vulnerable Customers", description: "In-branch assistance for elderly and vulnerable customers.", impactToleranceMin: 1440, criticality: "HIGH" },
    { code: "IBS_03", name: "Mobile & Online Banking", description: "Digital channels — primary access during lockdown.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_04", name: "Customer Hardship & Payment Holiday Processing", description: "Mass-volume hardship request handling.", impactToleranceMin: 1440, criticality: "HIGH" },
    { code: "IBS_05", name: "End-of-Day Settlement", description: "Treasury and settlement operations with reduced workforce.", impactToleranceMin: 480, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "09:00",
      title: "First UK cases — early posture activation",
      description:
        "First confirmed UK cases of a novel respiratory illness. Government issues general guidance on hygiene and travel. No restrictions yet but media coverage is escalating. Internal HR posture group is activated. Travel for non-essential business is reviewed. Wellbeing teams brief leaders on early signals to watch for.",
      expectedActions: [
        "Activate pandemic posture group",
        "Review business-travel policy",
        "Brief leaders on wellbeing signals",
        "Refresh WFH-readiness inventory",
      ],
      objectives: [
        "Test early-warning posture",
        "Validate travel-policy decisioning",
        "Assess WFH inventory accuracy",
      ],
      senderRoleTitle: "COO",
      toRoleTitles: ["CEO", "Customer Ops Lead", "Comms Lead"],
      ccRoleTitles: ["CRO", "CTO"],
    },
    {
      eventNo: 2,
      scheduledTime: "09:00",
      title: "Local restrictions, schools closed",
      description:
        "Several local-authority areas enter Tier-equivalent restrictions. Schools in those areas close with 24 hours' notice. Staff with school-age children face immediate caring responsibilities. The firm must decide whether to extend WFH guidance, adjust shift patterns, and protect vulnerable colleagues.",
      expectedActions: [
        "Extend WFH default for affected regions",
        "Issue guidance on caring responsibilities",
        "Identify and protect vulnerable colleagues",
        "Surge digital channels for elevated demand",
      ],
      objectives: [
        "Test caring-responsibility policy",
        "Validate vulnerable-colleague identification",
        "Assess channel-surge readiness",
      ],
      senderRoleTitle: "COO",
      toRoleTitles: ["CEO", "Customer Ops Lead"],
      ccRoleTitles: ["CTO", "CRO"],
    },
    {
      eventNo: 3,
      scheduledTime: "09:00",
      title: "National lockdown — WFH mandate",
      description:
        "Government announces national lockdown effective in 48 hours: schools closed, non-essential travel restricted, retail and hospitality closed. Firm must move 80% of workforce to WFH in 48 hours. Branches operate on reduced hours for vulnerable customers only. Customer hardship requests surge.",
      expectedActions: [
        "Execute 48-hour mass-WFH transition",
        "Reduce branch operations to vulnerable-customer support",
        "Stand up hardship-processing surge team",
        "Issue customer reassurance communications",
      ],
      objectives: [
        "Test mass-WFH transition capacity",
        "Validate vulnerable-customer process",
        "Assess hardship-processing scaling",
      ],
      senderRoleTitle: "CEO",
      toRoleTitles: ["COO", "CTO", "Comms Lead"],
      ccRoleTitles: ["CRO", "Customer Ops Lead"],
    },
    {
      eventNo: 4,
      scheduledTime: "09:00",
      isScheduled: false,
      title: "Wave 2 — staff absence peak",
      description:
        "Twelve weeks in: a second wave of the disease emerges with higher virulence. Staff absence reaches 35% across teams and 50% in the contact centre. The Treasury team is at half strength approaching a peak trading day. Several third-party suppliers report similar absence. The firm must decide which IBS to prioritise, accept controlled degradation in others, and brief regulators.",
      expectedActions: [
        "Prioritise critical IBS and accept degradation in others",
        "Coordinate with critical third parties on shared dependencies",
        "Brief board and regulator on impact-tolerance status",
        "Sustain wellbeing support for remaining staff",
      ],
      objectives: [
        "Test sustained-degradation decisioning",
        "Validate third-party coordination",
        "Assess workforce-sustainability planning",
      ],
      senderRoleTitle: "CRO",
      toRoleTitles: ["CEO", "COO", "CTO"],
      ccRoleTitles: ["Customer Ops Lead", "Comms Lead"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "11:00",
      summary: "VPN saturation under WFH surge",
      description:
        "The remote-access VPN reaches saturation as 80% of staff connect simultaneously. Critical applications time out. The team must triage VPN capacity, prioritising operations-critical roles. Some staff cannot work effectively from home.",
      relation:
        "Compounds Event #3. Tests technology-side WFH readiness.",
      senderRoleTitle: "CTO",
      toRoleTitles: ["Sn.TPM", "TPM", "COO"],
      ccRoleTitles: ["CEO"],
    },
    {
      injectNo: 2,
      scheduledTime: "10:00",
      isScheduled: false,
      summary: "Critical-personnel illness",
      description:
        "Three of seven authorisers required for high-value-payment release are off sick simultaneously, just before a Treasury cycle. The fall-back authoriser list has not been kept current and one named fall-back has left the firm. The team must produce a same-day amendment to the authorisation matrix.",
      relation:
        "Cuts across Event #4. Tests critical-personnel resilience.",
      senderRoleTitle: "CRO",
      toRoleTitles: ["CEO", "CTO", "COO"],
      ccRoleTitles: ["Treasury Lead"],
    },
  ],

  facilitatorQuestions: [
    { category: "Workforce", text: "What is your true mass-WFH transition capability over 48 hours?" },
    { category: "Workforce", text: "How do you protect and accommodate vulnerable colleagues and those with caring responsibilities?" },
    { category: "Customers", text: "What is the plan for vulnerable customers who depend on in-branch service?" },
    { category: "Critical Personnel", text: "When did you last revalidate your critical-personnel list and authorisation matrix?" },
    { category: "Sustainability", text: "What is your contingency plan if a second wave causes 50%+ absence?" },
  ],
  debriefQuestions: [
    { category: "General", text: "Were workforce-sustainability assumptions realistic across the multi-week scenario?" },
    { category: "Workforce", text: "Did duty-of-care obligations conflict with operational needs? How was this resolved?" },
    { category: "Customers", text: "Were vulnerable customers adequately served?" },
    { category: "Lessons Learned", text: "What is the top-priority pandemic-readiness gap revealed?" },
  ],
};
