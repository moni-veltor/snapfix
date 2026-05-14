import type { ScenarioTemplate } from "../types";

export const certificateExpiry: ScenarioTemplate = {
  slug: "certificate-expiry",
  title: "Production Certificate Expiry — Internal mTLS",
  category: "Cloud & Infrastructure",
  srrRef: "3.2",
  background:
    "An internal certificate authority's root certificate — the trust anchor for all internal service-to-service mTLS — expires at 03:14 on a Saturday. Service-to-service auth begins failing within minutes. The team rotating the CA forgot one downstream dependency. The fix requires re-issuance, redistribution, and rolling restarts across the production estate.",
  agenda:
    "03:14 Cert expires\n03:30 First alerts\n04:30 IMT convened\n06:00 New cert issued\n09:00 Phased rolling restart\n12:00 Mobile app recovery",
  dDayDate: "2026-04-11T03:14:00Z",
  durationMin: 120,
  cause:
    "An internal CA root certificate, set to a 5-year validity in 2021, expires. The renewal process was scheduled by the previous platform team but ownership transferred in a re-org. The new owner inherited the calendar reminder but it was filed under 'low priority — long lead time' and never re-prioritised.",
  impactNarrative:
    "Service-to-service TLS handshakes start failing. Customer-facing impact lags — most short-lived TLS sessions complete OK initially. After 30 minutes, services re-establishing connections start failing. By 04:30, mobile banking returns 503 for 90% of requests. The fix is conceptually trivial (re-issue + push the cert) but the push mechanism itself uses mTLS through the now-expired CA.",
  characteristics: [
    "Predictable but missed — certificates have known expiry dates.",
    "Weekend onset — minimum staffing.",
    "Recovery requires the very system that's broken — bootstrap problem.",
    "Long tail — every service must restart in dependency order.",
  ],
  assumptions: [
    "There is one root CA covering all internal mTLS in production.",
    "The deployment system uses mTLS auth, so cannot push a new cert until itself patched.",
    "Some long-running stateful services (databases) can't be restarted without coordination.",
  ],
  takeaways:
    "Certificate expiry is the most preventable major outage in modern systems. Automated alerts at 90 / 60 / 30 / 7 / 1 days before expiry are the minimum bar. Bootstrap-style dependencies (the cert-distributor needs the cert) need a documented break-glass.",
  stressVariables: [
    { name: "Cert ownership clarity", options: ["Clear, automated", "Documented but stale", "Tribal knowledge", "Unknown"] },
    { name: "Break-glass for redistribution", options: ["Tested in last 6 months", "Documented only", "Doesn't exist"] },
  ],
  caseStudy: {
    title: "Microsoft Azure — Multi-Factor Auth outage (November 2018)",
    causation:
      "An expired internal certificate prevented Azure MFA from completing authentication requests. Multiple Microsoft properties and customer Azure tenants were affected.",
    impactScale:
      "Customers worldwide could not sign in to Microsoft 365, Azure portal and other dependent services. Estimated tens of millions of users affected.",
    duration: "Several hours of full unavailability; rolling recovery over a longer window.",
  },
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: true,
    dataIntegrity: false,
    thirdParty: false,
  },

  ibsList: [
    { code: "IBS_01", name: "Mobile and online banking", description: "Customer authenticated channels.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Card authorisation", description: "Card auth real-time path.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Payments (Faster Payments)", description: "Domestic payments.", impactToleranceMin: 120, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "03:30",
      title: "First service-to-service TLS failures",
      description:
        "Pager fires: payments service can't talk to ledger. On-call SRE checks; sees TLS handshake failures. Spot-checks another service — also failing. Realises the common factor is internal mTLS. Begins to enumerate the failure pattern and pings the platform team Slack channel — which goes unread because it's 3am Saturday.",
      expectedActions: [
        "Reach platform on-call out-of-hours",
        "Confirm: is this a single service or the whole estate?",
      ],
      objectives: ["Test out-of-hours escalation"],
      senderRoleTitle: "Sn.TPM",
      toRoleTitles: ["CTO", "ISM"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 2,
      scheduledTime: "04:30",
      title: "Root cert expiry confirmed",
      description:
        "Platform on-call confirms the root CA expired 76 minutes ago. They have the procedure to issue a new one. But the certificate-distribution pipeline itself uses mTLS — so they can't push it. They have a documented break-glass path using SSH and a manually-deployed bootstrap cert, but it hasn't been exercised in 18 months.",
      expectedActions: [
        "Invoke the break-glass certificate-distribution path",
        "Communicate ETA to customer service",
      ],
      objectives: ["Test break-glass documentation"],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CEO", "CRO"],
      ccRoleTitles: ["COO"],
    },
    {
      eventNo: 3,
      scheduledTime: "09:00",
      title: "Phased rolling restart",
      description:
        "New cert distributed by 06:00. Services need rolling restart to pick it up. Sequence matters: identity service first, then ledger, then payments, then the customer-facing tier. Mobile app starts recovering at 09:00, six hours after first impact.",
      expectedActions: ["Track restart progress and communicate", "Schedule failback validation"],
      objectives: ["Test dependency-aware rolling restart"],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Customer Ops Lead"],
      ccRoleTitles: ["CRO"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "06:00",
      summary: "FCA notification trigger reached",
      description:
        "Impact tolerance for mobile / online banking (60 min) is comfortably breached. SUP 15A notification threshold considered. Compliance team paged out-of-hours.",
      senderRoleTitle: "Head of Compliance",
      toRoleTitles: ["CRO"],
      ccRoleTitles: ["CEO"],
    },
    {
      injectNo: 2,
      scheduledTime: "07:30",
      summary: "Press call",
      description:
        "A financial-press journalist calls the on-call media line asking about reports of weekend service degradation. The story will run; you can comment or no-comment.",
      senderRoleTitle: "Head of External Affairs",
      toRoleTitles: ["CCO", "Comms Lead"],
      ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Detection", text: "Do you have alerts at 90/60/30/7/1 days before every production certificate expiry?" },
    { category: "Break-glass", text: "When was the certificate redistribution break-glass last exercised?" },
    { category: "Out-of-hours", text: "What does your weekend escalation actually look like at 3am?" },
  ],
  debriefQuestions: [
    { category: "Prevention", text: "What systemic change would prevent this category of outage?" },
    { category: "Recovery", text: "Were break-glass paths usable in the moment?" },
  ],
};
