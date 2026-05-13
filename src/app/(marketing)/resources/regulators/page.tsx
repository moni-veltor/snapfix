import Link from "next/link";
import RegulatorExplorer from "@/components/marketing/RegulatorExplorer";

export const metadata = {
  title: "Regulator reference — SnapFix Resources",
  description:
    "PRA, FCA, BoE, ICO — what each one expects from your operational resilience programme, with notification timelines and deep links.",
};

export default function RegulatorsPage() {
  return (
    <div className="bg-night-hero">
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-8">
        <Link href="/resources" className="text-xs text-slate-400 hover:text-slate-200">
          ← Resources
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Regulator reference
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-300">
          The four UK regulators most operational-resilience programmes interact with — what each
          one expects from you, the notification clocks they impose, and where to find the source.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <RegulatorExplorer />
      </section>
    </div>
  );
}
