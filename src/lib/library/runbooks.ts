import type { FirmTier, RunbookCategory, RunbookStepKind } from "@/generated/prisma/enums";

/**
 * Tier applicability presets. Runbook templates are tagged with the firm
 * tiers they apply to so /runbooks can filter the library to "what's
 * relevant for our tier" without hiding anything from curious admins.
 *
 * - ALL_TIERS  → universally applicable (cyber, outage, BCP, comms…)
 * - BANKS      → bank-authorised firms only (TIER_1 G-SIB + TIER_2 challenger)
 * - GSIB       → systemically important banks only (TIER_1)
 */
const ALL_TIERS: readonly FirmTier[] = ["TIER_1", "TIER_2", "TIER_3"] as const;
const BANKS: readonly FirmTier[] = ["TIER_1", "TIER_2"] as const;
const GSIB: readonly FirmTier[] = ["TIER_1"] as const;

/**
 * Best-practice runbook templates seeded into the library. An org admin
 * clones a template into their org from /runbooks → "Add from library".
 *
 * Each step has an owner role and an estimated duration. The owner roles
 * are written as plain abbreviations (CEO/CRO/CTO/COO/Head of Comms/…)
 * so they match the firm's role catalogue without forcing a fixed enum.
 */

export type LibraryRunbookStep = {
  /** Stable slug; only used to cross-reference dependsOn within a template. */
  slug: string;
  title: string;
  description: string;
  kind: RunbookStepKind;
  ownerRoleTitle: string;
  estimatedMin: number;
  successCriteria?: string;
  /** Earlier-slug list — server resolves these to orderIdx on clone. */
  dependsOn?: string[];

  /** DECISION step extras. */
  decisionTypeCode?: string;
  /** NOTIFICATION step extras. */
  regulatorTrigger?: {
    regulator: "FCA" | "PRA" | "ICO" | "BANK_OF_ENGLAND" | "OTHER";
    slaHours: number;
    trigger: "POST_INVOCATION" | "POST_AWARENESS";
  };
  /** COMMS step extras. */
  commsTemplate?: {
    stakeholder: string;
    subject: string;
    bodyTemplate: string;
  };
};

/** Escalation declared on a library template. Resolved to a real
 *  RunbookEscalation row at clone time if the target slug also exists in
 *  the org's catalogue. */
export type LibraryRunbookEscalation = {
  /** Slug of another LibraryRunbook entry. */
  targetSlug: string;
  /** Severity gate for the escalation ("LOW"|…|"CRITICAL"). */
  severityAtLeast?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  /** Short reason — e.g. "Data exfiltration triggers ICO 72h notification". */
  rationale?: string;
};

export type LibraryRunbook = {
  slug: string;
  title: string;
  description: string;
  category: RunbookCategory;
  ownerRoleTitle: string;
  /**
   * Firm tiers this template applies to. /runbooks shows non-applicable
   * templates dimmed-and-tagged rather than hiding them — admins can still
   * clone them if their firm has a non-standard structure.
   */
  applicableTiers: readonly FirmTier[];
  trigger?: {
    severityAtLeast?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    scenarioCategoryEquals?: string;
  };
  /** Downstream runbooks the IMT should activate when this one fires. */
  escalates?: ReadonlyArray<LibraryRunbookEscalation>;
  steps: LibraryRunbookStep[];
};

const RANSOMWARE: LibraryRunbook = {
  slug: "ransomware-response",
  title: "Ransomware response",
  description:
    "First-90-minute playbook for confirmed or suspected ransomware. Isolates the blast radius, stands up the IMT, files regulator notifications on the right clocks, and pre-stages customer comms.",
  category: "RANSOMWARE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CISO",
  trigger: { severityAtLeast: "HIGH", scenarioCategoryEquals: "Technology & Data (Cyber)" },
  escalates: [
    { targetSlug: "bcp-activation", severityAtLeast: "HIGH", rationale: "Severe cyber outages usually need BCP-side workarounds in parallel." },
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Likely material under FCA rules — file the 4h notification." },
    { targetSlug: "ico-72h-breach", rationale: "Any personal-data exposure triggers ICO 72h clock." },
    { targetSlug: "dora-major-ict-incident", severityAtLeast: "HIGH", rationale: "EU DORA major ICT-incident classification likely." },
  ],
  steps: [
    {
      slug: "isolate-segments",
      title: "Isolate affected network segments",
      description:
        "Quarantine known-compromised segments at the perimeter and between zones. Do not power-off endpoints — preserve memory for forensics.",
      kind: "ACTION",
      ownerRoleTitle: "CISO",
      estimatedMin: 10,
      successCriteria: "Compromised segments isolated; lateral movement blocked at firewall.",
    },
    {
      slug: "invoke-imt",
      title: "Invoke the IMT",
      description: "Stand up the IMT bridge. Best practice: stand up early, stand down later — never the other way round.",
      kind: "DECISION",
      ownerRoleTitle: "CRO",
      estimatedMin: 5,
      decisionTypeCode: "INVOKE_IMT",
      dependsOn: ["isolate-segments"],
    },
    {
      slug: "classify-severity",
      title: "Classify severity",
      description: "Run the 5-dimension severity matrix. Severity gates the regulator clocks and the IMT cadence.",
      kind: "DECISION",
      ownerRoleTitle: "CRO",
      estimatedMin: 10,
      decisionTypeCode: "CLASSIFY_SEVERITY",
      dependsOn: ["invoke-imt"],
    },
    {
      slug: "do-not-pay",
      title: "Reaffirm no-ransom posture",
      description:
        "Confirm board-level standing decision to not pay. Document any deviation explicitly with CEO + CRO + legal sign-off.",
      kind: "DECISION",
      ownerRoleTitle: "CEO",
      estimatedMin: 5,
      decisionTypeCode: "DO_NOT_PAY_RANSOM",
      dependsOn: ["invoke-imt"],
    },
    {
      slug: "engage-ir-vendor",
      title: "Engage retained DFIR vendor",
      description: "Spin up the retained digital forensics + incident response vendor on the contracted SLA.",
      kind: "ACTION",
      ownerRoleTitle: "CISO",
      estimatedMin: 30,
      successCriteria: "DFIR vendor on the bridge with read access to affected systems.",
      dependsOn: ["classify-severity"],
    },
    {
      slug: "notify-fca",
      title: "Notify FCA",
      description: "Material incident notification within 4 hours of IMT invocation for High severity.",
      kind: "NOTIFICATION",
      ownerRoleTitle: "CRO",
      estimatedMin: 30,
      regulatorTrigger: { regulator: "FCA", slaHours: 4, trigger: "POST_INVOCATION" },
      dependsOn: ["classify-severity"],
    },
    {
      slug: "notify-pra",
      title: "Notify PRA",
      description: "Material incident notification within 4 hours of IMT invocation for PRA-regulated firms.",
      kind: "NOTIFICATION",
      ownerRoleTitle: "CRO",
      estimatedMin: 30,
      regulatorTrigger: { regulator: "PRA", slaHours: 4, trigger: "POST_INVOCATION" },
      dependsOn: ["classify-severity"],
    },
    {
      slug: "assess-ico",
      title: "Assess personal-data breach (ICO 72h clock)",
      description: "If personal data is suspected affected, notify ICO within 72 hours of awareness.",
      kind: "NOTIFICATION",
      ownerRoleTitle: "DPO",
      estimatedMin: 60,
      regulatorTrigger: { regulator: "ICO", slaHours: 72, trigger: "POST_AWARENESS" },
      dependsOn: ["classify-severity"],
    },
    {
      slug: "internal-comms",
      title: "Stand up internal comms",
      description:
        "Employees first, customers second. Brief staff before they hear it from media or customers — that ordering is non-negotiable.",
      kind: "COMMS",
      ownerRoleTitle: "Head of Comms",
      estimatedMin: 20,
      commsTemplate: {
        stakeholder: "EMPLOYEES",
        subject: "Operational incident — what we know, what we don't",
        bodyTemplate:
          "Team — we are managing a security incident that is affecting some of our systems. The IMT is stood up and we are working with our incident response partner. Please do not respond to external queries; route everything to {{ownerRoleTitle}}. We will update by {{nextSitrepDDay}}.",
      },
      dependsOn: ["classify-severity"],
    },
    {
      slug: "first-sitrep",
      title: "File first IMT sitrep",
      description: "GREEN / AMBER / RED status with summary, issues, asks. Cadence: every 30 min for High severity.",
      kind: "CHECKPOINT",
      ownerRoleTitle: "IMT Chair",
      estimatedMin: 15,
      successCriteria: "Sitrep filed; next-update time set.",
      dependsOn: ["classify-severity"],
    },
  ],
};

const CLOUD_REGION_OUTAGE: LibraryRunbook = {
  slug: "cloud-region-outage",
  title: "Cloud region outage",
  description:
    "Hyperscaler region failure playbook (AWS/Azure/GCP). Confirms scope from status sources, triggers multi-region failover if available, and pre-empts the regulator's concentration question.",
  category: "CLOUD_REGION_OUTAGE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CTO",
  trigger: { severityAtLeast: "HIGH" },
  escalates: [
    { targetSlug: "bcp-activation", severityAtLeast: "HIGH", rationale: "Region loss usually breaches an IBS impact tolerance." },
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Likely material under FCA SS1/21 thresholds." },
    { targetSlug: "dora-major-ict-incident", severityAtLeast: "HIGH", rationale: "EU DORA classification likely." },
  ],
  steps: [
    {
      slug: "confirm-scope",
      title: "Confirm hyperscaler scope from status page",
      description:
        "Cross-reference hyperscaler status page with internal monitoring. Capture: affected services, affected regions, declared start-time.",
      kind: "ACTION",
      ownerRoleTitle: "CTO",
      estimatedMin: 5,
      successCriteria: "Affected services × regions list documented and time-stamped.",
    },
    {
      slug: "ibs-impact",
      title: "Map outage to IBS list",
      description: "Walk the resource map: which IBSs depend on the affected services? Tag IBSs as IMPACTED in the workspace.",
      kind: "ACTION",
      ownerRoleTitle: "Head of Operational Resilience",
      estimatedMin: 10,
      dependsOn: ["confirm-scope"],
    },
    {
      slug: "invoke-imt",
      title: "Invoke the IMT",
      description: "Stand up if any IBS is IMPACTED. Don't wait for confirmed impact tolerance breach.",
      kind: "DECISION",
      ownerRoleTitle: "CRO",
      estimatedMin: 5,
      decisionTypeCode: "INVOKE_IMT",
      dependsOn: ["ibs-impact"],
    },
    {
      slug: "failover",
      title: "Trigger multi-region failover (where available)",
      description: "Activate DR runbook for affected services. Note: failover is itself risky — only invoke when impact tolerance is genuinely threatened.",
      kind: "DECISION",
      ownerRoleTitle: "CTO",
      estimatedMin: 30,
      decisionTypeCode: "RECOVERY_OPTION_CHOSEN",
      dependsOn: ["invoke-imt"],
    },
    {
      slug: "notify-fca",
      title: "Notify FCA",
      description: "If any IBS is at risk of breaching impact tolerance, notify within 4 hours.",
      kind: "NOTIFICATION",
      ownerRoleTitle: "CRO",
      estimatedMin: 30,
      regulatorTrigger: { regulator: "FCA", slaHours: 4, trigger: "POST_INVOCATION" },
      dependsOn: ["invoke-imt"],
    },
    {
      slug: "customer-holding-comms",
      title: "Issue customer holding statement",
      description: "Acknowledge the issue without speculating on root cause or recovery time. Push to all customer-facing channels.",
      kind: "COMMS",
      ownerRoleTitle: "Head of Comms",
      estimatedMin: 15,
      commsTemplate: {
        stakeholder: "CUSTOMERS",
        subject: "We're aware of an issue — update incoming",
        bodyTemplate:
          "We're currently experiencing issues with some of our services. Our team is working with our infrastructure provider to restore normal operation. We'll post another update by {{nextSitrepDDay}}. Thank you for your patience.",
      },
      dependsOn: ["invoke-imt"],
    },
    {
      slug: "concentration-review",
      title: "Post-incident concentration review",
      description:
        "Once stable, log into the vendor register and refresh the concentration-risk view. The regulator will ask whether this changes your MTP register.",
      kind: "CHECKPOINT",
      ownerRoleTitle: "Head of Procurement",
      estimatedMin: 60,
      successCriteria: "Vendor register reviewed; any new findings logged as action items.",
      dependsOn: ["failover"],
    },
  ],
};

const VENDOR_FAILURE: LibraryRunbook = {
  slug: "material-vendor-outage",
  title: "Material vendor outage",
  description:
    "Material third-party outage. Verifies impact, opens the contracted escalation path, and runs the customer-comms cascade in the right order.",
  category: "VENDOR_FAILURE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Head of Procurement",
  trigger: { severityAtLeast: "MEDIUM" },
  escalates: [
    { targetSlug: "fca-material-incident", rationale: "Material outsource disruption notifiable to the FCA." },
    { targetSlug: "dora-major-ict-incident", severityAtLeast: "HIGH", rationale: "If the vendor is a critical ICT third party under DORA." },
  ],
  steps: [
    {
      slug: "confirm-status",
      title: "Confirm vendor outage from vendor status URL",
      description: "Independent confirmation that the vendor is degraded. Don't take a single internal alert as ground-truth.",
      kind: "ACTION",
      ownerRoleTitle: "Service Operations Lead",
      estimatedMin: 5,
    },
    {
      slug: "open-escalation",
      title: "Open contracted escalation path with vendor",
      description: "Use the named technical + commercial escalation contacts on the vendor record. Capture the ticket reference.",
      kind: "ACTION",
      ownerRoleTitle: "Head of Procurement",
      estimatedMin: 10,
      dependsOn: ["confirm-status"],
    },
    {
      slug: "ibs-impact",
      title: "Identify impacted IBSs",
      description: "Walk the vendor → IBS link table. Flag any IBSs that could approach impact tolerance.",
      kind: "ACTION",
      ownerRoleTitle: "Head of Operational Resilience",
      estimatedMin: 10,
      dependsOn: ["confirm-status"],
    },
    {
      slug: "invoke-imt",
      title: "Decide whether to invoke IMT",
      description: "If any IBS is at risk, invoke the IMT. Document the call either way.",
      kind: "DECISION",
      ownerRoleTitle: "CRO",
      estimatedMin: 5,
      decisionTypeCode: "INVOKE_IMT",
      dependsOn: ["ibs-impact"],
    },
    {
      slug: "consider-exit",
      title: "Consider exit-plan activation",
      description: "If recovery time is unclear, evaluate failover to alternative provider per the exit plan.",
      kind: "DECISION",
      ownerRoleTitle: "CTO",
      estimatedMin: 30,
      decisionTypeCode: "RECOVERY_OPTION_CHOSEN",
      dependsOn: ["invoke-imt"],
    },
    {
      slug: "internal-brief",
      title: "Brief internal stakeholders",
      description: "Frontline support staff need to know before customer calls land. Employees-before-customers.",
      kind: "COMMS",
      ownerRoleTitle: "Head of Comms",
      estimatedMin: 10,
      commsTemplate: {
        stakeholder: "EMPLOYEES",
        subject: "Vendor outage — what to tell customers",
        bodyTemplate:
          "Vendor {{vendorName}} is experiencing an outage affecting {{affectedServices}}. If customers call, acknowledge and route to the support queue. Do not estimate recovery times. IMT is engaged.",
      },
      dependsOn: ["invoke-imt"],
    },
    {
      slug: "customer-comms",
      title: "Customer comms",
      description: "Once frontline is briefed, push the customer-facing notice. Always second, never first.",
      kind: "COMMS",
      ownerRoleTitle: "Head of Comms",
      estimatedMin: 15,
      commsTemplate: {
        stakeholder: "CUSTOMERS",
        subject: "Service degradation — we're on it",
        bodyTemplate:
          "Some of our services are currently unavailable due to a third-party issue. We've engaged the provider and will share another update by {{nextSitrepDDay}}.",
      },
      dependsOn: ["internal-brief"],
    },
    {
      slug: "post-incident-review",
      title: "Trigger PIR submission clock",
      description: "Post-incident report is due against the incident closure. Pre-stage the structure now while context is fresh.",
      kind: "CHECKPOINT",
      ownerRoleTitle: "Head of Operational Resilience",
      estimatedMin: 15,
      dependsOn: ["consider-exit"],
    },
  ],
};

const BCP_ACTIVATION: LibraryRunbook = {
  slug: "bcp-activation",
  title: "BCP activation",
  description:
    "Business Continuity Plan activation. Joint CEO + CRO decision, BU stand-up checklist, and the regulator-facing notifications.",
  category: "BCP_ACTIVATION",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CRO",
  escalates: [
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "BCP invocation typically meets FCA materiality." },
  ],
  steps: [
    {
      slug: "trigger-met",
      title: "Confirm BCP trigger met",
      description: "Document which trigger criteria are satisfied (impact tolerance, regulatory, reputational).",
      kind: "CHECKPOINT",
      ownerRoleTitle: "CRO",
      estimatedMin: 10,
      successCriteria: "Trigger criteria documented and time-stamped.",
    },
    {
      slug: "joint-decision",
      title: "Joint CEO + CRO activation decision",
      description: "Per policy, BCP activation requires joint sign-off. Capture both as approvers on the decision record.",
      kind: "DECISION",
      ownerRoleTitle: "CEO",
      estimatedMin: 5,
      decisionTypeCode: "ACTIVATE_BCP",
      dependsOn: ["trigger-met"],
    },
    {
      slug: "bu-standup",
      title: "BU stand-up checklist",
      description:
        "Every BU files an initial sitrep within 30 minutes of activation. Each sitrep is GREEN/AMBER/RED with issues and asks.",
      kind: "CHECKPOINT",
      ownerRoleTitle: "IMT Chair",
      estimatedMin: 30,
      successCriteria: "Sitrep received from every impacted BU.",
      dependsOn: ["joint-decision"],
    },
    {
      slug: "notify-fca",
      title: "Notify FCA of BCP activation",
      description: "BCP activation is itself a notifiable event for many firms.",
      kind: "NOTIFICATION",
      ownerRoleTitle: "CRO",
      estimatedMin: 30,
      regulatorTrigger: { regulator: "FCA", slaHours: 4, trigger: "POST_INVOCATION" },
      dependsOn: ["joint-decision"],
    },
    {
      slug: "employee-comms",
      title: "All-staff BCP comms",
      description: "Single source of truth on what's invoked, what's expected of staff, and where to direct queries.",
      kind: "COMMS",
      ownerRoleTitle: "Head of Comms",
      estimatedMin: 15,
      commsTemplate: {
        stakeholder: "EMPLOYEES",
        subject: "BCP activated — read in full",
        bodyTemplate:
          "The Business Continuity Plan has been activated as of {{invokedAtTime}}. Your line manager will brief on local impact. Follow IMT instructions. Do not commit to external timelines.",
      },
      dependsOn: ["joint-decision"],
    },
    {
      slug: "deactivation-criteria",
      title: "Define deactivation criteria",
      description: "Document what 'good' looks like for standing down. Best practice: define before you need it, not during.",
      kind: "ACTION",
      ownerRoleTitle: "CRO",
      estimatedMin: 20,
      dependsOn: ["bu-standup"],
    },
  ],
};

const DDOS_RESPONSE: LibraryRunbook = {
  slug: "ddos-response",
  title: "DDoS response",
  description:
    "Volumetric or application-layer denial-of-service. Triages traffic, engages upstream scrubbing, and manages customer-comms tempo while the noise resolves.",
  category: "CYBER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CISO",
  trigger: { severityAtLeast: "MEDIUM" },
  escalates: [
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Customer-impacting DDoS is FCA-notifiable." },
    { targetSlug: "bcp-activation", severityAtLeast: "CRITICAL", rationale: "Persistent or wide-blast DDoS needs BCP workarounds." },
  ],
  steps: [
    {
      slug: "characterise",
      title: "Characterise the attack",
      description: "Volumetric? Application-layer? Capture peak Gbps, source-IP distribution, target URI patterns.",
      kind: "ACTION",
      ownerRoleTitle: "Network Ops Lead",
      estimatedMin: 10,
    },
    {
      slug: "engage-scrubbing",
      title: "Engage upstream scrubbing service",
      description: "Activate contracted DDoS scrubbing (CDN / WAF provider). Flip traffic into the scrubbed VIP.",
      kind: "ACTION",
      ownerRoleTitle: "Network Ops Lead",
      estimatedMin: 15,
      dependsOn: ["characterise"],
    },
    {
      slug: "invoke-imt",
      title: "Invoke the IMT",
      description: "Even if scrubbing engages cleanly — the regulator will ask about the response.",
      kind: "DECISION",
      ownerRoleTitle: "CRO",
      estimatedMin: 5,
      decisionTypeCode: "INVOKE_IMT",
      dependsOn: ["characterise"],
    },
    {
      slug: "customer-comms",
      title: "Issue customer-facing acknowledgement",
      description: "Avoid attributing root cause publicly until forensics is solid. 'We are managing a service issue' is enough.",
      kind: "COMMS",
      ownerRoleTitle: "Head of Comms",
      estimatedMin: 10,
      commsTemplate: {
        stakeholder: "CUSTOMERS",
        subject: "Brief service issue — working on it",
        bodyTemplate:
          "Some customers are experiencing slowness or errors. We're managing the issue and will update by {{nextSitrepDDay}}.",
      },
      dependsOn: ["engage-scrubbing"],
    },
    {
      slug: "monitor-for-cover",
      title: "Monitor for cover attacks",
      description:
        "Volumetric DDoS is often the noisy cover for a quieter intrusion. Watch SIEM for credential-stuffing or fraud-pattern spikes during the storm.",
      kind: "ACTION",
      ownerRoleTitle: "CISO",
      estimatedMin: 30,
      dependsOn: ["engage-scrubbing"],
    },
    {
      slug: "stand-down",
      title: "Stand-down + lessons",
      description: "When traffic normalises and scrubbing is unwound, capture lessons. DDoS is the cheapest exercise you'll ever get — use it.",
      kind: "CHECKPOINT",
      ownerRoleTitle: "CRO",
      estimatedMin: 30,
      dependsOn: ["monitor-for-cover"],
    },
  ],
};

// ─── Additional cyber runbooks ──────────────────────────────────────────

const PHISHING_CREDENTIAL_COMPROMISE: LibraryRunbook = {
  slug: "phishing-credential-compromise",
  title: "Phishing-driven credential compromise",
  description:
    "Confirmed phishing campaign where employee credentials are believed harvested. Disables affected accounts, sweeps for further compromise, decides on a forced password reset.",
  category: "CYBER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CISO",
  trigger: { severityAtLeast: "MEDIUM", scenarioCategoryEquals: "Technology & Data (Cyber)" },
  steps: [
    { slug: "lock-accounts", title: "Disable known-compromised accounts", description: "Force sign-out + reset sessions across IdP, M365/Workspace, VPN, code repos.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 10, successCriteria: "Accounts disabled and active sessions revoked." },
    { slug: "sweep-mailboxes", title: "Sweep affected mailboxes", description: "Search for inbox rules auto-forwarding to external addresses; remove and audit.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 20, dependsOn: ["lock-accounts"] },
    { slug: "classify-severity", title: "Classify severity", description: "Is this an isolated compromise or campaign with privileged-access exposure?", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 10, decisionTypeCode: "CLASSIFY_SEVERITY", dependsOn: ["sweep-mailboxes"] },
    { slug: "forced-reset", title: "Decide on org-wide forced reset", description: "Balance disruption vs containment confidence; deputy + CISO co-sign.", kind: "DECISION", ownerRoleTitle: "CISO", estimatedMin: 15, decisionTypeCode: "FORCED_PASSWORD_RESET", dependsOn: ["classify-severity"] },
    { slug: "data-breach-check", title: "Assess personal-data breach risk", description: "If mailboxes contained customer PII, prepare ICO 72h notification.", kind: "DECISION", ownerRoleTitle: "DPO", estimatedMin: 30, dependsOn: ["sweep-mailboxes"] },
    { slug: "notify-ico", title: "ICO 72h personal-data breach", description: "Prepare and file if customer data confirmed accessed.", kind: "NOTIFICATION", ownerRoleTitle: "DPO", estimatedMin: 60, regulatorTrigger: { regulator: "ICO", slaHours: 72, trigger: "POST_AWARENESS" }, dependsOn: ["data-breach-check"] },
    { slug: "staff-advisory", title: "Issue staff advisory", description: "Plain-English advisory + how to spot the lure variant. Avoid blame.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 20, commsTemplate: { stakeholder: "EMPLOYEES", subject: "Phishing campaign — what to look for", bodyTemplate: "Team — we are responding to a phishing campaign that has affected a small number of accounts. The IMT is engaged and the accounts are secured. If you receive a suspicious email, forward to security@ and delete; do not click. We will update by {{nextSitrepDDay}}." }, dependsOn: ["classify-severity"] },
    { slug: "first-sitrep", title: "File first IMT sitrep", description: "GREEN/AMBER/RED with confirmed/suspected counts.", kind: "CHECKPOINT", ownerRoleTitle: "IMT Chair", estimatedMin: 10, dependsOn: ["classify-severity"] },
  ],
};

const SUPPLY_CHAIN_COMPROMISE: LibraryRunbook = {
  slug: "supply-chain-compromise",
  title: "Supply-chain / dependency compromise",
  description:
    "Trusted upstream package (NPM/PyPI/Maven/Docker image) or build tool has been compromised. Halts the build pipeline, audits affected releases, decides on rollback.",
  category: "CYBER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CTO",
  trigger: { severityAtLeast: "HIGH" },
  escalates: [
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Material customer impact — FCA notification." },
    { targetSlug: "dora-major-ict-incident", severityAtLeast: "HIGH", rationale: "EU DORA major ICT-incident classification likely." },
  ],
  steps: [
    { slug: "halt-builds", title: "Halt all production deploys", description: "Freeze CD pipelines + lock production change windows.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 5, successCriteria: "No new deploys in flight." },
    { slug: "scope-affected", title: "Scope affected artefacts", description: "SBOM scan for the compromised dependency across all services + container images.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 30, dependsOn: ["halt-builds"] },
    { slug: "invoke-imt", title: "Invoke the IMT", description: "Stand up if any production artefact ships the bad dependency.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 5, decisionTypeCode: "INVOKE_IMT", dependsOn: ["scope-affected"] },
    { slug: "rollback-decision", title: "Decide on rollback vs forward-fix", description: "Rollback is faster; forward-fix preserves recent feature work. Track impact tolerance.", kind: "DECISION", ownerRoleTitle: "CTO", estimatedMin: 20, decisionTypeCode: "RECOVERY_OPTION_CHOSEN", dependsOn: ["invoke-imt"] },
    { slug: "rotate-secrets", title: "Rotate secrets exposed to the build", description: "Any credential the bad dependency could have exfiltrated.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 60, dependsOn: ["scope-affected"] },
    { slug: "notify-fca", title: "Notify FCA if customer impact", description: "If any IBS is degraded, file within 4h of invocation.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "FCA", slaHours: 4, trigger: "POST_INVOCATION" }, dependsOn: ["invoke-imt"] },
    { slug: "first-sitrep", title: "File first sitrep", description: "Cadence: 60 min for High severity.", kind: "CHECKPOINT", ownerRoleTitle: "IMT Chair", estimatedMin: 10, dependsOn: ["invoke-imt"] },
  ],
};

const INSIDER_THREAT: LibraryRunbook = {
  slug: "insider-threat-privileged-user",
  title: "Insider threat — privileged user",
  description:
    "Credible evidence of malicious activity by a privileged employee. Revokes access without tipping off, preserves evidence, coordinates with HR + legal.",
  category: "CYBER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CISO",
  trigger: { severityAtLeast: "HIGH" },
  escalates: [
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Privileged-user abuse is FCA-notifiable when customer harm is likely." },
  ],
  steps: [
    { slug: "preserve-evidence", title: "Preserve evidence first", description: "Snapshot logs, mail, endpoints BEFORE access changes — chain of custody.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 30 },
    { slug: "legal-hr-loop", title: "Loop in Legal + HR", description: "Standing legal privilege + HR process must run in parallel from minute zero.", kind: "DECISION", ownerRoleTitle: "Chief Legal Officer", estimatedMin: 15, dependsOn: ["preserve-evidence"] },
    { slug: "revoke-access", title: "Revoke access — quietly", description: "Suspend tokens, sessions, hardware keys. Avoid status messages that broadcast suspension.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 15, dependsOn: ["legal-hr-loop"] },
    { slug: "physical-controls", title: "Physical access + workspace", description: "Revoke building badge; if remote, recall corporate kit per HR protocol.", kind: "ACTION", ownerRoleTitle: "COO", estimatedMin: 30, dependsOn: ["revoke-access"] },
    { slug: "harm-assessment", title: "Assess customer / market harm", description: "Did the individual have access to client data, market-moving info, or payment authorisation?", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 30, dependsOn: ["preserve-evidence"] },
    { slug: "notify-fca", title: "Notify FCA — SMF / conduct concern", description: "Material non-financial misconduct or insider trading triggers regulator notification.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 60, regulatorTrigger: { regulator: "FCA", slaHours: 24, trigger: "POST_AWARENESS" }, dependsOn: ["harm-assessment"] },
    { slug: "exec-only-comms", title: "Executive-only communications", description: "Keep circulation tight until legal/HR clear broader announce.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 15, commsTemplate: { stakeholder: "EXECUTIVE_TEAM", subject: "Restricted: HR matter under investigation", bodyTemplate: "This communication is restricted. An HR matter is under investigation and the IMT is engaged. Do not discuss outside this distribution. Legal lead is {{ownerRoleTitle}}." }, dependsOn: ["legal-hr-loop"] },
  ],
};

const ZERO_DAY_DISCLOSURE: LibraryRunbook = {
  slug: "zero-day-disclosure",
  title: "Zero-day vulnerability disclosure",
  description:
    "A critical vendor or open-source dependency publishes a 0-day with public exploit. Inventory exposure, patch on emergency change, monitor for active exploitation.",
  category: "CYBER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CISO",
  trigger: { severityAtLeast: "HIGH" },
  steps: [
    { slug: "inventory-exposure", title: "Inventory exposure", description: "Cross-reference the affected component against your CMDB / SBOM / endpoint inventory.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 30 },
    { slug: "emergency-cab", title: "Convene emergency CAB", description: "Approve out-of-cycle patch window with risk vs availability trade-off.", kind: "DECISION", ownerRoleTitle: "CTO", estimatedMin: 30, dependsOn: ["inventory-exposure"] },
    { slug: "mitigate-or-isolate", title: "Apply mitigations / isolate", description: "If patch isn't available, apply vendor mitigations or isolate at network layer.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 60, dependsOn: ["emergency-cab"] },
    { slug: "hunt-for-exploitation", title: "Hunt for active exploitation", description: "Search SIEM / EDR for known IOCs from the public disclosure.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 60, dependsOn: ["inventory-exposure"] },
    { slug: "patch-rollout", title: "Roll out patch to production", description: "Use canary → blue/green → full rollout where possible.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 240, dependsOn: ["emergency-cab"] },
    { slug: "internal-advisory", title: "Internal advisory", description: "Brief engineering + ops on the patch + the IOCs to watch for.", kind: "COMMS", ownerRoleTitle: "CISO", estimatedMin: 15, commsTemplate: { stakeholder: "EMPLOYEES", subject: "Emergency patch in flight — what to watch for", bodyTemplate: "Team — we are deploying an emergency patch for a critical vulnerability. Expect brief degraded service on affected systems. Report anything unusual to security@. Update by {{nextSitrepDDay}}." }, dependsOn: ["emergency-cab"] },
  ],
};

const LOST_DEVICE_WITH_DATA: LibraryRunbook = {
  slug: "lost-device-with-data",
  title: "Lost / stolen device with sensitive data",
  description:
    "Employee reports a laptop / phone with corporate data lost or stolen. Remote wipe + access audit + ICO assessment.",
  category: "CYBER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CISO",
  escalates: [
    { targetSlug: "ico-72h-breach", rationale: "Confirmed loss of personal data — ICO 72h." },
  ],
  steps: [
    { slug: "remote-wipe", title: "Initiate remote wipe", description: "MDM-driven wipe + remote lock; confirm device check-in status.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 15 },
    { slug: "revoke-credentials", title: "Revoke device-bound credentials", description: "Rotate any client certs, hardware-bound passkeys, refresh tokens on that device.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 20, dependsOn: ["remote-wipe"] },
    { slug: "data-classification", title: "Classify data on device", description: "Was unencrypted PII / confidential customer data stored locally?", kind: "DECISION", ownerRoleTitle: "DPO", estimatedMin: 30, dependsOn: ["remote-wipe"] },
    { slug: "notify-ico", title: "ICO 72h breach (if PII)", description: "Notify if encrypted-at-rest cannot be confirmed for the affected device.", kind: "NOTIFICATION", ownerRoleTitle: "DPO", estimatedMin: 60, regulatorTrigger: { regulator: "ICO", slaHours: 72, trigger: "POST_AWARENESS" }, dependsOn: ["data-classification"] },
    { slug: "police-report", title: "Police report (if stolen)", description: "File a crime reference number; often required by insurers.", kind: "ACTION", ownerRoleTitle: "COO", estimatedMin: 60, dependsOn: ["remote-wipe"] },
    { slug: "lessons-learned", title: "Lessons learned ticket", description: "Was disk encryption on? MDM enrolled? Update onboarding accordingly.", kind: "CHECKPOINT", ownerRoleTitle: "CISO", estimatedMin: 15, dependsOn: ["data-classification"] },
  ],
};

const DATA_EXFILTRATION: LibraryRunbook = {
  slug: "data-exfiltration-discovered",
  title: "Data exfiltration discovered",
  description:
    "DLP / SIEM detects large-volume egress to an unknown destination. Cuts off the egress path, scopes the dataset, runs the breach-notification clock.",
  category: "CYBER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CISO",
  trigger: { severityAtLeast: "CRITICAL" },
  escalates: [
    { targetSlug: "ico-72h-breach", rationale: "Confirmed exfiltration of personal data triggers ICO 72h." },
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Material customer harm — FCA notification." },
  ],
  steps: [
    { slug: "block-egress", title: "Block the egress channel", description: "DNS sinkhole / firewall block of the destination; preserve flow logs.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 10 },
    { slug: "preserve-evidence", title: "Preserve evidence", description: "Snapshot affected hosts, capture netflow / proxy logs; document time-stamps.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 30, dependsOn: ["block-egress"] },
    { slug: "invoke-imt", title: "Invoke the IMT", description: "Stand up immediately — data exfiltration is a regulator-clock event.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 5, decisionTypeCode: "INVOKE_IMT", dependsOn: ["block-egress"] },
    { slug: "scope-dataset", title: "Scope the exfiltrated dataset", description: "Volume + categories: PII, financial, business-confidential. Sample 1% for content.", kind: "ACTION", ownerRoleTitle: "DPO", estimatedMin: 120, dependsOn: ["preserve-evidence"] },
    { slug: "notify-fca", title: "Notify FCA", description: "Material incident notification within 4h of invocation.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "FCA", slaHours: 4, trigger: "POST_INVOCATION" }, dependsOn: ["invoke-imt"] },
    { slug: "notify-ico", title: "ICO 72h personal-data breach", description: "Required if any PII confirmed in scope.", kind: "NOTIFICATION", ownerRoleTitle: "DPO", estimatedMin: 60, regulatorTrigger: { regulator: "ICO", slaHours: 72, trigger: "POST_AWARENESS" }, dependsOn: ["scope-dataset"] },
    { slug: "customer-comms-prep", title: "Prepare customer notifications", description: "Draft individualised letters; do not send until forensic confidence on scope.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 60, commsTemplate: { stakeholder: "CUSTOMERS", subject: "Important security notice", bodyTemplate: "We are writing to inform you that on {{dDayHHMM}} we became aware of an incident affecting some customer data. We have engaged forensic specialists, contained the issue, and notified regulators. The data potentially affected includes [TO FILL]. We recommend you [TO FILL]. We will update you as the investigation progresses." }, dependsOn: ["scope-dataset"] },
    { slug: "first-sitrep", title: "First sitrep + ongoing cadence", description: "Cadence: 30 min for Critical severity.", kind: "CHECKPOINT", ownerRoleTitle: "IMT Chair", estimatedMin: 10, dependsOn: ["invoke-imt"] },
  ],
};

const COMPROMISED_ADMIN_CREDS: LibraryRunbook = {
  slug: "compromised-admin-credentials",
  title: "Compromised admin credentials",
  description:
    "Privileged-access credential (root, breakglass, IaC service account) confirmed leaked. Rotate, audit, and post-mortem.",
  category: "CYBER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CISO",
  trigger: { severityAtLeast: "HIGH" },
  steps: [
    { slug: "rotate-immediately", title: "Rotate the credential immediately", description: "Generate a new secret, deploy, then disable the old. Coordinate with services that depend on it.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 30 },
    { slug: "session-revoke", title: "Revoke active sessions", description: "Force re-auth across IAM, cloud accounts, internal IdP.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 15, dependsOn: ["rotate-immediately"] },
    { slug: "audit-use", title: "Audit credential usage timeline", description: "Compare normal usage pattern vs the suspect window; flag anomalies.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 90, dependsOn: ["session-revoke"] },
    { slug: "classify-blast-radius", title: "Classify blast radius", description: "What could this credential touch? Was it touched?", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 30, decisionTypeCode: "CLASSIFY_SEVERITY", dependsOn: ["audit-use"] },
    { slug: "notify-fca-if-impacted", title: "Notify FCA if customer impact", description: "If IBS data accessed, file material-incident notification.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "FCA", slaHours: 4, trigger: "POST_INVOCATION" }, dependsOn: ["classify-blast-radius"] },
    { slug: "permanent-fix", title: "Plan permanent fix", description: "Migrate to short-lived tokens / workload identity / hardware-bound keys.", kind: "CHECKPOINT", ownerRoleTitle: "CTO", estimatedMin: 60, dependsOn: ["classify-blast-radius"] },
  ],
};

const WIRE_FRAUD_SURGE: LibraryRunbook = {
  slug: "wire-fraud-surge",
  title: "APP fraud / wire fraud surge",
  description:
    "Authorised Push Payment fraud volumes spike past threshold. Tightens controls, briefs comms, coordinates with scheme reimbursement processes.",
  category: "CYBER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Head of Financial Crime",
  trigger: { severityAtLeast: "MEDIUM" },
  escalates: [
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Surge in wire fraud is FCA-notifiable." },
  ],
  steps: [
    { slug: "tighten-controls", title: "Tighten step-up + velocity controls", description: "Lower thresholds for step-up auth, increase friction on first-payee.", kind: "ACTION", ownerRoleTitle: "Head of Financial Crime", estimatedMin: 30 },
    { slug: "stop-payments", title: "Decide on payment-block list", description: "Block confirmed mule accounts at the scheme level via Confirmation of Payee.", kind: "DECISION", ownerRoleTitle: "Head of Financial Crime", estimatedMin: 15, dependsOn: ["tighten-controls"] },
    { slug: "victim-outreach", title: "Reach out to confirmed victims", description: "Empathetic + practical: reimbursement path, police referral, identity-protection support.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 60, commsTemplate: { stakeholder: "CUSTOMERS", subject: "We're investigating a transaction on your account", bodyTemplate: "Hello — we've identified a transaction on your account that we believe was authorised under deception. We have paused outbound transfers and have begun our reimbursement process. A specialist will be in touch within 1 business day on the number we have on file." }, dependsOn: ["stop-payments"] },
    { slug: "scheme-coordination", title: "Coordinate with scheme", description: "PSR / Pay.UK reimbursement framework; align on case-handling cadence.", kind: "ACTION", ownerRoleTitle: "Head of Financial Crime", estimatedMin: 60, dependsOn: ["stop-payments"] },
    { slug: "notify-fca-if-thematic", title: "Notify FCA if thematic", description: "Thematic surges (new lure pattern, mule-account ring) warrant FCA notification.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 60, regulatorTrigger: { regulator: "FCA", slaHours: 24, trigger: "POST_AWARENESS" }, dependsOn: ["scheme-coordination"] },
  ],
};

// ─── Additional cloud / infrastructure runbooks ─────────────────────────

const HYPERSCALER_SERVICE_OUTAGE: LibraryRunbook = {
  slug: "hyperscaler-service-outage",
  title: "Hyperscaler service-specific outage",
  description:
    "Single AWS/Azure/GCP service (S3, RDS, IAM, etc.) degraded — not a full region outage. Confirms scope, decides on workaround / failover, manages customer impact.",
  category: "CLOUD_REGION_OUTAGE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CTO",
  trigger: { severityAtLeast: "MEDIUM" },
  escalates: [
    { targetSlug: "bcp-activation", severityAtLeast: "HIGH", rationale: "Hyperscaler outage usually breaches an IBS impact tolerance." },
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Likely material under FCA SS1/21." },
  ],
  steps: [
    { slug: "confirm-status", title: "Confirm hyperscaler status", description: "Cross-reference vendor status page vs internal canaries.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 10 },
    { slug: "scope-blast", title: "Scope dependent services", description: "Which of our services use the affected hyperscaler service?", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 15, dependsOn: ["confirm-status"] },
    { slug: "decide-workaround", title: "Workaround vs wait", description: "Some services degrade gracefully; others need active workaround.", kind: "DECISION", ownerRoleTitle: "CTO", estimatedMin: 15, decisionTypeCode: "RECOVERY_OPTION_CHOSEN", dependsOn: ["scope-blast"] },
    { slug: "customer-status-page", title: "Update public status page", description: "Acknowledge upstream issue; avoid speculation on recovery.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 10, dependsOn: ["decide-workaround"] },
    { slug: "monitor-recovery", title: "Monitor recovery posture", description: "Watch for cascading failures as upstream service recovers + load returns.", kind: "CHECKPOINT", ownerRoleTitle: "CTO", estimatedMin: 30, dependsOn: ["decide-workaround"] },
  ],
};

const DNS_PROVIDER_OUTAGE: LibraryRunbook = {
  slug: "dns-provider-outage",
  title: "DNS provider outage",
  description:
    "Authoritative DNS provider is degraded. Failover to secondary / lower TTLs / customer comms.",
  category: "CLOUD_REGION_OUTAGE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CTO",
  steps: [
    { slug: "confirm-dns", title: "Confirm DNS degradation", description: "Test resolution from multiple resolvers in multiple regions.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 5 },
    { slug: "failover-secondary", title: "Failover to secondary DNS", description: "If multi-provider is configured; some firms don't.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 30, dependsOn: ["confirm-dns"] },
    { slug: "lower-ttls", title: "Lower TTLs going forward", description: "If a single-provider outage, lower TTLs to speed up future failovers.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 30, dependsOn: ["confirm-dns"] },
    { slug: "customer-comms", title: "Customer-facing comms", description: "Acknowledge connectivity issues; route mobile-app users to status page in-app.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 20, dependsOn: ["confirm-dns"] },
    { slug: "post-incident-fix", title: "Post-incident: multi-provider DNS", description: "If this was single-provider, plan migration to multi-provider authoritative DNS.", kind: "CHECKPOINT", ownerRoleTitle: "CTO", estimatedMin: 30, dependsOn: ["customer-comms"] },
  ],
};

const CDN_OUTAGE: LibraryRunbook = {
  slug: "cdn-outage",
  title: "CDN provider outage",
  description:
    "Edge CDN serving customer traffic is degraded. Failover or origin-direct, plus DDoS-resilience considerations.",
  category: "CLOUD_REGION_OUTAGE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CTO",
  steps: [
    { slug: "confirm-cdn", title: "Confirm CDN degradation", description: "RUM + synthetic monitoring confirms scope.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 5 },
    { slug: "origin-direct", title: "Decide on origin-direct fallback", description: "Origins absorb full traffic + lose WAF protection — calculated risk.", kind: "DECISION", ownerRoleTitle: "CTO", estimatedMin: 15, decisionTypeCode: "RECOVERY_OPTION_CHOSEN", dependsOn: ["confirm-cdn"] },
    { slug: "secondary-cdn", title: "Failover to secondary CDN (if any)", description: "Activate standby CDN; warm cache typically takes 10–30 min.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 30, dependsOn: ["origin-direct"] },
    { slug: "ddos-watch", title: "Heightened DDoS posture", description: "CDN outage windows attract opportunistic DDoS; raise WAF sensitivity at origin.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 15, dependsOn: ["origin-direct"] },
    { slug: "customer-comms", title: "Customer comms", description: "Acknowledge slow-loading or unavailable pages; status page must remain on independent infra.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 15, dependsOn: ["confirm-cdn"] },
  ],
};

const DB_FAILOVER_GONE_WRONG: LibraryRunbook = {
  slug: "db-failover-gone-wrong",
  title: "Database failover gone wrong",
  description:
    "Planned or unplanned DB failover triggered split-brain / data divergence / extended downtime. Rolls back, reconciles, runs ledger integrity checks.",
  category: "DATA_INCIDENT",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CTO",
  trigger: { severityAtLeast: "HIGH" },
  escalates: [
    { targetSlug: "bcp-activation", severityAtLeast: "HIGH", rationale: "Botched failover usually requires BCP workarounds while recovery runs." },
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Customer-impacting recovery failure — FCA notification." },
  ],
  steps: [
    { slug: "stop-writes", title: "Stop application writes", description: "Mark IBSs as IMPACTED; queue writes if possible.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 10 },
    { slug: "diagnose-state", title: "Diagnose DB state", description: "Determine which replica has the authoritative state; identify divergence window.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 30, dependsOn: ["stop-writes"] },
    { slug: "invoke-imt", title: "Invoke the IMT", description: "Database integrity events are always IMT events.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 5, decisionTypeCode: "INVOKE_IMT", dependsOn: ["stop-writes"] },
    { slug: "rollback-or-fix", title: "Rollback or forward-reconcile", description: "Rollback to last consistent snapshot vs replay-and-reconcile.", kind: "DECISION", ownerRoleTitle: "CTO", estimatedMin: 30, decisionTypeCode: "RECOVERY_OPTION_CHOSEN", dependsOn: ["diagnose-state"] },
    { slug: "ledger-integrity", title: "Ledger integrity check", description: "Run reconciliation of customer balances + outbound payment queues.", kind: "ACTION", ownerRoleTitle: "CFO", estimatedMin: 120, dependsOn: ["rollback-or-fix"] },
    { slug: "notify-fca", title: "Notify FCA", description: "Ledger / IBS integrity event materially affects supervision — file within 4h.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "FCA", slaHours: 4, trigger: "POST_INVOCATION" }, dependsOn: ["invoke-imt"] },
  ],
};

const KUBERNETES_CLUSTER_OUTAGE: LibraryRunbook = {
  slug: "kubernetes-cluster-outage",
  title: "Kubernetes cluster outage",
  description:
    "Production Kubernetes cluster degraded — control plane down, etcd issues, or mass node failure. Failover or rebuild.",
  category: "CLOUD_REGION_OUTAGE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CTO",
  escalates: [
    { targetSlug: "bcp-activation", severityAtLeast: "HIGH", rationale: "Cluster-level outage usually breaches an IBS impact tolerance." },
  ],
  steps: [
    { slug: "confirm-scope", title: "Confirm cluster scope", description: "Control plane alone or worker nodes too? Multi-cluster or single?", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 10 },
    { slug: "failover-secondary", title: "Failover to secondary cluster", description: "If GitOps + multi-cluster is set up, reroute traffic.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 30, dependsOn: ["confirm-scope"] },
    { slug: "etcd-restore", title: "Restore etcd if needed", description: "If etcd is corrupt, restore from snapshot — accept replica-lag.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 60, dependsOn: ["confirm-scope"] },
    { slug: "ingress-routing", title: "Route ingress around the bad cluster", description: "Update global load balancer / DNS to skip the bad cluster.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 30, dependsOn: ["failover-secondary"] },
    { slug: "customer-status", title: "Customer status update", description: "Acknowledge degradation; promise next update window.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 10, dependsOn: ["confirm-scope"] },
  ],
};

// ─── Additional vendor failure runbooks ─────────────────────────────────

const PAYMENTS_SCHEME_OUTAGE: LibraryRunbook = {
  slug: "payments-scheme-outage",
  title: "Payments scheme outage (FPS / BACS / CHAPS / SEPA)",
  description:
    "Faster Payments / BACS / CHAPS / SEPA scheme is degraded. Queues outbound, coordinates with scheme operator, files BoE notification if CHAPS.",
  category: "VENDOR_FAILURE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Head of Payments",
  trigger: { severityAtLeast: "HIGH" },
  escalates: [
    { targetSlug: "boe-settlement-incident", rationale: "Payments-scheme disruption notifiable to BoE." },
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Material customer harm — FCA notification." },
  ],
  steps: [
    { slug: "confirm-scheme", title: "Confirm scheme status", description: "Cross-reference Pay.UK / BoE / SWIFT status with internal payment-gateway logs.", kind: "ACTION", ownerRoleTitle: "Head of Payments", estimatedMin: 10 },
    { slug: "queue-outbound", title: "Queue outbound payments", description: "Hold customer-initiated outbound; allow inbound to settle if possible.", kind: "ACTION", ownerRoleTitle: "Head of Payments", estimatedMin: 15, dependsOn: ["confirm-scheme"] },
    { slug: "invoke-imt", title: "Invoke the IMT", description: "Scheme outage = IBS impact; stand up immediately.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 5, decisionTypeCode: "INVOKE_IMT", dependsOn: ["confirm-scheme"] },
    { slug: "alt-rail-decision", title: "Alternative rail decision", description: "Push urgent payments via CHAPS or correspondent — accept higher cost.", kind: "DECISION", ownerRoleTitle: "Head of Payments", estimatedMin: 20, decisionTypeCode: "RECOVERY_OPTION_CHOSEN", dependsOn: ["invoke-imt"] },
    { slug: "notify-boe-if-chaps", title: "Notify Bank of England (if CHAPS)", description: "CHAPS member notification within scheme rules.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "BANK_OF_ENGLAND", slaHours: 2, trigger: "POST_INVOCATION" }, dependsOn: ["invoke-imt"] },
    { slug: "notify-fca", title: "Notify FCA", description: "If customer payment service degraded > impact tolerance.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "FCA", slaHours: 4, trigger: "POST_INVOCATION" }, dependsOn: ["invoke-imt"] },
    { slug: "customer-comms", title: "Customer comms", description: "Honest about delay; give an ETA only if confident.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 20, commsTemplate: { stakeholder: "CUSTOMERS", subject: "Payment delays — we're on it", bodyTemplate: "Hello — we're aware that some payments are delayed due to a scheme-level issue. Funds are not lost; payments are queued and will settle once the scheme is restored. We'll update by {{nextSitrepDDay}}." }, dependsOn: ["queue-outbound"] },
  ],
};

const CARD_SCHEME_OUTAGE: LibraryRunbook = {
  slug: "card-scheme-outage",
  title: "Card scheme outage (Visa / Mastercard)",
  description:
    "Card scheme degraded — authorisations failing. Stand-in processing, customer comms, scheme coordination.",
  category: "VENDOR_FAILURE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Head of Payments",
  trigger: { severityAtLeast: "HIGH" },
  steps: [
    { slug: "confirm-scope", title: "Confirm scheme scope", description: "Single network or both? Authorisation only, or clearing too?", kind: "ACTION", ownerRoleTitle: "Head of Payments", estimatedMin: 10 },
    { slug: "stand-in", title: "Activate stand-in processing", description: "Issuer stand-in approves low-risk transactions while scheme is degraded.", kind: "ACTION", ownerRoleTitle: "Head of Payments", estimatedMin: 30, dependsOn: ["confirm-scope"] },
    { slug: "invoke-imt", title: "Invoke IMT", description: "Card outage = customer-visible IBS impact.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 5, decisionTypeCode: "INVOKE_IMT", dependsOn: ["confirm-scope"] },
    { slug: "customer-comms", title: "Customer comms across channels", description: "App banner + SMS to active travellers + email blast.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 20, dependsOn: ["invoke-imt"] },
    { slug: "notify-fca", title: "Notify FCA", description: "If material customer impact.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "FCA", slaHours: 4, trigger: "POST_INVOCATION" }, dependsOn: ["invoke-imt"] },
    { slug: "reconcile-post-recovery", title: "Reconcile after recovery", description: "Stand-in transactions need clearing; resolve any chargeback noise.", kind: "CHECKPOINT", ownerRoleTitle: "Head of Payments", estimatedMin: 120, dependsOn: ["stand-in"] },
  ],
};

const KYC_VENDOR_OUTAGE: LibraryRunbook = {
  slug: "kyc-vendor-outage",
  title: "KYC vendor outage",
  description:
    "ID-verification provider (Onfido/Jumio/Trulioo) is down. Decide whether to pause onboarding or run with stricter manual review.",
  category: "VENDOR_FAILURE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Head of Onboarding",
  steps: [
    { slug: "confirm-status", title: "Confirm vendor outage", description: "Status page + API health checks.", kind: "ACTION", ownerRoleTitle: "Head of Onboarding", estimatedMin: 5 },
    { slug: "pause-or-manual", title: "Pause onboarding vs manual review", description: "Pause = lost revenue; manual = AML risk + capacity strain.", kind: "DECISION", ownerRoleTitle: "Head of Financial Crime", estimatedMin: 15, dependsOn: ["confirm-status"] },
    { slug: "fail-safe", title: "Apply fail-safe screening", description: "If continuing, apply enhanced sanctions + adverse-media screening manually.", kind: "ACTION", ownerRoleTitle: "Head of Financial Crime", estimatedMin: 30, dependsOn: ["pause-or-manual"] },
    { slug: "customer-comms", title: "Customer-facing comms", description: "If paused, in-app banner + email to new-applicant cohort.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 15, dependsOn: ["pause-or-manual"] },
    { slug: "backlog-mgmt", title: "Manage post-recovery backlog", description: "Queue management once vendor recovers; SLA tracking.", kind: "CHECKPOINT", ownerRoleTitle: "Head of Onboarding", estimatedMin: 60, dependsOn: ["confirm-status"] },
  ],
};

const SMS_OTP_FAILURE: LibraryRunbook = {
  slug: "sms-otp-failure",
  title: "SMS / OTP delivery failure",
  description:
    "OTP delivery is degraded — customers can't log in or step up. Switch to in-app push, lower step-up thresholds, brief support.",
  category: "VENDOR_FAILURE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CISO",
  steps: [
    { slug: "confirm-scope", title: "Confirm SMS scope", description: "Which carriers, which countries?", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 10 },
    { slug: "push-fallback", title: "Switch to in-app push OTP", description: "App-bound users only; SMS-only customers degraded.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 15, dependsOn: ["confirm-scope"] },
    { slug: "step-up-adjust", title: "Adjust step-up policy", description: "Temporarily lower step-up thresholds for risk-graded sessions.", kind: "DECISION", ownerRoleTitle: "CISO", estimatedMin: 15, dependsOn: ["push-fallback"] },
    { slug: "support-brief", title: "Brief customer support", description: "Scripts for the inbound surge; offer voice-call OTP if available.", kind: "COMMS", ownerRoleTitle: "Head of Customer Service", estimatedMin: 15, dependsOn: ["push-fallback"] },
    { slug: "customer-banner", title: "App banner + status page", description: "Acknowledge OTP issues; advise on push fallback.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 10, dependsOn: ["push-fallback"] },
  ],
};

const EMAIL_PROVIDER_OUTAGE: LibraryRunbook = {
  slug: "email-provider-outage",
  title: "Email provider outage",
  description:
    "Transactional email (statements, OTP fallback, customer-comms) is degraded. Switch to fallback provider, queue critical mail.",
  category: "VENDOR_FAILURE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CTO",
  steps: [
    { slug: "confirm-status", title: "Confirm provider status", description: "Provider status + delivery telemetry.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 5 },
    { slug: "fallback-provider", title: "Activate secondary ESP", description: "If multi-ESP architecture exists; cold-start otherwise.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 30, dependsOn: ["confirm-status"] },
    { slug: "deprioritise-marketing", title: "Deprioritise marketing email", description: "Reserve capacity for transactional + security email.", kind: "ACTION", ownerRoleTitle: "Head of Comms", estimatedMin: 10, dependsOn: ["fallback-provider"] },
    { slug: "customer-comms", title: "Customer-facing comms", description: "If statements or OTP affected, status-page entry + in-app advice.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 15, dependsOn: ["fallback-provider"] },
  ],
};

const SAAS_CRITICAL_OUTAGE: LibraryRunbook = {
  slug: "saas-critical-outage",
  title: "Critical SaaS outage (CRM / collaboration)",
  description:
    "Salesforce / Slack / M365 / Zoom is down. Switch to fallback channels; preserve customer-service continuity.",
  category: "VENDOR_FAILURE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "COO",
  steps: [
    { slug: "confirm-status", title: "Confirm SaaS scope", description: "Vendor status + per-feature impact.", kind: "ACTION", ownerRoleTitle: "COO", estimatedMin: 5 },
    { slug: "switch-channel", title: "Switch to fallback channels", description: "Pre-agreed: WhatsApp / Teams / phone tree for IMT comms.", kind: "ACTION", ownerRoleTitle: "Head of Comms", estimatedMin: 15, dependsOn: ["confirm-status"] },
    { slug: "manual-service", title: "Manual customer service mode", description: "If CRM down, log on paper / sheet; reconcile post-recovery.", kind: "ACTION", ownerRoleTitle: "Head of Customer Service", estimatedMin: 30, dependsOn: ["confirm-status"] },
    { slug: "customer-comms", title: "Customer-facing comms (if visible)", description: "Only if outage impacts customer experience.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 15, dependsOn: ["switch-channel"] },
  ],
};

const CONTACT_CENTRE_OUTAGE: LibraryRunbook = {
  slug: "contact-centre-outage",
  title: "Contact-centre telephony outage",
  description:
    "Inbound call routing degraded. Customer wait times spike. Switch to IVR self-service + secondary provider.",
  category: "VENDOR_FAILURE",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Head of Customer Service",
  steps: [
    { slug: "confirm-status", title: "Confirm telephony scope", description: "Inbound only? Outbound? Recording?", kind: "ACTION", ownerRoleTitle: "Head of Customer Service", estimatedMin: 10 },
    { slug: "ivr-fallback", title: "Route to IVR + self-service", description: "Direct inbound to self-service flows for common tasks.", kind: "ACTION", ownerRoleTitle: "Head of Customer Service", estimatedMin: 15, dependsOn: ["confirm-status"] },
    { slug: "secondary-provider", title: "Activate secondary telephony", description: "If multi-provider; many firms have one.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 30, dependsOn: ["confirm-status"] },
    { slug: "customer-comms", title: "Status page + app banner", description: "Encourage chat / messaging while phones are down.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 15, dependsOn: ["ivr-fallback"] },
  ],
};

// ─── Additional BCP runbooks ────────────────────────────────────────────

const OFFICE_INACCESSIBLE: LibraryRunbook = {
  slug: "office-inaccessible",
  title: "Office building inaccessible",
  description:
    "Fire / police cordon / structural / strike action — primary office cannot be entered. Activate remote-working posture + secondary site.",
  category: "BCP_ACTIVATION",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "COO",
  escalates: [
    { targetSlug: "bcp-activation", rationale: "Site loss invokes the BCP." },
  ],
  steps: [
    { slug: "confirm-inaccessible", title: "Confirm inaccessibility window", description: "Police / building management timeline; expected duration.", kind: "ACTION", ownerRoleTitle: "COO", estimatedMin: 30 },
    { slug: "remote-shift", title: "Shift to fully-remote posture", description: "Email + Slack announce; trading desks already on home-trading kit (if Tier-1).", kind: "ACTION", ownerRoleTitle: "Head of People", estimatedMin: 60, dependsOn: ["confirm-inaccessible"] },
    { slug: "secondary-site", title: "Activate secondary site (if any)", description: "For functions that can't work fully remote (cash ops, mail room, on-site server room).", kind: "ACTION", ownerRoleTitle: "COO", estimatedMin: 120, dependsOn: ["confirm-inaccessible"] },
    { slug: "staff-welfare", title: "Staff welfare check", description: "Confirm everyone is safe and accounted for; offer support.", kind: "ACTION", ownerRoleTitle: "Head of People", estimatedMin: 60, dependsOn: ["confirm-inaccessible"] },
    { slug: "customer-comms", title: "Customer comms (only if visible)", description: "Only if a customer-facing service is impacted.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 20, dependsOn: ["remote-shift"] },
  ],
};

const SEVERE_WEATHER: LibraryRunbook = {
  slug: "severe-weather",
  title: "Severe weather event",
  description:
    "Named storm / heatwave / flood expected to affect staff access. Pre-emptive remote-working + safety-first messaging.",
  category: "BCP_ACTIVATION",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "COO",
  escalates: [
    { targetSlug: "bcp-activation", severityAtLeast: "HIGH", rationale: "Region-wide weather event invokes BCP-side workarounds." },
  ],
  steps: [
    { slug: "monitor-warnings", title: "Monitor Met Office / equivalent", description: "Track regional warnings; identify staff at risk.", kind: "ACTION", ownerRoleTitle: "COO", estimatedMin: 30 },
    { slug: "remote-day", title: "Declare optional remote day", description: "Send by 4pm prior day so commuters can plan.", kind: "DECISION", ownerRoleTitle: "COO", estimatedMin: 15, dependsOn: ["monitor-warnings"] },
    { slug: "critical-staff-cover", title: "Confirm critical-function cover", description: "Cash ops, trading desks, IMT cover — explicit roll-call.", kind: "ACTION", ownerRoleTitle: "COO", estimatedMin: 60, dependsOn: ["remote-day"] },
    { slug: "staff-comms", title: "Staff-comms cascade", description: "Safety first, work second; how to escalate if blocked from working.", kind: "COMMS", ownerRoleTitle: "Head of People", estimatedMin: 15, commsTemplate: { stakeholder: "EMPLOYEES", subject: "Weather advisory — please prioritise your safety", bodyTemplate: "Team — given the weather forecast, we're declaring an optional remote-working day. If your safety is at risk, please prioritise that. Critical-function cover is being coordinated by team leads. Reach your line manager with any questions." }, dependsOn: ["remote-day"] },
  ],
};

const PANDEMIC_ABSENCE: LibraryRunbook = {
  slug: "pandemic-absence",
  title: "Pandemic-style staff absence",
  description:
    "≥ 30% of staff out simultaneously due to illness or quarantine. Activate minimum-viable team mode.",
  category: "BCP_ACTIVATION",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "COO",
  trigger: { severityAtLeast: "HIGH" },
  steps: [
    { slug: "track-absence", title: "Track absence by function", description: "Daily roll-up by team; identify functions below MVT.", kind: "ACTION", ownerRoleTitle: "Head of People", estimatedMin: 60 },
    { slug: "mvt-posture", title: "Declare minimum-viable team", description: "Each function delivers MVT-only outputs; defer non-essential work.", kind: "DECISION", ownerRoleTitle: "COO", estimatedMin: 30, dependsOn: ["track-absence"] },
    { slug: "cross-train", title: "Cross-train across borders", description: "Where staff in unaffected regions can pick up critical functions.", kind: "ACTION", ownerRoleTitle: "Head of People", estimatedMin: 240, dependsOn: ["mvt-posture"] },
    { slug: "notify-fca", title: "Notify FCA if IBS at risk", description: "If MVT posture threatens IBS impact tolerances.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "FCA", slaHours: 24, trigger: "POST_AWARENESS" }, dependsOn: ["mvt-posture"] },
    { slug: "weekly-sitrep", title: "Weekly board sitrep", description: "Cadence: weekly for prolonged events.", kind: "CHECKPOINT", ownerRoleTitle: "IMT Chair", estimatedMin: 30, dependsOn: ["mvt-posture"] },
  ],
};

const WAN_LOSS: LibraryRunbook = {
  slug: "wan-loss",
  title: "Loss of corporate WAN / VPN",
  description:
    "Corporate network connectivity lost — staff can't reach internal systems. Switch to zero-trust posture, run on cloud-only services.",
  category: "BCP_ACTIVATION",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CTO",
  steps: [
    { slug: "confirm-loss", title: "Confirm scope of WAN loss", description: "ISP outage? Internal WAN provider? VPN concentrator?", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 10 },
    { slug: "ztna-fallback", title: "Activate ZTNA fallback", description: "If zero-trust access is configured; staff use ZTNA agent.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 30, dependsOn: ["confirm-loss"] },
    { slug: "cloud-only-mode", title: "Cloud-only service mode", description: "Internal systems unreachable — staff use cloud-hosted equivalents.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 60, dependsOn: ["confirm-loss"] },
    { slug: "staff-comms", title: "Staff comms via personal channels", description: "If email is unreachable, use pre-agreed WhatsApp/SMS tree.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 15, dependsOn: ["confirm-loss"] },
  ],
};

// ─── Data incident runbooks ─────────────────────────────────────────────

const MASS_DATA_BREACH: LibraryRunbook = {
  slug: "mass-data-breach",
  title: "Mass personal-data breach",
  description:
    "Confirmed exposure of personal data affecting > 5,000 individuals. ICO 72h clock + bespoke customer notifications + class-action defence prep.",
  category: "DATA_INCIDENT",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "DPO",
  trigger: { severityAtLeast: "CRITICAL" },
  escalates: [
    { targetSlug: "ico-72h-breach", rationale: "Mass breach triggers ICO 72h irrespective of severity." },
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Material customer harm — FCA notification." },
  ],
  steps: [
    { slug: "contain-exposure", title: "Contain ongoing exposure", description: "Stop the bleed before scoping; revoke any active leakage vector.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 30 },
    { slug: "invoke-imt", title: "Invoke IMT", description: "Mass breach = mandatory IMT.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 5, decisionTypeCode: "INVOKE_IMT", dependsOn: ["contain-exposure"] },
    { slug: "scope-impact", title: "Scope impact precisely", description: "How many individuals, what categories of data, what jurisdictions.", kind: "ACTION", ownerRoleTitle: "DPO", estimatedMin: 240, dependsOn: ["contain-exposure"] },
    { slug: "notify-ico", title: "Notify ICO within 72h", description: "Even partial scoping — update with detail post-72h.", kind: "NOTIFICATION", ownerRoleTitle: "DPO", estimatedMin: 60, regulatorTrigger: { regulator: "ICO", slaHours: 72, trigger: "POST_AWARENESS" }, dependsOn: ["scope-impact"] },
    { slug: "notify-fca", title: "Notify FCA if material", description: "Customer-financial-harm threshold typically met for mass breach.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "FCA", slaHours: 4, trigger: "POST_INVOCATION" }, dependsOn: ["invoke-imt"] },
    { slug: "individual-letters", title: "Individual customer letters", description: "Per-individual notification once scope is firm.", kind: "COMMS", ownerRoleTitle: "DPO", estimatedMin: 240, commsTemplate: { stakeholder: "CUSTOMERS", subject: "Important: personal-data incident affecting your account", bodyTemplate: "We are writing to inform you that on {{dDayHHMM}} we identified a security incident that has affected some personal data we hold for you. We have engaged forensic specialists, notified the ICO, and contained the issue. The data affected is [TO FILL]. We recommend you [TO FILL]. We are sorry for the worry this causes." }, dependsOn: ["scope-impact"] },
    { slug: "legal-defence-prep", title: "Class-action defence preparation", description: "Brief external counsel; preserve every artefact.", kind: "CHECKPOINT", ownerRoleTitle: "Chief Legal Officer", estimatedMin: 120, dependsOn: ["scope-impact"] },
  ],
};

const DATA_QUALITY_LEDGER: LibraryRunbook = {
  slug: "data-quality-ledger",
  title: "Ledger discrepancy / data-quality incident",
  description:
    "Reconciliation breaks — customer balances or GL totals diverge from source-of-truth. Halt postings, reconcile, communicate.",
  category: "DATA_INCIDENT",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CFO",
  steps: [
    { slug: "halt-postings", title: "Halt new postings to affected ledger", description: "Prevent the discrepancy widening.", kind: "ACTION", ownerRoleTitle: "CFO", estimatedMin: 15 },
    { slug: "scope-discrepancy", title: "Scope the discrepancy", description: "Which accounts, what value, what time window.", kind: "ACTION", ownerRoleTitle: "CFO", estimatedMin: 120, dependsOn: ["halt-postings"] },
    { slug: "invoke-imt", title: "Invoke IMT if material", description: "Material = > 0.1% of balance sheet or > 1000 customers affected.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 5, decisionTypeCode: "INVOKE_IMT", dependsOn: ["scope-discrepancy"] },
    { slug: "remediation-plan", title: "Remediation plan", description: "Customer-detriment customers go first; reconcile firm-side last.", kind: "DECISION", ownerRoleTitle: "CFO", estimatedMin: 60, dependsOn: ["invoke-imt"] },
    { slug: "notify-fca-if-material", title: "Notify FCA if material", description: "Material discrepancy in supervised firm requires notification.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "FCA", slaHours: 24, trigger: "POST_AWARENESS" }, dependsOn: ["invoke-imt"] },
    { slug: "customer-comms", title: "Customer comms (if detriment)", description: "Only customers in detriment; firm-side discrepancies don't need individual letters.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 60, dependsOn: ["remediation-plan"] },
  ],
};

const BACKUP_INTEGRITY_FAILURE: LibraryRunbook = {
  slug: "backup-integrity-failure",
  title: "Backup integrity failure",
  description:
    "Routine restore test fails — backups are corrupt or unavailable. Investigate scope, restore from older snapshots, urgent fix.",
  category: "DATA_INCIDENT",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CTO",
  trigger: { severityAtLeast: "HIGH" },
  escalates: [
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Loss of recovery confidence is FCA-notifiable." },
  ],
  steps: [
    { slug: "scope-failure", title: "Scope which backups failed", description: "Single system? All systems? Single region?", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 60 },
    { slug: "older-snapshot", title: "Verify older snapshots", description: "Test-restore against the next-oldest viable snapshot.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 120, dependsOn: ["scope-failure"] },
    { slug: "invoke-imt", title: "Invoke IMT if no viable backup", description: "No working backup = severe operational + regulatory risk.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 5, decisionTypeCode: "INVOKE_IMT", dependsOn: ["older-snapshot"] },
    { slug: "urgent-fix", title: "Stand up immediate replacement backup", description: "Even ad-hoc snapshots are better than nothing while fixing root cause.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 240, dependsOn: ["scope-failure"] },
    { slug: "notify-fca", title: "Notify FCA if material", description: "Loss of recovery capability for an IBS is materially significant.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "FCA", slaHours: 24, trigger: "POST_AWARENESS" }, dependsOn: ["invoke-imt"] },
  ],
};

const SAR_OVERLOAD: LibraryRunbook = {
  slug: "sar-overload",
  title: "Subject-access-request overload",
  description:
    "SAR / erasure request volume spikes past capacity. Triage, automate, prevent statutory-clock breach.",
  category: "DATA_INCIDENT",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "DPO",
  steps: [
    { slug: "measure-backlog", title: "Measure backlog vs SLA", description: "How many SARs vs 30-day statutory clock.", kind: "ACTION", ownerRoleTitle: "DPO", estimatedMin: 30 },
    { slug: "automate-fulfilment", title: "Automate fulfilment where possible", description: "Self-service export for common categories.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 120, dependsOn: ["measure-backlog"] },
    { slug: "extension-rules", title: "Apply 2-month extensions for complex requests", description: "Document the complexity basis.", kind: "DECISION", ownerRoleTitle: "DPO", estimatedMin: 30, dependsOn: ["measure-backlog"] },
    { slug: "external-resource", title: "Bring in external resource", description: "Specialist legal-ops vendor to clear backlog.", kind: "DECISION", ownerRoleTitle: "DPO", estimatedMin: 60, dependsOn: ["measure-backlog"] },
    { slug: "preventive-comms", title: "Preventive comms", description: "If a high-profile event is driving the surge, address it head-on.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 30, dependsOn: ["measure-backlog"] },
  ],
};

const CROSS_BORDER_DATA_BLOCK: LibraryRunbook = {
  slug: "cross-border-data-block",
  title: "Cross-border data-transfer block",
  description:
    "Regulator or court order halts a specific cross-border data transfer (e.g. EU-US data flow). Reroute, repatriate, or comply.",
  category: "DATA_INCIDENT",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "DPO",
  steps: [
    { slug: "scope-flows", title: "Scope affected flows", description: "Which services, which categories of data, which destinations.", kind: "ACTION", ownerRoleTitle: "DPO", estimatedMin: 120 },
    { slug: "legal-position", title: "Confirm legal position", description: "Standard contractual clauses, transfer impact assessment, derogations.", kind: "DECISION", ownerRoleTitle: "Chief Legal Officer", estimatedMin: 240, dependsOn: ["scope-flows"] },
    { slug: "reroute-or-localise", title: "Reroute or localise", description: "Switch to an in-jurisdiction processor, or repatriate.", kind: "DECISION", ownerRoleTitle: "CTO", estimatedMin: 60, dependsOn: ["legal-position"] },
    { slug: "vendor-comms", title: "Vendor coordination", description: "Brief affected processors; update DPAs as needed.", kind: "COMMS", ownerRoleTitle: "DPO", estimatedMin: 60, dependsOn: ["reroute-or-localise"] },
  ],
};

const DATA_CORRUPTION: LibraryRunbook = {
  slug: "data-corruption",
  title: "Data corruption in core system",
  description:
    "Confirmed corruption in a primary data store. Halt writes, restore, validate.",
  category: "DATA_INCIDENT",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CTO",
  trigger: { severityAtLeast: "HIGH" },
  steps: [
    { slug: "halt-writes", title: "Halt writes", description: "Prevent corruption from spreading.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 10 },
    { slug: "diagnose", title: "Diagnose corruption scope", description: "Which tables, which time range, replication state.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 60, dependsOn: ["halt-writes"] },
    { slug: "restore-from-backup", title: "Restore from backup", description: "Last known-good snapshot; accept data-loss window.", kind: "ACTION", ownerRoleTitle: "CTO", estimatedMin: 240, dependsOn: ["diagnose"] },
    { slug: "validate-integrity", title: "Validate restored integrity", description: "Reconciliation against source-of-truth feeds.", kind: "ACTION", ownerRoleTitle: "CFO", estimatedMin: 120, dependsOn: ["restore-from-backup"] },
    { slug: "customer-comms", title: "Customer comms (if data-loss visible)", description: "If transactions lost in the restore window, individual notifications.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 60, dependsOn: ["validate-integrity"] },
  ],
};

// ─── People disruption runbooks ─────────────────────────────────────────

const KEY_PERSON_LOSS: LibraryRunbook = {
  slug: "key-person-loss",
  title: "Loss of key person",
  description:
    "Sudden departure (death / arrest / resignation) of an SMF or single-shoulder critical operator. Activate deputy, transfer accountabilities, regulator notifications.",
  category: "PEOPLE_DISRUPTION",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Chief People Officer",
  trigger: { severityAtLeast: "HIGH" },
  steps: [
    { slug: "activate-deputy", title: "Activate the deputy", description: "Per the role catalogue's deputy chain.", kind: "ACTION", ownerRoleTitle: "Chief People Officer", estimatedMin: 30 },
    { slug: "secure-accounts", title: "Secure their accounts + sign-off rights", description: "Without delay — payment-authorisation rights, board-pack access.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 30, dependsOn: ["activate-deputy"] },
    { slug: "regulator-notification", title: "SMF change notification", description: "Notify FCA + PRA of SMF holder change.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 60, regulatorTrigger: { regulator: "FCA", slaHours: 24, trigger: "POST_AWARENESS" }, dependsOn: ["activate-deputy"] },
    { slug: "staff-comms", title: "Staff communications", description: "Tone is respectful; succession is reassuring.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 30, commsTemplate: { stakeholder: "EMPLOYEES", subject: "Important leadership update", bodyTemplate: "Team — we have an important update to share. [SHORT, RESPECTFUL CONTEXT]. {{ownerRoleTitle}} is stepping in as acting [SMF TITLE] from immediate effect; the wider IMT remains unchanged. We'll share more detail at a town-hall on [DATE]. Please direct any questions to your line manager." }, dependsOn: ["activate-deputy"] },
    { slug: "external-comms", title: "External comms (if SMF or board)", description: "Stock exchange / press release if listed; customer comms if customer-facing.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 60, dependsOn: ["staff-comms"] },
    { slug: "permanent-plan", title: "Plan permanent succession", description: "Internal candidate, search firm, interim engagement.", kind: "CHECKPOINT", ownerRoleTitle: "Chief People Officer", estimatedMin: 120, dependsOn: ["activate-deputy"] },
  ],
};

const SMF_EMERGENCY_LEAVE: LibraryRunbook = {
  slug: "smf-emergency-leave",
  title: "SMF on unexpected emergency leave",
  description:
    "Senior Management Function holder taken out by health or family emergency. Deputy steps in for the duration; regulator filed within 10 business days.",
  category: "PEOPLE_DISRUPTION",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Chief People Officer",
  steps: [
    { slug: "activate-deputy", title: "Activate deputy", description: "Per catalogue chain; brief them on live items.", kind: "ACTION", ownerRoleTitle: "Chief People Officer", estimatedMin: 30 },
    { slug: "handover-pack", title: "Prepare handover pack", description: "Open items, pending decisions, next two-week calendar.", kind: "ACTION", ownerRoleTitle: "Chief People Officer", estimatedMin: 120, dependsOn: ["activate-deputy"] },
    { slug: "regulator-12-week", title: "12-week regulator clock", description: "Notify if absence will exceed 12 weeks.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 30, dependsOn: ["activate-deputy"] },
    { slug: "staff-comms", title: "Staff comms", description: "Respect privacy; reassure on cover.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 15, dependsOn: ["activate-deputy"] },
  ],
};

const MASS_ABSENCE_STRIKE: LibraryRunbook = {
  slug: "mass-absence-strike",
  title: "Industrial action / mass absence",
  description:
    "Union strike or coordinated walkout affecting > 20% of staff. Activate continuity plan, brief customers if customer-visible.",
  category: "PEOPLE_DISRUPTION",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Chief People Officer",
  steps: [
    { slug: "confirm-scope", title: "Confirm absence scope", description: "Which teams, what duration is expected.", kind: "ACTION", ownerRoleTitle: "Chief People Officer", estimatedMin: 60 },
    { slug: "continuity-plan", title: "Activate continuity plan", description: "Cross-training, agency support, pre-agreed essentials list.", kind: "ACTION", ownerRoleTitle: "COO", estimatedMin: 120, dependsOn: ["confirm-scope"] },
    { slug: "customer-comms", title: "Customer comms (if visible)", description: "If branch / contact-centre impact, set expectations.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 30, dependsOn: ["continuity-plan"] },
    { slug: "monitor-iboundaries", title: "Monitor IBS impact tolerances", description: "Watch for breach risk; escalate to IMT if needed.", kind: "CHECKPOINT", ownerRoleTitle: "Head of Operational Resilience", estimatedMin: 60, dependsOn: ["confirm-scope"] },
  ],
};

const OUTSOURCE_CENTRE_CLOSURE: LibraryRunbook = {
  slug: "outsource-centre-closure",
  title: "Outsource centre closure",
  description:
    "An outsourced operations centre (KYC, ops, contact-centre) unexpectedly stops providing service. Activate vendor exit plan, in-source critical functions.",
  category: "PEOPLE_DISRUPTION",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "COO",
  trigger: { severityAtLeast: "HIGH" },
  steps: [
    { slug: "verify-cause", title: "Verify cause + duration", description: "Vendor insolvency, regional event, regulatory action.", kind: "ACTION", ownerRoleTitle: "COO", estimatedMin: 60 },
    { slug: "activate-exit", title: "Activate vendor exit plan", description: "Per the MTP register exit-plan documentation.", kind: "ACTION", ownerRoleTitle: "Head of Procurement", estimatedMin: 120, dependsOn: ["verify-cause"] },
    { slug: "in-source-critical", title: "In-source critical functions", description: "Functions where the impact tolerance can't absorb more delay.", kind: "ACTION", ownerRoleTitle: "COO", estimatedMin: 240, dependsOn: ["activate-exit"] },
    { slug: "notify-fca", title: "Notify FCA — material vendor disruption", description: "Material outsource disruption triggers FCA notification.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "FCA", slaHours: 24, trigger: "POST_AWARENESS" }, dependsOn: ["verify-cause"] },
    { slug: "customer-comms", title: "Customer comms (if SLA visible)", description: "If wait-times or service degradation will be visible to customers.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 30, dependsOn: ["in-source-critical"] },
  ],
};

const SOLO_OPERATOR_UNAVAILABLE: LibraryRunbook = {
  slug: "solo-operator-unavailable",
  title: "Single-shoulder operator unavailable",
  description:
    "A function with no documented backup is unstaffed (illness, holiday, departure). Activate cross-training plan, document properly.",
  category: "PEOPLE_DISRUPTION",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Chief People Officer",
  steps: [
    { slug: "identify-cover", title: "Identify nearest-skilled cover", description: "Look across teams; brief them on the function urgently.", kind: "ACTION", ownerRoleTitle: "Chief People Officer", estimatedMin: 60 },
    { slug: "knowledge-recovery", title: "Recover documentation + access", description: "Mailbox, Confluence, shared drives — get the cover what they need.", kind: "ACTION", ownerRoleTitle: "Head of People", estimatedMin: 60, dependsOn: ["identify-cover"] },
    { slug: "cross-train", title: "Begin cross-training plan", description: "This must become a permanent change — never one-deep again.", kind: "CHECKPOINT", ownerRoleTitle: "Chief People Officer", estimatedMin: 240, dependsOn: ["identify-cover"] },
  ],
};

// ─── Regulatory notification runbooks ───────────────────────────────────

const FCA_MATERIAL_INCIDENT: LibraryRunbook = {
  slug: "fca-material-incident",
  title: "FCA material incident notification",
  description:
    "Standalone runbook for filing the FCA 4-hour material-incident notification. Used when a parent runbook has not already covered it.",
  category: "REGULATORY_NOTIFICATION",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CRO",
  steps: [
    { slug: "confirm-materiality", title: "Confirm materiality", description: "Customer harm / market integrity / supervisability test.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 30 },
    { slug: "draft-notification", title: "Draft notification", description: "What, when, who, what we're doing, when we'll update.", kind: "ACTION", ownerRoleTitle: "CRO", estimatedMin: 60, dependsOn: ["confirm-materiality"] },
    { slug: "smf-signoff", title: "SMF sign-off", description: "Accountable individual signs the notification before submission.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 15, dependsOn: ["draft-notification"] },
    { slug: "submit", title: "Submit via FCA Connect", description: "File within 4 hours of incident invocation.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "FCA", slaHours: 4, trigger: "POST_INVOCATION" }, dependsOn: ["smf-signoff"] },
    { slug: "update-cadence", title: "Set update cadence", description: "Typically daily until close-out.", kind: "CHECKPOINT", ownerRoleTitle: "CRO", estimatedMin: 15, dependsOn: ["submit"] },
  ],
};

const PRA_MATERIAL_INCIDENT: LibraryRunbook = {
  slug: "pra-material-incident",
  title: "PRA material incident notification",
  description:
    "Standalone PRA notification for PRA-supervised firms.",
  category: "REGULATORY_NOTIFICATION",
  applicableTiers: BANKS,
  ownerRoleTitle: "CRO",
  steps: [
    { slug: "confirm-pra-scope", title: "Confirm PRA-scope materiality", description: "Safety + soundness, financial stability, policyholder protection.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 30 },
    { slug: "draft-notification", title: "Draft notification", description: "PRA Statement of Notification template.", kind: "ACTION", ownerRoleTitle: "CRO", estimatedMin: 60, dependsOn: ["confirm-pra-scope"] },
    { slug: "submit", title: "Submit via BEEDS / supervisor", description: "Within scheme rules; typically 4 hours.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "PRA", slaHours: 4, trigger: "POST_INVOCATION" }, dependsOn: ["draft-notification"] },
    { slug: "ongoing-updates", title: "Ongoing update cadence", description: "Engage with named supervisor for cadence.", kind: "CHECKPOINT", ownerRoleTitle: "CRO", estimatedMin: 30, dependsOn: ["submit"] },
  ],
};

const ICO_72H_BREACH: LibraryRunbook = {
  slug: "ico-72h-breach",
  title: "ICO 72-hour personal-data breach",
  description:
    "Standalone runbook for filing the ICO 72-hour breach notification.",
  category: "REGULATORY_NOTIFICATION",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "DPO",
  steps: [
    { slug: "confirm-pd", title: "Confirm personal data is in scope", description: "Categories + likely number of individuals.", kind: "DECISION", ownerRoleTitle: "DPO", estimatedMin: 60 },
    { slug: "risk-assess", title: "Risk-assess for individuals", description: "Likelihood + severity of harm to individuals.", kind: "DECISION", ownerRoleTitle: "DPO", estimatedMin: 60, dependsOn: ["confirm-pd"] },
    { slug: "submit", title: "Submit to ICO", description: "Within 72h of awareness; provisional submission allowed.", kind: "NOTIFICATION", ownerRoleTitle: "DPO", estimatedMin: 60, regulatorTrigger: { regulator: "ICO", slaHours: 72, trigger: "POST_AWARENESS" }, dependsOn: ["risk-assess"] },
    { slug: "individual-notify", title: "Notify individuals if high risk", description: "Direct notification when high risk to rights + freedoms.", kind: "COMMS", ownerRoleTitle: "DPO", estimatedMin: 240, dependsOn: ["risk-assess"] },
  ],
};

const BOE_SETTLEMENT_INCIDENT: LibraryRunbook = {
  slug: "boe-settlement-incident",
  title: "BoE settlement-affecting incident",
  description:
    "Incident affecting BoE settlement systems (CHAPS / RTGS). Notification within scheme rules + heightened cadence.",
  category: "REGULATORY_NOTIFICATION",
  applicableTiers: GSIB,
  ownerRoleTitle: "CRO",
  trigger: { severityAtLeast: "HIGH" },
  escalates: [
    { targetSlug: "fca-material-incident", rationale: "Settlement disruption usually requires parallel FCA notification." },
    { targetSlug: "pra-material-incident", rationale: "PRA-supervised firms file in parallel." },
  ],
  steps: [
    { slug: "confirm-scope", title: "Confirm settlement scope", description: "Which scheme, what window of disruption.", kind: "ACTION", ownerRoleTitle: "Head of Payments", estimatedMin: 30 },
    { slug: "notify-boe", title: "Notify Bank of England", description: "CHAPS member notification per scheme rules.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 30, regulatorTrigger: { regulator: "BANK_OF_ENGLAND", slaHours: 1, trigger: "POST_AWARENESS" }, dependsOn: ["confirm-scope"] },
    { slug: "scheme-coordination", title: "Coordinate with scheme operator", description: "Engage scheme operator for cross-firm impact picture.", kind: "ACTION", ownerRoleTitle: "Head of Payments", estimatedMin: 60, dependsOn: ["notify-boe"] },
    { slug: "ongoing-cadence", title: "Ongoing update cadence (15 min)", description: "Settlement incidents get 15-min update cadence to BoE.", kind: "CHECKPOINT", ownerRoleTitle: "IMT Chair", estimatedMin: 15, dependsOn: ["notify-boe"] },
  ],
};

const DORA_MAJOR_ICT_INCIDENT: LibraryRunbook = {
  slug: "dora-major-ict-incident",
  title: "DORA major ICT-related incident",
  description:
    "EU DORA major-incident classification and report. Initial notification within 4 hours.",
  category: "REGULATORY_NOTIFICATION",
  applicableTiers: BANKS,
  ownerRoleTitle: "CRO",
  steps: [
    { slug: "classify-major", title: "Classify as major", description: "Apply DORA's classification thresholds.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 30 },
    { slug: "initial-notification", title: "Initial notification", description: "Submit within 4h of classification.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 60, regulatorTrigger: { regulator: "OTHER", slaHours: 4, trigger: "POST_AWARENESS" }, dependsOn: ["classify-major"] },
    { slug: "intermediate-report", title: "Intermediate report within 72h", description: "Update notification with confirmed scope and impact.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 120, regulatorTrigger: { regulator: "OTHER", slaHours: 72, trigger: "POST_AWARENESS" }, dependsOn: ["initial-notification"] },
    { slug: "final-report", title: "Final report within 1 month", description: "Comprehensive post-mortem submission.", kind: "CHECKPOINT", ownerRoleTitle: "CRO", estimatedMin: 240, dependsOn: ["intermediate-report"] },
  ],
};

// ─── Other / market-event runbooks ──────────────────────────────────────

const MARKET_DISLOCATION: LibraryRunbook = {
  slug: "market-dislocation",
  title: "Severe market dislocation / liquidity crunch",
  description:
    "Market-wide event affecting pricing, liquidity, or trading. Activate liquidity-stress posture, hedge urgent positions, brief CRO.",
  category: "OTHER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "CFO",
  trigger: { severityAtLeast: "HIGH" },
  steps: [
    { slug: "snap-liquidity", title: "Snapshot liquidity position", description: "Cash, repo facilities, committed lines.", kind: "ACTION", ownerRoleTitle: "Treasury", estimatedMin: 30 },
    { slug: "stop-loss", title: "Tighten stop-loss rules", description: "Reduce risk appetite intraday.", kind: "DECISION", ownerRoleTitle: "Head of Trading", estimatedMin: 30, dependsOn: ["snap-liquidity"] },
    { slug: "invoke-imt", title: "Invoke IMT", description: "Convene full executive IMT.", kind: "DECISION", ownerRoleTitle: "CRO", estimatedMin: 5, decisionTypeCode: "INVOKE_IMT", dependsOn: ["snap-liquidity"] },
    { slug: "notify-fca-if-material", title: "FCA notification if material", description: "Significant solvency / liquidity threat triggers notification.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 60, regulatorTrigger: { regulator: "FCA", slaHours: 4, trigger: "POST_INVOCATION" }, dependsOn: ["invoke-imt"] },
    { slug: "board-brief", title: "Board brief", description: "Same-day board update; consider RNS if listed.", kind: "COMMS", ownerRoleTitle: "CEO", estimatedMin: 60, dependsOn: ["invoke-imt"] },
  ],
};

const SANCTIONS_HIT_CASCADE: LibraryRunbook = {
  slug: "sanctions-hit-cascade",
  title: "Sanctions-list hit cascade",
  description:
    "New sanctions list addition triggers many alerts. Freeze, screen, prioritise, file SAR.",
  category: "OTHER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Head of Financial Crime",
  trigger: { severityAtLeast: "HIGH" },
  steps: [
    { slug: "ingest-list", title: "Ingest updated sanctions list", description: "OFSI / OFAC / EU list update.", kind: "ACTION", ownerRoleTitle: "Head of Financial Crime", estimatedMin: 30 },
    { slug: "screen-portfolio", title: "Screen customer portfolio", description: "Run screening against all customers + transactions.", kind: "ACTION", ownerRoleTitle: "Head of Financial Crime", estimatedMin: 120, dependsOn: ["ingest-list"] },
    { slug: "freeze-confirmed", title: "Freeze confirmed matches", description: "Apply sanctions freeze to confirmed matches without delay.", kind: "ACTION", ownerRoleTitle: "Head of Financial Crime", estimatedMin: 60, dependsOn: ["screen-portfolio"] },
    { slug: "notify-ofsi", title: "Notify OFSI / equivalent", description: "Required by UK sanctions rules.", kind: "NOTIFICATION", ownerRoleTitle: "Head of Financial Crime", estimatedMin: 60, regulatorTrigger: { regulator: "OTHER", slaHours: 24, trigger: "POST_AWARENESS" }, dependsOn: ["freeze-confirmed"] },
    { slug: "customer-impact", title: "Manage customer impact", description: "Customers caught up incorrectly need rapid resolution.", kind: "ACTION", ownerRoleTitle: "Head of Financial Crime", estimatedMin: 120, dependsOn: ["freeze-confirmed"] },
  ],
};

const HOSTILE_INSPECTION: LibraryRunbook = {
  slug: "hostile-inspection",
  title: "Unannounced regulatory inspection",
  description:
    "Regulator arrives unannounced. Preserve evidence, give them the documents they ask for, brief executives.",
  category: "OTHER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Chief Legal Officer",
  steps: [
    { slug: "verify-credentials", title: "Verify inspector credentials", description: "ID + warrant / authority; document.", kind: "ACTION", ownerRoleTitle: "Chief Legal Officer", estimatedMin: 15 },
    { slug: "legal-attend", title: "Legal counsel attends throughout", description: "Never leave inspectors with staff alone; protect privilege.", kind: "ACTION", ownerRoleTitle: "Chief Legal Officer", estimatedMin: 60, dependsOn: ["verify-credentials"] },
    { slug: "scope-request", title: "Scope the request precisely", description: "What documents, what time-window; resist over-broad scope.", kind: "ACTION", ownerRoleTitle: "Chief Legal Officer", estimatedMin: 30, dependsOn: ["verify-credentials"] },
    { slug: "preserve-evidence", title: "Legal-hold across affected areas", description: "Suspend retention deletes for affected categories.", kind: "ACTION", ownerRoleTitle: "Chief Legal Officer", estimatedMin: 30, dependsOn: ["scope-request"] },
    { slug: "exec-brief", title: "Executive briefing", description: "CEO + CRO + Chair informed immediately.", kind: "COMMS", ownerRoleTitle: "CEO", estimatedMin: 30, dependsOn: ["verify-credentials"] },
  ],
};

const ACTIVE_MAJOR_FRAUD: LibraryRunbook = {
  slug: "active-major-fraud",
  title: "Active major fraud discovered",
  description:
    "Sizeable fraud (insider / external) ongoing. Freeze the loss, preserve evidence, coordinate with law enforcement.",
  category: "OTHER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Head of Financial Crime",
  trigger: { severityAtLeast: "CRITICAL" },
  escalates: [
    { targetSlug: "fca-material-incident", severityAtLeast: "HIGH", rationale: "Active major fraud triggers FCA notification." },
  ],
  steps: [
    { slug: "stop-the-loss", title: "Stop the loss", description: "Freeze the accounts / payments involved.", kind: "ACTION", ownerRoleTitle: "Head of Financial Crime", estimatedMin: 30 },
    { slug: "preserve-evidence", title: "Preserve evidence", description: "Chain of custody, image affected systems.", kind: "ACTION", ownerRoleTitle: "CISO", estimatedMin: 60, dependsOn: ["stop-the-loss"] },
    { slug: "law-enforcement", title: "Engage law enforcement", description: "Action Fraud + NCA for serious organised fraud.", kind: "ACTION", ownerRoleTitle: "Chief Legal Officer", estimatedMin: 60, dependsOn: ["preserve-evidence"] },
    { slug: "notify-fca", title: "Notify FCA", description: "Material fraud event = supervisory notification.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 60, regulatorTrigger: { regulator: "FCA", slaHours: 24, trigger: "POST_AWARENESS" }, dependsOn: ["preserve-evidence"] },
    { slug: "victim-comms", title: "Victim comms (if customers affected)", description: "Empathetic + practical; reimbursement plan if applicable.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 60, dependsOn: ["stop-the-loss"] },
  ],
};

const EXEC_SUCCESSION_CRISIS: LibraryRunbook = {
  slug: "exec-succession-crisis",
  title: "Executive succession crisis",
  description:
    "Multiple executives unavailable simultaneously. Activate full succession matrix, brief board + regulators.",
  category: "OTHER",
  applicableTiers: ALL_TIERS,
  ownerRoleTitle: "Chair",
  trigger: { severityAtLeast: "CRITICAL" },
  steps: [
    { slug: "convene-board", title: "Convene board", description: "Emergency board call within 4 hours.", kind: "ACTION", ownerRoleTitle: "Chair", estimatedMin: 60 },
    { slug: "activate-matrix", title: "Activate succession matrix", description: "Per the standing matrix; each SMF role gets a named acting holder.", kind: "ACTION", ownerRoleTitle: "Chair", estimatedMin: 120, dependsOn: ["convene-board"] },
    { slug: "regulator-brief", title: "Brief regulator(s)", description: "FCA + PRA on the temporary arrangements.", kind: "NOTIFICATION", ownerRoleTitle: "CRO", estimatedMin: 60, regulatorTrigger: { regulator: "FCA", slaHours: 24, trigger: "POST_AWARENESS" }, dependsOn: ["activate-matrix"] },
    { slug: "external-comms", title: "External comms (if material)", description: "RNS if listed; customer comms if customer-facing.", kind: "COMMS", ownerRoleTitle: "Head of Comms", estimatedMin: 60, dependsOn: ["activate-matrix"] },
    { slug: "search-process", title: "Begin permanent search", description: "Brief search firm; interim candidates considered.", kind: "CHECKPOINT", ownerRoleTitle: "Chair", estimatedMin: 240, dependsOn: ["activate-matrix"] },
  ],
};

export const LIBRARY_RUNBOOKS: LibraryRunbook[] = [
  // Existing
  RANSOMWARE,
  DDOS_RESPONSE,
  CLOUD_REGION_OUTAGE,
  VENDOR_FAILURE,
  BCP_ACTIVATION,
  // Cyber
  PHISHING_CREDENTIAL_COMPROMISE,
  SUPPLY_CHAIN_COMPROMISE,
  INSIDER_THREAT,
  ZERO_DAY_DISCLOSURE,
  LOST_DEVICE_WITH_DATA,
  DATA_EXFILTRATION,
  COMPROMISED_ADMIN_CREDS,
  WIRE_FRAUD_SURGE,
  // Cloud / infrastructure
  HYPERSCALER_SERVICE_OUTAGE,
  DNS_PROVIDER_OUTAGE,
  CDN_OUTAGE,
  DB_FAILOVER_GONE_WRONG,
  KUBERNETES_CLUSTER_OUTAGE,
  // Vendor
  PAYMENTS_SCHEME_OUTAGE,
  CARD_SCHEME_OUTAGE,
  KYC_VENDOR_OUTAGE,
  SMS_OTP_FAILURE,
  EMAIL_PROVIDER_OUTAGE,
  SAAS_CRITICAL_OUTAGE,
  CONTACT_CENTRE_OUTAGE,
  // BCP
  OFFICE_INACCESSIBLE,
  SEVERE_WEATHER,
  PANDEMIC_ABSENCE,
  WAN_LOSS,
  // Data
  MASS_DATA_BREACH,
  DATA_QUALITY_LEDGER,
  BACKUP_INTEGRITY_FAILURE,
  SAR_OVERLOAD,
  CROSS_BORDER_DATA_BLOCK,
  DATA_CORRUPTION,
  // People
  KEY_PERSON_LOSS,
  SMF_EMERGENCY_LEAVE,
  MASS_ABSENCE_STRIKE,
  OUTSOURCE_CENTRE_CLOSURE,
  SOLO_OPERATOR_UNAVAILABLE,
  // Regulatory
  FCA_MATERIAL_INCIDENT,
  PRA_MATERIAL_INCIDENT,
  ICO_72H_BREACH,
  BOE_SETTLEMENT_INCIDENT,
  DORA_MAJOR_ICT_INCIDENT,
  // Other
  MARKET_DISLOCATION,
  SANCTIONS_HIT_CASCADE,
  HOSTILE_INSPECTION,
  ACTIVE_MAJOR_FRAUD,
  EXEC_SUCCESSION_CRISIS,
];

export function findLibraryRunbook(slug: string): LibraryRunbook | undefined {
  return LIBRARY_RUNBOOKS.find((r) => r.slug === slug);
}
