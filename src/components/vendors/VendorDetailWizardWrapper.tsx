"use client";

import { useRouter } from "next/navigation";
import VendorAddWizard, {
  type VendorExisting,
} from "@/components/vendors/VendorAddWizard";

/**
 * Thin client wrapper so the server-component vendor detail page can
 * embed the wizard inside the Basics tab. The wizard manages its own
 * step state + form submission; we just need to provide `onDone` (a
 * no-op refresh so the page picks up any name / tier change).
 */
export default function VendorDetailWizardWrapper({
  existing,
}: {
  existing: VendorExisting;
}) {
  const router = useRouter();
  return (
    <VendorAddWizard
      existing={existing}
      onDone={() => router.refresh()}
    />
  );
}
