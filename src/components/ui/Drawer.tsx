"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Width preset on desktop. Mobile is always full-width. */
  width?: "md" | "lg" | "xl" | "2xl";
  side?: "right" | "left";
  children: ReactNode;
  /** Slot rendered in the header to the left of the close button. */
  headerExtras?: ReactNode;
  /** Slot rendered as a sticky footer (e.g. "showing N of M" tally). */
  footer?: ReactNode;
};

const WIDTH = {
  md: "sm:max-w-xl",
  lg: "sm:max-w-3xl",
  xl: "sm:max-w-5xl",
  "2xl": "sm:max-w-6xl",
} as const;

/**
 * Right-side (or left-side) sliding drawer. Used by the LibraryBrowser so
 * a registry page stays partially visible behind the drawer — the user is
 * literally adding *to* what's behind. Escape + backdrop click close.
 */
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  width = "xl",
  side = "right",
  children,
  headerExtras,
  footer,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Lock body scroll while the drawer is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sideClass = side === "right" ? "right-0" : "left-0";
  const animateClass =
    side === "right" ? "animate-in slide-in-from-right" : "animate-in slide-in-from-left";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute top-0 ${sideClass} flex h-full w-full ${WIDTH[width]} flex-col border-l border-line bg-surface-elev shadow-2xl ${animateClass}`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line bg-surface-1 p-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {headerExtras}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-soft hover:bg-surface-2 hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <footer className="border-t border-line bg-surface-1 px-4 py-3">{footer}</footer>
        )}
      </aside>
    </div>
  );
}
