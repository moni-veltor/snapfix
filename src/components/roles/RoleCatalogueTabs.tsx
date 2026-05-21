"use client";

import { useState, type ReactNode } from "react";
import { ClipboardList, Crown, Network } from "lucide-react";
import type { FirmTier } from "@/generated/prisma/enums";
import RoleCatalogueEditor from "@/components/roles/RoleCatalogueEditor";
import DeputyChainsView, {
  type ChainRoleRow,
} from "@/components/roles/DeputyChainsView";
import ResponsibilityMapView, {
  type MapRoleRow,
} from "@/components/roles/ResponsibilityMapView";

type Tab = "catalogue" | "chains" | "map";

type RoleRow = {
  id: string;
  abbreviation: string;
  title: string;
  responsibility: string | null;
  isSMF: boolean;
  isExecutive: boolean;
  deputyOfRoleId: string | null;
  deputyOfAbbreviation: string | null;
  defaultHolderId: string | null;
  defaultHolderName: string | null;
  defaultHolderEmail: string | null;
  seatCount: number;
  orderIdx: number;
};

type Member = { id: string; name: string | null; email: string };

/**
 * Tabbed wrapper around the role catalogue page. Catalogue keeps the
 * existing editor; Deputy chains visualises the deputy graph + flags
 * single-points-of-failure; Responsibility map shows which functional
 * areas are owned (and which are gaps) given the firm's tier.
 */
export default function RoleCatalogueTabs({
  roles,
  members,
  tier,
  spofCount,
  gapCount,
}: {
  roles: RoleRow[];
  members: Member[];
  tier: FirmTier | null;
  /** Pre-computed for the tab-strip badges. */
  spofCount: number;
  gapCount: number;
}) {
  const [tab, setTab] = useState<Tab>("catalogue");

  const chainRoles: ChainRoleRow[] = roles.map((r) => ({
    id: r.id,
    abbreviation: r.abbreviation,
    title: r.title,
    isSMF: r.isSMF,
    isExecutive: r.isExecutive,
    deputyOfRoleId: r.deputyOfRoleId,
    defaultHolderName: r.defaultHolderName,
    defaultHolderEmail: r.defaultHolderEmail,
  }));

  const mapRoles: MapRoleRow[] = roles.map((r) => ({
    id: r.id,
    abbreviation: r.abbreviation,
    title: r.title,
    responsibility: r.responsibility,
    isSMF: r.isSMF,
    isExecutive: r.isExecutive,
    defaultHolderName: r.defaultHolderName,
    defaultHolderEmail: r.defaultHolderEmail,
  }));

  return (
    <section className="space-y-4">
      <div className="border-b border-line">
        <div role="tablist" className="flex flex-wrap gap-1">
          <TabButton active={tab === "catalogue"} onClick={() => setTab("catalogue")} icon={ClipboardList}>
            Catalogue
          </TabButton>
          <TabButton active={tab === "chains"} onClick={() => setTab("chains")} icon={Crown}>
            Deputy chains
            {spofCount > 0 && <Badge tone="critical">{spofCount}</Badge>}
          </TabButton>
          <TabButton active={tab === "map"} onClick={() => setTab("map")} icon={Network}>
            Responsibility map
            {gapCount > 0 && <Badge tone="critical">{gapCount}</Badge>}
          </TabButton>
        </div>
      </div>

      <div>
        {tab === "catalogue" && (
          <RoleCatalogueEditor roles={roles} members={members} />
        )}
        {tab === "chains" && <DeputyChainsView roles={chainRoles} />}
        {tab === "map" && <ResponsibilityMapView roles={mapRoles} tier={tier} />}
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  children: ReactNode;
}) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-indigo-500 text-indigo-700 dark:text-indigo-200"
          : "border-transparent text-muted hover:text-ink"
      }`}
    >
      <Icon size={11} />
      {children}
    </button>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "critical" | "warn" | "info";
}) {
  const cls =
    tone === "critical"
      ? "bg-rose-600 text-white"
      : tone === "warn"
        ? "bg-amber-600 text-white"
        : "bg-indigo-600 text-white";
  return (
    <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}
