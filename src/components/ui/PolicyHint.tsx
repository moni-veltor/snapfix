import { type ReactNode } from "react";
import { HelpCircle } from "lucide-react";

type Props = {
  /** Optional short label. If omitted, renders a discreet ? icon. */
  clause?: string;
  /** Hover/focus explanation. */
  children: ReactNode;
};

/**
 * A discreet info chip — hover or focus to reveal the explanation. Useful
 * for panel titles where the underlying rationale isn't obvious to a
 * first-time participant.
 */
export default function PolicyHint({ clause, children }: Props) {
  return (
    <span
      tabIndex={0}
      title={typeof children === "string" ? children : undefined}
      className="ml-1 inline-flex cursor-help items-center gap-0.5 rounded-full border border-line-strong px-1.5 py-0.5 text-[10px] font-medium text-muted hover:bg-surface-2 hover:text-ink focus:outline-none focus:ring-2 focus:ring-indigo-300"
    >
      {clause ?? <HelpCircle size={10} aria-hidden />}
    </span>
  );
}
