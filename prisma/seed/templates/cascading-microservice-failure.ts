import type { ScenarioTemplate } from "../types";

export const cascadingMicroserviceFailure: ScenarioTemplate = {
  slug: "cascading-microservice-failure",
  title: "Cascading Microservice Failure (Thundering Herd)",
  category: "Cloud & Infrastructure",
  srrRef: "3.2",
  background:
    "A momentary blip in the identity service triggers an auth-token refresh storm. Downstream services see retries pile up, connection pools exhaust, and the failure cascades across 14 microservices in under 4 minutes. Each individual service's auto-scaler is doing its job — but together they form a thundering herd that takes down the platform.",
  agenda:
    "10:00 First-line on-call sees authentication 5xx\n10:05 Cascade begins\n10:15 Circuit breakers trip\n10:30 Decision: shed load or restart all?\n11:30 Phased recovery\n13:00 Backlog processing",
  dDayDate: "2026-09-22T10:00:00Z",
  durationMin: 150,
  cause:
    "A 30-second TLS handshake stall in the identity service causes every downstream service to retry token validation. Retries are exponential-backoff but the jitter is poorly tuned and all services synchronise. Connection pools to the identity service exhaust. Auto-scalers add more instances which all hit the same overloaded backend. The pattern crosses 14 services within 4 minutes.",
  impactNarrative:
    "Mobile login fails for 70% of customers. Card auth flows that depend on identity-service-backed step-up fall back to risk-based decisions that silently approve high-value transactions. The payments service queues fill; outbound payment latency rises from 200ms to 90s. Customer service Salesforce instance also auths through the identity service and starts failing — agents cannot see customer records.",
  characteristics: [
    "Triggered by a small fault that amplifies — not a single service failure but coupled system behaviour.",
    "Auto-scaling makes it worse, not better — more replicas pile onto an already-saturated dependency.",
    "Operationally invisible — each service's logs say 'transient error, retrying' until it falls over.",
    "Recovery is non-trivial — you can't just restart; the retry storm restarts with it.",
  ],
  assumptions: [
    "Identity service is the shared dependency across all microservices for authn/authz.",
    "Circuit breakers exist but trip thresholds are tuned per-service, not for systemic load.",
    "There is no global load-shedding control surface — each service decides independently.",
  ],
  takeaways:
    "Coupled failures don't show up in single-service drills. Test thundering-herd patterns explicitly: simulate a transient blip on a shared dependency and watch what your retry / backoff configuration actually does. Jitter is not optional.",
  stressVariables: [
    { name: "Cascade scope", options: ["3 services", "8 services", "14 services", "All"] },
    { name: "Recovery approach", options: ["Sequential restart", "Load shedding", "Coordinated drain & restart", "Region failover"] },
  ],
  caseStudy: {
    title: "Slack — January 2021 outage",
    causation:
      "A network configuration change caused a cascading load problem across Slack's services. Auto-scalers triggered the addition of more instances which compounded the load on already-saturated dependencies.",
    impactScale:
      "Slack was largely unavailable for hours. Millions of users globally were unable to access the service during peak European start-of-day hours.",
    duration: "Approximately 4 hours of significant degradation; long tail of backlog processing.",
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
    { code: "IBS_01", name: "Customer authentication", description: "Mobile / web / agent authn.", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Card transactions", description: "Real-time card authorisation.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Payments (Faster Payments)", description: "Same-day GBP send/receive.", impactToleranceMin: 120, criticality: "CRITICAL" },
    { code: "IBS_04", name: "Customer support tooling", description: "Salesforce agent console.", impactToleranceMin: 240, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "10:00",
      title: "Identity service latency spike",
      description:
        "Identity service p99 latency rises from 80ms to 8s for ~30 seconds. The on-call SRE clicks the alert and sees the spike has resolved. They tag it 'transient' and stand down. Five minutes later, the dashboards turn red across 12 unrelated services.",
      expectedActions: [
        "Recognise the pattern as a cascade rather than 12 separate incidents",
        "Avoid the temptation to restart everything",
      ],
      objectives: ["Test pattern recognition vs blunt response"],
      senderRoleTitle: "Sn.TPM",
      toRoleTitles: ["CTO", "ISM"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 2,
      scheduledTime: "10:15",
      title: "Circuit breakers trip — but the wrong ones",
      description:
        "Per-service circuit breakers trip but the configuration assumed each breaker was the last line of defence. With 14 breakers tripping simultaneously, the service mesh now refuses 100% of inter-service traffic and the platform is fully down. Restoration requires manual breaker reset in dependency order — which is not documented.",
      expectedActions: [
        "Reconstruct dependency order from architecture diagram",
        "Decide: full mesh disable + restart, or sequential breaker reset",
      ],
      objectives: ["Stress the dependency-order documentation"],
      senderRoleTitle: "Sn.TPM",
      toRoleTitles: ["CTO"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 3,
      scheduledTime: "11:30",
      title: "Backlog processing creates a second wave",
      description:
        "Services come back. The payments queue contains 90 minutes of stalled outbound payments. The queue drains aggressively, generating the same load profile that triggered the initial cascade. The second wave is shallower but causes a 20-minute degradation as backlog drains.",
      expectedActions: ["Throttle backlog processing", "Communicate delays to customer service team"],
      objectives: ["Test backlog-aware recovery"],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Sn.TPM"],
      ccRoleTitles: ["Customer Ops Lead"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "10:20",
      summary: "Auto-payment failures hit treasury",
      description:
        "Treasury's automated overnight settlement processes start failing because they depend on the same identity service. Settlement window is in 2 hours; treasury needs to know whether to proceed manually or wait.",
      senderRoleTitle: "Treasury Lead",
      toRoleTitles: ["CFO", "CTO"],
      ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 2,
      scheduledTime: "11:00",
      summary: "Auto-approved high-value transaction flagged",
      description:
        "A £180k outbound transfer auto-approved during the cascade is now flagged by post-hoc fraud review. It looks legitimate but the risk-engine downgrade left it un-stepped-up. Reverse the transaction or accept the risk?",
      senderRoleTitle: "CRO",
      toRoleTitles: ["CEO", "Head of Compliance"],
      ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Detection", text: "When does a momentary blip on a shared dependency become an incident, and who decides?" },
    { category: "Architecture", text: "Have you tested cascading-failure scenarios in production-like load tests?" },
    { category: "Recovery", text: "What's your dependency-aware restart order, and is it documented somewhere a stressed on-call can read?" },
  ],
  debriefQuestions: [
    { category: "Detection", text: "Could the cascade have been spotted before customer-facing impact?" },
    { category: "Recovery", text: "Was the recovery faster than the cascade?" },
    { category: "Architecture", text: "What architectural changes would reduce coupling here?" },
  ],
};
