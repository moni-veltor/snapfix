import type { ScenarioTemplate } from "../types";

export const ddosAuth: ScenarioTemplate = {
  slug: "ddos-auth",
  title: "DDoS Storm on Customer Authentication",
  category: "Technology & Data (Cyber)",
  srrRef: "3.1",
  background:
    "A coordinated layer-7 DDoS hits the customer login endpoint at 09:00 on Monday — peak login time. Traffic is shaped to look like legitimate retail customer logins, defeating naive rate-limit rules. The DDoS protection vendor's mitigation engages but with 8 minutes of leakage. During that window, the auth backend exhausts connection pools and legitimate customers are unable to log in for 40 minutes.",
  agenda: "09:00 Attack begins\n09:08 DDoS vendor engages\n09:30 IMT convened\n11:00 Auth stable\n12:00 Comms close-out",
  dDayDate: "2026-05-11T09:00:00Z",
  durationMin: 120,
  cause:
    "A botnet of 35,000 residential IPs (mostly compromised IoT devices) submits POST requests to /login with realistic-looking but invalid credentials. Each request reaches the auth backend, occupies a connection for ~1.2 seconds while bcrypt comparison runs, then returns 401. Volume is 14,000 RPS sustained for 18 minutes.",
  impactNarrative:
    "Login API p99 latency spikes from 180ms to 14s. Auth backend connection pool exhausts at 09:04. Legitimate customers see 'service unavailable' from the mobile app. The mobile app's aggressive retry logic compounds the issue. Card auth is unaffected (different path) but customer service is hit hard by login complaints. Status page is updated at 09:22, after the social media wave has already started.",
  characteristics: [
    "Targeted — specifically attacks the most-resource-intensive endpoint (login).",
    "Polymorphic — traffic shape evolves to defeat each new rule.",
    "Peak-time — designed to coincide with maximum legitimate volume.",
    "Reputation-poisoning — visible to customers, generates social-media noise.",
  ],
  assumptions: [
    "DDoS protection is in place but tuned for volumetric attacks, not credential stuffing.",
    "Login endpoint uses bcrypt with cost factor 12 — slow on purpose.",
    "Mobile app retries aggressively on auth failures.",
  ],
  takeaways:
    "Modern DDoS targets compute-bound endpoints, not just bandwidth. Defence requires bot-detection and aggressive shaping at the edge — not just a CDN. Aggressive client retry logic is your enemy.",
  stressVariables: [
    { name: "Attack pattern", options: ["Volumetric L4", "L7 credential stuffing", "API resource exhaustion", "Polymorphic"] },
    { name: "Mitigation lead time", options: ["Automated <2min", "Manual ~10min", "Manual >30min"] },
  ],
  caseStudy: {
    title: "GitHub — 1.35 Tbps memcached DDoS (February 2018)",
    causation:
      "GitHub absorbed a 1.35 Tbps reflection attack via misconfigured memcached servers. The attack was the largest DDoS recorded at that time.",
    impactScale: "GitHub.com was intermittently unavailable for approximately 10 minutes.",
    duration: "10 minutes of impact; tail of degraded service for the next hour.",
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
    { code: "IBS_01", name: "Customer authentication", description: "Login flow.", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Mobile and online banking", description: "Authenticated channels.", impactToleranceMin: 60, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "09:00",
      title: "Attack begins",
      description:
        "Login error rate jumps from 0.4% to 87% in 90 seconds. DDoS protection raises a 'suspicious traffic' alert but doesn't auto-block. The on-call team must decide whether to engage the manual escalation path with the DDoS vendor.",
      expectedActions: ["Engage DDoS vendor on-call", "Begin emergency shaping rules"],
      objectives: ["Test attack recognition speed"],
      senderRoleTitle: "ISM",
      toRoleTitles: ["CTO"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 2,
      scheduledTime: "09:30",
      title: "Mobile app retry storm",
      description:
        "Mobile app's exponential-backoff retry isn't well jittered; all clients retry on the same schedule. Even with the bot traffic mostly blocked, legitimate retry traffic is now flooding the auth backend.",
      expectedActions: ["Push a config update to mobile app to lengthen retry intervals", "Communicate via app banner that login will recover shortly"],
      objectives: ["Recognise the customer-induced second wave"],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Comms Lead"],
      ccRoleTitles: ["Customer Ops Lead"],
    },
    {
      eventNo: 3,
      scheduledTime: "10:30",
      title: "Auth stable, status page lagging",
      description:
        "Auth is stable. The status page hasn't been updated since 09:22 because the status-page team is dependent on the same identity provider for write access. They've been locked out of their own status page for an hour.",
      expectedActions: ["Backup channel for status updates", "Update customers via app banner instead"],
      objectives: ["Notice the status-page bootstrap problem"],
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CCO"],
      ccRoleTitles: ["CTO"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "09:45",
      summary: "Twitter sentiment turns",
      description:
        "Multiple customer-tweets pile up. A consumer-finance journalist with 80k followers posts 'looks like another login outage'. Sentiment is sharper than usual because it's Monday morning and people have payments to make.",
      senderRoleTitle: "Head of External Affairs",
      toRoleTitles: ["CCO", "Comms Lead"],
      ccRoleTitles: ["CEO"],
    },
  ],

  facilitatorQuestions: [
    { category: "DDoS readiness", text: "When was your last red-team DDoS exercise, and did it test L7 patterns or just L4 volumetric?" },
    { category: "Mobile retry", text: "Have you reviewed mobile-client retry logic for unintended thundering-herd?" },
  ],
  debriefQuestions: [
    { category: "Detection", text: "Was the attack recognised as an attack, or initially treated as a bug?" },
    { category: "Customer comms", text: "Did customers hear from you before social media did?" },
  ],
};
