import Link from "next/link";
import GlossaryBrowser from "@/components/marketing/GlossaryBrowser";

export const metadata = {
  title: "Glossary — SnapFix Resources",
  description:
    "Searchable glossary of operational resilience terms. IBS, IMT, IRT, RTO, RPO, CMORG, Consumer Duty and 25+ more, with cross-references.",
};

export default function GlossaryPage() {
  return (
    <div className="bg-night-hero">
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-8">
        <Link href="/resources" className="text-xs text-slate-400 hover:text-slate-200">
          ← Resources
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Glossary
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-300">
          Plain-language definitions for the acronyms and terms that operational-resilience teams
          use every day. Click any &laquo;See also&raquo; chip to jump.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <GlossaryBrowser />
      </section>
    </div>
  );
}
