import { TestTube2 } from "lucide-react";

export default function DryRunBadge({ size = "sm" }: { size?: "sm" | "lg" }) {
  const cls =
    size === "lg"
      ? "px-2 py-1 text-[11px]"
      : "px-1.5 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-200 font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-900/60 dark:text-amber-100 ${cls}`}
      title="Dry-run · auto-purged after 30 days · doesn't count toward annual obligations"
    >
      <TestTube2 size={size === "lg" ? 11 : 9} />
      Dry run
    </span>
  );
}

export function DryRunBanner() {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-800/60 dark:bg-amber-950/30">
      <p className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-100">
        <TestTube2 size={13} />
        This is a dry-run exercise
      </p>
      <p className="mt-0.5 text-amber-800 dark:text-amber-200">
        Private facilitator rehearsal. Auto-purged 30 days after creation. Not counted toward
        annual testing obligations. No evidence pack is generated on closure. When you&apos;re
        happy with the design, promote it to a production exercise.
      </p>
    </div>
  );
}
