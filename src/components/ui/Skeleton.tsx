type Props = {
  className?: string;
  /** Optional fixed height in px when `h-` utilities aren't enough. */
  height?: number;
};

/**
 * Shimmering placeholder block. Use as a building block for page-level
 * loading.tsx files. Token-driven so dark mode and zone tints stay
 * coherent.
 */
export default function Skeleton({ className = "", height }: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-surface-2 ${className}`}
      style={height ? { height } : undefined}
      aria-hidden
    >
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
        style={{ animation: "snapfix-shimmer 1.4s infinite" }}
      />
      <style>{`
        @keyframes snapfix-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

/** Quick stack helpers for common skeleton shapes. */
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-xl border border-line bg-surface-1 p-4">
      <Skeleton className="h-1 w-full" />
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="space-y-2 rounded-lg border border-line bg-surface-1 p-3">
      <Skeleton className="h-2 w-1/3" />
      <Skeleton className="h-6 w-1/2" />
    </div>
  );
}
