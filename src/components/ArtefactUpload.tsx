"use client";

import { useActionState, useRef, useEffect } from "react";
import { uploadArtefactAction, type UploadResult } from "@/app/actions/artefacts";

type Target = "SCENARIO" | "EXERCISE" | "EVENT" | "INJECT";

const KIND_LABELS: Record<string, string> = {
  FACILITATOR_GUIDE: "Facilitator Guide",
  PARTICIPANT_GUIDE: "Participant Guide",
  SCENARIO_GUIDE: "Scenario Guide",
  ALERT: "Alert (e.g. CloudWatch JSON)",
  EMAIL: "Email (PDF / image)",
  REPORT: "Report",
  DOC: "Document",
  LOG: "Log file",
  OTHER: "Other",
};

const DEFAULT_KINDS: Record<Target, string[]> = {
  SCENARIO: ["FACILITATOR_GUIDE", "PARTICIPANT_GUIDE", "SCENARIO_GUIDE", "DOC", "OTHER"],
  EXERCISE: ["REPORT", "DOC", "OTHER"],
  EVENT: ["ALERT", "EMAIL", "DOC", "OTHER"],
  INJECT: ["ALERT", "EMAIL", "DOC", "OTHER"],
};

export default function ArtefactUpload({
  target,
  targetId,
  compact = false,
}: {
  target: Target;
  targetId: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState<UploadResult | undefined, FormData>(
    uploadArtefactAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      encType="multipart/form-data"
      className={
        compact
          ? "grid grid-cols-1 gap-2 rounded-md border border-dashed border-line-strong bg-surface-1 p-3 text-sm sm:grid-cols-[1fr_auto_auto]"
          : "grid grid-cols-1 gap-2 rounded-md border border-dashed border-line-strong bg-surface-1 p-4 text-sm sm:grid-cols-2"
      }
    >
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="targetId" value={targetId} />
      {!compact && (
        <label className="block text-sm sm:col-span-2">
          <span className="text-ink">Title</span>
          <input
            name="title"
            required
            maxLength={200}
            placeholder="e.g. AWS CloudWatch Alert — 08:00" aria-label="e.g. AWS CloudWatch Alert — 08:00"
            className="mt-1 w-full rounded border border-line-strong px-2 py-1"
          />
        </label>
      )}
      {compact && (
        <input
          name="title"
          required
          maxLength={200}
          placeholder="Title" aria-label="Title"
          className="rounded border border-line-strong px-2 py-1"
        />
      )}
      <select
        name="kind"
        required
        defaultValue={DEFAULT_KINDS[target][0]}
        className="rounded border border-line-strong bg-surface-1 px-2 py-1"
      >
        {DEFAULT_KINDS[target].map((k) => (
          <option key={k} value={k}>
            {KIND_LABELS[k] ?? k}
          </option>
        ))}
      </select>
      <input
        name="file"
        type="file"
        required
        className="rounded border border-line-strong px-2 py-1"
      />
      {!compact && (
        <textarea
          name="description"
          placeholder="Description (optional)" aria-label="Description (optional)"
          rows={2}
          className="rounded border border-line-strong px-2 py-1 sm:col-span-2"
        />
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>
      {state && !state.ok && (
        <p className="text-sm text-rose-700 sm:col-span-2">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-700 sm:col-span-2">Uploaded ✓</p>
      )}
    </form>
  );
}
