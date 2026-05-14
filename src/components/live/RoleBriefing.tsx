"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";

type Props = {
  seatId: string;
  abbreviation: string;
  title: string;
  responsibility: string | null;
  isSMF: boolean;
  isDeputy: boolean;
};

const STORAGE_PREFIX = "snapfix-role-briefing-";

/**
 * Short briefing shown the first time a user holds a particular seat in an
 * exercise. Captures the doctrine for that role's first-ten-minutes — what
 * they own, what's expected, how they're scored. Dismissable; persists per
 * seat in localStorage so it doesn't keep re-firing.
 */
export default function RoleBriefing({
  seatId,
  abbreviation,
  title,
  responsibility,
  isSMF,
  isDeputy,
}: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${STORAGE_PREFIX}${seatId}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setShow(true);
  }, [seatId]);

  if (!show) return null;

  const expectations = EXPECTATIONS[abbreviation] ?? GENERIC_EXPECTATIONS;

  return (
    <div className="relative overflow-hidden rounded-lg border border-indigo-300 bg-gradient-to-br from-indigo-50 via-indigo-50 to-cyan-50 p-5 shadow-[var(--shadow-card-md)] dark:border-indigo-700 dark:from-indigo-950/50 dark:via-indigo-950/50 dark:to-cyan-950/40">
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="Dismiss briefing"
        className="absolute right-2 top-2 rounded-md p-1 text-soft hover:bg-surface-2 hover:text-ink"
      >
        <X size={14} />
      </button>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white">
          <Sparkles size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
            Role briefing
          </p>
          <h3 className="mt-1 text-base font-semibold text-ink">
            You're sitting <span className="font-mono">{abbreviation}</span> — {title}
            {isSMF && (
              <span className="ml-2 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] text-white">
                SMF
              </span>
            )}
            {isDeputy && (
              <span className="ml-2 rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] text-white">
                Deputy
              </span>
            )}
          </h3>
          {responsibility && (
            <p className="mt-2 text-sm text-muted">{responsibility}</p>
          )}
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Your first 10 minutes
            </p>
            <ul className="mt-1.5 space-y-1.5 text-sm text-ink">
              {expectations.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/** First-ten-minutes guidance per IMT seat. Tightly scoped to the role. */
const EXPECTATIONS: Record<string, string[]> = {
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

const GENERIC_EXPECTATIONS: string[] = [
  "Read the addressed messages in your inbox",
  "Reply to anything that needs your input",
  "Log decisions and actions as they happen",
  "Coordinate with your team via the chat panel and IMT meetings",
];
