"use client";

import { useState } from "react";
import {
  bulkReleaseAction,
  scrubDDayAction,
  broadcastAction,
} from "@/app/actions/facilitator";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { Input, FormField } from "@/components/ui/Input";

type Props = {
  exerciseId: string;
  status: string;
  dDayHHMM: string;
};

export default function FacilitatorControls({ exerciseId, status, dDayHHMM }: Props) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <BulkRelease exerciseId={exerciseId} dDayHHMM={dDayHHMM} />
      <Scrubber exerciseId={exerciseId} status={status} />
      <Broadcast exerciseId={exerciseId} />
    </div>
  );
}

function BulkRelease({ exerciseId, dDayHHMM }: { exerciseId: string; dDayHHMM: string }) {
  const [target, setTarget] = useState(dDayHHMM);
  const [kinds, setKinds] = useState({ events: true, injects: true });

  return (
    <Section
      title="Bulk release"
      subtitle="Catch the timeline up to a given D-Day moment"
    >
      <form action={bulkReleaseAction} className="space-y-2">
        <input type="hidden" name="exerciseId" value={exerciseId} />
        <input
          type="hidden"
          name="kinds"
          value={[kinds.events && "EVENTS", kinds.injects && "INJECTS"].filter(Boolean).join(",")}
        />
        <FormField label="Release everything ≤" hint="HH:MM on the D-Day clock">
          <Input
            name="upToHHMM"
            required
            pattern="[0-9]{2}:[0-9]{2}"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </FormField>
        <div className="flex flex-wrap gap-3 text-xs">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={kinds.events}
              onChange={(e) => setKinds((p) => ({ ...p, events: e.target.checked }))}
            />
            Events
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={kinds.injects}
              onChange={(e) => setKinds((p) => ({ ...p, injects: e.target.checked }))}
            />
            Injects
          </label>
        </div>
        <Button type="submit" size="sm" className="w-full">
          Catch up to {target}
        </Button>
      </form>
    </Section>
  );
}

function Scrubber({ exerciseId, status }: { exerciseId: string; status: string }) {
  const disabled = status !== "PAUSED";
  return (
    <Section
      title="D-Day scrubber"
      subtitle="Skip dead time during a tabletop"
    >
      <form action={scrubDDayAction} className="space-y-2">
        <input type="hidden" name="exerciseId" value={exerciseId} />
        {disabled && (
          <p className="rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Pause the exercise to enable scrubbing.
          </p>
        )}
        <div className="grid grid-cols-3 gap-1">
          {[-15, -5, 5, 15, 30, 60].map((delta) => (
            <button
              key={delta}
              type="submit"
              name="deltaMinutes"
              value={String(delta)}
              disabled={disabled}
              className="rounded-md border border-line bg-surface-1 px-2 py-1 text-[11px] font-medium text-ink hover:bg-surface-2 disabled:opacity-40"
            >
              {delta > 0 ? `+${delta}m` : `${delta}m`}
            </button>
          ))}
        </div>
      </form>
    </Section>
  );
}

function Broadcast({ exerciseId }: { exerciseId: string }) {
  const [message, setMessage] = useState("");

  return (
    <Section
      title="Broadcast"
      subtitle="Out-of-band message to the whole room"
    >
      <form
        action={async (fd) => {
          await broadcastAction(fd);
          setMessage("");
        }}
        className="space-y-2"
      >
        <input type="hidden" name="exerciseId" value={exerciseId} />
        <Input
          name="message"
          required
          placeholder="e.g. 'Lunch — paused 45m. Resume at D-Day 13:00.'"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button type="submit" size="sm" className="w-full">
          📢 Broadcast
        </Button>
      </form>
    </Section>
  );
}
