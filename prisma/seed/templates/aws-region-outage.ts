import type { ScenarioTemplate } from "../types";

export const awsRegionOutage: ScenarioTemplate = {
  slug: "aws-region-outage",
  title: "Hyperscaler Region Outage (AWS eu-west-2)",
  category: "Cloud & Infrastructure",
  srrRef: "3.2, 3.5",
  background:
    "AWS eu-west-2 (London) suffers a multi-AZ outage triggered by a control-plane fault propagating through EC2, RDS and EBS. The firm's primary production region is offline. Failover region (eu-west-1, Dublin) is partially operational but takes traffic only after manual DNS shift. Customer-facing services degrade within minutes; recovery time hinges on the firm's tested failover muscle, not on AWS's status page.",
  agenda:
    "08:00 Detection + AWS status page check\n08:30 Failover decision\n09:00 DNS shift to alternate region\n10:00 Customer comms + regulator pre-notification\n12:00 Full traffic on failover region\n15:00 AWS partial recovery\n17:00 Failback planning",
  dDayDate: "2026-07-09T08:00:00Z",
  durationMin: 180,

  cause:
    "A faulty configuration push to AWS eu-west-2's internal control plane cascades through EC2 metadata services, causing EBS volumes to detach randomly and RDS failovers to stall. All three availability zones are affected. AWS health dashboard initially shows green for the region while customer workloads silently fail. Status page is updated 22 minutes after the firm's own SOC detects the issue.",
  impactNarrative:
    "Within 10 minutes, the firm's mobile banking platform returns 503 errors for 60% of requests. Card auth latency rises from 80ms to 2.4s. The on-call SRE team begins the documented region-failover runbook. Two of the three critical databases fail over cleanly; the third needs a manual reconciliation because of an undocumented in-flight migration. Card-network partners begin queueing outbound auth requests. Treasury sees liquidity warnings as overnight settlement is delayed. The customer service contact centre is overwhelmed within 30 minutes.",
  characteristics: [
    "Rapid onset — minute-scale degradation; no early warning.",
    "Single hyperscaler dependency — entire firm tied to one cloud provider in one region.",
    "Failover is the test — the runbook has never been executed under load.",
    "External dependency on AWS — comms cadence dictated by AWS's status page, not yours.",
    "4th-party concentration — many of your vendors also run on AWS eu-west-2.",
  ],
  assumptions: [
    "Failover region (eu-west-1) is fully provisioned with capacity for 100% of production load.",
    "DNS shift takes 8–12 minutes to propagate; some customers see stale endpoints for up to an hour.",
    "AWS support response time is 15–30 minutes for Enterprise Support; no committed RTO.",
    "Cross-region database replication has lag <5s but has never been tested under sudden writeable promotion.",
  ],
  compoundScenarioNotes:
    "Combine with concurrent vendor outage if vendors (e.g. Onfido, ClearBank) also run on AWS eu-west-2. Combine with a deploy in flight to test 'we can't roll back because the deploy pipeline is in the affected region'.",
  takeaways:
    "AWS us-east-1 December 2021 incident lasted 7 hours and took down Disney+, Slack and major banks. AWS-eu-west-2 went down on 25 April 2023 affecting major UK banks. Failover muscle requires regular real-world drills; runbooks left untested for >6 months should be considered fictional.",
  stressVariables: [
    { name: "Affected services", options: ["EC2 only", "RDS + EBS", "Network + control plane", "Full region"] },
    { name: "Failover region capacity", options: ["100%", "60%", "30%", "Cold"] },
    { name: "Customer-traffic profile", options: ["Quiet weekend", "Average weekday", "Peak month-end", "Black Friday"] },
  ],
  caseStudy: {
    title: "AWS eu-west-2 — 25 April 2023",
    causation:
      "AWS eu-west-2 (London) experienced a multi-service outage affecting Lambda, API Gateway, EC2 and dependent services for several hours, impacting major UK customer-facing services.",
    impactScale:
      "Multiple UK banks reported mobile app and card-auth disruption. Customers experienced log-in failures and intermittent payment failures during peak hours.",
    duration:
      "Approximately 4 hours from detection to full recovery; some downstream services remained degraded for 12+ hours due to backlog processing.",
  },
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: true,
    dataIntegrity: false,
    thirdParty: true,
  },

  ibsList: [
    { code: "IBS_01", name: "Mobile and online banking", description: "Customer access via mobile and web channels.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Card transaction authorisation", description: "Real-time approve / decline of card transactions.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Domestic payments (Faster Payments)", description: "Same-day GBP payment send and receive.", impactToleranceMin: 120, criticality: "CRITICAL" },
    { code: "IBS_04", name: "Customer support contact centre", description: "Inbound customer support voice and chat.", impactToleranceMin: 240, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "08:00",
      title: "Multi-AZ failures in eu-west-2",
      description:
        "SRE pager fires: 5xx error rate jumps from 0.1% to 38% on the mobile banking API. AWS status page shows green. Internal CloudWatch shows EC2 instance health checks failing across all three AZs. Database connections to RDS are timing out. The on-call SRE escalates to the CTO and triggers the 'P1 — region degradation' runbook.",
      expectedActions: [
        "Confirm scope via internal observability, not just AWS status page",
        "Page CTO, ISM, and Customer Ops Lead",
        "Open the AWS Enterprise Support case immediately",
      ],
      objectives: [
        "Validate detection independence from vendor health dashboards",
        "Test 'P1 — region degradation' runbook activation",
      ],
      senderRoleTitle: "ISM",
      toRoleTitles: ["CTO", "Sn.TPM"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 2,
      scheduledTime: "08:30",
      title: "Failover decision",
      description:
        "Twenty minutes in, error rate is still climbing. AWS support has acknowledged the incident but cannot give an ETA. The IMT must decide: wait, or trigger the eu-west-1 failover. The CTO recommends failover; the CRO flags that two databases have in-flight long-running migrations. The decision is to fail over with manual reconciliation of the migration-affected dataset.",
      expectedActions: [
        "IMT formally invokes failover decision and records it in the decision log",
        "Customer Ops Lead drafts holding-pattern customer message",
        "Begin DNS TTL reduction in case of further regional issues",
      ],
      objectives: [
        "Test decision-making under uncertainty",
        "Test decision-log discipline at speed",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CEO", "CRO"],
      ccRoleTitles: ["COO", "Comms Lead"],
    },
    {
      eventNo: 3,
      scheduledTime: "10:00",
      title: "Vendor cascade",
      description:
        "The firm's KYC provider (Onfido) and identity provider (Auth0) both announce degradation — they too run on eu-west-2. New customer onboarding is now fully halted. Existing customers can authenticate (Auth0 has cross-region failover) but signup is offline. The CCO needs to decide whether to allow degraded onboarding (manual KYC) or pause entirely.",
      expectedActions: [
        "Map full 3rd-party dependency footprint affected by the same region",
        "Decide onboarding pause vs degraded manual path",
        "Issue customer-facing comms acknowledging signup pause",
      ],
      objectives: [
        "Surface 4th-party concentration risk",
        "Test multi-vendor co-incident response",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CEO", "CCO", "Customer Ops Lead"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 4,
      scheduledTime: "15:00",
      isScheduled: false,
      title: "AWS partial recovery",
      description:
        "AWS announces partial recovery but warns of residual instability. The firm now has to decide whether to failback (back to eu-west-2) before US trading hours, or stay on eu-west-1 overnight. The decision intersects with treasury liquidity overnight requirements.",
      expectedActions: [
        "Failback decision tree exercised",
        "Treasury impact assessment captured",
        "PIR planning begins — 10 business days clock starts on closure",
      ],
      objectives: [
        "Test failback discipline (the often-skipped second half of failover)",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CRO", "Treasury Lead"],
      ccRoleTitles: ["CEO"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "08:45",
      summary: "Twitter storm",
      description:
        "A major fintech journalist tweets a screenshot of your mobile app returning a 502 error, asking 'Anyone else?'. The tweet has 1,200 retweets within 15 minutes. Other firms confirm they're also affected. Your CEO is unreachable (on a flight).",
      relation: "Tests comms playbook + delegated authority. Occurs after Event #2 failover decision.",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CCO"],
      ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 2,
      scheduledTime: "11:15",
      summary: "FCA pre-notification request",
      description:
        "FCA Operational Resilience desk emails asking for an early-warning impact assessment. They've seen the same outage affect multiple supervised firms and want a coordinated picture. Reply within 60 minutes is requested.",
      relation: "Tests regulator-facing pre-notification path and impact-assessment quality under time pressure.",
      senderRoleTitle: "Head of Compliance",
      toRoleTitles: ["CRO", "CEO"],
      ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Detection", text: "How quickly did your detection diverge from AWS's health dashboard, and what is your protocol when they disagree?" },
    { category: "Failover", text: "When was the last real-world failover drill, and what assumptions did it not test?" },
    { category: "Decision-making", text: "Who has standing authority to invoke a failover without convening the full IMT, and what's the time-bound trigger?" },
    { category: "4th-party", text: "Which of your vendors share the same hyperscaler / region as you, and how would you know they were also affected?" },
    { category: "Comms", text: "What does your customer message say while you're still uncertain about scope?" },
  ],
  debriefQuestions: [
    { category: "Detection", text: "Did internal observability fire before AWS's status page updated? If not, why?" },
    { category: "Failover", text: "Did the decision to fail over arrive before or after impact tolerance was breached?" },
    { category: "4th-party", text: "How complete is your map of 4th-party hyperscaler dependencies?" },
    { category: "PIR", text: "Has the failback been planned, or is the team treating partial AWS recovery as 'done'?" },
  ],
};
