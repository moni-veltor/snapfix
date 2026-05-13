import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "danger" | "ghost" | "outline" | "warn";
type Size = "sm" | "md";

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
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${SIZE[size]} ${VARIANT[variant]} ${className}`}
    />
  );
}

const SIZE: Record<Size, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

const VARIANT: Record<Variant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
  warn: "bg-amber-600 text-white hover:bg-amber-500",
  ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
  outline:
    "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
};
