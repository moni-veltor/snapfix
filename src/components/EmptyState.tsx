import Link from "next/link";

/**
 * Friendly empty state for list-style pages. Replaces dashed-border + grey
 * text. Supports an optional primary CTA + secondary "how to" link.
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
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-12 text-center">
        {icon && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            {icon}
          </div>
        )}
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {body && <p className="mt-2 text-sm text-slate-600">{body}</p>}
        {(ctaHref || secondaryHref) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {ctaHref && ctaLabel && (
              <Link
                href={ctaHref}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                {ctaLabel}
              </Link>
            )}
            {secondaryHref && secondaryLabel && (
              <Link
                href={secondaryHref}
                className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
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
