"use client";

import { useEffect, useState } from "react";
import { Bell, ClipboardCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Drawer from "@/components/ui/Drawer";
import VendorAddWizard, {
  type VendorExisting,
} from "@/components/vendors/VendorAddWizard";
import MtpEditor from "@/components/vendors/MtpEditor";
import NotificationsPanel from "@/components/vendors/NotificationsPanel";
import { getVendorEditBundle, upsertVendorAction } from "@/app/actions/vendors";

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
          ? "Fill the wizard and MTP register together — one Save creates the vendor with everything captured."
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
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("wizard");

  // After save, transition to the same EditBody an existing row uses —
  // user can keep editing in place, including notifications.
  if (createdId) {
    return (
      <EditBody
        key={createdId}
        vendorId={createdId}
        canEdit={true}
        onClose={onClose}
        initialTab={tab === "wizard" ? "mtp" : tab}
      />
    );
  }

  // A blank "vendor" record so MtpEditor's defaults render as empty
  // inputs in create mode. Only relations + null scalars; no id.
  const blankVendor = BLANK_VENDOR_FOR_MTP;

  const handleSubmit = async (fd: FormData) => {
    const toastId = toast.loading("Saving vendor…");
    try {
      const result = await upsertVendorAction(fd);
      toast.success("Vendor saved", {
        id: toastId,
        description: "All sections captured. You can keep editing.",
      });
      setCreatedId(result.id);
    } catch (err) {
      toast.error("Couldn't save vendor", { id: toastId });
      throw err;
    }
  };

  return (
    <>
      <div className="border-b border-line bg-surface-1 px-5 pt-3">
        <div role="tablist" className="flex flex-wrap gap-1">
          <TabButton active={tab === "wizard"} onClick={() => setTab("wizard")} icon={Sparkles}>
            Wizard
          </TabButton>
          <TabButton
            active={tab === "mtp"}
            onClick={() => setTab("mtp")}
            icon={ClipboardCheck}
          >
            MTP register
          </TabButton>
          <TabButton
            active={tab === "notifications"}
            onClick={() => setTab("notifications")}
            icon={Bell}
            disabled
            title="Notifications attach to an existing vendor — save the basics first"
          >
            Notifications
          </TabButton>
        </div>
      </div>

      {/*
        One unified form spans wizard + MTP. Tabs only toggle CSS
        visibility — all inputs stay in the DOM so a single submit
        captures every field. upsertVendorAction picks up the MTP
        fields when present.
      */}
      <form action={handleSubmit} className="space-y-5 p-5">
        <div className={tab === "wizard" ? "" : "hidden"}>
          <VendorAddWizard embedded onDone={onClose} onSaved={setCreatedId} />
        </div>
        <div className={tab === "mtp" ? "" : "hidden"}>
          <MtpEditor
            embedded
            vendor={blankVendor}
            readiness={EMPTY_READINESS}
            canEdit
          />
        </div>
        {tab === "notifications" && (
          <PreSavePrompt onSwitchToWizard={() => setTab("wizard")} />
        )}

        <footer className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line bg-surface-0 px-3 py-2 text-sm text-muted hover:border-line-strong hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Save vendor
          </button>
        </footer>
      </form>
    </>
  );
}

function PreSavePrompt({ onSwitchToWizard }: { onSwitchToWizard: () => void }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-surface-1 p-8 text-center">
      <p className="text-sm text-ink">
        Save the vendor first to start sending notifications.
      </p>
      <p className="mt-1 text-xs text-muted">
        Notifications attach to an existing vendor record.
      </p>
      <button
        type="button"
        onClick={onSwitchToWizard}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        Back to the wizard
      </button>
    </div>
  );
}

const EMPTY_READINESS = {
  checks: [] as { id: string; ref: string; label: string; ok: boolean }[],
  passed: 0,
  total: 0,
  isRegisterReady: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BLANK_VENDOR_FOR_MTP: any = {
  id: "",
  name: "",
  isMaterialThirdParty: false,
  contractRef: null,
  legalName: null,
  legalEntityIdentifier: null,
  isOutsourcing: null,
  serviceTypeTaxonomy: null,
  cloudDeployment: null,
  productServiceDescription: null,
  supplyChainRanking: null,
  contractStartAt: null,
  contractEndAt: null,
  serviceCommencedAt: null,
  noticePeriodVendorDays: null,
  noticePeriodFirmDays: null,
  governingLaw: null,
  contractAnnualValueGBP: null,
  materialityReason: null,
  materialityAssessedAt: null,
  functionCategory: null,
  supportsCoreIBSElement: null,
  itPRASafetySoundness: null,
  itPRAFinancialStability: null,
  itPRAPolicyholderProtection: null,
  itFCAClientHarm: null,
  itFCAMarketIntegrity: null,
  itBankFMIRegulator: null,
  countryDataStored: null,
  countryServiceDeliveredFrom: null,
  compliesWithRules: null,
  assuranceSummary: null,
  smfSignedOff: null,
  governanceCommittee: null,
  governanceApprovedAt: null,
  substitutability: null,
  reintegrationAbility: null,
  impactOfDiscontinuing: null,
  assessments: [],
  ibsLinks: [],
};

function EditBody({
  vendorId,
  canEdit,
  onClose,
  initialTab = "wizard",
}: {
  vendorId: string;
  canEdit: boolean;
  onClose: () => void;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
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
