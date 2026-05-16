import { BookOpen, ShieldCheck, Sparkles, UserCog } from "lucide-react";
import { expectationsFor } from "@/lib/role-expectations";

type Props = {
  roleTitle: string | null;
  isSMF?: boolean;
  isDeputy?: boolean;
  responsibility?: string | null;
};

/**
 * Pre-live preview of the role briefing a participant will see when the
 * exercise goes live. Lets people prepare before they're under time
 * pressure — the IMP expects participants to know their role's first-10-
 * minutes doctrine cold, not be reading it for the first time at D-Day.
 */
export default function RoleBriefingPreview({
  roleTitle,
  isSMF = false,
  isDeputy = false,
  responsibility,
}: Props) {
  if (!roleTitle) {
    return (
      <section className="rounded-xl border border-dashed border-line bg-surface-1 p-5 text-sm">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <UserCog size={14} />
          No role assigned yet
        </p>
        <p className="mt-1 text-xs text-muted">
          Ask the facilitator to assign you a role on the team page. Once you have a
          role, you&apos;ll see the doctrine you need to know before going live.
        </p>
      </section>
    );
  }

  const expectations = expectationsFor(roleTitle);

  return (
    <section className="relative overflow-hidden rounded-xl border border-indigo-300 bg-gradient-to-br from-indigo-50 via-indigo-50 to-cyan-50 p-5 shadow-[var(--shadow-card-md)] dark:border-indigo-700 dark:from-indigo-950/40 dark:via-indigo-950/40 dark:to-cyan-950/30">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-900/30"
      />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white shadow-[var(--shadow-card)]">
          <BookOpen size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
            Pre-exercise role briefing
          </p>
          <h3 className="mt-1 flex flex-wrap items-center gap-2 text-base font-semibold text-ink">
            You&apos;ll be playing {roleTitle}
            {isSMF && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] text-white">
                <ShieldCheck size={9} />
                SMF
              </span>
            )}
            {isDeputy && (
              <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] text-white">
                Deputy
              </span>
            )}
          </h3>
          {responsibility && (
            <p className="mt-2 text-sm text-muted">{responsibility}</p>
          )}
          <div className="mt-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              <Sparkles size={10} />
              Your first 10 minutes — read this before D-Day
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink">
              {expectations.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-[11px] text-soft">
            This same briefing will pop up the first time you join the war room.
          </p>
        </div>
      </div>
    </section>
  );
}
