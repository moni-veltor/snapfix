"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Tone =
  | "primary"
  | "danger"
  | "warn"
  | "ok"
  | "ghost"
  | "outline"
  | "gradient";

type Size = "sm" | "md" | "lg";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  pendingLabel?: ReactNode;
  /** Override pending state — useful when the parent has its own loading source. */
  forcePending?: boolean;
};

const TONE: Record<Tone, string> = {
  primary:
    "bg-slate-900 text-white shadow-[var(--shadow-card)] hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400",
  danger: "bg-rose-600 text-white shadow-[var(--shadow-card)] hover:bg-rose-500",
  warn: "bg-amber-600 text-white shadow-[var(--shadow-card)] hover:bg-amber-500",
  ok: "bg-emerald-600 text-white shadow-[var(--shadow-card)] hover:bg-emerald-500",
  ghost: "text-ink hover:bg-surface-2",
  outline:
    "border border-line bg-surface-1 text-ink hover:bg-surface-2 hover:border-line-strong",
  gradient:
    "bg-gradient-brand text-white shadow-[var(--shadow-card-md)] hover:shadow-[var(--shadow-card-lg)] hover:brightness-110",
};

const SIZE: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-sm",
};

/**
 * Server-action-aware submit button. Reads `useFormStatus()` so any form
 * it's nested inside automatically shows a pending state (spinner +
 * dimmed) while the action is in flight. Cheaper than wiring per-form
 * loading state by hand, and works with any server action.
 */
export default function SubmitButton({
  children,
  tone = "primary",
  size = "md",
  pendingLabel,
  forcePending,
  className = "",
  disabled,
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  const isPending = forcePending ?? pending;
  return (
    <button
      type="submit"
      disabled={disabled || isPending}
      data-pending={isPending ? "true" : "false"}
      aria-busy={isPending || undefined}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70 ${SIZE[size]} ${TONE[tone]} ${className}`}
      {...rest}
    >
      {isPending ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
