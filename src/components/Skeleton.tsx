// Skeleton primitives — animated placeholders for loading states.

export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-surface-2 ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/[0.07]" />
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-md border border-line bg-surface-1 p-4">
      <Skeleton className="h-4 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="mt-2 h-3 w-full" />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-md border border-line bg-surface-1 p-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-8 w-14" />
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-md border border-line bg-surface-1 p-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2 w-1/2" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}
