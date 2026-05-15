import Skeleton, { SkeletonCard, SkeletonStat } from "@/components/ui/Skeleton";

/**
 * App-shell loading fallback. Streams in while a server component is
 * waiting on its data. Shape mirrors the most-common page layout
 * (header + stat row + widget grid) so the layout doesn't jump when
 * the real content lands.
 */
export default function AppLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-1 p-2">
        <Skeleton className="h-6 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-20" />
      </div>

      <Skeleton className="h-32 w-full" />

      <div className="grid gap-4 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
    </div>
  );
}
