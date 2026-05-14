"use client";

import { useState } from "react";
import { Users, AlertCircle } from "lucide-react";
import {
  claimSeatAction,
  vacateSeatAction,
  markSeatUnreachableAction,
} from "@/app/actions/seats";
import Section from "@/components/ui/Section";
import Pill from "@/components/ui/Pill";
import Button from "@/components/ui/Button";
import type { SeatView } from "@/lib/seats";

type Props = {
  exerciseId: string;
  seats: SeatView[];
  /** Current user's id, used to render "you" / "claim" affordances. */
  meId: string;
};

const STATUS_TONE: Record<string, "neutral" | "ok" | "warn" | "critical" | "info"> = {
  EMPTY: "neutral",
  CLAIMED: "ok",
  UNREACHABLE: "critical",
  DEPUTY_FILLED: "info",
  STOOD_DOWN: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  EMPTY: "Empty",
  CLAIMED: "Filled",
  UNREACHABLE: "Unreachable",
  DEPUTY_FILLED: "Deputy",
  STOOD_DOWN: "Stood down",
};

export default function SeatBoard({ exerciseId, seats, meId }: Props) {
  const [showAll, setShowAll] = useState(false);

  const filled = seats.filter((s) => s.status === "CLAIMED" || s.status === "DEPUTY_FILLED").length;
  const unreachable = seats.filter((s) => s.status === "UNREACHABLE").length;

  // Visible seats: executive seats always, the rest behind "show all"
  const visible = showAll ? seats : seats.filter((s) => s.isExecutive || s.holderUserId === meId);
  const hiddenCount = seats.length - visible.length;

  return (
    <Section
      icon={Users}
      title={`Seats · ${filled}/${seats.length}`}
      right={
        <div className="flex items-center gap-2">
          {unreachable > 0 && (
            <Pill variant="critical" tone="soft" size="sm">
              {unreachable} unreachable
            </Pill>
          )}
        </div>
      }
    >
      <ul className="space-y-2">
        {visible.map((s) => (
          <SeatRow
            key={s.id}
            seat={s}
            exerciseId={exerciseId}
            meId={meId}
          />
        ))}
      </ul>
      {!showAll && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 w-full rounded-md border border-dashed border-line py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink"
        >
          + Show {hiddenCount} more seat{hiddenCount === 1 ? "" : "s"} (IRT · Comms · Compliance)
        </button>
      )}
    </Section>
  );
}

function SeatRow({ seat, exerciseId, meId }: { seat: SeatView; exerciseId: string; meId: string }) {
  const heldByMe = seat.holderUserId === meId;
  const suggestedForMe = !seat.holderUserId && seat.defaultHolderUserId === meId;
  const tone = STATUS_TONE[seat.status] ?? "neutral";

  return (
    <li className="rounded-md border border-line bg-surface-1 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">{seat.roleAbbreviation}</span>
            <span className="text-xs text-muted">{seat.roleTitle}</span>
            {seat.isSMF && (
              <Pill variant="info" tone="soft" size="sm">SMF</Pill>
            )}
            {seat.isDeputy && (
              <Pill variant="info" tone="soft" size="sm">Deputy</Pill>
            )}
          </div>
          {seat.responsibility && (
            <p className="mt-0.5 text-[11px] text-muted">{seat.responsibility}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
            <Pill variant={tone} tone="soft" size="sm">{STATUS_LABEL[seat.status] ?? seat.status}</Pill>
            {seat.holderName && (
              <span className="text-muted">
                <span className="text-soft">held by</span>{" "}
                <span className={heldByMe ? "font-semibold text-indigo-600 dark:text-indigo-300" : "text-ink"}>
                  {heldByMe ? "you" : seat.holderName}
                </span>
                {seat.claimedAt && (
                  <span className="text-soft"> · since {seat.claimedAt.toISOString().slice(11, 16)}</span>
                )}
              </span>
            )}
            {!seat.holderUserId && seat.defaultHolderName && (
              <span className="text-soft">
                normally {seat.defaultHolderName}
                {suggestedForMe && (
                  <span className="ml-1 rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
                    suggested for you
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {heldByMe ? (
            <form action={vacateSeatAction}>
              <input type="hidden" name="exerciseId" value={exerciseId} />
              <input type="hidden" name="seatId" value={seat.id} />
              <Button type="submit" variant="ghost" size="sm">
                Vacate
              </Button>
            </form>
          ) : (
            <>
              {seat.status !== "UNREACHABLE" && (
                <form action={markSeatUnreachableAction}>
                  <input type="hidden" name="exerciseId" value={exerciseId} />
                  <input type="hidden" name="seatId" value={seat.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    icon={AlertCircle}
                    title="Mark this seat as unreachable — signals deputies to step up"
                  >
                    Mark unreachable
                  </Button>
                </form>
              )}
              <form action={claimSeatAction}>
                <input type="hidden" name="exerciseId" value={exerciseId} />
                <input type="hidden" name="seatId" value={seat.id} />
                {seat.status === "UNREACHABLE" && (
                  <input type="hidden" name="asDeputy" value="on" />
                )}
                <Button
                  type="submit"
                  variant={suggestedForMe ? "gradient" : "outline"}
                  size="sm"
                >
                  {seat.status === "UNREACHABLE"
                    ? "Step up as deputy"
                    : suggestedForMe
                      ? "Take seat"
                      : "Claim"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
