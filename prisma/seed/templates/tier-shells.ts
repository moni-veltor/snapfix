// Tier-specific shell scenarios (rich metadata, minimal MSEL — admins extend).

import type { ScenarioTemplate } from "../types";

// ─── TIER 1 ──────────────────────────────────────────────────────────────────

export const tier1SwiftDisconnect: ScenarioTemplate = {
  slug: "tier1-swift-sanctions-disconnect",
  title: "SWIFT Sanctions-Driven Disconnect",
  category: "Geopolitical",
  tier: "TIER_1",
  firmProfile: "Global Universal Bank",
  background:
    "Geopolitical sanctions force the firm to disconnect from SWIFT in a particular sub-region, disrupting cross-border payment, securities and trade-finance flows. Tests sanctions-compliance integration with operations.",
  dDayDate: "2026-04-09T07:00:00Z",
  cause:
    "A new sanctions package requires immediate disconnection from SWIFT for transactions involving certain counterparties or jurisdictions. The firm has 24-48 hours to implement screening and disconnect arrangements.",
  impactNarrative:
    "Wholesale payment routes for affected jurisdictions are halted. Pending trade-finance transactions are stuck. Correspondent banking arrangements are reviewed. Clients in those jurisdictions cannot transact. Compliance and Operations must coordinate at speed under regulatory scrutiny.",
  characteristics: [
    "Slower onset (sanctions process has lead time).",
    "Regulatory complexity — multiple sanctions regimes (OFAC, EU, UK).",
    "Operational impact spans payments, trade finance, securities.",
    "Compliance-led — operations must execute compliance decisions.",
  ],
  assumptions: [
    "Sanctions are broad-based but not unprecedented.",
    "The firm has had partial pre-warning via diplomatic channels.",
  ],
  takeaways:
    "Russia 2022 sanctions: speed of SWIFT disconnection for selected Russian banks demonstrated how quickly correspondent-banking arrangements can be unwound. Tier-1 banks must integrate sanctions screening with operational decisioning at scale.",
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: false, dataIntegrity: false, thirdParty: true },
  events: [
    {
      eventNo: 1, scheduledTime: "07:00", title: "Sanctions package announced",
      description: "Treasury/FCO announces sanctions package effective 48 hours; affected counterparties and jurisdictions listed.",
      expectedActions: ["Activate Sanctions Major Incident", "Brief Compliance, Operations, Legal", "Identify affected client portfolios", "Begin disconnect planning"],
      objectives: ["Test sanctions-response activation"],
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CEO", "General Counsel", "Head of Operations"], ccRoleTitles: ["CRO"],
    },
  ],
};

export const tier1T1Settlement: ScenarioTemplate = {
  slug: "tier1-t1-settlement-failure",
  title: "T+1 Settlement Cycle Failure",
  category: "Third Party",
  tier: "TIER_1",
  firmProfile: "Global Universal Bank",
  background:
    "T+1 settlement cycle in US equities makes operational mistakes much more visible and consequential. A reconciliation failure or counterparty default causes a build-up of failed settlements with direct capital and liquidity implications.",
  dDayDate: "2026-06-26T16:00:00Z",
  cause:
    "A reconciliation issue between front-office and middle-office records, exacerbated by T+1 timing pressure, causes a multi-million-dollar fail-to-deliver across multiple counterparties.",
  impactNarrative:
    "DTCC reports rising fails. Cash and securities positions inconsistent across regional books. Margin calls trigger from CCPs. Counterparties demand immediate resolution. Funding costs spike for affected positions. Reputational damage with prime-brokerage clients.",
  characteristics: [
    "Rapid impact — T+1 leaves little time to fix.",
    "Multi-counterparty — issue spans many trading relationships.",
    "Capital implication — fails carry buy-in cost and reputational risk.",
  ],
  assumptions: [
    "Settlement systems are mostly functional but reconciliation logic flawed.",
    "DTCC SLA windows are firm.",
  ],
  takeaways:
    "Industry T+1 implementation (May 2024) demonstrated the challenges of compressed settlement timeframes. Pre-T+1 firms had ~12 hours' buffer for reconciliation; now have ~2.",
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: false, dataIntegrity: true, thirdParty: true },
  events: [
    {
      eventNo: 1, scheduledTime: "16:00", title: "DTCC fails alert",
      description: "DTCC reports the firm has a high fail rate on the day's settlement cycle. Initial investigation underway.",
      expectedActions: ["Activate settlement incident desk", "Engage CCP and counterparties", "Brief Treasury on capital impact"],
      objectives: ["Test T+1 incident response"],
      senderRoleTitle: "Head of Operations", toRoleTitles: ["CFO", "Head of Markets"], ccRoleTitles: ["CRO"],
    },
  ],
};

// ─── TIER 2 ──────────────────────────────────────────────────────────────────

export const tier2AppStoreDeplatform: ScenarioTemplate = {
  slug: "tier2-app-store-deplatform",
  title: "App Store Deplatforming",
  category: "Third Party",
  tier: "TIER_2",
  firmProfile: "Digital Challenger Bank",
  background:
    "Apple or Google notifies the firm that the app will be removed from their store due to a policy violation or unresolved issue. For a digital-first bank, this is existential — new-customer acquisition halts and existing customers cannot reinstall or update.",
  dDayDate: "2026-02-15T16:00:00Z",
  cause:
    "App Store policy violation (e.g. misleading marketing, third-party SDK that breaches privacy guidelines) triggers a 48-hour removal notice from Apple or Google.",
  impactNarrative:
    "Existing customers keep using the app on their phones, but the app cannot be reinstalled, updated, or downloaded by new users. New-customer acquisition stops. App-store reviews and search rankings are damaged long-term. Reputational risk if the reason becomes public.",
  characteristics: [
    "Existential for digital-first firms.",
    "Resolution timeline opaque — appeal processes notoriously slow.",
    "Operational and reputational dimensions.",
  ],
  assumptions: [
    "The firm has no PWA / web fallback that fully replicates app functionality.",
    "Existing customers retain access for now.",
  ],
  takeaways:
    "App-store policy decisions are largely outside the firm's control. Building a robust PWA fallback and maintaining direct customer-comms (email lists not dependent on push) provides resilience.",
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: false, dataIntegrity: false, thirdParty: true },
  events: [
    {
      eventNo: 1, scheduledTime: "16:00", title: "App Store removal notice received",
      description: "Apple sends a formal notice: the app will be removed in 48 hours unless the policy issue is resolved.",
      expectedActions: ["Activate App Store Incident", "Engage Apple Developer Relations", "Brief CEO and CMO", "Begin PWA contingency activation"],
      objectives: ["Test App Store incident response"],
      senderRoleTitle: "CTO", toRoleTitles: ["CEO", "CMO"], ccRoleTitles: ["CRO"],
    },
  ],
};

export const tier2OutsourcedKyc: ScenarioTemplate = {
  slug: "tier2-outsourced-kyc-failure",
  title: "Outsourced KYC Provider Failure",
  category: "Third Party",
  tier: "TIER_2",
  firmProfile: "Digital Challenger Bank",
  background:
    "The firm's sole outsourced KYC partner (e.g. Onfido, Trulioo, Jumio) experiences a multi-day outage or service degradation. New-customer onboarding halts; existing-customer enhanced-due-diligence reviews cannot complete.",
  dDayDate: "2026-09-10T09:00:00Z",
  cause:
    "KYC partner's facial-recognition / document-verification ML service experiences a major model failure, with verification times dropping to <30% accuracy and many false rejections.",
  impactNarrative:
    "New customer onboarding effectively halted. Existing customers needing re-verification (large transaction, suspicious activity) cannot complete it. Customer-acquisition pipeline backs up. AML monitoring compromised for unverified high-risk activity. FCA expects KYC controls to remain effective; partner outage is not an excuse.",
  characteristics: [
    "Rapid onset.",
    "Customer-acquisition and AML simultaneously impacted.",
    "Regulatory pressure — KYC failure is regulator priority.",
  ],
  assumptions: [
    "Single KYC partner; no fast-failover.",
    "Manual KYC capacity in-house is limited.",
  ],
  takeaways:
    "Single-vendor KYC concentration creates simultaneous AML and customer-acquisition risk. Tier 2 firms should consider manual fall-back capacity even if not regularly used.",
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: true, dataIntegrity: false, thirdParty: true },
  events: [
    {
      eventNo: 1, scheduledTime: "09:00", title: "KYC accuracy drops below threshold",
      description: "Internal monitoring shows KYC partner accuracy is collapsing. Manual override required for new customers.",
      expectedActions: ["Engage KYC partner", "Activate manual KYC capacity", "Brief Compliance and Customer Ops"],
      objectives: ["Test KYC vendor incident response"],
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CTO", "Customer Ops Lead"], ccRoleTitles: ["CRO"],
    },
  ],
};

// ─── TIER 3 ──────────────────────────────────────────────────────────────────

export const tier3KeyPerson: ScenarioTemplate = {
  slug: "tier3-key-person-loss",
  title: "Sole Key-Person Dependency Loss",
  category: "Other",
  tier: "TIER_3",
  firmProfile: "Small fintech / new bank",
  background:
    "The firm's sole technical or operational lead (e.g. CTO who built and operates the core platform, or sole compliance officer) becomes unavailable due to illness, departure, or family emergency. Tests resilience to single-person dependency typical of small firms.",
  dDayDate: "2026-07-13T08:00:00Z",
  cause:
    "Sole key person becomes unavailable indefinitely. May have left no documentation, no shared credentials in escrow, no backup operator trained on critical systems.",
  impactNarrative:
    "Critical operational decisions cannot be made. Production access for emergencies is unclear. Documentation is in the absent person's head. Routine operations continue for days/weeks but any incident requires the missing person. Customers cannot tell — until the next routine task breaks something.",
  characteristics: [
    "Slow-burn impact — appears manageable for days.",
    "Tail-risk realization — failure modes only emerge on next incident.",
    "Long resolution — replacement and knowledge transfer take weeks/months.",
  ],
  assumptions: [
    "No designated successor or documented runbooks.",
    "Some credentials only known to the missing person.",
  ],
  takeaways:
    "Small firms must invest in key-person documentation, credential escrow, and at-least-one-other-trained-operator long before they think they need to. The cost of doing this is small; the cost of not doing it can be the firm.",
  riskCoverage: { people: true, property: false, technology: true, dataAvailability: false, dataIntegrity: false, thirdParty: false },
  events: [
    {
      eventNo: 1, scheduledTime: "08:00", title: "Key person unavailable",
      description: "The firm's CTO has informed the CEO they will be unreachable indefinitely due to a family emergency. No formal handover prepared.",
      expectedActions: ["Activate Key-Person Incident", "Inventory critical knowledge held by the person", "Identify next-best-trained colleagues", "Plan urgent credential / access transfer"],
      objectives: ["Test key-person-loss response"],
      senderRoleTitle: "CEO", toRoleTitles: ["Head of Operations", "Head of Compliance"], ccRoleTitles: ["CRO"],
    },
  ],
};

export const tier3CapitalAdequacy: ScenarioTemplate = {
  slug: "tier3-capital-adequacy-concern",
  title: "Capital Adequacy Concern",
  category: "Other",
  tier: "TIER_3",
  firmProfile: "New bank / small financial firm",
  background:
    "PRA / FCA raises an immediate concern about the firm's capital adequacy or stress-test outcome and requests a written response within tight timelines. The firm must produce evidence, often under unexpected scrutiny that the leadership team has not faced at this depth before.",
  dDayDate: "2026-03-25T10:00:00Z",
  cause:
    "Routine regulatory review surfaces a previously-unspotted concern about the firm's capital position under stress conditions. Regulator requests a written response within 14 days and an immediate-action plan.",
  impactNarrative:
    "Leadership must produce credible response under pressure. May require additional capital injection, business-mix change, or immediate operational change. Knowledge of the concern in the firm spreads; key employees become anxious. Reputational risk if the concern becomes public.",
  characteristics: [
    "Confidential — initial concern not public.",
    "Resource-intensive — small firms struggle to staff regulator response.",
    "Existential potential — outcome may threaten the firm.",
  ],
  assumptions: [
    "Concern is genuine but resolvable with the right action.",
    "Firm has limited in-house capital-stress-modelling capability.",
  ],
  takeaways:
    "Tier 3 firms need credible relationships with PRA/FCA Supervision Leads, capital-planning capability, and a clear hierarchy of remediation actions ranging from minor adjustments to capital injection to business divestiture.",
  riskCoverage: { people: false, property: false, technology: false, dataAvailability: false, dataIntegrity: false, thirdParty: false },
  events: [
    {
      eventNo: 1, scheduledTime: "10:00", title: "Regulator letter received",
      description: "A confidential letter from the PRA raises a Capital Adequacy concern and requests a written response within 14 days plus an immediate-action plan.",
      expectedActions: ["Activate Regulator Major Concern protocol", "Brief board chair confidentially", "Engage external counsel and capital advisors", "Begin response drafting"],
      objectives: ["Test confidential regulator-concern response"],
      senderRoleTitle: "CRO", toRoleTitles: ["CEO", "CFO", "Chair"], ccRoleTitles: ["General Counsel"],
    },
  ],
};

export const allTierShells: ScenarioTemplate[] = [
  tier1SwiftDisconnect,
  tier1T1Settlement,
  tier2AppStoreDeplatform,
  tier2OutsourcedKyc,
  tier3KeyPerson,
  tier3CapitalAdequacy,
];
