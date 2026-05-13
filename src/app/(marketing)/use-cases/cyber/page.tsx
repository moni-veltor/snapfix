import UseCaseLayout from "@/components/marketing/UseCaseLayout";

export const metadata = {
  title: "Cyber & ransomware — SnapFix Use Cases",
  description:
    "Drill ransomware on Tier 1, data exfiltration via insider, supply-chain compromise. The scenarios that test whether your incident response can survive a cyber event.",
};

export default function CyberUseCase() {
  return (
    <UseCaseLayout
      badge="Use case"
      title="Cyber & ransomware"
      pitch="The hardest call you make is in the first 15 minutes of a cyber event. Defaults matter. Discipline matters. Practice matters."
      pains={[
        "First-hour information is always partial — you don't know what's encrypted, what's exfiltrated, what's reachable",
        "Pressure to pay ransom to restore service quickly — even when policy is to never pay without Board + Legal approval",
        "Forensics tension: do you isolate (preserve evidence) or restore (resume service)?",
        "Regulator notification clocks start the moment IMT invokes — 4 hours to FCA + PRA, 72 hours to ICO",
        "Public attribution risk — media coverage, supply-chain partner alerts, customer concern compounding",
      ]}
      outcomes={[
        "IMT invoked within 30 minutes of first credible signal — and cyber-default-High severity applied",
        "Forensics-led containment: isolate to preserve evidence, don't power-off",
        "Don't-pay-ransom decision recorded with Board + Legal approver references",
        "FCA + PRA notifications drafted within the 4-hour window",
        "Customer + employee comms cascade in policy-correct order, vetted by Head of External Affairs",
        "Recovery plan with RTO targets per system, RPO acceptable per service",
      ]}
      exercises={[
        {
          title: "CMORG-01 · Ransomware on a Tier 1 system",
          description:
            "Core banking encrypted. Backups partially affected. Vendor escalation engaged. 8-hour exercise window covering containment, severity, comms cascade, and recovery decision.",
        },
        {
          title: "CMORG-04 · Data exfiltration via insider",
          description:
            "Privileged user accessed and exfiltrated sensitive customer records. ICO 72-hour clock central. Investigates the Consumer Duty promotion to High.",
        },
        {
          title: "CMORG-09 · Supply-chain cyber compromise",
          description:
            "Critical vendor's software update contained malware. Multi-tenant impact. Vendor coordination + your own containment in parallel.",
        },
        {
          title: "Tier-3 fintech variant · BaaS partner cyber event",
          description:
            "Your BaaS sponsor bank has had a cyber event. You're impacted but not the target. Exercises the role of dependent-party in someone else's incident.",
        },
      ]}
    >
      <h2>The defaults that catch people out</h2>
      <p>
        <strong>Cyber default-to-High severity.</strong> Per Afin BCPlans §6.3.8, ransomware and
        data exfiltration default to High unless explicitly assessed otherwise by the IMT. Most
        firms learn this the hard way — they assess down to Medium because financial threshold
        isn't met, then breach the FCA notification window.
      </p>
      <p>
        <strong>Don't power off. Isolate.</strong> Counterintuitively, killing infected systems
        destroys forensic evidence. Network-isolate them, preserve memory state, then let
        forensics do their work. The same applies to clean backups — don't restore over the
        affected system, restore to an isolated environment first.
      </p>
      <p>
        <strong>Ransom payment is a Board + Legal decision.</strong> Not a CRO call, not a CEO
        call. Per Afin's playbook, the gate is Board approval AND Legal sign-off, in writing.
        Most firms have an "absolutely never" policy in normal times that quietly becomes
        "maybe in extremis" under pressure — the exercise reveals that tension.
      </p>

      <h2>The Consumer Duty trap</h2>
      <p>
        If your cyber event affects customers' ability to access funds, complete transactions or
        exercise rights, the FCA's Consumer Duty (PS22/3) promotes severity to High regardless
        of financial threshold. Most cyber events that affect customer-facing systems trigger
        this — even when the firm's instinct is "the financials aren't huge, we'll grade as
        Medium." The platform's severity calculator catches this; the exercise drills it.
      </p>

      <h2>What SnapFix gives you</h2>
      <ul>
        <li>
          Pre-built cyber scenarios with MSEL events timed for an 8-hour live exercise or a
          90-minute tabletop
        </li>
        <li>Cyber default-to-High severity rule wired into the platform — one click and it's applied</li>
        <li>
          The full regulator-clock automation (FCA / PRA 4h, ICO 72h, closure 2 business days)
        </li>
        <li>
          Comms cascade with employee-before-customer enforcement so your customer service team
          isn't learning about the event from a customer
        </li>
        <li>
          Audit log of every decision — when ransom was discussed, when forensics was consulted,
          when Board was briefed
        </li>
      </ul>
    </UseCaseLayout>
  );
}
