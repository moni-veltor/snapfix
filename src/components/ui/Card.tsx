import { type ReactNode } from "react";

type Props = {
  className?: string;
  padded?: boolean;
  hoverable?: boolean;
  children: ReactNode;
};

/** Plain card — surface-1 background, line border, consistent radius. */
export default function Card({ className = "", padded = true, hoverable = false, children }: Props) {
  return (
    <div
      className={`rounded-md border border-line bg-surface-1 ${
        padded ? "p-4" : ""
      } ${hoverable ? "transition-colors hover:border-line-strong hover:bg-surface-2" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
