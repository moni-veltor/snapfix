import Link from "next/link";
import TemplateGenerators from "@/components/marketing/TemplateGenerators";

export const metadata = {
  title: "Templates — SnapFix Resources",
  description:
    "Interactive generators for the artefacts every resilience programme needs: IBS register, sitrep, after-action report. Edit in browser, download in seconds.",
};

export default function TemplatesPage() {
  return (
    <div className="bg-night-hero">
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-8">
        <Link href="/resources" className="text-xs text-slate-400 hover:text-slate-200">
          ← Resources
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Templates
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-300">
          Fill in the structure on this page; download a CSV or markdown file. No email gating, no
          account required.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <TemplateGenerators />
      </section>
    </div>
  );
}
