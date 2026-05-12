// Skeleton primitives — animated placeholders for loading states.

export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <Skeleton className="h-4 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="mt-2 h-3 w-full" />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-8 w-14" />
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2 w-1/2" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}
