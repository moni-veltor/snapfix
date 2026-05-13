import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "danger" | "ghost" | "outline" | "warn" | "ok";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 ${SIZE[size]} ${VARIANT[variant]} ${className}`}
    />
  );
}

const SIZE: Record<Size, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-sm",
};

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-slate-900 text-white hover:bg-slate-700 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-400",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
  warn: "bg-amber-600 text-white hover:bg-amber-500",
  ok: "bg-emerald-600 text-white hover:bg-emerald-500",
  ghost:
    "text-ink hover:bg-surface-2 dark:text-slate-200 dark:hover:bg-white/[0.06]",
  outline:
    "border border-line bg-surface-1 text-ink hover:bg-surface-2",
};
