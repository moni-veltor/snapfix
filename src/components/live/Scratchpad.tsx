"use client";

import { useEffect, useState } from "react";
import { FileText, Save } from "lucide-react";
import { saveScratchpadAction } from "@/app/actions/scratchpad";

type Props = {
  exerciseId: string;
  initialBody: string;
  lastEditedByName: string | null;
  lastEditedAt: Date | null;
};

/**
 * Shared free-form scratchpad — the equivalent of a Google Doc / Notion page
 * the team would normally fall back to. Markdown-friendly text area with
 * autosave debounced 1s after typing stops.
 */
export default function Scratchpad({
  exerciseId,
  initialBody,
  lastEditedByName,
  lastEditedAt,
}: Props) {
  const [body, setBody] = useState(initialBody);
  const [savedAt, setSavedAt] = useState<Date | null>(lastEditedAt);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Debounced autosave
  useEffect(() => {
    if (!dirty) return;
    const id = setTimeout(async () => {
      setSaving(true);
      try {
        const fd = new FormData();
        fd.set("exerciseId", exerciseId);
        fd.set("body", body);
        await saveScratchpadAction(fd);
        setSavedAt(new Date());
        setDirty(false);
      } finally {
        setSaving(false);
      }
    }, 1200);
    return () => clearTimeout(id);
  }, [body, dirty, exerciseId]);

  return (
    <details className="rounded-md border border-line bg-surface-1" open={initialBody.length > 0}>
      <summary className="flex cursor-pointer items-center gap-2 p-3 text-xs font-semibold uppercase tracking-wider text-ink">
        <FileText size={14} className="text-indigo-500 dark:text-indigo-300" />
        Scratchpad
        <span className="ml-auto text-[10px] font-normal text-soft">
          {saving ? (
            <span className="flex items-center gap-1">
              <Save size={10} className="animate-pulse" />
              saving…
            </span>
          ) : dirty ? (
            <span>unsaved changes</span>
          ) : savedAt ? (
            <span>
              saved
              {lastEditedByName && ` · ${lastEditedByName}`}
            </span>
          ) : null}
        </span>
      </summary>
      <div className="p-3 pt-0">
        <textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setDirty(true);
          }}
          rows={6}
          placeholder="A shared scratchpad for things that don't fit anywhere else — phone-call notes, working hypotheses, draft talking points. Autosaves every second."
          className="w-full rounded-md border border-line bg-surface-0 px-3 py-2 text-sm placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <p className="mt-1 text-[10px] text-soft">
          Markdown-friendly · Autosaves 1s after you stop typing
        </p>
      </div>
    </details>
  );
}
