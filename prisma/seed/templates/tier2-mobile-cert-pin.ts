import type { ScenarioTemplate } from "../types";

export const tier2MobileCertPin: ScenarioTemplate = {
  slug: "tier2-mobile-cert-pin",
  title: "Mobile App Cert-Pin Failure After Upstream Rotation",
  category: "Cloud & Infrastructure",
  tier: "TIER_2",
  srrRef: "3.2",
  firmProfile: "Digital challenger / mobile-first fintech",
  background:
    "Your mobile API switches its TLS certificate from an old CA to a new one as part of routine rotation. Older app versions (pre-v8.2.0) still trust both. The latest app version (v8.4.0, shipped 4 days ago to 60% of users by phased rollout) has the old CA's pin removed in error. After cert rotation, those users see immediate login failures. App-store fix is at least 12 hours away because of review queues.",
  agenda: "07:00 Cert rotation\n07:05 Newest users locked out\n07:30 Pattern recognised\n09:00 Emergency rollback decision\n12:00 App-store fix submitted",
  dDayDate: "2026-10-22T07:00:00Z",
  durationMin: 180,
  cause:
    "The mobile team removed the legacy CA pin from the v8.4 build, assuming the rotation had already taken effect. They were wrong by 4 days. The cert rotation runbook didn't cross-reference the mobile-pin list.",
  impactNarrative:
    "Approximately 600k customers running v8.4.0 (60% rollout) cannot complete TLS handshake to the mobile API. They see 'unable to connect — please try later'. Web banking works. Older app versions still work. The newest users — typically your most engaged customers — are the ones locked out. Force-update flag exists but pushing it now would just send users to v8.4.0, which is broken.",
  characteristics: [
    "Newest, most-engaged users hit hardest.",
    "Reversal is slow — app-store review queues.",
    "Documentation gap (cert rotation runbook ↔ mobile pin list).",
    "Customer-facing error message is uninformative.",
  ],
  assumptions: [
    "Mobile rollout is phased to 60% of users on v8.4.0.",
    "App-store emergency review takes 4-12 hours.",
    "Web banking remains a viable fallback channel.",
  ],
  takeaways:
    "Certificate-pinning and cert rotation are two systems that must be co-owned. A 'who knows the pin list' question should never arise in production. Treat the mobile binary as a runtime dependency that's slow to patch — your runbook timings should reflect that.",
  stressVariables: [
    { name: "App-version distribution", options: ["100% on bad version", "60%", "20%", "10%"] },
    { name: "App-store turnaround", options: ["2h emergency", "12h", "48h"] },
  ],
  caseStudy: {
    title: "Let's Encrypt root expiry — September 2021",
    causation:
      "Let's Encrypt's old IdenTrust DST Root CA X3 expired. Many older Android devices and other clients with hardcoded trust to that root could no longer validate Let's Encrypt-issued certificates.",
    impactScale: "Significant numbers of older Android devices, smart TVs, IoT devices and macOS pre-10.12.1 saw TLS failures across many services.",
    duration: "Several days of degraded service for affected clients; long tail.",
  },
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: true, dataIntegrity: false, thirdParty: false },

  ibsList: [
    { code: "IBS_01", name: "Mobile banking", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Customer authentication", impactToleranceMin: 30, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1, scheduledTime: "07:05",
      title: "Login failure spike",
      description:
        "Mobile login error rate jumps from 0.3% to 38% in 90 seconds. Engineering checks: TLS handshake failures. Web banking is unaffected. Customer service starts receiving calls within 10 minutes.",
      expectedActions: ["Identify which app versions are affected", "Page mobile + platform on-call"],
      objectives: ["Test pattern recognition under panic"],
      senderRoleTitle: "ISM", toRoleTitles: ["CTO", "Sn.TPM"], ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 2, scheduledTime: "07:45",
      title: "Root cause identified — mobile cert pin gap",
      description:
        "Engineering correlates: the failed cert in handshakes is your new CA. Older app versions still trust the previous CA. v8.4.0 removed the old pin prematurely. App-store hotfix is the only path to recovery for newest users.",
      expectedActions: ["Submit emergency app-store review", "Push a force-update gate on v8.4.0 once a fix is approved"],
      objectives: ["Test emergency app-store workflow"],
      senderRoleTitle: "CTO", toRoleTitles: ["CEO", "CCO"], ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 3, scheduledTime: "09:00",
      title: "Comms cascade — direct customers to web banking",
      description:
        "CCO approves a customer-comms wave: in-app banner (for those who can load anything), email, SMS to all v8.4.0 users telling them to use web banking temporarily. The email-team realises 60% of v8.4.0 users have only ever used the app.",
      expectedActions: ["Deploy in-app banner", "Email + SMS cascade"],
      objectives: ["Test multi-channel fallback comms"],
      senderRoleTitle: "CCO", toRoleTitles: ["Comms Lead", "Customer Ops Lead"], ccRoleTitles: ["CEO"],
    },
    {
      eventNo: 4, scheduledTime: "12:00",
      title: "App-store fix submitted, awaiting review",
      description:
        "Hotfix submitted to Apple + Google. Apple says ~6 hours. Google says ~2 hours. Customers still can't log in to the app for several more hours.",
      expectedActions: ["Decide whether to compensate affected customers", "Plan PIR — 10 business day clock"],
      objectives: ["Test long-tail recovery planning"],
      senderRoleTitle: "CTO", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: ["Head of Compliance"],
    },
  ],

  injects: [
    {
      injectNo: 1, scheduledTime: "07:08", kind: "TECHNICAL",
      summary: "CloudWatch: TLS handshake error rate spike",
      description:
        "CloudWatch alarm fires: 'mobile-api-tls-handshake-errors' has crossed 5% threshold. ssl_handshake_failed events are spiking. Affected client User-Agent strings cluster on 'YourBank/8.4.0'.",
      relation: "First-line technical signal. Tests observability + log-cluster diagnosis speed.",
      senderRoleTitle: "ISM", toRoleTitles: ["Sn.TPM"], ccRoleTitles: ["CTO"],
    },
    {
      injectNo: 2, scheduledTime: "07:20", kind: "TECHNICAL",
      summary: "App-version analytics: 600k users on v8.4.0",
      description:
        "Mixpanel / your app analytics reveals 600k+ active users on v8.4.0 in the last 7 days. They represent ~60% of MAU. v8.4.0 was published 4 days ago via phased rollout.",
      relation: "Quantifies blast radius.",
      senderRoleTitle: "Sn. DA/E", toRoleTitles: ["CTO", "Customer Ops Lead"], ccRoleTitles: [],
    },
    {
      injectNo: 3, scheduledTime: "08:30", kind: "BUSINESS",
      summary: "Press desk fielding calls",
      description:
        "The financial tech press has noticed customer complaints. Three publications are asking for comment by 11:00 deadline. The CEO is in a board meeting until 11:30.",
      relation: "Tests delegated press authority.",
      senderRoleTitle: "Head of External Affairs", toRoleTitles: ["CCO"], ccRoleTitles: ["CEO"],
    },
    {
      injectNo: 4, scheduledTime: "10:00", kind: "BUSINESS",
      summary: "App-store reviews tanking",
      description:
        "Within hours, App Store rating drops from 4.7 to 3.9 with 800+ new 1-star reviews. Many cite 'I can't log in' as the reason. These reviews persist long after the fix.",
      relation: "Tests post-incident-recovery reputational work, not just technical.",
      senderRoleTitle: "Customer Ops Lead", toRoleTitles: ["CCO"], ccRoleTitles: ["CEO"],
    },
    {
      injectNo: 5, scheduledTime: "10:30", kind: "TECHNICAL",
      summary: "Datadog: web-banking traffic 4× normal",
      description:
        "As customers reroute to web banking, web-banking infra sees 4× normal traffic. Auto-scaling kicks in but Datadog flags the rate of new pods spawning is unusually high — risk of hitting account-level quota limits.",
      relation: "Adds a secondary technical pressure — failover channels can themselves fail.",
      senderRoleTitle: "Sn.TPM", toRoleTitles: ["CTO"], ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Process", text: "Who owns the cross-reference between cert rotation and mobile cert pins, and is that documented?" },
    { category: "Fallback", text: "When mobile is down, what's the customer-facing fallback story, and have you load-tested it?" },
    { category: "Comms", text: "If you can't reach 60% of customers via the app, what channel reaches them?" },
  ],
  debriefQuestions: [
    { category: "Recovery", text: "Did the app-store path beat or miss your expected RTO?" },
    { category: "Reputation", text: "What's the plan for the App Store rating after recovery?" },
  ],
};
