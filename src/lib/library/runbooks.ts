import type { RunbookCategory, RunbookStepKind } from "@/generated/prisma/enums";

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

export type LibraryRunbook = {
  slug: string;
  title: string;
  description: string;
  category: RunbookCategory;
  ownerRoleTitle: string;
  trigger?: {
    severityAtLeast?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    scenarioCategoryEquals?: string;
  };
  steps: LibraryRunbookStep[];
};

const RANSOMWARE: LibraryRunbook = {
  slug: "ransomware-response",
  title: "Ransomware response",
  description:
    "First-90-minute playbook for confirmed or suspected ransomware. Isolates the blast radius, stands up the IMT, files regulator notifications on the right clocks, and pre-stages customer comms.",
  category: "RANSOMWARE",
  ownerRoleTitle: "CISO",
  trigger: { severityAtLeast: "HIGH", scenarioCategoryEquals: "Technology & Data (Cyber)" },
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
  ownerRoleTitle: "CTO",
  trigger: { severityAtLeast: "HIGH" },
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
  ownerRoleTitle: "Head of Procurement",
  trigger: { severityAtLeast: "MEDIUM" },
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
  ownerRoleTitle: "CRO",
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
  ownerRoleTitle: "CISO",
  trigger: { severityAtLeast: "MEDIUM" },
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

export const LIBRARY_RUNBOOKS: LibraryRunbook[] = [
  RANSOMWARE,
  DDOS_RESPONSE,
  CLOUD_REGION_OUTAGE,
  VENDOR_FAILURE,
  BCP_ACTIVATION,
];

export function findLibraryRunbook(slug: string): LibraryRunbook | undefined {
  return LIBRARY_RUNBOOKS.find((r) => r.slug === slug);
}
