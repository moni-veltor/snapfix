"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Drop-in poller for the live exercise page. Re-fetches server-rendered
 * content every `intervalMs` so newly released events / injects / chat
 * messages appear without a manual refresh.
 *
 * Pauses when the tab is hidden to be polite. Lighter than SSE for now;
 * upgrade to SSE later when the channel becomes load-bearing.
 */
export default function LivePoller({
  intervalMs = 10_000,
  pauseWhenHidden = true,
}: {
  intervalMs?: number;
  pauseWhenHidden?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => router.refresh(), intervalMs);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    if (!pauseWhenHidden || document.visibilityState === "visible") start();

    const onVis = () => {
      if (!pauseWhenHidden) return;
      if (document.visibilityState === "visible") {
        router.refresh(); // catch-up on tab return
        start();
      } else {
        stop();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stop();
    };
  }, [router, intervalMs, pauseWhenHidden]);

  return null;
}
