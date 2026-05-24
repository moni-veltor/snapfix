import {
  AlertOctagon,
  Ban,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Colourblind-safe status badge: icon + text so users who can't tell
 * "amber vs green" can still parse status. Replaces the loose
 * "bg-X-100 text-X-800" pill pattern that was the most common colour-
 * only signal in the app.
 *
 * All variants ship matching dark-mode classes; the icon size is fixed
 * at 10px so the badge stays compact next to inline metadata.
 */

export type StatusKind =
  // Action-item lifecycle
  | "OPEN"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "DONE"
  | "WONT_FIX"
  // Incident lifecycle
  | "DECLARED"
  | "INVOKED"
  | "CONTAINED"
  | "RESOLVED"
  | "STOOD_DOWN"
  | "CLOSED"
  // Comms / approval lifecycle
  | "DRAFT"
  | "AWAITING_APPROVAL"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SENT"
  | "ACKNOWLEDGED"
  | "SUBMITTED";

type Spec = {
  icon: LucideIcon;
  cls: string;
  label: string;
};

const SPECS: Record<StatusKind, Spec> = {
  // Action items
  OPEN: {
    icon: Circle,
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    label: "Open",
  },
  IN_PROGRESS: {
    icon: Loader2,
    cls: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
    label: "In progress",
  },
  BLOCKED: {
    icon: AlertOctagon,
    cls: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    label: "Blocked",
  },
  DONE: {
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    label: "Done",
  },
  WONT_FIX: {
    icon: Ban,
    cls: "bg-surface-2 text-muted",
    label: "Won't fix",
  },
  // Incident
  DECLARED: {
    icon: Circle,
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    label: "Declared",
  },
  INVOKED: {
    icon: AlertOctagon,
    cls: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    label: "Invoked",
  },
  CONTAINED: {
    icon: ShieldCheck,
    cls: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
    label: "Contained",
  },
  RESOLVED: {
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    label: "Resolved",
  },
  STOOD_DOWN: {
    icon: Ban,
    cls: "bg-surface-2 text-muted",
    label: "Stood down",
  },
  CLOSED: {
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    label: "Closed",
  },
  // Comms / approval
  DRAFT: {
    icon: Mail,
    cls: "bg-surface-2 text-muted",
    label: "Draft",
  },
  AWAITING_APPROVAL: {
    icon: Clock,
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    label: "Awaiting approval",
  },
  PENDING_APPROVAL: {
    icon: Clock,
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    label: "Pending approval",
  },
  APPROVED: {
    icon: CheckCircle2,
    cls: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
    label: "Approved",
  },
  REJECTED: {
    icon: XCircle,
    cls: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    label: "Rejected",
  },
  SENT: {
    icon: Send,
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    label: "Sent",
  },
  ACKNOWLEDGED: {
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    label: "Acknowledged",
  },
  SUBMITTED: {
    icon: Send,
    cls: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
    label: "Submitted",
  },
};

export default function StatusBadge({
  status,
  size = "sm",
  className = "",
  labelOverride,
}: {
  status: StatusKind | string;
  size?: "xs" | "sm";
  className?: string;
  /** Replace the default label (useful when the surrounding context already
   *  implies status — e.g. "3 OPEN" → labelOverride="3 Open"). */
  labelOverride?: string;
}) {
  const spec = SPECS[status as StatusKind] ?? {
    icon: Circle,
    cls: "bg-surface-2 text-muted",
    label: String(status).replace(/_/g, " ").toLowerCase(),
  };
  const Icon = spec.icon;
  const sizeCls =
    size === "xs"
      ? "px-1.5 py-0.5 text-[9px] gap-0.5"
      : "px-2 py-0.5 text-[10px] gap-1";
  const iconSize = size === "xs" ? 9 : 10;
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wider ${sizeCls} ${spec.cls} ${className}`}
    >
      <Icon size={iconSize} aria-hidden="true" />
      {labelOverride ?? spec.label}
    </span>
  );
}
