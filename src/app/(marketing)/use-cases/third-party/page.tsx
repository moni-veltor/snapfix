import UseCaseLayout from "@/components/marketing/UseCaseLayout";

export const metadata = {
  title: "Critical third-party failure — SnapFix Use Cases",
  description:
    "Thought Machine outage. ClearBank rail down. AWS region loss. The scenarios where a single vendor incident turns into a customer-impact incident.",
};

export default function ThirdPartyUseCase() {
  return (
    <UseCaseLayout
      badge="Use case"
      title="Critical third-party failure"
      pitch="The hard truth of modern banking: most of your IBSs are delivered through someone else's infrastructure. When their incident becomes your incident, you have no source code, no infrastructure access, and a regulator on the phone."
      pains={[
        "You have no control of recovery — you're a customer of someone else's IM process",
        "Vendor status pages lag the real incident by 20–40 minutes; you find out from your customers first",
        "Multiple IBSs may depend on the same vendor — a single failure cascades across services",
        "Your impact tolerance doesn't pause because the cause is upstream",
        "Regulator wants to know your contingency — you may not have one if the vendor is single-sourced",
      ]}
      outcomes={[
        "Vendor register live and queryable — every IBS knows its critical third parties",
        "Workarounds rehearsed in advance — degraded-mode operation tested per IBS",
        "Direct escalation contacts (not generic support) practised on the call tree",
        "Comms cascade for vendor incidents distinct from your own (vendor customers and intermediaries also notified)",
        "Regulator notification framed correctly — your incident, your IBS, even though the cause is upstream",
      ]}
      exercises={[
        {
          title: "CMORG-06 · Critical cloud provider region outage",
          description:
            "AWS eu-west-2 (London) experiences a multi-AZ outage. Your customer-facing services degrade. Tests your DR posture and the call tree to AWS Enterprise Support.",
        },
        {
          title: "CMORG-07 · Core banking vendor failure",
          description:
            "Thought Machine experiences a platform-wide incident. Multiple downstream firms affected. Exercise coordinates with vendor's incident bridge and tests your customer comms.",
        },
        {
          title: "CMORG-08 · Payments rail disruption",
          description:
            "Faster Payments degraded for 6 hours. Customers can't move money out. Tests your manual workaround procedures and the customer-comms cadence.",
        },
        {
          title: "Tier-3 fintech variant · BaaS sponsor outage",
          description:
            "Your BaaS sponsor bank is down. You have no banking licence yourself. Exercises the existential question: what do you do when your dependency is your service?",
        },
      ]}
    >
      <h2>The vendor-register prerequisite</h2>
      <p>
        Third-party exercises are only as good as your vendor register. SnapFix ships a vendor
        entity that links critical third parties to the IBSs they support, with criticality
        tier (Tier 1 mission-critical, Tier 2 business-critical, Tier 3 operational),
        contact details, status URLs and SLA posture. When a vendor incident triggers, the
        platform surfaces every affected IBS automatically.
      </p>
      <p>
        Most firms maintain this in a spreadsheet that's 18 months out of date. The first
        exercise reveals how far the register drifts from reality — which is itself a useful
        finding.
      </p>

      <h2>The Section 166 angle</h2>
      <p>
        After a notable third-party incident, the regulator often commissions a Section 166
        review of your reliance on that vendor. The questions are predictable:
      </p>
      <ul>
        <li>Did you understand the criticality of this vendor before the event?</li>
        <li>Did you test scenarios involving its failure?</li>
        <li>Did you have a workaround? Was it documented? Had it been tested?</li>
        <li>What's your exit plan if you need to migrate?</li>
      </ul>
      <p>
        A six-month history of third-party exercises in the SnapFix audit log produces evidence
        for all four. A history of "we'll get around to it" produces a finding.
      </p>

      <h2>What SnapFix gives you</h2>
      <ul>
        <li>
          Vendor register at the org level, with IBS links and criticality tiers
        </li>
        <li>
          Pre-built scenarios for cloud-provider region loss, core-banking vendor failure, and
          payment-rail disruption
        </li>
        <li>
          Audit log of every third-party exercise so a Section 166 reviewer can reconstruct
          your testing history in one query
        </li>
        <li>
          Tier-3 fintech variants for BaaS-dependent firms where the vendor IS the service
        </li>
      </ul>
    </UseCaseLayout>
  );
}
