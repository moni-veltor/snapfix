import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import AccessForm from "./AccessForm";

export const metadata: Metadata = {
  title: "SnapFix — Access code required",
  description: "Private beta. Enter the access code to continue.",
  robots: { index: false, follow: false },
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const safeFrom = typeof from === "string" && from.startsWith("/") ? from : "/";

  return (
    <main className="min-h-screen bg-[color:var(--night-base)] text-slate-200">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
        <div className="w-full rounded-xl border border-white/[0.08] bg-[color:var(--night-surface)] p-8 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <Logo size={28} tone="light" />
            <span className="text-base font-semibold tracking-tight text-white">SnapFix</span>
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
            Private beta
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Enter the access code
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            SnapFix is invite-only while we work with our first design partners. Enter the code
            you were given to continue. Your sign-in still happens on the next screen.
          </p>
          <div className="mt-6">
            <AccessForm from={safeFrom} />
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] text-slate-500">
          Don&apos;t have a code?{" "}
          <a
            href="mailto:hello@snapfix.app?subject=SnapFix%20access%20request"
            className="font-medium text-slate-400 underline-offset-2 hover:text-indigo-300 hover:underline"
          >
            Request one
          </a>
          .
        </p>
      </div>
    </main>
  );
}
