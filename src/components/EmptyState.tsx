import Link from "next/link";

/**
 * Friendly empty state for list-style pages. Uses semantic tokens so it
 * adapts to dark mode automatically.
 */
export default function EmptyState({
  icon,
  title,
  body,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-1">
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-12 text-center">
        {icon && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent-soft text-indigo-600 dark:text-indigo-300">
            {icon}
          </div>
        )}
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {body && <p className="mt-2 text-sm text-muted">{body}</p>}
        {(ctaHref || secondaryHref) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {ctaHref && ctaLabel && (
              <Link
                href={ctaHref}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {ctaLabel}
              </Link>
            )}
            {secondaryHref && secondaryLabel && (
              <Link
                href={secondaryHref}
                className="text-sm text-muted hover:text-ink hover:underline"
              >
                {secondaryLabel} →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
