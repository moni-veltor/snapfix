import Link from "next/link";
import {
  Building2,
  Crown,
  Layers,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

export type Audience = "board" | "executive" | "programme" | "risk" | "vendors";

const TABS: { key: Audience; label: string; hint: string; icon: LucideIcon }[] = [
  { key: "board", label: "Board", hint: "Strategic KPIs", icon: Crown },
  { key: "executive", label: "Executive", hint: "ERCC / BRCC + comms", icon: Users },
  { key: "programme", label: "Programme", hint: "Coverage gaps", icon: Layers },
  { key: "risk", label: "Risk", hint: "Findings + breaches", icon: ShieldAlert },
  { key: "vendors", label: "Vendors", hint: "Third-party concentration", icon: Building2 },
];

type Props = {
  current: Audience;
  /** Forwarded query params so the FilterBar's state survives tab switches. */
  carryParams?: Record<string, string | undefined>;
};

export default function AudienceTabs({ current, carryParams = {} }: Props) {
  return (
    <nav
      aria-label="Audience"
      className="-mx-1 flex flex-wrap gap-1 rounded-xl border border-line bg-surface-1 p-1"
    >
      {TABS.map((t) => {
        const params = new URLSearchParams();
        params.set("audience", t.key);
        for (const [k, v] of Object.entries(carryParams)) {
          if (k === "audience" || !v) continue;
          params.set(k, v);
        }
        const active = current === t.key;
        const Icon = t.icon;
        return (
          <Link
            key={t.key}
            href={`/analytics?${params.toString()}`}
            aria-current={active ? "page" : undefined}
            className={`group flex min-w-[150px] flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left transition-all ${
              active
                ? "bg-gradient-brand text-white shadow-[var(--shadow-card)]"
                : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <Icon size={14} className="shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{t.label}</span>
              <span
                className={`block truncate text-[10px] ${
                  active ? "text-white/80" : "text-soft"
                }`}
              >
                {t.hint}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
