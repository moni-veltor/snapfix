"use client";

import { useState } from "react";
import { Library } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { addRunbookFromLibraryAction } from "@/app/actions/runbooks";
import type { LibraryRunbook } from "@/lib/library/runbooks";

/**
 * "Add from library" — modal-pick a best-practice runbook template, which is
 * then cloned into the org as a DRAFT runbook the admin can customise.
 */
export default function LibraryRunbookPicker({ library }: { library: LibraryRunbook[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2"
      >
        <Library size={14} />
        Add from library
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="xl"
        title="Add runbook from library"
        subtitle={`${library.length} best-practice template${library.length === 1 ? "" : "s"} available to clone into your org`}
      >
        <ul className="space-y-3">
          {library.map((r) => (
            <li
              key={r.slug}
              className="rounded-xl border border-line bg-surface-1 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {r.category.replace(/_/g, " ")}
                  </p>
                  <h3 className="mt-0.5 font-display text-base font-semibold text-ink">
                    {r.title}
                  </h3>
                  <p className="mt-1 text-[12px] text-soft">{r.description}</p>
                  <p className="mt-2 text-[11px] text-soft">
                    {r.steps.length} steps · owner {r.ownerRoleTitle}
                    {r.trigger?.severityAtLeast && (
                      <> · auto-activates ≥ {r.trigger.severityAtLeast}</>
                    )}
                  </p>
                </div>
                <form action={addRunbookFromLibraryAction}>
                  <input type="hidden" name="slug" value={r.slug} />
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Add to org
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
