import type { ScenarioTemplate } from "../types";

export const cyberRansomware: ScenarioTemplate = {
  slug: "cyber-ransomware",
  title: "Cyber Attack — Malware (Ransomware)",
  category: "Technology & Data (Cyber)",
  srrRef: "3.1, 3.2",
  background:
    "This scenario explores a sophisticated double-extortion ransomware attack, resulting in the exfiltration of internal firm data and the encryption of core IT infrastructure, applications and end-point devices, causing Important Business Services (IBS) to be disrupted. The threat actor exploits an unpatched server to deploy malware which encrypts servers supporting core infrastructure as well as colleague end-point devices, then moves through the network compromising privileged accounts, domain controllers and backups, and exfiltrating customer PII.",
  agenda:
    "08:00 Discovery & Activation\n08:00–10:15 Containment & impact assessment\n10:15–11:30 Service-degradation response (BCP / regulator)\n11:30–13:00 Third-party impact (vendor-coordinated recovery)\n13:00–14:00 Communications & customer impact\n14:00–17:00 Recovery & handover",
  dDayDate: "2026-06-15T08:00:00Z",
  durationMin: 180,

  cause:
    "The threat actor exploits an unpatched server to successfully deploy malware which encrypts Windows servers supporting core infrastructure and IT applications, as well as colleague end-point devices. The threat actor moves through the network, compromising privileged accounts, domain controllers and backups, and exfiltrates customer PII.",
  impactNarrative:
    "The attack renders all impacted devices unusable, causing significant disruption to internal and external technology services. Response capabilities are limited because colleagues cannot access their devices. Disruption has been contained to a single Active Directory domain but ~50% of Windows servers are rendered the Active Directory inoperable. ~25% of user devices have also been encrypted across the entire estate, impacting all staff supporting IBS in addition to those IBS reliant on impacted servers. The threat actor posts the firm as a victim on their leak site, demanding a multi-million-dollar ransom to release the systems and return customer PII data. Media spreads the news and the firm faces pressure to comment. Other Financial Services firms confirm they have executed disconnection protocols. Within 3 days, the ransomware threat actors begin leaking PII as a pressure tactic.",
  characteristics: [
    "Rapid onset — no- or minimal-notice event with little to no time to put additional mitigations in place.",
    "Low predictability / highly changeable — threat actor adapts to counter-moves.",
    "High persistence — potential for recurring periods of disruption.",
    "Uncertain duration — investigation, containment and recovery time makes estimating business recovery times difficult.",
    "Information asymmetry — key information regarding the incident may not be fully visible.",
    "Disrupted communication — internal and external comms channels impaired by the nature of the incident.",
    "Higher scrutiny and potential to undermine stakeholder trust — through perceived or actual lack of action / transparency.",
  ],
  assumptions: [
    "Incident happens on a peak and/or significant trading day with above-average volume (in line with the worst-case scenario used for setting impact tolerance).",
    "Threat actor is capable and sophisticated, deploying ransomware as a business — both primary and backups have been encrypted.",
    "On completion of Technical Recovery, an application recovery/rebuild will be required followed by data and business reconciliation.",
  ],
  compoundScenarioNotes:
    "Cyber scenarios can be combined with a range of other causations. Rapid shifts to home-working (e.g. pandemic) create a much larger attack surface. Coincident third-party disruption (e.g. supply-chain or CSP outage) compounds recovery options.",
  takeaways:
    "The Maersk NotPetya attack demonstrated the vast disruptive potential of ransomware and speed of onset. It highlighted the importance of network segmentation, patch management and backups being isolated. Communication systems, key in any incident, may also be impacted — plans and tools required to recover need to be accessible without dependence on the technology that may be impacted.",
  stressVariables: [
    { name: "Platforms impacted", options: ["Windows", "Linux", "Midrange", "Mainframe", "Other"] },
    { name: "Servers impacted", options: ["60%", "70%", "80%", "90%", "100%"] },
    { name: "End-points impacted", options: ["30%", "40%", "50%", "50-75%", ">75%"] },
  ],
  caseStudy: {
    title: "Maersk — NotPetya (27 June 2017)",
    causation:
      "Container shipping company Maersk was one of many organisations across multiple countries hit by NotPetya, a destructive cyber attack which spread via a compromised Ukrainian accounting-software update and resulted in widespread encryption and unavailability of technology and data.",
    impactScale:
      "The attack spread across Maersk's network, crippling it within 7 minutes. 45,000 PCs and 4,000 servers were infected, impacting 76 global port terminals which had to shut down. Maersk reverted to manual operation and handled order backlogs. The attack was estimated to cost the organisation $300m.",
    duration:
      "It was 2 days before Maersk could take orders from existing customers, and 6–12 days before terminals gradually progressed to more normal operations. Operations didn't fully return to normal until mid-July.",
  },
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: true,
    dataIntegrity: true,
    thirdParty: false,
  },

  ibsList: [
    { code: "IBS_01", name: "Deposit Account Opening", description: "Opening of new deposit accounts (savings, fixed-term).", impactToleranceMin: 240, criticality: "HIGH" },
    { code: "IBS_02", name: "Deposit Access Service", description: "Customer access to existing deposit balances and withdrawals.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Issuing and Completion of a Secured Loan (mortgage)", description: "Processing of mortgage applications through to completion.", impactToleranceMin: 480, criticality: "HIGH" },
    { code: "IBS_04", name: "Providing access to balances", description: "Mobile and online channels surfacing account balances and statements.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_05", name: "Provision of a channel for urgent communications to customers", description: "Authoritative outbound channel for urgent customer communications.", impactToleranceMin: 120, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "08:00",
      title: "Initial Cyber Intrusion",
      description:
        "The Security Operations Centre receives multiple alerts indicating sophisticated penetration attempts targeting AWS infrastructure. The attack pattern suggests a coordinated effort using compromised credentials from a third-party contractor. Unusual API calls are detected across multiple regions, with attempts to escalate privileges and access sensitive customer data stores. Initial analysis suggests the attackers may have been present in the network for up to 48 hours before detection. CloudWatch metrics show suspicious spikes in customer data transfer during off-peak hours.",
      expectedActions: [
        "Activate Cyber Incident Response Team",
        "Begin impact assessment across all IBS",
        "Alert third-party providers",
        "Document initial findings",
      ],
      objectives: [
        "Validate detection capabilities",
        "Test initial response procedures",
        "Assess team coordination",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Sn.TPM", "TPM", "Sn. DA/E", "ISM"],
      ccRoleTitles: ["CEO", "CRO"],
    },
    {
      eventNo: 2,
      scheduledTime: "10:15",
      title: "Service Degradation",
      description:
        "A cascade of service degradations begins as the attack spreads. Mobile app users report seeing other customers' account balances intermittently (IBS_04). The deposit access service (IBS_02) starts showing delayed processing times, with some customers receiving duplicate transaction confirmations. Customer service receives a surge of calls about failed login attempts and unauthorised access notifications. Social media monitoring detects growing customer complaints, with several high-profile customers threatening to close their accounts. The bank's public website begins experiencing intermittent outages.",
      expectedActions: [
        "Implement BCP procedures",
        "Activate customer communication protocols",
        "Begin regulatory notification process",
        "Initiate service recovery procedures",
      ],
      objectives: [
        "Test service recovery processes",
        "Validate communication procedures",
        "Assess regulatory reporting",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Sn.TPM", "TPM", "Comms Lead"],
      ccRoleTitles: ["Customer Ops Lead"],
    },
    {
      eventNo: 3,
      scheduledTime: "11:00",
      title: "Third-Party Provider Impact",
      description:
        "The core-banking vendor reports critical degradation after detecting potentially malicious database queries originating from compromised application credentials. The system begins showing signs of data inconsistency, with some mortgage applications (IBS_03) displaying incorrect loan amounts and terms. Payment processing queues start backing up, affecting both incoming and outgoing transactions. Automated failover triggers but fails to complete successfully, leaving services in an indeterminate state.",
      expectedActions: [
        "Activate third-party contingency plans",
        "Implement manual processing",
        "Assess cross-service impacts",
        "Update stakeholders",
      ],
      objectives: [
        "Test contingency arrangements",
        "Validate manual processes",
        "Assess impact management",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Sn.TPM", "TPM"],
      ccRoleTitles: ["CEO", "CRO"],
    },
    {
      eventNo: 4,
      scheduledTime: "12:05",
      title: "Communication Channel Disruption",
      description:
        "The bank's primary customer communication infrastructure experiences a sophisticated DDoS attack, overwhelming the contact-centre systems. Simultaneously, the automated fraud detection system begins generating a high volume of false positives, flagging legitimate transactions as suspicious. The backup communication channels show signs of compromise, with unauthorised messages being queued for sending to customers.",
      expectedActions: [
        "Activate backup channels",
        "Implement emergency procedures",
        "Monitor fraud reporting capabilities",
        "Update crisis management team",
      ],
      objectives: [
        "Test communication resilience",
        "Validate backup systems",
        "Assess emergency response",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Comms Lead"],
      ccRoleTitles: ["TPM"],
    },
    {
      eventNo: 5,
      scheduledTime: "12:30",
      isScheduled: false,
      title: "Recovery Phase Initiation",
      description:
        "Initial recovery efforts begin showing progress as teams isolate compromised systems. However, the recovery process triggers hidden malware that begins deleting system logs and backup files. The incident response team discovers a sophisticated persistence mechanism in the AWS Lambda functions, requiring careful coordination to remove without disrupting essential services. Authentication systems start experiencing race conditions during the recovery process, causing intermittent lockouts for both customers and staff.",
      expectedActions: [
        "Begin service restoration",
        "Validate data integrity",
        "Document recovery steps",
        "Prepare stakeholder updates",
      ],
      objectives: [
        "Test recovery procedures",
        "Validate data consistency",
        "Assess restoration priorities",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Sn.TPM", "TPM", "Sn. DA/E", "ISM"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 6,
      scheduledTime: "17:00",
      isScheduled: false,
      title: "Recovery Completion and Handover",
      description:
        "Recovery teams achieve stable service restoration but discover potential data inconsistencies in recent mortgage applications. The incident response team identifies a previously unknown backdoor in a third-party integration service that requires immediate patching. Customer data reconciliation shows potential exposure of sensitive information, requiring regulatory disclosure assessment. Teams must coordinate complex handover procedures while maintaining heightened security posture and managing ongoing system stability issues.",
      expectedActions: [
        "Verify service restoration",
        "Complete incident documentation",
        "Prepare for D+1 activities",
        "Brief incoming teams",
      ],
      objectives: [
        "Validate full restoration",
        "Test handover procedures",
        "Assess documentation quality",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CEO", "CRO"],
      ccRoleTitles: ["Sn.TPM", "TPM", "Sn. DA/E", "ISM"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "09:33",
      summary: '"Interest Rate Chaos" — system disruption',
      description:
        "Sophisticated malware activates across the savings platform, altering all fixed-term deposit rates to show 13% AER. The mobile app and online banking begin displaying inflated maturity values for all savings products. The system starts sending automated maturity notifications to fixed-term deposit holders showing incorrect enhanced returns. When staff attempt to correct rates manually, the system automatically doubles the erroneous rate. The mortgage calculator begins showing monthly payments of £13 regardless of loan amount, causing a surge in online mortgage applications.",
      relation:
        "Occurs shortly after Event #2 service degradation. Exploits the initial AWS infrastructure breach. Tests IBS_01 (deposit account opening) and IBS_02 (deposit access).",
      senderRoleTitle: "ISM",
      toRoleTitles: ["Sn.TPM", "TPM", "Sn. DA/E"],
      ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 2,
      scheduledTime: "11:40",
      summary: "Early Access Anomaly",
      description:
        "A system glitch begins triggering false early-access requests for fixed-term savings accounts, bypassing notice-period requirements. The platform starts sending automated approval messages for penalty-free withdrawals to all savings customers. Customer notifications include legitimate-looking payment instructions directing funds to 'secure holding accounts'. The online servicing portal begins displaying countdown timers showing all fixed-term products maturing within 24 hours, while mortgage payment dates are shown as defaulting to immediate payment in full.",
      relation:
        "Precedes Event #3 (third-party degradation). Tests emergency response procedures for unauthorised financial transactions. Directly impacts IBS_02.",
      senderRoleTitle: "Customer Ops Lead",
      toRoleTitles: ["Sn.TPM", "TPM"],
      ccRoleTitles: ["Comms Lead", "CRO"],
    },
    {
      injectNo: 3,
      scheduledTime: "12:05",
      isScheduled: false,
      summary: "Documentation Disruption",
      description:
        "All mortgage documentation begins showing property values from the 1980s, with loan offers automatically adjusting to historical price levels. Savings account certificates start displaying maturity dates from random past decades. KYC documents appear to expire simultaneously, triggering automated lockouts across savings accounts. The document management system begins converting all PDFs to images of vintage savings passbooks, making them unreadable by automated processing systems.",
      relation:
        "Occurs between Events #3 and #4. Impacts IBS_03 (mortgage services). Tests document integrity and recovery procedures.",
      senderRoleTitle: "Sn. DA/E",
      toRoleTitles: ["Sn.TPM", "TPM", "ISM"],
      ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 4,
      scheduledTime: "09:45",
      summary: "Compliance Communications Crisis",
      description:
        "An AI-driven system compromise begins generating authentic-looking compliance breach notifications, suggesting savings balances exceed FSCS protection limits. The system automatically starts splitting savings accounts over £85,000 into multiple accounts without authorisation. Automated communications are sent to mortgage customers claiming their loan-to-value ratios have breached lending criteria due to a 'market crash', requesting immediate additional security. The secure message system begins sending notifications in regulatory compliance jargon, making communications nearly incomprehensible to customers.",
      relation:
        "Follows Event #4 communication infrastructure attack. Directly tests IBS_05 (urgent communications). Tests regulatory reporting and compliance procedures.",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["ISM", "Sn.TPM"],
      ccRoleTitles: ["CRO", "CEO"],
    },
  ],

  facilitatorQuestions: [
    { category: "Incident Detection & Initial Response", text: "How is a major disruption detected, and what are the early warning indicators for service failure?" },
    { category: "Incident Detection & Initial Response", text: "Who is responsible for declaring a critical incident, and what is the decision-making process?" },
    { category: "Incident Detection & Initial Response", text: "If the mobile banking platform is unavailable nationwide, what is the priority — restoring the service or managing customer communications?" },
    { category: "Business Service Impact & Continuity Strategies", text: "How would the disruption affect customers using savings, lending, and payments services?" },
    { category: "Business Service Impact & Continuity Strategies", text: "What alternative channels are available for customers if the mobile app is down?" },
    { category: "Communication & Crisis Management", text: "How will customers, regulators, and key stakeholders be informed of the incident?" },
    { category: "Communication & Crisis Management", text: "How does the bank manage public perception and customer trust during an extended outage?" },
    { category: "IT System Recovery & Resilience", text: "Can recovery procedures be executed within the established RTO and RPO?" },
    { category: "Extended Outages & Escalation", text: "If the outage lasts longer than 24 hours, what emergency measures are enacted to maintain business continuity?" },
    { category: "Lessons Learned", text: "What additional resources, technology or processes are needed to enhance recovery capabilities?" },
  ],
  debriefQuestions: [
    { category: "General Feedback", text: "Were there any key issues or concerns that were not discussed during the exercise?" },
    { category: "General Feedback", text: "Did the scenario feel realistic and relevant to your firm's operations?" },
    { category: "Effectiveness of the Plan", text: "What worked well in the firm's response to the simulated incident?" },
    { category: "Effectiveness of the Plan", text: "Which aspects of the resilience and recovery plan require further development?" },
    { category: "IT & Business Service Recovery", text: "Did system recovery align with RTO and RPO?" },
    { category: "Communication & Crisis Management", text: "Was internal communication between teams clear and efficient?" },
    { category: "Communication & Crisis Management", text: "Did the external communication strategy (for customers, regulators, media) seem effective?" },
    { category: "Lessons Learned & Next Steps", text: "What are the top three takeaways from this exercise?" },
    { category: "Lessons Learned & Next Steps", text: "Did we stay within impact tolerances?" },
  ],
};
