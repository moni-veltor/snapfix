/**
 * Per-IMT-role "first 10 minutes" guidance. Shared between the live
 * RoleBriefing popover (shown on first sit-in) and the pre-live
 * RoleBriefingPreview shown on the exercise overview page so participants
 * can familiarise themselves before they go live.
 */
export const EXPECTATIONS: Record<string, string[]> = {
  CEO: [
    "Confirm the IMT is invoked — if not, invoke it now (better to stand up than fail to)",
    "Sign off on severity classification once your CRO proposes it",
    "Decide whether to convene the Board Action Committee",
    "Be visible to the team — your role is leadership, not management",
  ],
  CRO: [
    "Run the process — you're the Incident Manager, not the leader",
    "Drive the severity classification across the five dimensions",
    "Spawn the regulator notification clocks (FCA / PRA 4h on High; ICO 72h if personal data)",
    "Make sure each business unit files an initial sitrep within 15 min of invocation",
  ],
  CTO: [
    "Confirm scope of technical impact — which systems are affected, what tier are they",
    "Identify any third-party dependencies and start vendor escalations in parallel",
    "Brief the IMT on the recovery options and ETAs you're confident in",
    "Don't shut down anything in a cyber event — isolate, preserve forensic evidence",
  ],
  COO: [
    "Open the customer-impact lens — how many customers, what kind of harm",
    "Coordinate Customer Operations Lead and Comms Lead on the cascade",
    "Track whether Important Business Service tolerances are at risk of breach",
    "Pre-stage manual workarounds for the affected services",
  ],
  CCO: [
    "Be the Consumer Duty conscience — does this affect vulnerable customers?",
    "Approve customer-facing communications before they go out",
    "Brief the IMT on customer-channel volumes and sentiment",
    "Pre-stage the customer-comms approval queue",
  ],
  CFO: [
    "Daily liquidity monitoring kicks in if BCP activates — confirm posture",
    "You can approve emergency spend up to £100k unilaterally; above needs joint CEO+CFO",
    "Coordinate with Treasury on contingent-liquidity drawdown decision points",
    "Brief the IMT on financial impact early — quarter-affecting numbers shape decisions",
  ],
  CPO: [
    "Staff welfare check — is anyone in an evacuation, on-call burnout, distressed",
    "Manage HR coordination if this is an insider event",
    "Track absenteeism / cross-cover for the response team itself",
    "Brief the IMT on people-side risks the response could create",
  ],
  ISM: [
    "Lead forensics if this is a cyber event — preserve evidence before containing",
    "Confirm DLP / SIEM signals and the timeline of attacker activity",
    "Coordinate with external forensics retainer if engaged",
    "Brief the IMT on what you know vs. what you're still investigating",
  ],
  "Head of Compliance": [
    "Assess UK GDPR Art. 33 reportability — start the ICO 72h clock if personal data is involved",
    "Confirm whether other regulators (FCA, PRA, BoE) need notifying",
    "Prepare a draft notification template for the CRO's approval",
    "Document the reportability assessment whether you notify or not",
  ],
  "Head of External Affairs": [
    "Monitor media + social — flag any coverage early",
    "Prepare a holding statement: confirm nothing, deny nothing",
    "Brief CEO on press-line incoming questions and likely angles",
    "Coordinate with Comms Lead on the cascade timing",
  ],
  "Comms Lead": [
    "Get the employee comms out FIRST — the cascade depends on it",
    "Hold customer / third-party / media until employees are informed",
    "Draft the four-step cascade: First / Update / Second update / Resolution",
    "Coordinate sign-off with Head of External Affairs + CEO",
  ],
  "Sn.TPM": [
    "Lead the Tech Recovery Team — coordinate the engineers actually fixing it",
    "Brief the CTO on recovery options + ETAs every 15 min",
    "Manage the vendor escalation if a third-party is involved",
    "Document the timeline as you go — incident log entries every 10-15 min",
  ],
  TPM: [
    "Work alongside Sn.TPM on the recovery — own a specific system stream",
    "Surface blockers immediately — don't let the team be quietly stuck",
    "Log Action and Resource entries to the incident log",
  ],
  "Sn. DA/E": [
    "Confirm data integrity — has anything been corrupted or exfiltrated?",
    "Lead the data-side rebuild / restore if backups are affected",
    "Brief the IMT on RPO impact — what data is irrecoverable",
  ],
  "Customer Ops Lead": [
    "Surface contact-centre volumes early — first sign customers are noticing",
    "Coordinate the customer-facing comms with Comms Lead",
    "Brief the COO on customer-impact metrics every 30 min",
  ],
};

export const GENERIC_EXPECTATIONS: string[] = [
  "Read the addressed messages in your inbox",
  "Reply to anything that needs your input",
  "Log decisions and actions as they happen",
  "Coordinate with your team via the chat panel and IMT meetings",
];

export function expectationsFor(roleAbbrOrTitle: string | null | undefined): string[] {
  if (!roleAbbrOrTitle) return GENERIC_EXPECTATIONS;
  return EXPECTATIONS[roleAbbrOrTitle] ?? GENERIC_EXPECTATIONS;
}
