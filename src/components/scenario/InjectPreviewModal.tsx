"use client";

import Modal from "@/components/ui/Modal";
import Pill from "@/components/ui/Pill";

type Marker = {
  id: string;
  kind: "EVENT" | "INJECT";
  no: number;
  time: string;
  title: string;
  description: string;
  senderRoleTitle: string | null;
  toRoleTitles: string[];
  ccRoleTitles: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  marker: Marker | null;
  knownLower: Set<string>;
};

/**
 * Preview an event/inject as the addressed participant will see it in the
 * inbox. Shows the addressing block + body + flags for unknown roles.
 */
export default function InjectPreviewModal({ open, onClose, marker, knownLower }: Props) {
  if (!marker) return null;
  const unknown = marker.toRoleTitles
    .concat(marker.ccRoleTitles)
    .filter((r) => knownLower.size > 0 && !knownLower.has(r.toLowerCase()));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${marker.kind} preview — #${marker.no}`}
      subtitle={`How this looks in the addressed participant's inbox at D-Day ${marker.time}`}
      size="lg"
    >
      <div className="space-y-3">
        {/* Inbox row mock */}
        <div className="rounded-md border border-rose-300 bg-rose-50/50 p-3 dark:border-rose-700 dark:bg-rose-950/30">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <Pill variant="mono" tone="soft" size="sm" className="font-mono">
              {marker.time}
            </Pill>
            <Pill variant="info" tone="soft" size="sm">
              {marker.kind}
            </Pill>
            <Pill variant="critical" tone="solid" size="sm">
              unread
            </Pill>
            {marker.senderRoleTitle && (
              <span className="text-muted">from {marker.senderRoleTitle}</span>
            )}
          </div>
          <div className="mt-2 text-sm font-medium text-ink">{marker.title}</div>
          <div className="mt-1 text-[11px] text-muted">
            <span className="font-semibold">To:</span>{" "}
            {marker.toRoleTitles.length === 0 ? (
              <em className="text-rose-600 dark:text-rose-400">no recipients</em>
            ) : (
              marker.toRoleTitles.join(", ")
            )}
            {marker.ccRoleTitles.length > 0 && (
              <>
                {" · "}
                <span className="font-semibold">Cc:</span> {marker.ccRoleTitles.join(", ")}
              </>
            )}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{marker.description}</p>
        </div>

        {/* Validation hints */}
        {marker.toRoleTitles.length === 0 && (
          <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
            <strong>Nobody will see this.</strong> With no roles on the To: line, no participant
            inbox will receive it.
          </div>
        )}
        {unknown.length > 0 && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>Unknown role{unknown.length === 1 ? "" : "s"}:</strong>{" "}
            {unknown.join(", ")}. None of these roles are on any exercise roster for this
            scenario yet — participants holding these titles won't receive the message until
            they're added on the team page.
          </div>
        )}
        {!marker.senderRoleTitle && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>No sender role.</strong> The inbox will show "from —". Set a senderRoleTitle
            so participants know who the message is from.
          </div>
        )}
      </div>
    </Modal>
  );
}
