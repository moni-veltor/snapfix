import type { ScenarioTemplate } from "../types";

export const insiderDataExfil: ScenarioTemplate = {
  slug: "insider-data-exfil",
  title: "Insider Data Exfiltration — Privileged-User Threat",
  category: "Technology & Data (Cyber)",
  srrRef: "3.2, 3.4",
  background:
    "A trusted privileged user — a senior database engineer with legitimate access to customer-identifying records — has been observed exfiltrating large volumes of personal data over a sustained period. Detection comes via the DLP system flagging anomalous outbound traffic patterns, followed by SIEM correlation showing access patterns inconsistent with the engineer's stated role activities. The exercise puts the firm through a data-breach response that is harder than the external-attacker case: the actor is inside the trust boundary, the regulatory clock (ICO 72h) starts the moment a personal data breach is suspected, and HR / Legal / Compliance must work in lockstep with Security and IT without alerting the suspect prematurely.",
  agenda:
    "09:30 Detection & initial triage\n09:45 IMT invocation & severity classification\n10:00 ICO 72h clock starts\n10:30 Containment without tip-off\n11:30 Forensic evidence preservation\n12:30 Customer & regulator comms drafting\n14:00 Closure conditions, lessons-learned",
  dDayDate: "2026-07-22T09:30:00Z",
  durationMin: 240,

  cause:
    "A long-tenured database engineer (≥ 5 years, SMF-adjacent privileged access) has been routinely exporting customer KYC records to a personal cloud-storage account over the past 6 weeks. The volume escalates sharply in the 72 hours before detection — DLP flags a single 4.2GB outbound transfer to an unsanctioned domain. SIEM correlation confirms the access pattern doesn't align with any open ticket or business justification.",
  impactNarrative:
    "Initial scoping suggests ~140,000 customer records exfiltrated, including name, address, date of birth, NI numbers, and partial bank-account information. Of these, ~22% are vulnerable customers per the firm's Consumer Duty register. The actor still has live access at the moment of detection — revoking access prematurely will tip them off and may destroy evidence; leaving access live risks further exfiltration. The firm has no evidence the data has been sold or leaked publicly yet, but the actor's motivation is unknown (financial, disgruntlement, third-party recruitment).",
  characteristics: [
    "Insider — actor is on the staff, inside the security perimeter.",
    "Detected via DLP + SIEM correlation, not via external indicator.",
    "Personal data clearly affected — UK GDPR Art. 33 72h clock applies.",
    "Containment is constrained — premature action tips off the actor.",
    "HR, Legal, Security, Compliance must coordinate without leakage.",
    "Consumer Duty material — material vulnerable-customer impact.",
  ],
  assumptions: [
    "The actor retains live access at the moment of detection.",
    "Backups and audit logs are intact (the actor hasn't touched their cover).",
    "Forensic tooling is available; the firm has a digital-forensics retainer.",
    "Legal counsel can be reached within 30 minutes.",
    "The firm has a documented insider-threat playbook — but it hasn't been exercised in 18 months.",
  ],
  compoundScenarioNotes:
    "Insider-threat events frequently co-occur with M&A integration periods (access not fully reconciled), with staff-disgruntlement signals (recent performance management), or with third-party engagement (the actor may be on a vendor's procurement target list). Compounding with a ransomware or external-cyber event creates an evidentiary nightmare where it's unclear whether the insider is independent or a recruited beach-head.",
  takeaways:
    "Insider data exfiltration is a structurally different shape from external cyber: the legal and HR processes run in parallel with the technical containment. The hardest part is preserving evidence (which constrains containment options) while staying inside the ICO 72h clock and meeting Consumer Duty obligations. Firms that have only exercised external-cyber playbooks are usually unprepared for the HR + Legal coordination this demands.",
  stressVariables: [
    { name: "Records affected", options: ["10k", "50k", "140k", "500k", ">1m"] },
    { name: "Vulnerable customers %", options: ["0%", "5%", "15%", "22%", ">40%"] },
    { name: "Actor's access level", options: ["Read-only", "Read-write", "SMF-adjacent", "SMF", "Domain admin"] },
    { name: "Time of detection", options: ["Business hours", "Out-of-hours", "Holiday period"] },
  ],
  caseStudy: {
    title: "Morrisons (2014) — Internal Data Leak",
    causation:
      "A disgruntled senior internal auditor at Morrisons supermarket exfiltrated payroll data for 99,998 employees and posted it online. He was caught and convicted, but Morrisons faced years of group litigation from affected employees claiming vicarious liability for the breach.",
    impactScale:
      "Records of nearly 100,000 employees published online. Morrisons faced both the regulatory investigation (ICO) and a multi-year civil class action that ultimately went to the Supreme Court. Costs to defend and remediate ran into the millions.",
    duration:
      "Initial leak: 24 hours. Public discovery and notification: 2–3 weeks. Litigation: 6 years to final Supreme Court ruling (2020).",
  },
  riskCoverage: {
    people: true,
    property: false,
    technology: true,
    dataAvailability: false,
    dataIntegrity: true,
    thirdParty: false,
  },

  ibsList: [
    {
      code: "IBS_01",
      name: "Deposit Account Opening",
      description: "Opening of new deposit accounts (savings, fixed-term).",
      impactToleranceMin: 240,
      criticality: "HIGH",
    },
    {
      code: "IBS_05",
      name: "Provision of a channel for urgent communications to customers",
      description: "Authoritative outbound channel for urgent customer communications — critical for breach notification.",
      impactToleranceMin: 120,
      criticality: "HIGH",
    },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "09:30",
      title: "DLP alert — large outbound transfer",
      description:
        "The Data Loss Prevention platform flags a 4.2 GB outbound transfer from a privileged engineer's workstation to an unsanctioned cloud domain (sync.personal-cloud-provider.com). The SOC analyst on duty correlates this with the SIEM and finds the same user has been accessing customer-identifying tables outside any open ticket since approximately 6 weeks ago — escalating in the last 72 hours. The user is still active and has accessed the same tables 5 times in the past hour.",
      expectedActions: [
        "Escalate to ISM and CTO within 15 minutes",
        "Preserve DLP and SIEM logs in WORM storage",
        "Avoid tipping off the user — do NOT revoke access yet",
        "Engage Legal counsel for evidence-handling guidance",
      ],
      objectives: [
        "Test detection-to-escalation latency on insider threats",
        "Validate evidence preservation procedures",
        "Test the 'don't tip off' discipline under time pressure",
      ],
      senderRoleTitle: "ISM",
      toRoleTitles: ["CTO", "CRO"],
      ccRoleTitles: ["Head of Compliance"],
    },
    {
      eventNo: 2,
      scheduledTime: "09:45",
      title: "Initial scoping — personal data confirmed",
      description:
        "Forensic triage confirms the exfiltrated records include name, address, date of birth, NI number, and partial bank-account details — clearly within UK GDPR's definition of personal data. Initial estimate: 140,000 records affected, of which ~22% are flagged on the firm's Consumer Duty vulnerable-customer register. The ICO 72-hour notification clock starts the moment the firm becomes aware of a personal data breach — that moment is now.",
      expectedActions: [
        "Invoke the IMT formally (CEO + CRO)",
        "Classify severity — High by default (Consumer Duty + personal data)",
        "Start the ICO 72h clock with documented timestamp",
        "Brief Head of Compliance on UK GDPR Art. 33 reportability",
      ],
      objectives: [
        "Test IMT invocation discipline",
        "Validate the Consumer Duty + High severity rule",
        "Confirm ICO timeline awareness",
      ],
      senderRoleTitle: "Head of Compliance",
      toRoleTitles: ["CEO", "CRO"],
      ccRoleTitles: ["CTO", "CCO"],
    },
    {
      eventNo: 3,
      scheduledTime: "10:30",
      title: "Containment dilemma — actor still active",
      description:
        "Forensics reports the user has just initiated another export. The IMT must decide: (a) revoke access immediately and risk tipping off + losing further visibility into actor intent, or (b) leave access live, increase monitoring, and risk further exfiltration. Legal counsel notes the firm has a duty to prevent further harm and cannot simply observe further breaches for forensic completeness — but a hasty technical revocation could destroy evidence and prejudice subsequent criminal proceedings.",
      expectedActions: [
        "Decision: technical isolation that preserves evidence",
        "Coordinate the disconnect with HR + Legal so the user can be called into a controlled meeting",
        "Document the rationale in the decision log (this is an audit-critical decision)",
        "Notify named SMF holders (CRO, CTO) — written record",
      ],
      objectives: [
        "Test cross-function decision-making under time pressure",
        "Validate the decision-log discipline on a high-stakes call",
        "Test the HR + Legal + Security coordination protocol",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CRO", "CEO"],
      ccRoleTitles: ["Head of Compliance"],
    },
    {
      eventNo: 4,
      scheduledTime: "12:00",
      title: "Press tip-off",
      description:
        "A journalist from a national business publication has called the press line asking for comment on 'reports we've received about a major customer data leak at the bank'. They mention they've seen a sample of what appears to be customer records circulating in a closed Telegram channel that focuses on financial-services data trading. They give the firm a 4-hour window to respond before they run the story.",
      expectedActions: [
        "Brief CEO + Head of External Affairs immediately",
        "Draft holding statement — confirm nothing, deny nothing",
        "Verify the alleged sample matches the actual exfiltration",
        "Confirm whether to bring forward customer-affected notifications",
      ],
      objectives: [
        "Test the comms cascade order (employees first, then customers + media)",
        "Validate the 'never deny / never confirm' discipline",
        "Test bringing forward notifications under media pressure",
      ],
      senderRoleTitle: "Head of External Affairs",
      toRoleTitles: ["CEO", "Comms Lead"],
      ccRoleTitles: ["CRO", "CCO"],
    },
    {
      eventNo: 5,
      scheduledTime: "14:30",
      title: "ICO contact",
      description:
        "Head of Compliance has prepared the ICO notification draft. The IMT must confirm: (a) whether the breach assessment is final or preliminary, (b) what the customer impact framing is, (c) whether the firm is prepared to publish the notification to affected customers in parallel with the ICO submission. The ICO 72h clock is at +5 hours and counting.",
      expectedActions: [
        "Approve the ICO notification text (CRO approves; CEO signs)",
        "Decide on parallel customer notification approach",
        "Document the rationale for any waivers from the 72h timeline",
        "Confirm the breach-register entry",
      ],
      objectives: [
        "Test the regulator-notification authority chain",
        "Validate documentation discipline under time pressure",
      ],
      senderRoleTitle: "Head of Compliance",
      toRoleTitles: ["CRO", "CEO"],
      ccRoleTitles: ["CCO"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "10:05",
      summary: "Customer-services team asks if anything is wrong",
      description:
        "Customer Services contact-centre lead notices unusual security questions on her team-meeting agenda this morning. She emails the COO directly: 'is there something I should know about — there's a rumour in the team that there's been a system event.' This is the first sign that internal staff are sensing something is off. How the IMT responds will set the tone for the employee-comms cascade.",
      senderRoleTitle: "Customer Ops Lead",
      toRoleTitles: ["COO"],
      ccRoleTitles: ["CEO"],
      relation: "Tests the cascade-ordering rule — employee comms must come before customer comms.",
    },
    {
      injectNo: 2,
      scheduledTime: "11:15",
      summary: "Vulnerable-customer team escalates",
      description:
        "The firm's vulnerable-customer specialist (reporting to the COO) notes that of the 140,000 affected records, ~30,800 are on the vulnerable-customer register. Under Consumer Duty, the firm has a duty to consider whether those customers need proactive contact ahead of the broader notification — and whether bespoke support arrangements are needed.",
      senderRoleTitle: "Customer Ops Lead",
      toRoleTitles: ["COO", "CCO"],
      ccRoleTitles: ["CEO", "Head of Compliance"],
      relation: "Tests Consumer Duty application in incident management.",
    },
    {
      injectNo: 3,
      scheduledTime: "13:00",
      summary: "HR requires controlled-meeting protocol",
      description:
        "Head of HR confirms the protocol for calling the suspect into a controlled meeting: two senior managers + Legal counsel + a Security observer in a non-recorded room, technical isolation activated 5 minutes before the meeting starts. HR notes this is the first time the protocol has been invoked in this firm; the playbook is documented but unrehearsed.",
      senderRoleTitle: "CPO",
      toRoleTitles: ["CTO", "Head of Compliance"],
      ccRoleTitles: ["CEO"],
      relation: "Tests the HR-Legal-Security coordination playbook (best practice / the insider-threat module).",
    },
  ],
};
