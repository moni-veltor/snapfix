"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * One-shot celebratory toast when achievements have unlocked since the
 * user's last dashboard visit. Dedups per-session via sessionStorage,
 * keyed by the recap "since" cut-point so a mid-session refresh doesn't
 * re-fire the toast.
 */
export default function UnlockToast({
  count,
  sinceISO,
}: {
  count: number;
  /** ISO string of the recap cut point; used as the dedup key. */
  sinceISO: string;
}) {
  useEffect(() => {
    if (count <= 0) return;
    if (typeof window === "undefined") return;
    const key = `snapfix:unlock-toast-seen:${sinceISO}`;
    if (window.sessionStorage.getItem(key) === "1") return;
    window.sessionStorage.setItem(key, "1");

    toast.success(
      count === 1
        ? "1 achievement unlocked since you were last here"
        : `${count} achievements unlocked since you were last here`,
      {
        description: "Tap to see what changed.",
        duration: 6000,
        action: {
          label: "View",
          onClick: () => {
            window.location.assign("/achievements");
          },
        },
      },
    );
  }, [count, sinceISO]);

  return null;
}
