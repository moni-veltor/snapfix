import type {
  TechFailoverKind,
  TechSystemKind,
  TechSystemTier,
  DRTestOutcome,
} from "@/generated/prisma/enums";

export type TechSystem = {
  id: string;
  orgId: string;
  name: string;
  kind: TechSystemKind;
  tier: TechSystemTier;
  description: string | null;
  owner: string | null;
  rtoMin: number | null;
  rpoMin: number | null;
  mtpdMin: number | null;
  primaryRegion: string | null;
  failoverRegion: string | null;
  failoverKind: TechFailoverKind;
  backupFrequency: string | null;
  backupRetentionDays: number | null;
  lastBackupValidatedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DRTest = {
  id: string;
  systemId: string;
  testedAt: Date;
  outcome: DRTestOutcome;
  rtoActualMin: number | null;
  rpoActualMin: number | null;
  participants: string | null;
  notes: string | null;
  createdAt: Date;
};

export const SYSTEM_KIND_LABEL: Record<TechSystemKind, string> = {
  APPLICATION: "Application",
  INFRASTRUCTURE: "Infrastructure",
  DATABASE: "Database",
  NETWORK: "Network",
  AUTH: "Authentication",
  OBSERVABILITY: "Observability",
  OTHER: "Other",
};

export const SYSTEM_TIER_LABEL: Record<TechSystemTier, string> = {
  CRITICAL: "Critical · RTO < 1h",
  ESSENTIAL: "Essential · RTO < 4h",
  IMPORTANT: "Important · RTO < 24h",
  ROUTINE: "Routine",
};

export const SYSTEM_TIER_CHIP: Record<TechSystemTier, string> = {
  CRITICAL: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  ESSENTIAL: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  IMPORTANT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  ROUTINE: "bg-surface-2 text-muted",
};

export const FAILOVER_LABEL: Record<TechFailoverKind, string> = {
  ACTIVE_ACTIVE: "Active / active",
  ACTIVE_PASSIVE: "Active / passive",
  WARM_STANDBY: "Warm standby",
  COLD_RESTORE: "Cold restore",
  NONE: "None / single-region",
};

export type SystemWithTests = TechSystem & {
  drTests: DRTest[];
};

export type SystemHealth = {
  badges: { label: string; tone: "ok" | "warn" | "critical" }[];
  rtoStatus: "met" | "missed" | "untested" | "no-target";
  daysSinceTest: number | null;
  backupAgeDays: number | null;
};

export function systemHealth(s: SystemWithTests, now: Date = new Date()): SystemHealth {
  const latest = s.drTests[0]; // assumes ordered by testedAt desc
  const badges: SystemHealth["badges"] = [];

  if (!s.rtoMin) {
    badges.push({ label: "No RTO declared", tone: "critical" });
  }
  if (!latest) {
    badges.push({ label: "Never DR-tested", tone: "critical" });
  } else {
    const daysSinceTest = Math.floor(
      (now.getTime() - latest.testedAt.getTime()) / 86_400_000,
    );
    if (daysSinceTest > 365) {
      badges.push({ label: "DR test > 1 year stale", tone: "critical" });
    } else if (daysSinceTest > 180) {
      badges.push({ label: "DR test > 6 months stale", tone: "warn" });
    }
    if (latest.outcome === "FAIL") {
      badges.push({ label: "Last DR test failed", tone: "critical" });
    } else if (latest.outcome === "PARTIAL") {
      badges.push({ label: "Last DR test partial", tone: "warn" });
    }
  }

  if (s.lastBackupValidatedAt) {
    const days = Math.floor((now.getTime() - s.lastBackupValidatedAt.getTime()) / 86_400_000);
    if (days > 90) {
      badges.push({ label: "Backup not validated > 90d", tone: "warn" });
    }
  } else if (s.tier === "CRITICAL" || s.tier === "ESSENTIAL") {
    badges.push({ label: "Backup never validated", tone: "warn" });
  }

  if (s.failoverKind === "NONE" && (s.tier === "CRITICAL" || s.tier === "ESSENTIAL")) {
    badges.push({ label: "No failover topology", tone: "critical" });
  }

  let rtoStatus: SystemHealth["rtoStatus"] = "no-target";
  if (s.rtoMin && latest?.rtoActualMin != null) {
    rtoStatus = latest.rtoActualMin <= s.rtoMin ? "met" : "missed";
  } else if (s.rtoMin && !latest) {
    rtoStatus = "untested";
  }

  return {
    badges,
    rtoStatus,
    daysSinceTest: latest
      ? Math.floor((now.getTime() - latest.testedAt.getTime()) / 86_400_000)
      : null,
    backupAgeDays: s.lastBackupValidatedAt
      ? Math.floor((now.getTime() - s.lastBackupValidatedAt.getTime()) / 86_400_000)
      : null,
  };
}

export function postureScore(systems: SystemWithTests[], now: Date = new Date()): number {
  if (systems.length === 0) return 0;
  let total = 0;
  for (const s of systems) {
    const h = systemHealth(s, now);
    let pts = 100;
    pts -= h.badges.filter((b) => b.tone === "critical").length * 25;
    pts -= h.badges.filter((b) => b.tone === "warn").length * 10;
    total += Math.max(0, pts);
  }
  return Math.round(total / systems.length);
}

export function fmtMin(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n < 60) return `${n}m`;
  if (n < 60 * 24) {
    const h = Math.floor(n / 60);
    const m = n % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  const d = Math.floor(n / (60 * 24));
  const h = Math.floor((n % (60 * 24)) / 60);
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
}
