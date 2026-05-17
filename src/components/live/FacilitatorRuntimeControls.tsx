"use client";

import { useState } from "react";
import { AlertOctagon, Send, Wand2, X } from "lucide-react";
import { abortExerciseAction, fireCurveballInjectAction } from "@/app/actions/exercise-runtime";

type Props = {
  exerciseId: string;
  rosterRoleTitles: string[];
  status: string;
};

/**
 * Facilitator-only runtime controls shown on the facilitator dashboard
 * during a live exercise. Two pieces:
 *   1. Curveball — fire an ad-hoc inject at the team RIGHT NOW.
 *   2. Abort   — hard-stop because a real incident has taken over.
 */
export default function FacilitatorRuntimeControls({
  exerciseId,
  rosterRoleTitles,
  status,
}: Props) {
  const [showCurveball, setShowCurveball] = useState(false);
  const [showAbort, setShowAbort] = useState(false);

  const isRunning = status === "IN_PROGRESS" || status === "PAUSED";

  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-4">
      <header>
        <h2 className="text-sm font-semibold text-ink">Runtime controls</h2>
        <p className="text-[11px] text-soft">
          Curveballs let you keep the team honest; abort frees everyone when a real incident
          takes over.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!isRunning}
          onClick={() => setShowCurveball(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <Wand2 size={11} />
          Fire a curveball
        </button>
        <button
          type="button"
          onClick={() => setShowAbort(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-900 hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <AlertOctagon size={11} />
          Abort (real incident taking over)
        </button>
      </div>

      {showCurveball && (
        <form
          action={async (fd) => {
            await fireCurveballInjectAction(fd);
            setShowCurveball(false);
          }}
          className="grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/60 dark:bg-amber-950/30 sm:grid-cols-2"
        >
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <div className="sm:col-span-2 flex items-baseline justify-between">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
              Fire a curveball NOW
            </p>
            <button
              type="button"
              onClick={() => setShowCurveball(false)}
              className="text-soft hover:text-ink"
            >
              <X size={11} />
            </button>
          </div>
          <label className="text-[11px] sm:col-span-2">
            <span className="text-amber-900 dark:text-amber-100">Summary</span>
            <input
              name="summary"
              required
              maxLength={200}
              placeholder="e.g. CEO call from FCA — they've seen the news"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-[11px] sm:col-span-2">
            <span className="text-amber-900 dark:text-amber-100">Body</span>
            <textarea
              name="description"
              required
              rows={3}
              maxLength={2000}
              placeholder="Full text the team will see in their inbox"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-[11px]">
            <span className="text-amber-900 dark:text-amber-100">Sender role</span>
            <input
              name="senderRoleTitle"
              maxLength={120}
              defaultValue="Facilitator"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-[11px]">
            <span className="text-amber-900 dark:text-amber-100">Kind</span>
            <select
              name="kind"
              defaultValue="BUSINESS"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
            >
              <option value="BUSINESS">BUSINESS</option>
              <option value="REGULATOR">REGULATOR</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="MEDIA">MEDIA</option>
              <option value="VENDOR">VENDOR</option>
              <option value="INTERNAL">INTERNAL</option>
            </select>
          </label>
          <label className="text-[11px]">
            <span className="text-amber-900 dark:text-amber-100">
              To (roles, comma-separated)
            </span>
            <input
              name="toRoleTitlesCsv"
              required
              placeholder="CRO, CEO"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-[11px]">
            <span className="text-amber-900 dark:text-amber-100">CC (optional)</span>
            <input
              name="ccRoleTitlesCsv"
              placeholder="Head of Compliance"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
            />
          </label>
          {rosterRoleTitles.length > 0 && (
            <p className="text-[10px] text-amber-800 dark:text-amber-200 sm:col-span-2">
              Roles on roster: {rosterRoleTitles.slice(0, 12).join(", ")}
              {rosterRoleTitles.length > 12 && ` + ${rosterRoleTitles.length - 12}`}
            </p>
          )}
          <div className="sm:col-span-2 flex justify-end">
            <button className="inline-flex items-center gap-1 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
              <Send size={11} />
              Fire now
            </button>
          </div>
        </form>
      )}

      {showAbort && (
        <form
          action={abortExerciseAction}
          className="space-y-2 rounded-md border border-rose-200 bg-rose-50 p-3 dark:border-rose-800/60 dark:bg-rose-950/30"
        >
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold text-rose-900 dark:text-rose-100">
              Abort — free participants for the real incident
            </p>
            <button
              type="button"
              onClick={() => setShowAbort(false)}
              className="text-soft hover:text-ink"
            >
              <X size={11} />
            </button>
          </div>
          <p className="text-[11px] text-rose-800 dark:text-rose-200">
            All exercise state is preserved. Status flips to ABANDONED. Captured here so the
            reason is visible in the audit trail (and the evidence pack if applicable).
          </p>
          <label className="block text-[11px]">
            <span className="text-rose-900 dark:text-rose-100">
              Reason (required — captured in audit)
            </span>
            <textarea
              name="reason"
              required
              rows={2}
              maxLength={500}
              placeholder="e.g. Real major incident at payments rail — IMT standing up live"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
            />
          </label>
          <div className="flex justify-end">
            <button className="inline-flex items-center gap-1 rounded-md bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600">
              <AlertOctagon size={11} />
              Abort and free participants
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
