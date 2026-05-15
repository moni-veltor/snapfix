import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import Hoot from "@/components/fun/Hoot";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 flex justify-center">
        <Hoot mood="thinking" size={96} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Hoot can&apos;t find that page
      </h1>
      <p className="mt-2 text-sm text-muted">
        The URL you followed doesn&apos;t exist — maybe a bookmarked link
        from a previous version, or a typo.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <Home size={14} />
          Take me home
        </Link>
        <Link
          href="javascript:history.back()"
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3.5 py-2 text-sm font-medium text-ink hover:bg-surface-2"
        >
          <ArrowLeft size={14} />
          Go back
        </Link>
      </div>
    </div>
  );
}
