"use client";

import { useState } from "react";
import { markEventReadAction, markInjectReadAction } from "@/app/actions/inbox";
import { upsertResponseAction } from "@/app/actions/exercises";
import type { InboxItem } from "@/lib/inbox";

type ExistingResponse = {
  assessment: string;
  proposedActions: string;
  stakeholders: string | null;
  resources: string | null;
  commsNeeds: string | null;
};

type Props = {
  exerciseId: string;
  item: InboxItem;
  existingResponse: ExistingResponse | null;
};

export default function LiveInboxItem({ exerciseId, item, existingResponse }: Props) {
  const [open, setOpen] = useState(item.unread);
  const [showResponse, setShowResponse] = useState(!!existingResponse);

  const isInject = item.kind === "INJECT";

  return (
    <li
      className={`rounded-md border ${
        item.unread ? "border-rose-300 bg-rose-50/50" : "border-line bg-surface-1"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 p-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 font-mono">{item.scheduledTime}</span>
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">{item.kind}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 ${
                item.addressing === "TO" ? "bg-slate-900 text-white" : "bg-surface-2 text-ink"
              }`}
            >
              {item.addressing}
            </span>
            {item.unread && (
              <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-white">unread</span>
            )}
            {item.from && <span>· from {item.from}</span>}
          </div>
          <div className="mt-1 truncate font-medium text-ink">{item.title}</div>
          {!open && <p className="mt-1 line-clamp-1 text-xs text-muted">{item.summary}</p>}
        </div>
        <span className="text-xs text-soft">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-line px-3 pb-3 pt-2">
          <p className="whitespace-pre-wrap text-sm text-ink">{item.summary}</p>

          {item.attachments.length > 0 && (
            <ul className="space-y-1 text-xs">
              {item.attachments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 rounded border border-line bg-surface-0 px-2 py-1"
                >
                  <span className="rounded-full bg-surface-2 px-1.5 py-0.5 font-mono">{a.kind}</span>
                  <a
                    href={a.blobUrl}
                    target="_blank"
                    rel="noopener"
                    className="flex-1 truncate font-medium text-ink hover:underline"
                  >
                    {a.title}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {item.unread && (
              <form action={isInject ? markInjectReadAction : markEventReadAction}>
                <input type="hidden" name="exerciseId" value={exerciseId} />
                <input
                  type="hidden"
                  name={isInject ? "injectId" : "eventId"}
                  value={item.id}
                />
                <button className="rounded-md border border-line-strong px-3 py-1 text-xs hover:bg-surface-0">
                  Mark read
                </button>
              </form>
            )}
            {isInject && (
              <button
                type="button"
                onClick={() => setShowResponse((s) => !s)}
                className="rounded-md bg-slate-900 px-3 py-1 text-xs text-white hover:bg-slate-700"
              >
                {existingResponse ? "Edit response" : showResponse ? "Hide response" : "Respond"}
              </button>
            )}
          </div>

          {isInject && showResponse && (
            <form
              action={upsertResponseAction}
              className="space-y-2 rounded-md border border-line bg-surface-0 p-3"
            >
              <input type="hidden" name="exerciseId" value={exerciseId} />
              <input type="hidden" name="injectId" value={item.id} />
              <Field
                name="assessment"
                label="Initial assessment"
                required
                defaultValue={existingResponse?.assessment ?? ""}
              />
              <Field
                name="proposedActions"
                label="Proposed actions"
                required
                defaultValue={existingResponse?.proposedActions ?? ""}
              />
              <Field
                name="stakeholders"
                label="Stakeholders"
                defaultValue={existingResponse?.stakeholders ?? ""}
              />
              <Field
                name="resources"
                label="Resources needed"
                defaultValue={existingResponse?.resources ?? ""}
              />
              <Field
                name="commsNeeds"
                label="Comms needs"
                defaultValue={existingResponse?.commsNeeds ?? ""}
              />
              <button className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
                {existingResponse ? "Update response" : "Submit response"}
              </button>
            </form>
          )}
        </div>
      )}
    </li>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs">
      <span className="font-medium text-ink">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        required={required}
        rows={2}
        className="mt-1 w-full rounded-md border border-line-strong px-2 py-1.5 text-sm"
      />
    </label>
  );
}
