import UseCaseLayout from "@/components/marketing/UseCaseLayout";

export const metadata = {
  title: "Regulator preparation — SnapFix Use Cases",
  description:
    "PRA / FCA supervisory visit, Section 166, or self-assessment due. The evidence trail that makes the conversation defensible.",
};

export default function RegulatorPrepUseCase() {
  return (
    <UseCaseLayout
      badge="Use case"
      title="Regulator preparation"
      pitch="A supervisor walks in on Tuesday with a list of questions. You have 90 minutes to produce documents. SnapFix is the platform that gives you the evidence trail to answer them — without scrambling through SharePoint."
      pains={[
        "Self-assessment due in 6 weeks and the IBS register hasn't been updated in 18 months",
        "Section 166 commissioned and you need to reconstruct an incident timeline from emails and Slack threads",
        "Supervisor asks 'when did you last test this IBS?' — you don't have a clean answer",
        "Action items from last exercise are still open, owners unclear, due dates expired",
        "IMT decisions captured in a CRO's notebook rather than a defensible system of record",
      ]}
      outcomes={[
        "IBS register live, dated, signed off, with rationale per tolerance",
        "Exercise history queryable in seconds — what was tested, by whom, when, and what came out of it",
        "Every incident has a clean timeline with decisions, approvers and rationale captured at the moment",
        "Action items tracked to closure with evidence",
        "Audit log of every material action, retained for the life of the tenant",
      ]}
      exercises={[
        {
          title: "PRA SS1/21 supervisory dry-run",
          description:
            "A simulated supervisory visit. The IMT presents IBS register, tolerances, test results and remediation evidence to a peer-reviewer playing the supervisor role. Identifies gaps before they're externally identified.",
        },
        {
          title: "Section 166 timeline reconstruction",
          description:
            "Given a past real incident, can your team produce a defensible timeline within 4 hours? Tests system-of-record discipline more than incident response.",
        },
        {
          title: "Annual self-assessment workshop",
          description:
            "Structured 1-day exercise that produces the self-assessment artefact. SnapFix audit log and exercise history feed in as evidence.",
        },
        {
          title: "Board Risk Committee dress rehearsal",
          description:
            "Practise presenting an operational-resilience update to the BRCC, with challenge questions modelled on past supervisory letters. Closes the gap between operational reality and board-level reporting.",
        },
      ]}
    >
      <h2>What "good" looks like when the supervisor walks in</h2>
      <p>
        A firm that's properly prepared can — within an hour of a supervisor walking in —
        produce: the IBS register (signed off), the most recent tolerance assessment, the last
        12 months of exercise reports, the open action item list with owners and due dates, the
        IMP and BCP in their current versions, and the vendor register with criticality scores.
        None of it is in a single email — but every piece is somewhere a named person can fetch.
      </p>
      <p>
        SnapFix is designed so all of the above is one or two queries away. Not because we want
        you to use SnapFix for record-keeping — but because the evidence trail is the by-product
        of running exercises in the platform.
      </p>

      <h2>The 12-question readiness checklist</h2>
      <p>
        The <a href="/resources/guides/ss121">PRA SS1/21 readiness checklist</a> in our resources
        hub is the bar most supervisors hold firms to. Each question has an "evidence prompt" —
        what the supervisor would actually ask to see. Going through the list and tagging each
        with "yes, evidence at X" or "no, gap at Y" is one of the most productive 2-hour
        workshops a CRO can run.
      </p>

      <h2>What SnapFix gives you</h2>
      <ul>
        <li>IBS register at the org level with all six dimensions, signed off and dated</li>
        <li>
          Exercise history queryable by IBS — "show me the last 5 exercises that tested IBS_02"
        </li>
        <li>Decision log per incident with approver and rationale</li>
        <li>Post-Incident Reports in the 8-section IMP §6.5.3 format</li>
        <li>Audit log of every material action with actor, target, summary, metadata</li>
        <li>Action-item tracker with owner, due date, status, evidence URL</li>
      </ul>
    </UseCaseLayout>
  );
}
