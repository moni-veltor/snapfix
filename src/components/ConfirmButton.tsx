"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Wraps a form submission with a confirmation modal. The form's action runs
 * only after the user confirms. Use for destructive operations.
 *
 *   <ConfirmButton
 *     action={deleteScenarioAction}
 *     hidden={{ id: scenario.id }}
 *     label="Delete"
 *     title="Delete this scenario?"
 *     body="This will permanently delete the scenario and all of its events, injects, and exercises."
 *     successMessage="Scenario deleted"
 *     destructive
 *   />
 */
export default function ConfirmButton({
  action,
  hidden = {},
  label = "Delete",
  title = "Are you sure?",
  body,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  successMessage,
  variant = "link",
}: {
  action: (formData: FormData) => Promise<void> | void;
  hidden?: Record<string, string>;
  label?: string;
  title?: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  successMessage?: string;
  variant?: "link" | "button";
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const triggerCls =
    variant === "button"
      ? `rounded-md px-3 py-1.5 text-sm ${destructive ? "border border-rose-300 text-rose-700 hover:bg-rose-50" : "border border-line-strong"}`
      : destructive
        ? "text-xs text-rose-600 hover:underline"
        : "text-xs text-slate-600 hover:underline";

  return (
    <>
      <button type="button" className={triggerCls} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-line bg-surface-1 p-5 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {body && <p className="mt-2 text-sm text-slate-600">{body}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-line-strong px-3 py-1.5 text-sm hover:bg-surface-0"
                onClick={() => setOpen(false)}
              >
                {cancelLabel}
              </button>
              <form
                ref={formRef}
                action={async (fd) => {
                  setOpen(false);
                  try {
                    await action(fd);
                    if (successMessage) toast.success(successMessage);
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Something went wrong",
                    );
                  }
                }}
              >
                {Object.entries(hidden).map(([k, v]) => (
                  <input key={k} type="hidden" name={k} value={v} />
                ))}
                <button
                  type="submit"
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    destructive
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "bg-slate-900 text-white hover:bg-slate-700"
                  }`}
                >
                  {confirmLabel}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
