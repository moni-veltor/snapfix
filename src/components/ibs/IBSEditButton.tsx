"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Edit3 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import IBSForm from "@/components/IBSForm";

type Suggestion = { value: string; source: "system" | "vendor" | "library" };

type Props = {
  ibs: React.ComponentProps<typeof IBSForm>["existing"];
  techSuggestions: Suggestion[];
  vendorSuggestions: Suggestion[];
  informationSuggestions: Suggestion[];
  processSuggestions: Suggestion[];
};

/**
 * Opens the IBS edit form in a modal instead of a full-page route.
 * Backwards-compat: auto-opens when `?edit=1` is in the URL so existing
 * deep-links from the registry or audit log keep working.
 */
export default function IBSEditButton({
  ibs,
  techSuggestions,
  vendorSuggestions,
  informationSuggestions,
  processSuggestions,
}: Props) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("edit") === "1") {
      // External-state bridge — open from URL param on mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
    }
  }, [searchParams]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
      >
        <Edit3 size={13} />
        Edit
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="xl"
        title={`Edit ${ibs?.code ?? ""}`}
        subtitle={ibs?.name ?? undefined}
      >
        <IBSForm
          existing={ibs}
          techSuggestions={techSuggestions}
          vendorSuggestions={vendorSuggestions}
          informationSuggestions={informationSuggestions}
          processSuggestions={processSuggestions}
          onSaved={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
