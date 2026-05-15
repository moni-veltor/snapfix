import type { ScenarioTemplate } from "../types";

export const tier3AgmDisruption: ScenarioTemplate = {
  slug: "tier3-agm-disruption",
  title: "AGM Voting Platform Compromise — Building Society Member Crisis",
  category: "Third Party",
  tier: "TIER_3",
  srrRef: "3.1, 3.4",
  firmProfile: "Mutual / building society",
  background:
    "Your annual general meeting is happening today at 14:00 with hybrid voting via a third-party voting platform. At 13:40, the voting platform suffers a DDoS attack — voting is unavailable for 28 minutes. The AGM has a contested board-election with 80,000 members eligible to vote. Quorum is at risk. Members are calling, social media is loud, and the press are asking whether the vote will be re-run.",
  agenda: "13:40 Voting platform unavailable\n14:00 AGM scheduled start\n14:08 Platform recovers but reliability poor\n15:30 Postpone-or-continue decision\n16:30 Statement to members + press\n+1 week Re-vote logistics",
  dDayDate: "2026-06-25T13:40:00Z",
  durationMin: 180,
  cause:
    "A DDoS attack targets the voting platform vendor. The attack is volumetric (90 Gbps) and overwhelms the vendor's edge defences. They engage mitigation but lose 28 minutes of service in the worst window. The platform also exhibits residual instability for several hours after.",
  impactNarrative:
    "AGM agenda includes a contested board election + a contentious motion on a proposed merger. Member trust is heightened. Voting fairness is critical. By 14:00, only 38% of members have voted (vs typical 55%+ at this point). Quorum threshold is 60%. The CEO must decide: proceed, pause, postpone. Every choice has reputational cost.",
  characteristics: [
    "Member-mutual context — trust is the asset.",
    "Time-bound regulatory event (AGM has legal requirements).",
    "3rd-party caused, but the firm is publicly accountable.",
    "Decision-making in minutes, not days.",
  ],
  assumptions: [
    "AGM has a quorum requirement of 60% of eligible members.",
    "Hybrid format includes in-person, telephone and online voting.",
    "Voting-platform vendor has SLAs but recovery time is what it is.",
  ],
  takeaways:
    "Member-mutual governance events have technical-dependency tails. Vendor SLAs cover the easy cases; the regulatory and reputational fallout is yours. Postpone-and-re-run is a procedurally cleaner answer than 'we'll proceed and hope'.",
  stressVariables: [
    { name: "Platform downtime", options: ["10 min", "28 min", "2h", "4h+"] },
    { name: "Quorum at risk", options: ["Comfortably above", "Marginal", "Definitely below"] },
  ],
  caseStudy: {
    title: "Various AGM platforms during COVID-19 (2020-2021)",
    causation:
      "When member organisations rapidly moved AGMs online, several voting platforms experienced capacity or reliability issues. Some required postponement and re-vote.",
    impactScale: "Reputational impact + several million pounds of re-run cost across sector; lasting changes to vendor due-diligence and dual-platform strategies.",
    duration: "Same-day disruption; weeks of re-vote logistics.",
  },
  riskCoverage: { people: true, property: false, technology: true, dataAvailability: true, dataIntegrity: false, thirdParty: true },

  ibsList: [
    { code: "IBS_01", name: "Member AGM voting", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Member communications", impactToleranceMin: 120, criticality: "HIGH" },
    { code: "IBS_03", name: "Customer support contact centre", impactToleranceMin: 240, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1, scheduledTime: "13:40",
      title: "Voting platform unavailable",
      description:
        "Voting page returns 503. Vendor's status page goes orange. Member service desk gets first calls within 4 minutes — many members had set aside this window to vote.",
      expectedActions: ["Engage vendor's on-call", "Pre-prepare member-comms message", "Brief CEO and CTO"],
      objectives: ["Test out-of-cycle event-window response"],
      senderRoleTitle: "CTO", toRoleTitles: ["CEO", "CRO"], ccRoleTitles: ["CCO"],
    },
    {
      eventNo: 2, scheduledTime: "14:08",
      title: "Platform partially recovers",
      description:
        "Voting back online but slow and intermittent. Vendor reports DDoS mitigation engaged, expects 30-60 min of further instability. Vote count has resumed but new submissions are 4× slower than normal.",
      expectedActions: ["Decide: extend voting window or postpone", "CCO drafts member statement"],
      objectives: ["Test postpone-vs-extend decision quality"],
      senderRoleTitle: "CCO", toRoleTitles: ["CEO"], ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 3, scheduledTime: "15:30",
      title: "Postpone-or-continue decision",
      description:
        "Voting has stabilised but quorum is now uncertain. The IMT, briefed by the AGM chair, decides to extend voting by 48 hours and re-run the contested motion. The CEO records a video to members explaining.",
      expectedActions: ["Decision recorded", "Member-facing video produced and approved", "Press statement issued"],
      objectives: ["Test extended-event communications discipline"],
      senderRoleTitle: "CEO", toRoleTitles: ["CCO", "Head of Compliance"], ccRoleTitles: [],
    },
  ],

  injects: [
    {
      injectNo: 1, scheduledTime: "13:45", kind: "TECHNICAL",
      summary: "Vendor status page: 'investigating'",
      description:
        "Voting-platform vendor's status page changes from green to 'investigating' at 13:45. No further information for 8 minutes. Then 'DDoS mitigation engaged'.",
      relation: "Tests vendor-status-page → internal-comms loop.",
      senderRoleTitle: "Sn.TPM", toRoleTitles: ["CTO"], ccRoleTitles: [],
    },
    {
      injectNo: 2, scheduledTime: "13:55", kind: "TECHNICAL",
      summary: "PagerDuty: member-service call-queue depth spike",
      description:
        "Member service desk's PagerDuty integration alerts: call-queue depth has hit 180 (normal 12), average wait time 8 minutes. Staff being pulled from other queues.",
      relation: "Operational signal of the event spreading to call centre.",
      senderRoleTitle: "Customer Ops Lead", toRoleTitles: ["CCO"], ccRoleTitles: [],
    },
    {
      injectNo: 3, scheduledTime: "14:30", kind: "BUSINESS",
      summary: "Member campaigner amplifies",
      description:
        "A member who has been campaigning against the merger motion tweets: 'Convenient that the voting platform fails right when contested motions are due. #BankInQuestion'. Their tweet gets 600 retweets in 30 minutes.",
      relation: "Tests social-media + trust narrative.",
      senderRoleTitle: "Head of External Affairs", toRoleTitles: ["CCO"], ccRoleTitles: ["CEO"],
    },
    {
      injectNo: 4, scheduledTime: "15:00", kind: "BUSINESS",
      summary: "Press call with conspiracy angle",
      description:
        "A regional newspaper calls asking 'Are you aware some members are alleging the platform was deliberately taken down? Can you comment by 16:30?'",
      relation: "Tests press response to misinformation framing.",
      senderRoleTitle: "Head of External Affairs", toRoleTitles: ["CCO", "CEO"], ccRoleTitles: [],
    },
    {
      injectNo: 5, scheduledTime: "16:00", kind: "TECHNICAL",
      summary: "Vendor: post-mortem won't be ready for 5 days",
      description:
        "Voting-platform vendor confirms recovery and offers a written incident summary in 5 business days. The CEO needs a public statement within 2 hours that doesn't speculate but reassures.",
      relation: "Tests speaking-on-vendor's-behalf risk.",
      senderRoleTitle: "CTO", toRoleTitles: ["CCO", "CEO"], ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 6, scheduledTime: "Day 2", kind: "BUSINESS",
      summary: "Member-rights group files complaint",
      description:
        "A member-rights organisation writes formally to the FCA and PRA challenging whether the firm has discharged its obligations to members. The complaint is procedurally framed but well-supported.",
      relation: "Tests sustained regulator-engagement.",
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Vendor", text: "What's your due-diligence on time-bound event vendors (voting, payroll, settlement)?" },
    { category: "Member trust", text: "When trust is the asset, what is your transparency stance during an incident?" },
    { category: "Process", text: "Do you have an explicit 'postpone vs continue' decision tree for time-bound regulatory events?" },
  ],
  debriefQuestions: [
    { category: "Decision", text: "Was the postpone decision quick enough?" },
    { category: "Comms", text: "Did members hear from the CEO before social-media speculation took hold?" },
  ],
};
