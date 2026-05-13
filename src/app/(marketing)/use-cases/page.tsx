import Link from "next/link";
import { ShieldAlert, Network, Landmark, CloudLightning } from "lucide-react";

export const metadata = {
  title: "Use cases — SnapFix",
  description:
    "Operational-resilience exercises for the disruptions that matter — cyber, third-party failure, regulator prep, severe weather.",
};

const CASES = [
  {
    href: "/use-cases/cyber",
    icon: ShieldAlert,
    title: "Cyber & ransomware",
    pitch:
      "Drill the call you don't want to make. Ransomware on a Tier 1 system, data exfiltration via insider, supply-chain compromise — and the cyber-default-High severity rule that kicks in regardless.",
  },
  {
    href: "/use-cases/third-party",
    icon: Network,
    title: "Critical third-party failure",
    pitch:
      "Thought Machine outage. ClearBank rail down. AWS eu-west-2 region loss. The scenarios where a single vendor incident turns into a customer-impact incident — and how you recover with no source code, no infrastructure access, and a regulator on the phone.",
  },
  {
    href: "/use-cases/regulator-prep",
    icon: Landmark,
    title: "Regulator preparation",
    pitch:
      "PRA / FCA supervisory visit incoming. Section 166 just landed. The self-assessment is due. SnapFix gives you the evidence trail — IBS register, exercise history, action items closed, incident response timelines — that turns a difficult conversation into a defensible one.",
  },
  {
    href: "/use-cases/severe-weather",
    icon: CloudLightning,
    title: "Severe weather & premises",
    pitch:
      "Storm closes your London office. Data centre region loss. Power-grid disruption. The non-cyber scenarios that still take you down — and that regulators increasingly expect you to test against.",
  },
];

export default function UseCasesIndex() {
  return (
    <div className="bg-night-hero">
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
          Use cases
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Real disruptions, ready-made exercises
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-slate-300">
          Every scenario in the SnapFix library is built around a disruption type that the PRA,
          FCA or BoE has already told the industry to prepare for. Pick a use case to see the
          scenarios, the pains, and what good looks like.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <ul className="grid gap-4 md:grid-cols-2">
          {CASES.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="group block h-full rounded-lg border border-white/10 bg-white/[0.03] p-6 transition hover:border-indigo-400/40 hover:bg-white/[0.06]"
              >
                <c.icon size={24} className="text-indigo-300" />
                <h2 className="mt-3 text-lg font-semibold text-white group-hover:text-indigo-200">
                  {c.title}
                </h2>
                <p className="mt-2 text-sm text-slate-400">{c.pitch}</p>
                <p className="mt-3 text-xs text-indigo-300">Explore →</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
