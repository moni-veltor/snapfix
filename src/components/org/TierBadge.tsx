import Link from "next/link";
import { Crown, Pencil } from "lucide-react";
import type { FirmTier } from "@/generated/prisma/enums";

const TONE: Record<FirmTier | "UNSET", string> = {
  TIER_1: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  TIER_2: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  TIER_3: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  UNSET: "bg-surface-2 text-muted",
};

const SHORT: Record<FirmTier | "UNSET", string> = {
  TIER_1: "TIER 1",
  TIER_2: "TIER 2",
  TIER_3: "TIER 3",
  UNSET: "TIER —",
};

/**
 * Tier chip shown in the /org hero. Tier is the single most important
 * attribute about the firm — without it surfaced the tier-minimums
 * panel below has no anchor.
 */
export default function TierBadge({
  tier,
  label,
  canEditSettings,
}: {
  tier: FirmTier | null;
  label: string;
  canEditSettings: boolean;
}) {
  const key: FirmTier | "UNSET" = tier ?? "UNSET";
  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold uppercase tracking-[0.18em] ${TONE[key]}`}
      >
        <Crown size={11} />
        {SHORT[key]}
      </span>
      <span className="text-muted">{label}</span>
      {canEditSettings && (
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-[11px] text-soft hover:text-ink"
          title="Change tier in Settings"
        >
          <Pencil size={10} />
          Change
        </Link>
      )}
    </span>
  );
}
