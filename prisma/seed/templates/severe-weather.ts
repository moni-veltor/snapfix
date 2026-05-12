import type { ScenarioTemplate } from "../types";

export const severeWeather: ScenarioTemplate = {
  slug: "severe-weather",
  title: "Severe Weather (Storm / Hurricane)",
  category: "Natural Hazards & Public Health",
  srrRef: "12.1",
  background:
    "This scenario explores a major severe-weather event — a Category-3-equivalent storm with prolonged high winds, flooding and surge — impacting the UK over a 5-day period. Slower onset than cyber events but with broader societal disruption.",
  agenda:
    "Day -2 Forecast activation\nDay 0 Storm landfall — sites closed\nDay 1 Damage assessment & access restrictions\nDay 2 Restoration begins\nDay 3 Workforce return & customer impact",
  dDayDate: "2026-02-09T08:00:00Z",
  durationMin: 180,

  cause:
    "A major named storm makes landfall, with sustained wind speeds exceeding regional design tolerances, flooding in coastal and low-lying areas, and prolonged disruption to utilities, transport and public services.",
  impactNarrative:
    "Disruption is broad-based: power outages affect both office and home working; transport networks suspended; schools and childcare closed. Some branches damaged. Staff absence reaches up to 20% due to caring responsibilities, transport disruption and direct impact. Some markets suspended. Customers face property damage with elevated demand for emergency banking services.",
  characteristics: [
    "Slower onset — forecast lead time allows pre-positioning, but events can intensify rapidly.",
    "Elevated staff anxiety — safety of family members and homes.",
    "Conflicting priorities — caring and personal-property concerns limit staff availability.",
    "Disrupted communication — telecoms and broadcast networks degraded by physical damage.",
    "Other: compound risk — power, telecoms and transport may fail together.",
  ],
  assumptions: [
    "UPS/generators work as expected for safe shutdown and limited operations.",
    "Some branches will be damaged and forced to close for up to 1 month.",
    "External suppliers are heavily impacted in the same geography.",
  ],
  compoundScenarioNotes:
    "Severe weather typically compounds with localised power loss (CNI 7.1) and loss of telecoms (CNI 7.3). Long-tail customer impact may persist for months.",
  takeaways:
    "Hurricane Katrina highlighted the importance of infrastructure resilience, particularly flood-protection systems, and the need for plans that consider vulnerable customers and compounding factors. Response is underpinned by clear coordination and communication. Climate change is increasing both frequency and severity, so contingency capacity must keep pace.",
  stressVariables: [
    { name: "Market status", options: ["Open", "Closed (1 day)", "Closed (2 days)", "Closed (3 days)", "Closed (4+ days)"] },
    { name: "Utilities impact (power)", options: ["Local 1-2d", "Regional 1-2d", "Local 3-5d", "Regional 3-5d", "5 days+"] },
    { name: "Staff absence", options: ["20%", "30%", "40%", "50%"] },
  ],
  caseStudy: {
    title: "Hurricane Katrina (29 August 2005)",
    causation:
      "Category-3 storm at landfall on the US Gulf Coast, with extreme winds, heavy rainfall and a storm surge that overwhelmed levees in New Orleans.",
    impactScale:
      "~80% of New Orleans inundated; >1,800 deaths; tens of thousands homeless; >1 million displaced from the Gulf Coast region. Economic loss estimated at $125bn.",
    duration:
      "Immediate weather-related impacts lasted approximately 1 week. Recovery efforts continued for years; full recovery in some neighbourhoods took over a decade.",
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
    { code: "IBS_01", name: "Branch Banking — Affected Region", description: "Physical branches in the storm-impact area.", impactToleranceMin: 1440, criticality: "HIGH" },
    { code: "IBS_02", name: "Contact Centre", description: "Inbound customer telephony — expected surge.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Online & Mobile Banking", description: "Digital channels — primary access during physical disruption.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_04", name: "Claims & Hardship Support", description: "Customer hardship and emergency support processes.", impactToleranceMin: 1440, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "08:00",
      title: "Storm forecast triggers regional activation",
      description:
        "The Met Office upgrades the warning to a Red category for the south-west and south-east. Confidence is high that landfall will occur within 36 hours with sustained winds exceeding 100 mph and significant coastal surge. Government issues 'do not travel' advice for the forecast region. The firm's regional sites must decide whether to close ahead of the storm and shift to remote operations.",
      expectedActions: [
        "Activate the severe-weather playbook for the affected region",
        "Decide branch closures and customer messaging",
        "Confirm WFH and split-site working for affected staff",
        "Pre-position contact-centre surge capacity",
      ],
      objectives: [
        "Validate pre-event activation triggers",
        "Test branch-closure decision process",
        "Assess WFH-readiness for the workforce",
      ],
      senderRoleTitle: "COO",
      toRoleTitles: ["Customer Ops Lead", "Comms Lead"],
      ccRoleTitles: ["CEO", "CRO"],
    },
    {
      eventNo: 2,
      scheduledTime: "10:00",
      title: "Landfall — power and telecoms degradation",
      description:
        "Storm makes landfall. Regional power outages reported across 30% of the affected counties. Mobile network operators report cell-site failures and battery exhaustion. Internet backhaul to several branches in the affected region is lost. Contact-centre call volumes are 4x baseline and rising. Three branches report wind damage to roofing.",
      expectedActions: [
        "Confirm closures for affected branches and adjust messaging",
        "Stand up the customer-hardship process",
        "Surge contact-centre staffing",
        "Coordinate with telecoms providers on priority restoration",
      ],
      objectives: [
        "Test mobilisation of customer-hardship process",
        "Validate telecoms-priority restoration channel",
        "Assess contact-centre surge",
      ],
      senderRoleTitle: "COO",
      toRoleTitles: ["Customer Ops Lead", "CTO"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 3,
      scheduledTime: "07:30",
      isScheduled: false,
      title: "Day 1 — damage assessment and access cordon",
      description:
        "Daylight reveals significant damage. Two branches will need engineering inspection before re-opening. Local authorities have closed roads in three town centres. Many staff in the affected region are unable to travel to alternate sites due to road closures or because their own homes are damaged. Staff absence is reported at 22% across the region.",
      expectedActions: [
        "Assess and report on physical damage to property",
        "Plan customer-hardship response",
        "Re-balance workload to unaffected sites",
        "Update regulator on impact-tolerance status for IBS",
      ],
      objectives: [
        "Test property-damage assessment cadence",
        "Validate workload-balancing across geography",
        "Assess regulator-update process",
      ],
      senderRoleTitle: "COO",
      toRoleTitles: ["CEO", "CRO"],
      ccRoleTitles: ["Comms Lead", "Customer Ops Lead"],
    },
    {
      eventNo: 4,
      scheduledTime: "11:00",
      isScheduled: false,
      title: "Day 3 — restoration and reputation management",
      description:
        "Power has been substantially restored. The contact centre is at full capacity but call wait times remain very high — over 18 minutes — due to a backlog of hardship-related queries. Media coverage criticises the firm and competitors for slow response. Two political figures comment on social media. The board asks for a clear plan for customer redress within 24 hours.",
      expectedActions: [
        "Approve customer-redress framework",
        "Issue board-level public statement",
        "Process emergency hardship payments",
        "Plan multi-week customer-impact programme",
      ],
      objectives: [
        "Test customer-redress decision-making at scale",
        "Validate executive-comms response",
        "Assess long-tail recovery planning",
      ],
      senderRoleTitle: "CEO",
      toRoleTitles: ["Comms Lead", "COO", "CRO"],
      ccRoleTitles: ["CTO"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "11:30",
      summary: "Branch staff stranded by surge",
      description:
        "Two retail branches still have staff inside when surge water begins rising rapidly outside. Local emergency services advise shelter-in-place. The firm's duty-of-care obligations require an immediate response, but the safety officer cannot reach staff via mobile.",
      relation:
        "Compounds Event #2. Tests duty-of-care escalation and emergency liaison.",
      senderRoleTitle: "COO",
      toRoleTitles: ["CEO", "CRO"],
      ccRoleTitles: ["Comms Lead"],
    },
    {
      injectNo: 2,
      scheduledTime: "10:00",
      isScheduled: false,
      summary: "Insurance partner reports flood-claim surge",
      description:
        "The firm's insurance partner reports an emerging surge in property-claim notifications, with their own contact-centre at peak capacity. They warn the firm that some joint-product customers may be unable to get through to their primary insurer for hours and ask the bank to brief frontline staff on the situation.",
      relation:
        "Tests partner-coordination and customer-handling during a compound event.",
      senderRoleTitle: "Customer Ops Lead",
      toRoleTitles: ["Comms Lead", "COO"],
      ccRoleTitles: ["CRO"],
    },
  ],

  facilitatorQuestions: [
    { category: "Activation", text: "When do you trigger your severe-weather playbook? Has the trigger been tested?" },
    { category: "Workforce", text: "How do you reach staff in affected regions when mobile networks are degraded?" },
    { category: "Customers", text: "What is your hardship-payment threshold and what is the approval chain?" },
    { category: "Property", text: "Who assesses physical damage and how quickly?" },
    { category: "Sector Coordination", text: "Have you coordinated with neighbouring firms on customer-impact messaging?" },
  ],
  debriefQuestions: [
    { category: "General", text: "Was the slower-onset nature of the event reflected in your activation timing?" },
    { category: "Workforce", text: "Were you able to maintain duty-of-care obligations to staff in the affected region?" },
    { category: "Customers", text: "Did your hardship process meet customer expectations?" },
    { category: "Lessons Learned", text: "What is the single biggest gap revealed by this scenario?" },
  ],
};
