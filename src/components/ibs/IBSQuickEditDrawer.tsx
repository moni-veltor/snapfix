"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Layers, Sparkles } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import IBSForm from "@/components/IBSForm";
import IBSAttestationPanel from "@/components/ibs/IBSAttestationPanel";
import ResourceMapEditor from "@/components/ibs/ResourceMapEditor";
import { getIBSEditBundle } from "@/app/actions/ibs";

type Tab = "form" | "attestation" | "resources";

type Bundle = Awaited<ReturnType<typeof getIBSEditBundle>>;

type Props = {
  open: boolean;
  onClose: () => void;
  /** Minimal placeholder shown in the header while the bundle loads. */
  ibs: { id: string; code: string; name: string } | null;
  canEdit?: boolean;
};

/**
 * Aggregate edit drawer — shows everything the /ibs/[id] detail page
 * does: the canonical IBS form (identity / tolerance / resources /
 * importance / coverage), the attestation cycle panel and the
 * resource-map editor. Data is fetched lazily on open so the grid stays
 * cheap.
 */
export default function IBSQuickEditDrawer({
  open,
  onClose,
  ibs,
  canEdit = true,
}: Props) {
  const [tab, setTab] = useState<Tab>("form");
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !ibs?.id) return;
    let cancelled = false;
    // Lazy fetch on open; loading flag flips once before the network resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getIBSEditBundle(ibs.id).then((b) => {
      if (cancelled) return;
      setBundle(b);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, ibs?.id]);

  if (!ibs) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-soft">{ibs.code}</span>
          <span>{ibs.name}</span>
        </span>
      }
      subtitle="Full IBS editor — form, attestations and resource map, same as the detail page."
      width="2xl"
    >
      <div className="border-b border-line bg-surface-1 px-5 pt-3">
        <div role="tablist" className="flex flex-wrap gap-1">
          <TabButton active={tab === "form"} onClick={() => setTab("form")} icon={Sparkles}>
            Form
          </TabButton>
          <TabButton
            active={tab === "attestation"}
            onClick={() => setTab("attestation")}
            icon={ClipboardList}
          >
            Attestations
            {bundle && bundle.ibs.attestations.length > 0 && (
              <span className="ml-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold text-soft">
                {bundle.ibs.attestations.length}
              </span>
            )}
          </TabButton>
          <TabButton
            active={tab === "resources"}
            onClick={() => setTab("resources")}
            icon={Layers}
          >
            Resource map
            {bundle && bundle.ibs.resources.length > 0 && (
              <span className="ml-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold text-soft">
                {bundle.ibs.resources.length}
              </span>
            )}
          </TabButton>
        </div>
      </div>

      <div className="p-5">
        {loading && (
          <div className="rounded-md border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
            Loading IBS…
          </div>
        )}
        {!loading && !bundle && (
          <div className="rounded-md border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
            Couldn&apos;t load this IBS. Close the drawer and try again.
          </div>
        )}
        {!loading && bundle && (
          <>
            {tab === "form" && (
              <IBSForm
                existing={bundle.ibs}
                techSuggestions={bundle.suggestions.techSuggestions}
                vendorSuggestions={bundle.suggestions.vendorSuggestions}
                informationSuggestions={bundle.suggestions.informationSuggestions}
                processSuggestions={bundle.suggestions.processSuggestions}
                onSaved={onClose}
              />
            )}
            {tab === "attestation" && (
              <IBSAttestationPanel
                ibsId={bundle.ibs.id}
                ibsCode={bundle.ibs.code}
                canManage={canEdit}
                attestations={bundle.ibs.attestations.map((a) => ({
                  id: a.id,
                  cycle: a.cycle,
                  line: a.line,
                  status: a.status,
                  reviewer: a.reviewer,
                  reviewedAt: a.reviewedAt ? a.reviewedAt.toISOString() : null,
                  comment: a.comment,
                }))}
              />
            )}
            {tab === "resources" && (
              <ResourceMapEditor
                ibsId={bundle.ibs.id}
                ibsCode={bundle.ibs.code}
                ibsName={bundle.ibs.name}
                resources={bundle.ibs.resources.map((r) => ({
                  id: r.id,
                  kind: r.kind,
                  label: r.label,
                  criticality: r.criticality,
                  vendor: r.vendor
                    ? { id: r.vendor.id, name: r.vendor.name, statusUrl: r.vendor.statusUrl ?? null }
                    : null,
                  techSystem: r.techSystem
                    ? {
                        id: r.techSystem.id,
                        name: r.techSystem.name,
                        tier: r.techSystem.tier ?? null,
                        lastDrTest: r.techSystem.drTests[0]
                          ? {
                              testedAt: r.techSystem.drTests[0].testedAt,
                              outcome: r.techSystem.drTests[0].outcome,
                            }
                          : null,
                        nextDrTestDueAt: r.techSystem.nextDrTestDueAt ?? null,
                      }
                    : null,
                  department: r.department
                    ? { id: r.department.id, name: r.department.name }
                    : null,
                  note: r.note,
                }))}
                sharedBy={bundle.sharedBy}
                vendors={bundle.orgVendors}
                techSystems={bundle.orgTechSystems}
                departments={bundle.orgDepartments}
                canEdit={canEdit}
              />
            )}
          </>
        )}
      </div>
    </Drawer>
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
  children: React.ReactNode;
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
