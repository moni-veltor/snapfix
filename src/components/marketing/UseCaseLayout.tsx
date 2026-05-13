import Link from "next/link";
import { type ReactNode } from "react";

type Props = {
  badge: string;
  title: string;
  pitch: string;
  pains: string[];
  outcomes: string[];
  exercises: { title: string; description: string }[];
  cta?: { label: string; href: string };
  children?: ReactNode;
};

export default function UseCaseLayout({
  badge,
  title,
  pitch,
  pains,
  outcomes,
  exercises,
  cta,
  children,
}: Props) {
  return (
    <div className="bg-night-hero">
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
        <Link href="/use-cases" className="text-xs text-slate-400 hover:text-slate-200">
          ← Use cases
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
          {badge}
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-slate-300">{pitch}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-rose-300/30 bg-rose-500/[0.05] p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-rose-200">
              The pain
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {pains.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="text-rose-400">·</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/[0.05] p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
              What good looks like
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {outcomes.map((o) => (
                <li key={o} className="flex gap-2">
                  <span className="text-emerald-400">·</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <h2 className="text-xl font-semibold text-white">Exercises that drill this</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {exercises.map((e) => (
            <li
              key={e.title}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
            >
              <h3 className="text-sm font-semibold text-white">{e.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{e.description}</p>
            </li>
          ))}
        </ul>
      </section>

      {children && (
        <section className="mx-auto max-w-3xl px-6 pb-12">
          <div className="prose prose-invert max-w-none [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_p]:mt-3 [&_p]:text-slate-300 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-slate-300 [&_li]:mt-1 [&_a]:text-indigo-300 [&_a:hover]:text-indigo-200 [&_strong]:text-white">
            {children}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="rounded-lg border border-indigo-400/30 bg-indigo-500/[0.08] p-6 text-center">
          <h2 className="text-xl font-semibold text-white">Want to run an exercise like this?</h2>
          <p className="mt-2 text-sm text-slate-300">
            All these scenarios are in the SnapFix library — clone, adapt, and run with your team.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href={cta?.href ?? "/sign-up"}
              className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
            >
              {cta?.label ?? "Get started free"}
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.04]"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
