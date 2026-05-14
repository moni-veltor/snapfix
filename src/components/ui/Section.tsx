import { type ReactNode, type ElementType } from "react";

type Variant = "neutral" | "critical" | "warn" | "ok" | "info";

type Props = {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Leading icon shown in the title row — typically a lucide icon. */
  icon?: ElementType;
  right?: ReactNode;
  variant?: Variant;
  className?: string;
  children?: ReactNode;
};

/**
 * The single panel primitive. Consistent border / surface / header treatment,
 * with optional title-leading icon and semantic colour variants.
 */
export default function Section({
  title,
  subtitle,
  icon: Icon,
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
            <div className="flex min-w-0 items-center gap-2">
              {Icon && (
                <Icon
                  size={14}
                  strokeWidth={2.2}
                  className={ICON_TONE[variant]}
                  aria-hidden
                />
              )}
              <div className="min-w-0">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                  {title}
                </h3>
                {subtitle && <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p>}
              </div>
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

const ICON_TONE: Record<Variant, string> = {
  neutral: "text-muted",
  critical: "text-rose-600 dark:text-rose-300",
  warn: "text-amber-600 dark:text-amber-300",
  ok: "text-emerald-600 dark:text-emerald-300",
  info: "text-indigo-600 dark:text-indigo-300",
};
