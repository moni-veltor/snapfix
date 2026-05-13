import { type ReactNode } from "react";

type Variant = "neutral" | "critical" | "warn" | "ok" | "info" | "mono";
type Size = "sm" | "md";
type Tone = "soft" | "solid";

type Props = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  tone?: Tone;
  className?: string;
  title?: string;
};

/**
 * The single pill primitive. Three semantic variants (critical=rose, warn=amber,
 * ok=emerald) plus neutral, info (indigo) for brand accents, and mono for
 * fixed-width values (clocks, codes).
 */
export default function Pill({
  children,
  variant = "neutral",
  size = "md",
  tone = "soft",
  className = "",
  title,
}: Props) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full font-medium ${SIZE[size]} ${TONE[tone][variant]} ${
        variant === "mono" ? "font-mono" : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}

const SIZE: Record<Size, string> = {
  sm: "px-1.5 py-0.5 text-[10px] leading-tight",
  md: "px-2 py-0.5 text-xs",
};

const TONE: Record<Tone, Record<Variant, string>> = {
  soft: {
    neutral: "bg-slate-100 text-slate-700",
    critical: "bg-rose-100 text-rose-800",
    warn: "bg-amber-100 text-amber-800",
    ok: "bg-emerald-100 text-emerald-800",
    info: "bg-indigo-100 text-indigo-800",
    mono: "bg-slate-100 text-slate-700",
  },
  solid: {
    neutral: "bg-slate-800 text-white",
    critical: "bg-rose-600 text-white",
    warn: "bg-amber-600 text-white",
    ok: "bg-emerald-600 text-white",
    info: "bg-indigo-600 text-white",
    mono: "bg-slate-900 text-white",
  },
};
