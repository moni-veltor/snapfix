import {
  Crown,
  Shield,
  Server,
  Building2,
  Heart,
  Banknote,
  Users,
  Scale,
  Megaphone,
  Mic,
  Lock,
  Wrench,
  Code,
  Database,
  Headphones,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export type RoleFamily = "executive" | "tactical" | "comms" | "compliance" | "other";

export type RoleVisual = {
  icon: LucideIcon;
  family: RoleFamily;
};

const ROLE_VISUALS: Record<string, RoleVisual> = {
  // Executive — indigo
  CEO: { icon: Crown, family: "executive" },
  CRO: { icon: Shield, family: "executive" },
  CTO: { icon: Server, family: "executive" },
  COO: { icon: Building2, family: "executive" },
  CCO: { icon: Heart, family: "executive" },
  CFO: { icon: Banknote, family: "executive" },
  CPO: { icon: Users, family: "executive" },

  // Compliance — violet
  "Head of Compliance": { icon: Scale, family: "compliance" },

  // Comms — amber
  "Head of External Affairs": { icon: Megaphone, family: "comms" },
  "Comms Lead": { icon: Mic, family: "comms" },

  // Tactical — cyan
  ISM: { icon: Lock, family: "tactical" },
  "Sn.TPM": { icon: Wrench, family: "tactical" },
  TPM: { icon: Code, family: "tactical" },
  "Sn. DA/E": { icon: Database, family: "tactical" },
  "Customer Ops Lead": { icon: Headphones, family: "tactical" },
};

const DEFAULT_VISUAL: RoleVisual = { icon: Briefcase, family: "other" };

export function roleVisual(abbreviation: string): RoleVisual {
  return ROLE_VISUALS[abbreviation] ?? DEFAULT_VISUAL;
}

/**
 * Tailwind utility strings per family — kept here so every component renders
 * the role consistently. Backgrounds tuned for both light and dark.
 */
export const FAMILY_STYLES: Record<RoleFamily, {
  /** Soft tinted background for the role tile / chip. */
  tint: string;
  /** Solid background for the icon avatar. */
  solid: string;
  /** Text colour for the family label. */
  text: string;
  /** Border accent. */
  border: string;
  /** Family display label. */
  label: string;
}> = {
  executive: {
    tint: "bg-indigo-50 dark:bg-indigo-950/40",
    solid: "bg-indigo-600 text-white",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    label: "Executive",
  },
  tactical: {
    tint: "bg-cyan-50 dark:bg-cyan-950/40",
    solid: "bg-cyan-600 text-white",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800",
    label: "Tactical",
  },
  comms: {
    tint: "bg-amber-50 dark:bg-amber-950/40",
    solid: "bg-amber-600 text-white",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    label: "Communications",
  },
  compliance: {
    tint: "bg-violet-50 dark:bg-violet-950/40",
    solid: "bg-violet-600 text-white",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-800",
    label: "Compliance",
  },
  other: {
    tint: "bg-surface-2",
    solid: "bg-slate-600 text-white",
    text: "text-muted",
    border: "border-line",
    label: "Other",
  },
};
