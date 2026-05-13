import { type ReactNode } from "react";

type Variant = "neutral" | "critical" | "warn" | "ok" | "info";

type Props = {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  variant?: Variant;
  className?: string;
  children?: ReactNode;
};

/**
 * The single panel primitive. Provides consistent border/background/padding/
 * header treatment across the app. Backgrounds use semantic tokens so they
 * swap automatically in dark mode.
 */
export default function Section({
  title,
  subtitle,
  right,
  variant = "neutral",
  className = "",
  children,
}: Props) {
  return (
    <section className={`rounded-md border p-3 ${VARIANT[variant]} ${className}`}>
      {(title || right) && (
        <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
          {title && (
            <div className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">{title}</h3>
              {subtitle && <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p>}
            </div>
          )}
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

const VARIANT: Record<Variant, string> = {
  neutral: "border-line bg-surface-1",
  critical: "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40",
  warn: "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40",
  ok: "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40",
  info: "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40",
};
