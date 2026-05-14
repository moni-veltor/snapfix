"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { zoneForPath, ZONE_TONE } from "@/lib/zones";

type Props = {
  children: ReactNode;
};

/**
 * Wraps the (app) main content in a zone class so child components see a
 * shifted `--accent` token depending on the page family. The zone is derived
 * from the current pathname — keeps the layout simple, no prop-drilling.
 *
 * Also paints a 2px accent strip at the very top so the eye picks up the
 * shift on navigation.
 */
export default function ZoneFrame({ children }: Props) {
  const pathname = usePathname() ?? "/";
  const zone = zoneForPath(pathname);
  const tone = ZONE_TONE[zone];

  return (
    <div className={`relative flex min-w-0 flex-1 flex-col ${tone.cssClass}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-70"
        style={{ background: tone.accent }}
      />
      {children}
    </div>
  );
}
