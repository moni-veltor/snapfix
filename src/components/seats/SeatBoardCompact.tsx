"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, LogOut, Crown } from "lucide-react";
import { claimSeatAction, vacateSeatAction, markSeatUnreachableAction } from "@/app/actions/seats";
import { visualFor, FAMILY_TONE } from "@/lib/role-icons";
import type { SeatView } from "@/lib/seats";

type Props = {
  exerciseId: string;
  meId: string;
  seats: SeatView[];
};

/**
 * Compact rail-side seat view shown after a participant has claimed.
 * Foregrounds the user's own seat as a hero card; collapses every other
 * seat into a scannable chip-strip with optional expand for details.
 * Replaces both the old wall-of-seats SeatBoard and the duplicate
 * MobilisationChecklist.
 */
export default function SeatBoardCompact({ exerciseId, meId, seats }: Props) {
  const [expanded, setExpanded] = useState(false);

  const mySeat = seats.find((s) => s.holderUserId === meId);
  const otherSeats = seats.filter((s) => s.holderUserId !== meId);
  const filledOthers = otherSeats.filter((s) => s.holderUserId).length;
  const unreachable = otherSeats.filter((s) => s.status === "UNREACHABLE").length;

  return (
    <div className="space-y-3">
      {mySeat && <MySeatCard exerciseId={exerciseId} seat={mySeat} />}

      <section className="rounded-md border border-line bg-surface-1">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between gap-2 p-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Other seats
            </span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              {filledOthers}/{otherSeats.length}
            </span>
            {unreachable > 0 && (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                {unreachable} unreachable
              </span>
            )}
          </div>
          {expanded ? <ChevronUp size={14} className="text-soft" /> : <ChevronDown size={14} className="text-soft" />}
        </button>

        {expanded ? (
          <ul className="divide-y divide-line border-t border-line">
            {otherSeats.map((seat) => (
              <CompactSeatRow key={seat.id} exerciseId={exerciseId} seat={seat} meId={meId} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-wrap gap-1 border-t border-line p-3">
            {otherSeats.slice(0, 12).map((seat) => (
              <SeatChip key={seat.id} seat={seat} />
            ))}
            {otherSeats.length > 12 && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                +{otherSeats.length - 12}
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function MySeatCard({ exerciseId, seat }: { exerciseId: string; seat: SeatView }) {
  const v = visualFor(seat.roleAbbreviation);
  const tone = FAMILY_TONE[v.family];
  const Icon = v.icon;

  return (
    <div className="relative overflow-hidden rounded-lg border-2 border-indigo-400 bg-gradient-brand-soft p-4 shadow-[var(--shadow-card-md)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${tone.iconBg}`}>
            <Icon size={22} className={tone.iconColor} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              <Crown size={10} />
              Your seat
            </div>
            <div className="mt-0.5 font-mono text-sm font-semibold text-ink">
              {seat.roleAbbreviation}
            </div>
            <div className="text-xs text-muted">{seat.roleTitle}</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {seat.isSMF && (
                <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white">
                  SMF
                </span>
              )}
              {seat.isDeputy && (
                <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white">
                  Deputy
                </span>
              )}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${tone.chip}`}
              >
                {tone.label}
              </span>
            </div>
          </div>
        </div>
        <form action={vacateSeatAction}>
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="seatId" value={seat.id} />
          <button
            type="submit"
            title="Vacate this seat"
            className="rounded-md p-1.5 text-soft hover:bg-white/40 hover:text-rose-600 dark:hover:bg-white/[0.04] dark:hover:text-rose-400"
          >
            <LogOut size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}

function CompactSeatRow({
  exerciseId,
  seat,
  meId,
}: {
  exerciseId: string;
  seat: SeatView;
  meId: string;
}) {
  const v = visualFor(seat.roleAbbreviation);
  const tone = FAMILY_TONE[v.family];
  const Icon = v.icon;
  const isFilled = !!seat.holderUserId;
  const isUnreachable = seat.status === "UNREACHABLE";
  const suggestedForMe = seat.defaultHolderUserId === meId && !isFilled;

  return (
    <li className="flex flex-wrap items-center gap-2 p-3 text-xs">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tone.iconBg}`}>
        <Icon size={13} className={tone.iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-ink">{seat.roleAbbreviation}</span>
          <span className="text-soft">·</span>
          <span className="truncate text-muted">{seat.roleTitle}</span>
        </div>
        <div className="mt-0.5 text-[10px]">
          {isFilled ? (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={9} />
              {seat.holderName}
            </span>
          ) : isUnreachable ? (
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <AlertCircle size={9} />
              Unreachable
            </span>
          ) : suggestedForMe ? (
            <span className="text-indigo-600 dark:text-indigo-300">Suggested for you</span>
          ) : (
            <span className="text-soft">Empty</span>
          )}
        </div>
      </div>
      {!isFilled ? (
        <form action={claimSeatAction}>
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="seatId" value={seat.id} />
          {isUnreachable && <input type="hidden" name="asDeputy" value="on" />}
          <button
            type="submit"
            className="rounded-md border border-line bg-surface-0 px-2 py-0.5 text-[10px] font-medium text-ink hover:bg-surface-2"
          >
            {isUnreachable ? "Step up" : "Claim"}
          </button>
        </form>
      ) : (
        <form action={markSeatUnreachableAction}>
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="seatId" value={seat.id} />
          <button
            type="submit"
            title="Mark as unreachable"
            className="rounded-md p-1 text-soft hover:bg-surface-2 hover:text-rose-600"
          >
            <AlertCircle size={11} />
          </button>
        </form>
      )}
    </li>
  );
}

function SeatChip({ seat }: { seat: SeatView }) {
  const v = visualFor(seat.roleAbbreviation);
  const tone = FAMILY_TONE[v.family];
  const Icon = v.icon;
  const isFilled = !!seat.holderUserId;
  const isUnreachable = seat.status === "UNREACHABLE";

  return (
    <span
      title={`${seat.roleAbbreviation} · ${seat.roleTitle}${
        isFilled ? ` · ${seat.holderName}` : isUnreachable ? " · unreachable" : " · empty"
      }`}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
        isUnreachable
          ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          : isFilled
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : `border-line bg-surface-0 ${tone.iconColor}`
      }`}
    >
      <Icon size={10} />
      <span className="font-mono">{seat.roleAbbreviation}</span>
    </span>
  );
}
