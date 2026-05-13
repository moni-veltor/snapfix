import { type ReactNode } from "react";

type Props = {
  clause: string; // e.g. "IMP §6.2.2"
  children: ReactNode; // The explanation
};

/**
 * A subtle policy citation chip. Hover/focus reveals the explanation.
 * Used to teach as participants drill — every panel that mirrors a policy
 * clause should render one so the connection is explicit.
 */
export default function PolicyHint({ clause, children }: Props) {
  return (
    <span
      tabIndex={0}
      title={typeof children === "string" ? children : undefined}
      className="ml-1 inline-flex cursor-help items-center rounded-full border border-slate-300 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      {clause}
    </span>
  );
}
