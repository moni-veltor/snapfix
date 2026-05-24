import { Save, Zap } from "lucide-react";
import { upsertHotWashAction } from "@/app/actions/exercise-runtime";

type Props = {
  exerciseId: string;
  defaults: {
    summary: string | null;
    immediateGaps: string | null;
    immediateWins: string | null;
    nextActionsRaw: string | null;
    heldAt: Date | null;
  } | null;
};

/**
 * Captures the 15-minute structured hot-wash immediately at end-of-exercise.
 * Distinct from the formal Retrospective (5d post-closure) and the
 * publish-grade AAR. Designed to be filled in live by the facilitator while
 * the team is still in the room.
 */
export default function HotWashForm({ exerciseId, defaults }: Props) {
  return (
    <form
      action={upsertHotWashAction}
      className="space-y-3 rounded-xl border border-line bg-surface-1 p-5"
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <header>
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Zap size={14} className="text-amber-600 dark:text-amber-300" />
          Hot-wash (immediate)
        </h2>
        <p className="mt-0.5 text-[11px] text-soft">
          15-minute structured debrief while the team is still in the room. Distinct from the
          formal retrospective (held 5 days later) and the published AAR. Captures only what&apos;s
          obvious right now.
        </p>
        {defaults?.heldAt && (
          <p className="mt-1 text-[11px] text-soft">
            First captured {defaults.heldAt.toISOString().slice(0, 16).replace("T", " ")} UTC
          </p>
        )}
      </header>
      <Field
        label="Quick summary"
        name="summary"
        defaultValue={defaults?.summary ?? ""}
        placeholder="One paragraph the team agrees on, written live."
      />
      <Field
        label="The 1-3 things that hurt most"
        name="immediateGaps"
        defaultValue={defaults?.immediateGaps ?? ""}
        placeholder="What broke. What we didn't have. Where we lost time."
      />
      <Field
        label="The 1-3 things that worked surprisingly well"
        name="immediateWins"
        defaultValue={defaults?.immediateWins ?? ""}
        placeholder="What clicked. What we'd absolutely keep doing."
      />
      <Field
        label="Raw next-actions (will be promoted to action items)"
        name="nextActionsRaw"
        defaultValue={defaults?.nextActionsRaw ?? ""}
        placeholder={"- Update on-call list with FCA out-of-hours number\n- Re-run severity classification drill before next exercise\n- Get CRO sign-off on the comms cascade template"}
      />
      <div className="flex justify-end">
        <button className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-500">
          <Save size={11} />
          Save hot-wash
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-ink">{label}</span>
      <textarea
        name={name}
        rows={3}
        defaultValue={defaultValue}
        placeholder={placeholder} aria-label={placeholder}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm"
      />
    </label>
  );
}
