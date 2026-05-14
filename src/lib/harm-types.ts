import {
  Users,
  Building,
  Server,
  Wifi,
  Database,
  Boxes,
  type LucideIcon,
} from "lucide-react";

export type HarmType =
  | "people"
  | "property"
  | "technology"
  | "dataAvailability"
  | "dataIntegrity"
  | "thirdParty";

export type HarmTypeDef = {
  id: HarmType;
  label: string;
  icon: LucideIcon;
  summary: string;
  examples: string[];
  coaching: string;
  ringClass: string;
  iconBgClass: string;
  iconColorClass: string;
};

export const HARM_TYPES: HarmTypeDef[] = [
  {
    id: "people",
    label: "People",
    icon: Users,
    summary:
      "Disruption to your workforce or to third parties' workforce that operate the service.",
    examples: [
      "Pandemic / mass absenteeism",
      "Industrial action affecting key staff",
      "Loss of an SMF or other named individual",
      "Insider threat or malicious act",
    ],
    coaching:
      "People harms are easy to forget because they are not in the tech stack — but they often dominate real-world incidents. Plan for both planned (key-person dependency) and unplanned (mass absence) people loss.",
    ringClass: "ring-rose-300 dark:ring-rose-700/60",
    iconBgClass: "bg-rose-100 dark:bg-rose-950/40",
    iconColorClass: "text-rose-600 dark:text-rose-300",
  },
  {
    id: "property",
    label: "Property",
    icon: Building,
    summary:
      "Loss of premises, facilities, physical equipment, or environmental control.",
    examples: [
      "Fire / flood at HQ or DC",
      "Loss of office access (cordon, evacuation)",
      "Power outage to a key site",
      "Hardware destruction",
    ],
    coaching:
      "Property harms often drive long recovery clocks — physical replacement timescales are typically days, not minutes. Plan for both site loss (alternate site / WFH) and equipment loss (replacement lead time).",
    ringClass: "ring-amber-300 dark:ring-amber-700/60",
    iconBgClass: "bg-amber-100 dark:bg-amber-950/40",
    iconColorClass: "text-amber-600 dark:text-amber-300",
  },
  {
    id: "technology",
    label: "Technology",
    icon: Server,
    summary:
      "Failure of the technology stack — applications, infrastructure, networks.",
    examples: [
      "Production application outage",
      "Database corruption",
      "Cloud-region failure",
      "Authentication / SSO failure",
    ],
    coaching:
      "Don't let technology dominate your test coverage — exercise non-tech harms with equal frequency. Within tech, distinguish between availability incidents (fast restore) and integrity incidents (slow forensics + restore).",
    ringClass: "ring-cyan-300 dark:ring-cyan-700/60",
    iconBgClass: "bg-cyan-100 dark:bg-cyan-950/40",
    iconColorClass: "text-cyan-600 dark:text-cyan-300",
  },
  {
    id: "dataAvailability",
    label: "Data availability",
    icon: Wifi,
    summary:
      "The data exists and is correct, but is not reachable for some period.",
    examples: [
      "Storage subsystem failure",
      "Network partition isolating a database",
      "Encryption-key service offline",
      "Cloud-storage rate limiting",
    ],
    coaching:
      "Availability incidents usually recover in minutes-to-hours. Watch the RTO closely — if you can't meet RTO, escalate before the tolerance breach, not after.",
    ringClass: "ring-indigo-300 dark:ring-indigo-700/60",
    iconBgClass: "bg-indigo-100 dark:bg-indigo-950/40",
    iconColorClass: "text-indigo-600 dark:text-indigo-300",
  },
  {
    id: "dataIntegrity",
    label: "Data integrity",
    icon: Database,
    summary:
      "Data has been corrupted, lost, or altered without authority. The service is up but the data is wrong.",
    examples: [
      "Ransomware encryption / wiper",
      "Botched migration corrupting records",
      "Schema-change accident",
      "Backup not being valid when needed",
    ],
    coaching:
      "Integrity incidents are the worst — they're hard to detect, slow to recover from, and often require forensic work before you can restore. Test your point-in-time recovery actually works at the cadence regulators expect.",
    ringClass: "ring-violet-300 dark:ring-violet-700/60",
    iconBgClass: "bg-violet-100 dark:bg-violet-950/40",
    iconColorClass: "text-violet-600 dark:text-violet-300",
  },
  {
    id: "thirdParty",
    label: "Third party",
    icon: Boxes,
    summary:
      "A material supplier, intra-group entity, or critical third party fails or becomes unavailable.",
    examples: [
      "Critical vendor outage (e.g. cloud, payments, KYC)",
      "Supplier bankruptcy / exit",
      "Concentration on a single 4th party",
      "Geopolitical sanction blocking a region",
    ],
    coaching:
      "Third-party harm is the regulator's current focus. Map your 4th-party concentration (i.e. when many of your 3rd parties run on the same hyperscaler) and rehearse the exit-plan trigger — not just the post-failure response.",
    ringClass: "ring-emerald-300 dark:ring-emerald-700/60",
    iconBgClass: "bg-emerald-100 dark:bg-emerald-950/40",
    iconColorClass: "text-emerald-600 dark:text-emerald-300",
  },
];

export function harmTypeFor(id: HarmType): HarmTypeDef {
  return HARM_TYPES.find((h) => h.id === id) ?? HARM_TYPES[0];
}
