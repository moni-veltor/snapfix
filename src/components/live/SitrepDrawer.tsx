"use client";

import { useState } from "react";
import { MessageSquareWarning, X } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import ToastForm from "@/components/ui/ToastForm";
import { addSitrepAction } from "@/app/actions/decisions";

/**
 * One-click sitrep capture from the cadence banner. The full
 * IncidentCapturePanel form lived behind two tabs and a scroll; this
 * drawer brings the whole thing to wherever the participant noticed
 * they're overdue — a sitrep banner click, an approver chip, …
 *
 * The banner above renders nothing when there's no active incident, so
 * by the time this button is visible an incidentId is guaranteed.
 */
export default function SitrepDrawer({
  exerciseId,
  incidentId,
  dDayHHMM,
  defaultBusinessUnit,
}: {
  exerciseId: string;
  incidentId: string;
  dDayHHMM: string;
  defaultBusinessUnit?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-500"
      >
        <MessageSquareWarning size={12} />
        File sitrep now
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="File sitrep"
        subtitle={`D-Day ${dDayHHMM} · current state for your business unit`}
        width="md"
      >
        <ToastForm
          action={addSitrepAction}
          toast={{
            success: "Sitrep filed",
            description: "It will appear in the live feed.",
          }}
          className="space-y-3 p-4 text-sm"
        >
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="incidentId" value={incidentId} />

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Business unit *
            </span>
            <input
              name="businessUnit"
              required
              defaultValue={defaultBusinessUnit ?? ""}
              placeholder="e.g. Core Banking, Payments, KYC Ops" aria-label="e.g. Core Banking, Payments, KYC Ops"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
            />
          </label>

          <fieldset>
            <legend className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Status *
            </legend>
            <div className="mt-1 grid grid-cols-3 gap-2 text-[12px]">
              {(["GREEN", "AMBER", "RED"] as const).map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-surface-1 px-2 py-1.5 hover:bg-surface-2"
                >
                  <input type="radio" name="status" value={s} required />
                  <span
                    className={`font-semibold ${
                      s === "GREEN"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : s === "AMBER"
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {s}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Summary *
            </span>
            <textarea
              name="summary"
              required
              rows={3}
              placeholder="Two-line state-of-the-world for the IMT. What's the situation right now." aria-label="Two-line state-of-the-world for the IMT. What's the situation right now."
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Issues
            </span>
            <textarea
              name="issues"
              rows={2}
              placeholder="Anything that's broken or at risk." aria-label="Anything that's broken or at risk."
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Asks
            </span>
            <textarea
              name="asks"
              rows={2}
              placeholder="What you need from the IMT (decisions, resources, escalations)." aria-label="What you need from the IMT (decisions, resources, escalations)."
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Next update due (D-Day HH:MM)
            </span>
            <input
              name="nextUpdateDDayTime"
              type="text"
              pattern="\d{1,2}:\d{2}"
              placeholder="e.g. 10:30" aria-label="e.g. 10:30"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
            />
            <p className="mt-1 text-[10px] text-soft">
              30-60 minutes is typical cadence for an active incident.
            </p>
          </label>

          <footer className="flex items-center justify-end gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
            >
              <X size={13} />
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500"
            >
              File sitrep
            </button>
          </footer>
        </ToastForm>
      </Drawer>
    </>
  );
}
