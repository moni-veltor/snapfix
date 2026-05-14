import { type ReactNode, type ElementType } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  /** One-line positioning sentence that gives the page a voice. */
  pitch?: ReactNode;
  /** Optional decorative icon shown alongside the eyebrow. */
  icon?: ElementType;
  /** Top-right slot for primary action(s). */
  actions?: ReactNode;
  className?: string;
};

/**
 * Page-level hero strip. Establishes the page's identity with a brand-tinted
 * background and a 1-sentence positioning line. Used at the top of major
 * destinations (Scenarios, Exercises, IBS register, Vendors, etc.).
 */
export default function PageHero({ eyebrow, title, pitch, icon: Icon, actions, className = "" }: Props) {
  return (
    <header
      className={`relative overflow-hidden rounded-xl border border-line bg-surface-1 p-6 ${className}`}
    >
      {/* Decorative brand-soft gradient corner — barely there in light mode,
          more luminous in dark. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--gradient-brand-soft)" }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {(eyebrow || Icon) && (
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              {Icon && <Icon size={12} className="text-indigo-500 dark:text-indigo-300" aria-hidden />}
              {eyebrow && <span>{eyebrow}</span>}
            </div>
          )}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {pitch && <p className="mt-2 max-w-2xl text-sm text-muted">{pitch}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
