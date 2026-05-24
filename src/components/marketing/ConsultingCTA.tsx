import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2 } from "lucide-react";

type Props = {
  variant?: "wide" | "compact";
  headline?: string;
  pitch?: string;
  bullets?: string[];
  contactInterest?: string;
};

const DEFAULT_BULLETS = [
  "30-minute call — no obligation, no sales script",
  "We'll review your current exercise cadence and IBS register against what your tier of regulator is asking for",
  "You leave with a one-page note on what we'd do first",
];

export default function ConsultingCTA({
  variant = "wide",
  headline = "Want a hand running it?",
  pitch = "Most of our customers also run consulting engagements with us — we facilitate annual exercise cycles, coach IBS registers through their first regulator review, and design the bespoke scenarios that don't fit the library.",
  bullets = DEFAULT_BULLETS,
  contactInterest,
}: Props) {
  const contactHref = contactInterest
    ? `/contact?interest=${encodeURIComponent(contactInterest)}`
    : "/contact?interest=consulting";

  if (variant === "compact") {
    return (
      <div className="rounded-lg border border-indigo-400/30 bg-gradient-to-br from-indigo-500/[0.08] via-indigo-500/[0.03] to-transparent p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
          <Calendar size={14} />
          Run this with us
        </div>
        <p className="mt-2 text-sm text-slate-300">{pitch}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={contactHref}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-400"
          >
            Book a 30-min call <ArrowRight size={12} />
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.05]"
          >
            See what we do
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="border-y border-white/[0.06] bg-[color:var(--night-surface)]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
              <Calendar size={12} />
              Consulting + platform
            </div>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white">
              {headline}
            </h2>
            <p className="mt-3 max-w-xl text-slate-300">{pitch}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={contactHref}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-5 py-3 text-sm font-medium text-white shadow-[0_0_32px_-4px_rgba(99,102,241,0.55)] hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
              >
                Book a 30-min call <ArrowRight size={14} />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white hover:bg-white/[0.08]"
              >
                See consulting services →
              </Link>
            </div>
          </div>
          <ul className="space-y-3 md:col-span-5">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-slate-300"
              >
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-indigo-300"
                  aria-hidden
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
