"use client";

import { useState, type ReactNode } from "react";
import { Library } from "lucide-react";
import LibraryBrowser from "./LibraryBrowser";
import type { LibraryBrowserConfig } from "./types";

type Props<T> = {
  config: LibraryBrowserConfig<T>;
  items: ReadonlyArray<T>;
  existingKeys: ReadonlyArray<string>;
  canAdd: boolean;
  /** Override default button label. */
  label?: ReactNode;
  /** Visual style. "ghost" = secondary action; "primary" = primary CTA. */
  variant?: "ghost" | "primary";
};

/**
 * Drop-in button + drawer. Pages render this in their header action slot and
 * the drawer state lives entirely client-side.
 */
export default function LibraryBrowserButton<T>({
  config,
  items,
  existingKeys,
  canAdd,
  label,
  variant = "ghost",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const existing = new Set(existingKeys);

  const buttonClass =
    variant === "primary"
      ? "inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      : "inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        <Library size={14} strokeWidth={2.2} />
        {label ?? "Browse library"}
      </button>
      <LibraryBrowser
        open={open}
        onClose={() => setOpen(false)}
        config={config}
        items={items}
        existingKeys={existing}
        canAdd={canAdd}
      />
    </>
  );
}
