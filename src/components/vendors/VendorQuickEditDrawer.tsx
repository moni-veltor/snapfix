"use client";

import { useEffect, useState } from "react";
import { Bell, ClipboardCheck, Sparkles } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import VendorAddWizard, {
  type VendorExisting,
} from "@/components/vendors/VendorAddWizard";
import MtpEditor from "@/components/vendors/MtpEditor";
import NotificationsPanel from "@/components/vendors/NotificationsPanel";
import { getVendorEditBundle } from "@/app/actions/vendors";

type Tab = "wizard" | "mtp" | "notifications";

type Bundle = Awaited<ReturnType<typeof getVendorEditBundle>>;

type Props = {
  open: boolean;
  onClose: () => void;
  /** Pass null to open in create mode. */
  vendor: { id: string; name: string } | null;
  canEdit?: boolean;
};

/**
 * Aggregate edit drawer — shows everything the /vendors/[id] detail
 * page does: the wizard (basics / DORA / contract / assurance / exit),
 * the MTP register editor and the notifications panel.
 *
 * When `vendor` is null the drawer opens in create mode: only the
 * Wizard tab is usable, the MTP + Notifications tabs are disabled with
 * a hint that they unlock after first save. Data is fetched lazily on
 * open so the grid stays cheap.
 */
export default function VendorQuickEditDrawer({
  open,
  onClose,
  vendor,
  canEdit = true,
}: Props) {
  if (!open) return null;
  const isCreate = vendor === null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isCreate ? "Add a vendor" : vendor.name}
      subtitle={
        isCreate
          ? "Five-step wizard. MTP register and notifications unlock after first save."
          : "Full vendor editor — wizard, MTP register and notifications, same as the detail page."
      }
      width="2xl"
    >
      {isCreate ? (
        <CreateBody onClose={onClose} />
      ) : (
        <EditBody
          key={vendor.id}
          vendorId={vendor.id}
          canEdit={canEdit}
          onClose={onClose}
        />
      )}
    </Drawer>
  );
}

function CreateBody({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="border-b border-line bg-surface-1 px-5 pt-3">
        <div role="tablist" className="flex flex-wrap gap-1">
          <TabButton active onClick={() => {}} icon={Sparkles}>
            Wizard
          </TabButton>
          <TabButton
            active={false}
            disabled
            onClick={() => {}}
            icon={ClipboardCheck}
            title="Save the vendor first to unlock the MTP register"
          >
            MTP register
          </TabButton>
          <TabButton
            active={false}
            disabled
            onClick={() => {}}
            icon={Bell}
            title="Save the vendor first to unlock notifications"
          >
            Notifications
          </TabButton>
        </div>
      </div>
      <div className="p-5">
        <VendorAddWizard onDone={onClose} />
      </div>
    </>
  );
}

function EditBody({
  vendorId,
  canEdit,
  onClose,
}: {
  vendorId: string;
  canEdit: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("wizard");
  const [bundle, setBundle] = useState<Bundle | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVendorEditBundle(vendorId).then((b) => {
      if (!cancelled) setBundle(b);
    });
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  const loading = bundle === null;
  const v = bundle?.vendor ?? null;
  const wizardExisting: VendorExisting | null = v
    ? {
        id: v.id,
        name: v.name,
        description: v.description,
        serviceKind: v.serviceKind,
        tier: v.tier,
        contactName: v.contactName,
        contactEmail: v.contactEmail,
        statusUrl: v.statusUrl,
        isDoraCritical: v.isDoraCritical,
        doraIctTier: v.doraIctTier,
        hyperscaler: v.hyperscaler,
        region: v.region,
        contractStartAt: v.contractStartAt,
        contractEndAt: v.contractEndAt,
        contractRenewalNoticeDays: v.contractRenewalNoticeDays,
        contractAnnualValueGBP: v.contractAnnualValueGBP,
        assuranceKind: v.assuranceKind,
        assuranceExpiryAt: v.assuranceExpiryAt,
        exitPlanReviewedAt: v.exitPlanReviewedAt,
        exitPlanRTOMin: v.exitPlanRTOMin,
        exitPlanNotes: v.exitPlanNotes,
      }
    : null;

  return (
    <>
      <div className="border-b border-line bg-surface-1 px-5 pt-3">
        <div role="tablist" className="flex flex-wrap gap-1">
          <TabButton active={tab === "wizard"} onClick={() => setTab("wizard")} icon={Sparkles}>
            Wizard
          </TabButton>
          <TabButton active={tab === "mtp"} onClick={() => setTab("mtp")} icon={ClipboardCheck}>
            MTP register
          </TabButton>
          <TabButton
            active={tab === "notifications"}
            onClick={() => setTab("notifications")}
            icon={Bell}
          >
            Notifications
            {bundle && bundle.vendor.notifications.length > 0 && (
              <span className="ml-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold text-soft">
                {bundle.vendor.notifications.length}
              </span>
            )}
          </TabButton>
        </div>
      </div>

      <div className="p-5">
        {loading && (
          <div className="rounded-md border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
            Loading vendor…
          </div>
        )}
        {!loading && !bundle && (
          <div className="rounded-md border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
            Couldn&apos;t load this vendor. Close the drawer and try again.
          </div>
        )}
        {!loading && bundle && wizardExisting && (
          <>
            {tab === "wizard" && (
              <VendorAddWizard existing={wizardExisting} onDone={onClose} />
            )}
            {tab === "mtp" && (
              <MtpEditor
                vendor={bundle.vendor}
                readiness={bundle.readiness}
                canEdit={canEdit}
              />
            )}
            {tab === "notifications" && (
              <NotificationsPanel
                vendorId={bundle.vendor.id}
                vendorName={bundle.vendor.name}
                isMTP={bundle.vendor.isMaterialThirdParty}
                registerReady={bundle.readiness.isRegisterReady}
                canEdit={canEdit}
                notifications={bundle.vendor.notifications}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
  disabled = false,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`-mb-px flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-indigo-500 text-indigo-700 dark:text-indigo-200"
          : "border-transparent text-muted hover:text-ink"
      } ${disabled ? "opacity-40 cursor-not-allowed hover:text-muted" : ""}`}
    >
      <Icon size={11} />
      {children}
    </button>
  );
}
