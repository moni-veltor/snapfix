import { type ButtonHTMLAttributes, type ReactNode, type ElementType } from "react";

type Variant = "primary" | "gradient" | "danger" | "ghost" | "outline" | "warn" | "ok";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Icon slot — typically a lucide icon component. Rendered before children. */
  icon?: ElementType;
  /** Icon slot rendered after children. */
  iconAfter?: ElementType;
  loading?: boolean;
  /** Subtle hover-lift on the button. Default for lg, opt-in for md. */
  lift?: boolean;
  children?: ReactNode;
};

export default function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconAfter: IconAfter,
  loading = false,
  lift,
  className = "",
  disabled,
  children,
  ...rest
}: Props) {
  const liftDefault = size === "lg";
  const useLift = lift ?? liftDefault;
  const iconSize = ICON_SIZE[size];

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1
        disabled:cursor-not-allowed disabled:opacity-50
        ${SIZE[size]}
        ${VARIANT[variant]}
        ${useLift ? "hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] active:translate-y-0 active:shadow-[var(--shadow-card)]" : ""}
        ${className}
      `}
    >
      {loading ? (
        <>
          <Spinner size={iconSize} />
          {children}
        </>
      ) : (
        <>
          {Icon && <Icon size={iconSize} strokeWidth={2.2} aria-hidden />}
          {children}
          {IconAfter && <IconAfter size={iconSize} strokeWidth={2.2} aria-hidden />}
        </>
      )}
    </button>
  );
}

function Spinner({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ICON_SIZE: Record<Size, number> = { sm: 12, md: 14, lg: 16 };

const SIZE: Record<Size, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2.5 text-sm",
};

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-slate-900 text-white shadow-[var(--shadow-card)] hover:bg-slate-700 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-400",
  gradient:
    "bg-gradient-brand text-white shadow-[var(--shadow-card-md)] hover:shadow-[var(--shadow-card-lg)] hover:brightness-110",
  danger: "bg-rose-600 text-white shadow-[var(--shadow-card)] hover:bg-rose-500",
  warn: "bg-amber-600 text-white shadow-[var(--shadow-card)] hover:bg-amber-500",
  ok: "bg-emerald-600 text-white shadow-[var(--shadow-card)] hover:bg-emerald-500",
  ghost:
    "text-ink hover:bg-surface-2 dark:text-slate-200 dark:hover:bg-white/[0.06]",
  outline:
    "border border-line bg-surface-1 text-ink hover:bg-surface-2 hover:border-line-strong",
};
