import Link from "next/link";
import { type ReactNode } from "react";

type Props = {
  title: string;
  effective: string;
  intro: string;
  children: ReactNode;
};

export default function LegalLayout({ title, effective, intro, children }: Props) {
  return (
    <div className="bg-night-hero">
      <article className="mx-auto max-w-3xl px-6 pt-16 pb-24">
        <div className="flex items-center gap-3 text-xs">
          <Link href="/" className="text-slate-400 hover:text-slate-200">
            ← Home
          </Link>
          <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-slate-400">
            Effective {effective}
          </span>
        </div>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-base text-slate-300">{intro}</p>
        <div className="prose prose-invert mt-10 max-w-none [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_p]:mt-3 [&_p]:text-slate-300 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-slate-300 [&_li]:mt-1 [&_a]:text-indigo-300 [&_a:hover]:text-indigo-200 [&_strong]:text-white">
          {children}
        </div>
        <p className="mt-10 rounded-md border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-400">
          This is a plain-language version of our {title.toLowerCase()}. For procurement, audit or
          contract negotiation, request the formal document via{" "}
          <Link href="/contact" className="underline">
            /contact
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
