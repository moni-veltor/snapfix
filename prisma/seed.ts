import "dotenv/config";
import bcrypt from "bcryptjs";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket as unknown as typeof neonConfig.webSocketConstructor;
}

async function main() {
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL must be set");
  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding Astro Bank organisation + Simulation 2…");

  // ─── Organisation ─────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: "astro-bank" },
    create: { name: "Astro Bank", slug: "astro-bank" },
    update: {},
  });

  // ─── Users (all members of Astro Bank) ────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "admin@astrobank.com" },
    create: {
      email: "admin@astrobank.com",
      name: "Astro Bank Admin",
      passwordHash,
      orgId: org.id,
      orgRole: "OWNER",
    },
    update: { orgId: org.id, orgRole: "OWNER" },
  });
  await prisma.user.upsert({
    where: { email: "cto@astrobank.com" },
    create: {
      email: "cto@astrobank.com",
      name: "Casey Tan (CTO)",
      passwordHash,
      orgId: org.id,
      orgRole: "ADMIN",
    },
    update: { orgId: org.id, orgRole: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "participant@astrobank.com" },
    create: {
      email: "participant@astrobank.com",
      name: "Demo Participant",
      passwordHash,
      orgId: org.id,
      orgRole: "MEMBER",
    },
    update: { orgId: org.id, orgRole: "MEMBER" },
  });

  // ─── Scenario ─────────────────────────────────────────────────────────────
  const existing = await prisma.scenario.findFirst({
    where: { orgId: org.id, title: "Simulation 2 — Operational Resilience" },
  });
  if (existing) {
    console.log("Scenario already seeded — skipping.");
    await prisma.$disconnect();
    return;
  }

  const scenario = await prisma.scenario.create({
    data: {
      orgId: org.id,
      title: "Simulation 2 — Operational Resilience",
      background:
        "Astro Bank is conducting a functional simulation exercise to test the resilience of its important business services, ensuring the effectiveness of its Operational Resilience Policy and Recovery Plans. This exercise will assess the bank's ability to respond to and recover from a simulated disruption affecting mission-critical systems, including its mobile banking platform, savings, and lending services.",
      agenda:
        "11:00–11:05 Welcome and Introduction\n11:05–11:10 Exercise briefing (objectives, rules of engagement)\n11:10–12:45 Scenario discussion and resolution (hands-on)\n12:45–13:00 Debrief and Hot wash",
      dDayDate: new Date("2025-02-12T08:00:00Z"),
      durationMin: 120,
      createdById: owner.id,
    },
  });

  // ─── Important Business Services ──────────────────────────────────────────
  const ibsRows = [
    {
      code: "IBS_01",
      name: "Deposit Account Opening",
      description: "Opening of new deposit accounts (savings, fixed-term).",
      impactToleranceMin: 240,
      criticality: "HIGH",
    },
    {
      code: "IBS_02",
      name: "Deposit Access Service",
      description: "Customer access to existing deposit balances and withdrawals.",
      impactToleranceMin: 60,
      criticality: "CRITICAL",
    },
    {
      code: "IBS_03",
      name: "Issuing and Completion of a Secured Loan (mortgage)",
      description: "Processing of mortgage applications through to completion.",
      impactToleranceMin: 480,
      criticality: "HIGH",
    },
    {
      code: "IBS_04",
      name: "Providing access to balances",
      description: "Mobile and online channels surfacing account balances and statements.",
      impactToleranceMin: 60,
      criticality: "CRITICAL",
    },
    {
      code: "IBS_05",
      name: "Provision of a channel for urgent communications to customers",
      description: "Authoritative outbound channel for urgent customer communications.",
      impactToleranceMin: 120,
      criticality: "HIGH",
    },
  ] as const;
  await prisma.importantBusinessService.createMany({
    data: ibsRows.map((r) => ({ ...r, scenarioId: scenario.id })),
  });

  // ─── Master Scenario Events List ──────────────────────────────────────────
  await prisma.event.createMany({
    data: [
      {
        scenarioId: scenario.id,
        eventNo: 1,
        scheduledTime: "08:00",
        isScheduled: true,
        title: "Initial Cyber Intrusion",
        description:
          "The bank's Security Operations Center receives multiple alerts indicating sophisticated penetration attempts targeting AWS infrastructure. The attack pattern suggests a coordinated effort using compromised credentials from a third-party contractor. Unusual API calls are detected across multiple regions, with attempts to escalate privileges and access sensitive customer data stores. Initial analysis suggests the attackers may have been present in the network for up to 48 hours before detection. CloudWatch metrics show suspicious spikes in customer data transfer during off-peak hours.",
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
      },
      {
        scenarioId: scenario.id,
        eventNo: 2,
        scheduledTime: "10:15",
        isScheduled: true,
        title: "Service Degradation",
        description:
          "A cascade of service degradations begins as the attack spreads. Mobile app users report seeing other customers' account balances intermittently (IBS_04). The deposit access service (IBS_02) starts showing delayed processing times, with some customers receiving duplicate transaction confirmations. Customer service receives a surge of calls about failed login attempts and unauthorised access notifications. Social media monitoring detects growing customer complaints about service issues, with several high-profile customers threatening to close their accounts. The bank's public website begins experiencing intermittent outages.",
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
      },
      {
        scenarioId: scenario.id,
        eventNo: 3,
        scheduledTime: "11:00",
        isScheduled: true,
        title: "Third-Party Provider Impact (Thought Machine)",
        description:
          "Thought Machine reports critical degradation in their core banking platform after detecting potentially malicious database queries originating from compromised application credentials. The system begins showing signs of data inconsistency, with some mortgage applications (IBS_03) displaying incorrect loan amounts and terms. Payment processing queues start backing up, affecting both incoming and outgoing transactions. The system's automated failover mechanisms trigger but fail to complete successfully, leaving services in an indeterminate state.",
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
      },
      {
        scenarioId: scenario.id,
        eventNo: 4,
        scheduledTime: "12:05",
        isScheduled: true,
        title: "Communication Channel Disruption",
        description:
          "The bank's primary customer communication infrastructure experiences a sophisticated DDoS attack, overwhelming the contact center systems. Simultaneously, the automated fraud detection system begins generating a high volume of false positives, flagging legitimate transactions as suspicious. The backup communication channels show signs of compromise, with unauthorised messages being queued for sending to customers.",
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
      },
      {
        scenarioId: scenario.id,
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
      },
      {
        scenarioId: scenario.id,
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
      },
    ],
  });

  // ─── Injects ──────────────────────────────────────────────────────────────
  await prisma.inject.createMany({
    data: [
      {
        scenarioId: scenario.id,
        injectNo: 1,
        scheduledTime: "09:33",
        isScheduled: true,
        summary: '"Interest Rate Chaos" System Disruption',
        description:
          "A sophisticated malware activates across the savings platform, altering all fixed-term deposit rates to show 13% AER. The mobile app and online banking platform begin displaying inflated maturity values for all savings products. The system starts sending automated maturity notifications to fixed-term deposit holders showing incorrect enhanced returns. When staff attempt to correct rates manually, the system automatically doubles the erroneous rate. Simultaneously, the mortgage calculator begins showing monthly payments of £13 regardless of loan amount, causing a surge in online mortgage applications.",
        relation:
          "Occurs shortly after Event #2 service degradation. Exploits the initial AWS infrastructure breach. Tests IBS_01 (deposit account opening) and IBS_02 (deposit access). Challenges teams to maintain accurate customer data during cyber attack.",
      },
      {
        scenarioId: scenario.id,
        injectNo: 2,
        scheduledTime: "11:40",
        isScheduled: true,
        summary: "Early Access Anomaly",
        description:
          "A system glitch begins triggering false early-access requests for fixed-term savings accounts, bypassing notice period requirements. The platform starts sending automated approval messages for penalty-free withdrawals to all savings customers. Customer notifications include legitimate-looking payment instructions directing funds to 'secure holding accounts.' The online servicing portal begins displaying countdown timers showing all fixed-term products maturing within 24 hours, while mortgage payment dates are shown as defaulting to immediate payment in full.",
        relation:
          "Precedes Event #3 (Thought Machine critical degradation). Tests emergency response procedures for unauthorised financial transactions. Directly impacts IBS_02 (deposit access service). Tests third-party dependency management with payment providers.",
      },
      {
        scenarioId: scenario.id,
        injectNo: 3,
        scheduledTime: "12:05",
        isScheduled: false,
        summary: "Documentation Disruption",
        description:
          "All mortgage documentation in the system begins showing property values from 1980s, with loan offers automatically adjusting to historical price levels. Savings account certificates start displaying maturity dates from random past decades, with interest calculations using historical base rates. KYC documents in the system appear to expire simultaneously, triggering automated lockouts across savings accounts. The document management system begins converting all PDFs to images of vintage savings passbooks, making them unreadable by automated processing systems.",
        relation:
          "Occurs between Events #3 and #4. Impacts IBS_03 (mortgage services). Tests document integrity and recovery procedures. Forces coordination between multiple third-party providers.",
      },
      {
        scenarioId: scenario.id,
        injectNo: 4,
        scheduledTime: "09:45",
        isScheduled: true,
        summary: "Compliance Communications Crisis",
        description:
          "An AI-driven system compromise begins generating authentic-looking compliance breach notifications, suggesting savings balances exceed FSCS protection limits. The system automatically starts splitting savings accounts over £85,000 into multiple accounts without authorization. Meanwhile, automated communications are sent to mortgage customers claiming their loan-to-value ratios have breached lending criteria due to a 'market crash,' requesting immediate additional security. The bank's secure message system begins sending notifications in regulatory compliance jargon, making communications nearly incomprehensible to customers and causing panic about potential savings losses.",
        relation:
          "Follows Event #4 communication infrastructure attack. Directly tests IBS_05 (urgent communications). Tests regulatory reporting and compliance procedures. Forces prioritisation between different critical services.",
      },
    ],
  });

  // ─── Facilitator question bank ────────────────────────────────────────────
  const facilitatorQs: { category: string; text: string }[] = [
    { category: "Incident Detection & Initial Response", text: "How is a major disruption detected, and what are the early warning indicators for service failure?" },
    { category: "Incident Detection & Initial Response", text: "Who is responsible for declaring a critical incident, and what is the decision-making process?" },
    { category: "Incident Detection & Initial Response", text: "What steps are taken in the first 30 minutes after discovering a major disruption?" },
    { category: "Incident Detection & Initial Response", text: "If the mobile banking platform is unavailable nationwide, what is the priority — restoring the service or managing customer communications?" },
    { category: "Business Service Impact & Continuity Strategies", text: "How would the disruption affect customers using savings, lending, and payments services?" },
    { category: "Business Service Impact & Continuity Strategies", text: "What alternative channels are available for customers if the mobile app is down?" },
    { category: "Communication & Crisis Management", text: "How will customers, regulators, and key stakeholders be informed of the incident?" },
    { category: "Communication & Crisis Management", text: "How does the bank manage public perception and customer trust during an extended outage?" },
    { category: "IT System Recovery & Resilience", text: "Can recovery procedures be executed within the established Recovery Time Objectives (RTOs) and Recovery Point Objectives (RPOs)?" },
    { category: "Extended Outages & Escalation Scenarios", text: "If the outage lasts longer than 24 hours, what emergency measures are enacted to maintain business continuity?" },
    { category: "Financial Resilience & Capital Management", text: "How does Astro Bank manage liquidity risks when customers withdraw funds during service disruptions?" },
    { category: "Lessons Learned & Future Improvements", text: "What additional resources, technology, or processes are needed to enhance recovery capabilities?" },
  ];
  await prisma.facilitatorQuestion.createMany({
    data: facilitatorQs.map((q, i) => ({ ...q, scenarioId: scenario.id, orderIdx: i })),
  });

  // ─── Debrief question bank ────────────────────────────────────────────────
  const debriefQs: { category: string; text: string }[] = [
    { category: "General Feedback", text: "Were there any key issues or concerns that were not discussed during the exercise?" },
    { category: "General Feedback", text: "Did the scenario feel realistic and relevant to Astro Bank's operations?" },
    { category: "Effectiveness of the Plan", text: "What worked well in Astro Bank's response to the simulated incident?" },
    { category: "Effectiveness of the Plan", text: "Which aspects of the resilience and recovery plan require further development?" },
    { category: "IT & Business Service Recovery", text: "Did system recovery align with Recovery Time Objectives (RTOs) and Recovery Point Objectives (RPOs)?" },
    { category: "IT & Business Service Recovery", text: "Were any unforeseen dependencies, vulnerabilities, or bottlenecks identified?" },
    { category: "Communication & Crisis Management", text: "Was internal communication between teams clear and efficient?" },
    { category: "Communication & Crisis Management", text: "Did the external communication strategy (for customers, regulators, media) seem effective?" },
    { category: "Lessons Learned & Next Steps", text: "What are the top three takeaways from this exercise?" },
    { category: "Lessons Learned & Next Steps", text: "Did we stay within impact tolerances?" },
  ];
  await prisma.debriefQuestion.createMany({
    data: debriefQs.map((q, i) => ({ ...q, scenarioId: scenario.id, orderIdx: i })),
  });

  // ─── Sample exercise cast (additional Astro Bank users) ───────────────────
  const cast: { email: string; name: string; roleTitle: string }[] = [
    { email: "fadaei@astrobank.com", name: "Mohammed Fadaei", roleTitle: "Sn.TPM" },
    { email: "najem@astrobank.com", name: "Mohammed Najem", roleTitle: "TPM" },
    { email: "sifah@astrobank.com", name: "Emmanuel Sifah", roleTitle: "Sn. DA/E" },
    { email: "musawi@astrobank.com", name: "Imran Musawi", roleTitle: "ISM" },
    { email: "oakley@astrobank.com", name: "Jason Oakley", roleTitle: "CEO" },
    { email: "ferguson@astrobank.com", name: "Patrick Ferguson", roleTitle: "CRO" },
    { email: "lewis@astrobank.com", name: "Rebecca Lewis", roleTitle: "Comms Lead" },
    { email: "tunney@astrobank.com", name: "Nicola Tunney", roleTitle: "Customer Ops Lead" },
  ];
  const castUsers: Record<string, { id: string; roleTitle: string }> = {};
  for (const c of cast) {
    const u = await prisma.user.upsert({
      where: { email: c.email },
      create: {
        email: c.email,
        name: c.name,
        passwordHash,
        orgId: org.id,
        orgRole: "MEMBER",
      },
      update: { orgId: org.id, orgRole: "MEMBER", name: c.name },
    });
    castUsers[c.email] = { id: u.id, roleTitle: c.roleTitle };
  }

  // ─── Sample exercise (PLANNING) using Simulation 2 ────────────────────────
  const exercise = await prisma.exercise.create({
    data: {
      orgId: org.id,
      scenarioId: scenario.id,
      facilitatorId: owner.id,
      title: "Astro Bank — Operational Resilience Functional Exercise (Demo)",
      description:
        "Sample exercise to demonstrate the SnapFix planning hub. Drives the Simulation 2 scenario with the standard team layout.",
      plannedDate: new Date("2026-06-15T10:00:00Z"),
      location: "Lower Ground Floor, 10 Chiswell Street, London EC1Y 4UQ",
      status: "PLANNING",
    },
  });

  // Default team structure (matches the Simulation 2 cast)
  const teamDefs = [
    { name: "Incident Management", description: "Coordinates the overall response.", orderIdx: 0 },
    { name: "Tech Recovery", description: "Restores systems and infrastructure.", orderIdx: 1 },
    { name: "Communications", description: "Customer, regulator and media comms.", orderIdx: 2 },
    { name: "Customer Operations", description: "Customer-facing operations and call centre.", orderIdx: 3 },
    { name: "Executive Observers", description: "CEO, CRO, CCO — observe and authorise.", orderIdx: 4 },
  ] as const;
  for (const t of teamDefs) {
    await prisma.exerciseTeam.create({
      data: { exerciseId: exercise.id, ...t },
    });
  }
  const teams = await prisma.exerciseTeam.findMany({
    where: { exerciseId: exercise.id },
  });
  const teamByName = Object.fromEntries(teams.map((t) => [t.name, t]));

  // Assign cast members to teams with role titles
  const assignments: { email: string; team: string; role: "LEAD" | "PARTICIPANT" | "OBSERVER" }[] = [
    { email: "fadaei@astrobank.com", team: "Tech Recovery", role: "LEAD" },
    { email: "najem@astrobank.com", team: "Tech Recovery", role: "PARTICIPANT" },
    { email: "sifah@astrobank.com", team: "Incident Management", role: "PARTICIPANT" },
    { email: "musawi@astrobank.com", team: "Incident Management", role: "LEAD" },
    { email: "lewis@astrobank.com", team: "Communications", role: "LEAD" },
    { email: "tunney@astrobank.com", team: "Customer Operations", role: "LEAD" },
    { email: "oakley@astrobank.com", team: "Executive Observers", role: "OBSERVER" },
    { email: "ferguson@astrobank.com", team: "Executive Observers", role: "OBSERVER" },
  ];
  // The CTO (Astro Bank Admin) is the facilitator
  await prisma.exerciseParticipant.create({
    data: {
      exerciseId: exercise.id,
      userId: owner.id,
      teamId: teamByName["Incident Management"]?.id ?? null,
      roleTitle: "CTO (Facilitator)",
      exerciseRole: "FACILITATOR",
    },
  });
  for (const a of assignments) {
    const u = castUsers[a.email];
    if (!u || !teamByName[a.team]) continue;
    await prisma.exerciseParticipant.create({
      data: {
        exerciseId: exercise.id,
        userId: u.id,
        teamId: teamByName[a.team].id,
        roleTitle: u.roleTitle,
        exerciseRole: a.role,
      },
    });
  }

  console.log("✓ Seed complete.");
  console.log("  Sign in as admin@astrobank.com / password123 (OWNER, exercise facilitator)");
  console.log("  Sign in as participant@astrobank.com / password123 (MEMBER)");
  console.log(`  Sample exercise: ${exercise.title} (${exercise.id})`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
