"use client";

import Drawer from "@/components/ui/Drawer";
import IBSForm from "@/components/IBSForm";

export type IBSQuickEditRow = {
  id: string;
  code: string;
  name: string;
  outcome: string | null;
  description: string | null;
  processType: string | null;
  processOwner: string | null;
  secondLineReviewer: string | null;
  reviewDueAt: Date | null;
  customerJourneys: string[];
  productsCovered: string[];
  impactToleranceMin: number;
  fcaToleranceMin: number | null;
  praToleranceMin: number | null;
  toleranceRationale: string | null;
  criticality: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  technology: string[];
  peopleNotes: string | null;
  facilities: string | null;
  thirdParties: string[];
  information: string[];
  processes: string[];
  impactCustomerFinancial: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  impactVulnerableCustomer: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  impactLossOfLicense: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  impactRegulatoryFine: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  impactReputational: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  impactLossOfCapital: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  importanceAssessmentNotes: string | null;
  vulnerabilitiesNotes: string | null;
  testingNotes: string | null;
  coversPeople: boolean;
  coversProperty: boolean;
  coversTechnology: boolean;
  coversDataAvailability: boolean;
  coversDataIntegrity: boolean;
  coversThirdParty: boolean;
};

type ResourceSuggestion = { value: string; source: "system" | "vendor" | "library" };

type Props = {
  open: boolean;
  onClose: () => void;
  row: IBSQuickEditRow | null;
  techSuggestions?: ResourceSuggestion[];
  vendorSuggestions?: ResourceSuggestion[];
  informationSuggestions?: ResourceSuggestion[];
  processSuggestions?: ResourceSuggestion[];
};

/**
 * Inline edit for an IBS register row. Hosts the canonical IBSForm in
 * edit mode so create + edit always cover the same fields (data-model
 * integrity). On save, the underlying updateIBSAction redirects to /ibs
 * which revalidates the grid; the drawer closes via onSaved.
 */
export default function IBSQuickEditDrawer({
  open,
  onClose,
  row,
  techSuggestions = [],
  vendorSuggestions = [],
  informationSuggestions = [],
  processSuggestions = [],
}: Props) {
  if (!row) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-soft">{row.code}</span>
          <span>{row.name}</span>
        </span>
      }
      subtitle="Edit IBS — same fields as creation. Tab through identity, tolerance, resources, importance and coverage."
      width="xl"
    >
      <div className="p-5">
        <IBSForm
          existing={row}
          techSuggestions={techSuggestions}
          vendorSuggestions={vendorSuggestions}
          informationSuggestions={informationSuggestions}
          processSuggestions={processSuggestions}
          onSaved={onClose}
        />
      </div>
    </Drawer>
  );
}
