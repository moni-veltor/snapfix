import Link from "next/link";
import { type ReactNode } from "react";

type Props = {
  title: string;
  pitch: string;
  badge?: string;
  readingTime?: string;
  children: ReactNode;
};

export default function GuideLayout({ title, pitch, badge, readingTime, children }: Props) {
  return (
    <div className="bg-night-hero">
      <article className="mx-auto max-w-3xl px-6 pt-16 pb-24">
        <Link href="/resources" className="text-xs text-slate-400 hover:text-slate-200">
          ← Resources
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {badge && (
            <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-indigo-200">
              {badge}
            </span>
          )}
          {readingTime && (
            <span className="text-[11px] text-slate-500">{readingTime} read</span>
          )}
        </div>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-base text-slate-300">{pitch}</p>

        <div className="prose prose-invert mt-10 max-w-none [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-slate-300 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-slate-300 [&_li]:mt-1 [&_blockquote]:mt-4 [&_blockquote]:rounded-md [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-400 [&_blockquote]:bg-white/[0.03] [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-slate-200 [&_blockquote]:italic [&_a]:text-indigo-300 [&_a:hover]:text-indigo-200 [&_strong]:text-white [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]">
          {children}
        </div>
      </article>
    </div>
  );
}
