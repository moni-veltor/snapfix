import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * URL-driven pagination footer. Renders prev / numeric pages (windowed
 * around the current page) / next as plain links, preserving all other
 * query params (search, filter, etc.) so navigation doesn't drop them.
 *
 * Server component — no client state. The page itself reads
 * searchParams.page and applies skip/take to the query.
 */
export default function Pagination({
  basePath,
  currentPage,
  totalPages,
  /** Other query params to preserve when building the page links. */
  otherParams,
  /** Optional label for screen-readers (e.g. "vendors", "notifications"). */
  itemLabel,
  /** Optional totals to show as context (X to Y of Z). */
  total,
  pageSize,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  otherParams?: Record<string, string | undefined>;
  itemLabel?: string;
  total?: number;
  pageSize?: number;
}) {
  if (totalPages <= 1 && !total) return null;

  const linkFor = (p: number): string => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(otherParams ?? {})) {
      if (v != null && v !== "") params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Window of up to 5 page numbers around the current page so the bar
  // doesn't explode on registers with many pages.
  const windowSize = 5;
  let from = Math.max(1, currentPage - Math.floor(windowSize / 2));
  const to = Math.min(totalPages, from + windowSize - 1);
  if (to - from + 1 < windowSize) from = Math.max(1, to - windowSize + 1);
  const pages: number[] = [];
  for (let i = from; i <= to; i++) pages.push(i);

  const showingStart = total && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const showingEnd = total && pageSize ? Math.min(currentPage * pageSize, total) : null;

  return (
    <nav
      aria-label={`Pagination${itemLabel ? ` for ${itemLabel}` : ""}`}
      className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-1 px-3 py-2 text-[12px]"
    >
      <div className="text-soft">
        {showingStart != null && showingEnd != null && total != null ? (
          <>
            Showing <span className="font-semibold text-ink">{showingStart.toLocaleString()}</span>
            {" – "}
            <span className="font-semibold text-ink">{showingEnd.toLocaleString()}</span> of{" "}
            <span className="font-semibold text-ink">{total.toLocaleString()}</span>
            {itemLabel ? ` ${itemLabel}` : ""}
          </>
        ) : (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {currentPage > 1 ? (
            <Link
              href={linkFor(currentPage - 1)}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2 py-1 text-[11px] font-medium text-ink hover:bg-surface-2"
              rel="prev"
            >
              <ChevronLeft size={12} />
              Prev
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] font-medium text-soft">
              <ChevronLeft size={12} />
              Prev
            </span>
          )}
          {from > 1 && (
            <>
              <Link
                href={linkFor(1)}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
              >
                1
              </Link>
              {from > 2 && <span className="px-1 text-soft">…</span>}
            </>
          )}
          {pages.map((p) => (
            <Link
              key={p}
              href={linkFor(p)}
              aria-current={p === currentPage ? "page" : undefined}
              className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                p === currentPage
                  ? "bg-indigo-600 text-white"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {p}
            </Link>
          ))}
          {to < totalPages && (
            <>
              {to < totalPages - 1 && <span className="px-1 text-soft">…</span>}
              <Link
                href={linkFor(totalPages)}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
              >
                {totalPages}
              </Link>
            </>
          )}
          {currentPage < totalPages ? (
            <Link
              href={linkFor(currentPage + 1)}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2 py-1 text-[11px] font-medium text-ink hover:bg-surface-2"
              rel="next"
            >
              Next
              <ChevronRight size={12} />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] font-medium text-soft">
              Next
              <ChevronRight size={12} />
            </span>
          )}
        </div>
      )}
    </nav>
  );
}
