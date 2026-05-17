import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import StepIndicator from "./StepIndicator";
import PageHero from "@/components/ui/PageHero";

type Props = {
  currentStep: number;
  /** Optional preserved query params used to keep wizard state in URLs. */
  carryParams?: Record<string, string | undefined>;
  /** Wizard step content. */
  children: ReactNode;
  /** When set, surfaces an "Editing draft: <title>" hint in the header. */
  draftTitle?: string;
};

/**
 * Chrome around every wizard step. Renders the page hero, the 5-step
 * indicator, and a back-link to the exercises list. Individual step
 * components own their own form / next-button so they can submit to
 * step-specific server actions.
 */
export default function WizardShell({ currentStep, carryParams = {}, children, draftTitle }: Props) {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={draftTitle ? `Editing draft · ${draftTitle}` : "Plan an exercise"}
        icon={Target}
        title="Plan an exercise"
        pitch="Five steps. We'll save your progress as you go. You can come back to this draft anytime — and you can't go live until every readiness check passes."
        actions={
          <Link
            href="/exercises"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
          >
            <ArrowLeft size={14} />
            Back to exercises
          </Link>
        }
      />

      <StepIndicator current={currentStep} carryParams={carryParams} />

      {children}
    </div>
  );
}
