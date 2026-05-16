"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Inbox,
  ListChecks,
  Megaphone,
  Users,
  X,
} from "lucide-react";

const STORAGE_KEY = "snapfix-live-tour-seen-v1";

type Step = {
  icon: typeof Compass;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: Compass,
    title: "Welcome to the war room",
    body:
      "This is the live exercise view. It updates in real time as injects fire, decisions get logged, and comms get drafted. The five tabs below split the view by what you're doing right now — there's no need to scroll through everything at once.",
  },
  {
    icon: Inbox,
    title: "Inbox — read injects in order",
    body:
      "Anything sent to you by the facilitator (or simulated calls from the public, regulator, media) appears here in time order. Open one to see the full text and the suggested response window. Unread items have a red dot.",
  },
  {
    icon: ListChecks,
    title: "Decisions — log as you go, close at the end",
    body:
      "When the team makes a call — declare the incident, escalate to IMT, invoke the BCP — record it here with the rationale. At the end of the exercise the closure gate checks every decision has an owner, a rationale, and a next step.",
  },
  {
    icon: Megaphone,
    title: "Comms — drafts go for approval before they 'send'",
    body:
      "Customer notices, regulator reports, internal cascades — draft them here and request approval. Approved drafts get an 'as-sent' timestamp so the post-incident review can reconstruct the comms cascade exactly.",
  },
  {
    icon: Users,
    title: "Team — who's in the seat right now",
    body:
      "Shows who else is logged in, what role they're playing, and the live feed of who did what. If you need to hand off your role mid-exercise this is where you do it.",
  },
];

/**
 * First-time onboarding overlay for the live exercise view. Renders only
 * once per browser — uses localStorage to remember dismissal. Five steps
 * walk the user through the tab model so they understand the view before
 * the first inject lands.
 */
export default function FirstTimeLiveTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
    setShow(false);
  };

  if (!show) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface-1 shadow-[var(--shadow-card-lg)]">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Skip tour"
          className="absolute right-3 top-3 rounded-md p-1 text-soft hover:bg-surface-2 hover:text-ink"
        >
          <X size={14} />
        </button>

        <div className="bg-gradient-brand p-5 text-white">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
            <span>Step {step + 1} of {STEPS.length}</span>
          </div>
          <h2 id="tour-title" className="mt-2 flex items-center gap-2 text-lg font-semibold">
            <Icon size={18} />
            {current.title}
          </h2>
        </div>

        <div className="p-5 text-sm text-ink">
          <p className="leading-relaxed">{current.body}</p>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-0 px-5 py-3">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full ${
                  i === step
                    ? "bg-indigo-600"
                    : i < step
                      ? "bg-indigo-300"
                      : "bg-surface-2"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                type="button"
                onClick={dismiss}
                className="rounded-md px-2.5 py-1.5 text-xs text-muted hover:text-ink"
              >
                Skip
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? dismiss() : setStep(step + 1))}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              {isLast ? (
                <>
                  <CheckCircle2 size={12} />
                  Got it
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={12} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
