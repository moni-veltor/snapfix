"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { recallReleaseAction } from "@/app/actions/facilitator";

type Props = {
  exerciseId: string;
  kind: "EVENT" | "INJECT";
  id: string;
};

export default function RecallButton({ exerciseId, kind, id }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  const recall = () =>
    start(async () => {
      const fd = new FormData();
      fd.set("exerciseId", exerciseId);
      fd.set("kind", kind);
      fd.set("id", id);
      try {
        await recallReleaseAction(fd);
        toast.success(
          kind === "EVENT" ? "Event recalled" : "Inject recalled",
          { description: "Read receipts cleared." },
        );
      } catch {
        toast.error("Couldn't recall — please try again.");
      }
      setConfirming(false);
    });

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[11px] text-muted hover:text-rose-600"
        title={`Recall this ${kind.toLowerCase()} — un-release and clear receipts`}
      >
        Recall
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px]">
      <span className="text-rose-700 dark:text-rose-400">Sure?</span>
      <button
        type="button"
        onClick={recall}
        disabled={pending}
        className="rounded bg-rose-600 px-1.5 py-0.5 text-white hover:bg-rose-500 disabled:opacity-50"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded border border-line px-1.5 py-0.5"
      >
        No
      </button>
    </span>
  );
}
