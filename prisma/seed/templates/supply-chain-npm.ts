import type { ScenarioTemplate } from "../types";

export const supplyChainNpm: ScenarioTemplate = {
  slug: "supply-chain-npm",
  title: "Supply-Chain Compromise — npm Package Hijack",
  category: "Technology & Data (Cyber)",
  srrRef: "3.1, 3.4",
  background:
    "A widely-used npm package — a transitive dependency of your mobile-app analytics SDK — is hijacked. The attacker pushes a malicious version 8.4.3 with code that exfiltrates the user's mobile device-id, IP and (where granted) location to an attacker-controlled endpoint. Your build pipeline auto-bumps minor versions; the bad version is in production within 6 hours of release.",
  agenda: "06:00 npm package compromised\n12:00 Your CI picks up the new version\n18:00 Deployed to production\n09:00 next day Researcher tweets the IoC\n09:30 You confirm exposure",
  dDayDate: "2026-06-23T09:30:00Z",
  durationMin: 180,
  cause:
    "An npm package maintainer's account is compromised via a credential stuffed from a separate breach. The attacker publishes a patch-version with the malicious payload. The payload is obfuscated and runs only on production-typed environments to evade developer-laptop testing.",
  impactNarrative:
    "Approximately 1.2 million mobile-app sessions in the last 36 hours have shipped device identifiers and IP addresses to the attacker. No banking credentials or financial data leak (the SDK doesn't have access) but GDPR personal data is involved. Detection comes from an external security researcher posting on Twitter. Your team confirms via build-log forensics that the bad version is in your shipped iOS and Android binaries.",
  characteristics: [
    "Vendor supply chain — your dependency's dependency.",
    "Lag between compromise and detection — 6 to 30+ hours typical.",
    "GDPR breach by default — personal data exfiltrated, even if not financial.",
    "App-store rollback path is slow (review queues).",
  ],
  assumptions: [
    "Build pipeline auto-bumps semver minor/patch versions.",
    "Mobile binaries pin some, but not all, transitive dependencies.",
    "ICO notification clock starts at confirmed breach awareness.",
  ],
  takeaways:
    "Supply-chain attacks are now routine, not exotic. Dependency pinning, automated SBOM scanning, and verifying maintainer identity for production-critical packages are the cost of doing business. App-store rollback isn't a recovery plan — it's a wish.",
  stressVariables: [
    { name: "Data sensitivity exfiltrated", options: ["Device IDs only", "Device + IP", "Device + IP + location", "Auth tokens"] },
    { name: "Notification clock", options: ["GDPR 72h", "FCA SUP 15A", "Both"] },
  ],
  caseStudy: {
    title: "event-stream npm hijack (November 2018)",
    causation:
      "A maintainer transferred the popular `event-stream` npm package to an attacker who appeared as a willing contributor. Within months, the attacker pushed a malicious dependency targeting Bitcoin wallet libraries.",
    impactScale:
      "Two million weekly downloads of event-stream meant the malicious code was widely distributed. The targeted Bitcoin wallet was the primary direct victim but downstream risk was much wider.",
    duration: "Approximately 2 months between malicious version publish and discovery.",
  },
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: false,
    dataIntegrity: true,
    thirdParty: true,
  },

  ibsList: [
    { code: "IBS_01", name: "Mobile banking app", description: "Customer-facing mobile channel.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Customer data integrity", description: "Personal-data confidentiality.", impactToleranceMin: 60, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "09:30",
      title: "External tip-off",
      description:
        "Security researcher posts on Twitter naming the malicious npm package version. Your team identifies the package in your dependency tree. ISM begins forensic timeline assembly: when did the bad version enter your build, and when did it hit customer devices?",
      expectedActions: ["Confirm dependency presence", "Assemble timeline", "Engage privacy team for ICO notification"],
      objectives: ["Test forensic timeline-building"],
      senderRoleTitle: "ISM",
      toRoleTitles: ["CTO", "CRO"],
      ccRoleTitles: ["Head of Compliance"],
    },
    {
      eventNo: 2,
      scheduledTime: "11:00",
      title: "GDPR notification trigger",
      description:
        "Privacy team confirms: personal data left customer devices via the malicious SDK. GDPR 72-hour clock starts. Decision: pre-notify ICO before full forensics are complete, or wait until you have the full picture? FCA notification also triggered for operational resilience reasons.",
      expectedActions: ["Decide ICO and FCA notification timing", "Brief CEO and Board"],
      objectives: ["Test dual-regulator notification under uncertainty"],
      senderRoleTitle: "Head of Compliance",
      toRoleTitles: ["CRO", "CEO"],
      ccRoleTitles: [],
    },
    {
      eventNo: 3,
      scheduledTime: "14:00",
      title: "App-store rollback delays",
      description:
        "Mobile team pushes a clean version to the app stores. Apple review queue is 24 hours; Google is 12. Some customers will still have the malicious version for at least a day.",
      expectedActions: ["Force in-app update", "Push customer-comms in app banner"],
      objectives: ["Test the customer-comms muscle for 'don't trust the app you have'"],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CCO", "Comms Lead"],
      ccRoleTitles: ["CEO"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "12:30",
      summary: "Class action lawyer makes contact",
      description:
        "A claims-management law firm emails offering to 'represent affected customers'. They claim to have already lined up 200 customers willing to sue. The email is also CC'd to a journalist.",
      senderRoleTitle: "Head of Compliance",
      toRoleTitles: ["CRO", "CEO"],
      ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Supply chain", text: "Do you have an SBOM for your production mobile binaries, and is it updated automatically?" },
    { category: "Dependency policy", text: "What's your policy for auto-bumping dependency versions vs pinning?" },
    { category: "Notification", text: "Can your privacy and operational-resilience teams jointly run a dual-regulator clock?" },
  ],
  debriefQuestions: [
    { category: "Detection", text: "Did you detect via your own controls or via external tip-off?" },
    { category: "Customer comms", text: "Were customers told before journalists picked it up?" },
  ],
};
