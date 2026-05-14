import {
  Crown,
  Shield,
  Server,
  Users,
  Heart,
  Wallet,
  UserCog,
  Scale,
  Megaphone,
  Radio,
  Lock,
  Wrench,
  Code,
  Database,
  Headphones,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export type RoleFamily = "executive" | "tactical" | "comms" | "compliance" | "other";

/**
 * Visual identity per seat — icon + colour family. Used by SeatLobby /
 * SeatBoardCompact / RoleBriefing to make seats read distinct at a glance.
 * Falls back to `Briefcase` + `other` family for unknown roles.
 */
export type RoleVisual = {
  icon: LucideIcon;
  family: RoleFamily;
};

const VISUAL_BY_ABBR: Record<string, RoleVisual> = {
  CEO: { icon: Crown, family: "executive" },
  CRO: { icon: Shield, family: "executive" },
  CTO: { icon: Server, family: "executive" },
  COO: { icon: Users, family: "executive" },
  CCO: { icon: Heart, family: "executive" },
  CFO: { icon: Wallet, family: "executive" },
  CPO: { icon: UserCog, family: "executive" },

  "Head of Compliance": { icon: Scale, family: "compliance" },
  "Head of External Affairs": { icon: Megaphone, family: "comms" },
  "Comms Lead": { icon: Radio, family: "comms" },

  ISM: { icon: Lock, family: "tactical" },
  "Sn.TPM": { icon: Wrench, family: "tactical" },
  TPM: { icon: Code, family: "tactical" },
  "Sn. DA/E": { icon: Database, family: "tactical" },
  "Customer Ops Lead": { icon: Headphones, family: "tactical" },
};

export function visualFor(abbreviation: string): RoleVisual {
  return VISUAL_BY_ABBR[abbreviation] ?? { icon: Briefcase, family: "other" };
}

/** Tailwind colour classes per family, used as Card border + accent. */
export const FAMILY_TONE: Record<
  RoleFamily,
  { ring: string; chip: string; iconBg: string; iconColor: string; label: string }
> = {
  executive: {
    ring: "border-indigo-300 dark:border-indigo-700/50",
    chip: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    iconColor: "text-indigo-600 dark:text-indigo-300",
    label: "Executive",
  },
  tactical: {
    ring: "border-cyan-300 dark:border-cyan-700/50",
    chip: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
    iconBg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    iconColor: "text-cyan-600 dark:text-cyan-300",
    label: "Tactical",
  },
  comms: {
    ring: "border-amber-300 dark:border-amber-700/50",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-300",
    label: "Comms",
  },
  compliance: {
    ring: "border-violet-300 dark:border-violet-700/50",
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
    iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-300",
    label: "Compliance",
  },
  other: {
    ring: "border-slate-300 dark:border-slate-700/50",
    chip: "bg-surface-2 text-ink dark:bg-slate-800 dark:text-slate-200",
    iconBg: "bg-slate-500/10 dark:bg-slate-500/20",
    iconColor: "text-muted dark:text-slate-300",
    label: "Other",
  },
};
