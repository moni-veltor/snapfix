import type { ScenarioTemplate } from "../types";

export const keyPersonAbsence: ScenarioTemplate = {
  slug: "key-person-absence",
  title: "Concurrent Key-Person Absence — Flu Wave",
  category: "People",
  srrRef: "3.7",
  background:
    "A norovirus outbreak combined with seasonal flu takes out 30% of the engineering team across a single week — including the CTO, two senior platform engineers, and the database SME. Three of them are key-person dependencies that have been on the 'we should cross-train' list for two years. A routine production incident on Wednesday morning escalates because no one available has the runbook context.",
  agenda: "Mon — Absence pattern emerging\nTue — Headcount below threshold\nWed — Production incident\nWed afternoon — Escalation\nThu — Recovery + lessons",
  dDayDate: "2026-02-04T08:00:00Z",
  durationMin: 120,
  cause:
    "Coincident illness — not a single person's flu but a wave that simultaneously affects multiple engineering roles. Pre-existing key-person dependencies that the firm has been aware of for some time are exposed when several of those people are absent together.",
  impactNarrative:
    "Wednesday morning, the payments service starts experiencing intermittent failures. Normally the database SME would diagnose this within 20 minutes. With her absent, the on-call engineer takes 90 minutes to identify the cause (a query plan regression after a stats update). During that time, payment latency rises and customer service is hit. The CTO, also absent, is normally the IMT chair. Deputy CTO has never run an IMT.",
  characteristics: [
    "Slow build — develops over days, not minutes.",
    "Predictable but ignored — illness waves happen every winter.",
    "Reveals hidden single points of failure — people, not systems.",
    "Cascades into operational incidents the team usually handles routinely.",
  ],
  assumptions: [
    "Cross-training has been on the to-do list for 18+ months.",
    "Deputy roles are formally assigned but rarely exercised.",
    "30% absence is at the high end but not unprecedented in winter.",
  ],
  takeaways:
    "Key-person dependencies are a leadership problem, not an HR one. Cross-training that never happens is a liability waiting to surface during an absence wave. Deputies must run the IMT periodically when the primary is on holiday, not only when they're sick.",
  stressVariables: [
    { name: "Absence rate", options: ["10%", "20%", "30%", "40%+"] },
    { name: "Concurrent incident severity", options: ["None", "P3", "P2", "P1"] },
    { name: "Deputy readiness", options: ["Drilled monthly", "Drilled annually", "Documented only", "On paper only"] },
  ],
  caseStudy: {
    title: "UK NHS — Winter 2017–18 absence surge",
    causation:
      "A severe flu season combined with norovirus outbreaks hit NHS staffing levels across the country at the same time as peak demand.",
    impactScale:
      "Multiple hospital trusts declared major incidents. Routine surgery was suspended for weeks. Staff absence rates of 20-30% on critical wards.",
    duration: "Acute phase ~6 weeks; recovery to baseline ~3 months.",
  },
  riskCoverage: {
    people: true,
    property: false,
    technology: false,
    dataAvailability: false,
    dataIntegrity: false,
    thirdParty: false,
  },

  ibsList: [
    { code: "IBS_01", name: "Engineering on-call capability", description: "Ability to respond to P1 incidents.", impactToleranceMin: 240, criticality: "HIGH" },
    { code: "IBS_02", name: "Database operations", description: "DB tuning, query investigation, schema operations.", impactToleranceMin: 480, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "Monday morning",
      title: "Absence pattern emerges",
      description:
        "HR reports 8% absence on Monday — high but not exceptional. Engineering manager flags that 3 of the 8 absent are senior platform engineers. CTO sees the pattern but is herself ill by Monday evening.",
      expectedActions: ["Engineering manager activates contingency plan", "Deputy CTO formally notified"],
      objectives: ["Test deputy-activation muscle"],
      senderRoleTitle: "CPO",
      toRoleTitles: ["COO", "CRO"],
      ccRoleTitles: [],
    },
    {
      eventNo: 2,
      scheduledTime: "Wednesday 09:30",
      title: "Production incident with no SME",
      description:
        "Payments service throws intermittent timeouts. On-call engineer is new to the team (3 months). Normal escalation chain has 3 of the 5 names absent. Incident drags from a 20-minute fix to a 90-minute fix because the team is reasoning from first principles.",
      expectedActions: ["Engage external contractor / partner support", "Document the runbook gap as it's discovered"],
      objectives: ["Test the on-call's ability to fall back to first principles"],
      senderRoleTitle: "Deputy CTO",
      toRoleTitles: ["CRO", "CEO"],
      ccRoleTitles: [],
    },
    {
      eventNo: 3,
      scheduledTime: "Wednesday 14:00",
      title: "Decision: scale back releases",
      description:
        "With reduced engineering capacity, the IMT must decide whether to pause all non-essential deploys for the week. This is a leadership-and-team-morale call, not just operational.",
      expectedActions: ["Decision recorded with named approver", "Comms to engineering team"],
      objectives: ["Test leadership decision-making with reduced inputs"],
      senderRoleTitle: "Deputy CTO",
      toRoleTitles: ["CRO", "CEO"],
      ccRoleTitles: [],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "Wed 12:00",
      summary: "Junior on-call burns out",
      description:
        "The new on-call engineer has been escalating to senior people who are all off. They've worked through their lunch and missed two calls. Their manager (also off) hasn't responded. CPO needs to intervene to protect the person.",
      senderRoleTitle: "CPO",
      toRoleTitles: ["COO"],
      ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Key person", text: "Which roles in your engineering team are key-person dependencies, and what's the cross-training plan for each?" },
    { category: "Deputy", text: "When did your deputy last actually run an IMT for real?" },
    { category: "Welfare", text: "How do you spot when a junior engineer is burning out during a long incident?" },
  ],
  debriefQuestions: [
    { category: "People", text: "Did the deputy chain hold up, or did people improvise?" },
    { category: "Documentation", text: "What runbooks were missing or stale that the incident surfaced?" },
  ],
};
