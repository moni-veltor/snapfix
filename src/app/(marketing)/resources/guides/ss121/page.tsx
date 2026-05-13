import GuideLayout from "@/components/marketing/GuideLayout";

export const metadata = {
  title: "PRA SS1/21 readiness checklist — SnapFix Resources",
  description:
    "Twelve questions the PRA expects you to answer before a supervisory visit. With evidence prompts you can drop into your control library.",
};

const CHECKS = [
  {
    question: "Can you produce your IBS register today?",
    evidence:
      "A formal, dated register signed off by the appropriate SMF (usually the CRO or COO). Not a spreadsheet on someone's laptop.",
  },
  {
    question: "Is each IBS scored across the six importance dimensions?",
    evidence:
      "Customer financial · vulnerable customer · loss of licence · regulatory fine · reputational · loss of capital — with documented thresholds.",
  },
  {
    question: "Does each IBS have a documented impact tolerance with rationale?",
    evidence:
      "Tolerance value (in time), separate primary / FCA / PRA tolerances where relevant, and a written rationale linking the number to a customer-harm model.",
  },
  {
    question: "Have you completed a resource-dependency map for each IBS?",
    evidence:
      "Systems, people, facilities, third parties, information, processes — with dependencies named individually, not at the team or department level.",
  },
  {
    question: "Have you tested each IBS against a severe-but-plausible scenario in the last 12 months?",
    evidence:
      "Exercise report with scenario summary, MSEL, participants, observations and remediation actions. CMORG scenarios count.",
  },
  {
    question: "Can you evidence remediation of issues found in those tests?",
    evidence:
      "Action items with owner, due date, status, and (for closed items) what changed. Open items past their due date are a red flag.",
  },
  {
    question: "Have you completed a self-assessment?",
    evidence:
      "Annual self-assessment document. Should include IBS register, tolerances, test results, gap analysis and investment plan.",
  },
  {
    question: "Is your incident management plan documented and current?",
    evidence:
      "IMP covering invocation, severity classification, IMT / IRT structure, regulator notification SLAs, closure criteria, lessons-learned.",
  },
  {
    question: "Does your IMP separate Incident Leader (CEO) from Incident Manager (CRO)?",
    evidence:
      "Explicit statement in the IMP. Per Afin IMP §6.1.3, the same person cannot hold both roles.",
  },
  {
    question: "Do you have a Business Continuity Plan that wires into the IMP?",
    evidence:
      "BCP with activation triggers (joint CEO + CRO decision), BRTs named, financial continuity rules, daily-liquidity-monitoring protocol if BC active.",
  },
  {
    question: "Can you map your critical third parties to the IBSs they support?",
    evidence:
      "Vendor register with criticality tier, IBS links, contact details, status URLs, and SLA / exit-plan posture.",
  },
  {
    question: "Is your governance evidenced in committee minutes?",
    evidence:
      "ERCC / BRCC minutes showing operational-resilience as a standing agenda item, with materially substantive discussion — not just a 'noted' line.",
  },
];

export default function SS121Guide() {
  return (
    <GuideLayout
      readingTime="8 min"
      title="PRA SS1/21 readiness checklist"
      pitch="Twelve questions the PRA expects you to answer when they walk in. None of them have one-line answers. Each has an evidence prompt you can drop into your control library."
    >
      <h2>How to use this</h2>
      <p>
        Go through each question. If your answer is "yes, and here's where the evidence lives,"
        you're in good shape. If your answer is "we're working on it" or "the team knows but it's
        not written down," that's the gap.
      </p>
      <p>
        Below each question is an <strong>evidence prompt</strong> — what a supervisor would
        actually ask to see. Tick the question only if you can hand over that specific
        document or system extract within an hour of being asked.
      </p>

      <h2>The 12 questions</h2>
      <ol className="!list-decimal !pl-6">
        {CHECKS.map((c, i) => (
          <li key={i} className="!mt-6 !pl-1">
            <p className="!mt-0 !text-base !font-semibold !text-white">{c.question}</p>
            <p className="!mt-1 !text-sm !text-slate-400">
              <strong>Evidence:</strong> {c.evidence}
            </p>
          </li>
        ))}
      </ol>

      <h2>The most common gaps</h2>
      <ul>
        <li>
          <strong>Tolerances without rationale.</strong> The number is there, the reasoning isn't.
          A supervisor asks "why 4 hours, not 6?" and there's no documented answer.
        </li>
        <li>
          <strong>Resource maps stop at the team level.</strong> "Tech Recovery team" is not a
          resource — name the specific systems, the specific roles, the specific vendors.
        </li>
        <li>
          <strong>Test results without remediation evidence.</strong> The exercise happened. The
          action items were captured. The action items were never closed.
        </li>
        <li>
          <strong>Vendor register is stale.</strong> The list of critical third parties hasn't
          been refreshed in 18 months. New vendors aren't on it.
        </li>
        <li>
          <strong>IMP separation of roles isn't enforced.</strong> The plan says CEO leads and
          CRO manages, but in the last incident one person did both because the CEO was
          unavailable. No deputy chain was documented.
        </li>
      </ul>

      <h2>What "good" looks like</h2>
      <p>
        A firm that's properly prepared can — within an hour of a supervisor walking in —
        produce: the IBS register, the most recent tolerance assessment, the last 12 months of
        exercise reports, the open action item list with owners and due dates, the IMP and BCP
        in their current versions, and the vendor register with criticality scores. None of it
        is in a single email — but every piece is somewhere a named person can fetch.
      </p>
    </GuideLayout>
  );
}
