"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { updateMemberProfileAction } from "@/app/actions/org";
import { withToast } from "@/lib/toast-action";

type UserShape = {
  id: string;
  name: string | null;
  email: string;
  jobTitle: string | null;
  location: string | null;
  phone: string | null;
  altEmail: string | null;
  outOfHoursPhone: string | null;
  bio: string | null;
};

export default function MemberProfileEditButton({
  user,
  isMe,
}: {
  user: UserShape;
  isMe: boolean;
}) {
  const [open, setOpen] = useState(false);
  const action = withToast(updateMemberProfileAction, {
    success: "Profile updated",
    description: "Contact details are now visible across the org.",
    error: "Couldn't update the profile",
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        <Pencil size={14} strokeWidth={2.4} />
        {isMe ? "Edit your profile" : "Edit profile"}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isMe ? "Edit your profile" : `Edit ${user.name ?? user.email}`}
        subtitle="Contact details that the IMT relies on for real-incident escalation."
        size="lg"
      >
        <form
          action={async (fd) => {
            setOpen(false);
            await action(fd);
          }}
          className="space-y-3 text-sm"
        >
          <input type="hidden" name="userId" value={user.id} />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-xs">
              <span className="text-soft">Display name</span>
              <input
                name="name"
                defaultValue={user.name ?? ""}
                placeholder="Jane Doe" aria-label="Jane Doe"
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-soft">Email (read-only)</span>
              <input
                value={user.email}
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-soft"
              />
            </label>
            <label className="text-xs">
              <span className="text-soft">Job title</span>
              <input
                name="jobTitle"
                defaultValue={user.jobTitle ?? ""}
                placeholder="Group CRO · Head of Tech Ops" aria-label="Group CRO · Head of Tech Ops"
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-soft">Location / office</span>
              <input
                name="location"
                defaultValue={user.location ?? ""}
                placeholder="London HQ · Manchester ops · Remote (Edinburgh)" aria-label="London HQ · Manchester ops · Remote (Edinburgh)"
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <fieldset className="space-y-2 rounded-md border border-line bg-surface-0 p-3">
            <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              Contact for incident response
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="text-xs">
                <span className="text-soft">Primary phone</span>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={user.phone ?? ""}
                  placeholder="+44 20 7946 0958" aria-label="+44 20 7946 0958"
                  className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs">
                <span className="text-soft">Out-of-hours phone</span>
                <input
                  name="outOfHoursPhone"
                  type="tel"
                  defaultValue={user.outOfHoursPhone ?? ""}
                  placeholder="+44 7700 900000" aria-label="+44 7700 900000"
                  className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-[10px] text-soft">
                  The number SOC / on-call rings at 3am when the SLA is on fire.
                </span>
              </label>
              <label className="text-xs sm:col-span-2">
                <span className="text-soft">Alternate email (OOH)</span>
                <input
                  name="altEmail"
                  type="email"
                  defaultValue={user.altEmail ?? ""}
                  placeholder="personal@gmail.com" aria-label="personal@gmail.com"
                  className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </fieldset>

          <label className="block text-xs">
            <span className="text-soft">Skills & certifications</span>
            <textarea
              name="bio"
              rows={3}
              defaultValue={user.bio ?? ""}
              placeholder="IMT Gold-Commander qualified · MBCI · Chartered Risk Practitioner · CISSP" aria-label="IMT Gold-Commander qualified · MBCI · Chartered Risk Practitioner · CISSP"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
            />
            <span className="mt-1 block text-[10px] text-soft">
              Free text. Used to find specialists when planning an exercise or escalating.
            </span>
          </label>

          <footer className="flex items-center justify-end gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Save profile
            </button>
          </footer>
        </form>
      </Modal>
    </>
  );
}
