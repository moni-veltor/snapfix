"use client";

import { useState, type ReactNode } from "react";

type Props = {
  /** Tooltip content — supports rich formatting. */
  content: ReactNode;
  /** Trigger element that the tooltip describes. */
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
};

/**
 * Lightweight rich tooltip — CSS-positioned, no portal, opens on hover/focus.
 * Use for explanations that need formatting (policy citations, threshold
 * tables, longer hints). For simple text, the native `title=` attribute is
 * still fine.
 */
export default function Tooltip({ content, children, side = "top", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const pos =
    side === "top"
      ? "bottom-full mb-1 -translate-x-1/2 left-1/2"
      : "top-full mt-1 -translate-x-1/2 left-1/2";
  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 ${pos} max-w-xs whitespace-normal rounded-md border border-line-strong bg-surface-elev px-3 py-2 text-[11px] leading-relaxed text-ink shadow-[var(--shadow-card-lg)]`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
