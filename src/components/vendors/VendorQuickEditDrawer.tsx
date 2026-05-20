"use client";

import Drawer from "@/components/ui/Drawer";
import VendorAddWizard, {
  type VendorExisting,
} from "@/components/vendors/VendorAddWizard";

export type VendorQuickEditRow = VendorExisting;

type Props = {
  open: boolean;
  onClose: () => void;
  row: VendorQuickEditRow | null;
};

/**
 * Inline edit for a vendor row. Hosts the canonical VendorAddWizard in
 * edit mode so create + edit always cover the same fields (data-model
 * integrity). The wizard sends a hidden `id` and upsertVendorAction
 * branches to the update path.
 */
export default function VendorQuickEditDrawer({ open, onClose, row }: Props) {
  if (!row) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={row.name}
      subtitle="Edit vendor — same fields as creation. Step through basics, DORA, contract, assurance and exit plan."
      width="xl"
    >
      <div className="p-5">
        <VendorAddWizard existing={row} onDone={onClose} />
      </div>
    </Drawer>
  );
}
