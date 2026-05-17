import { Brain, Clock, HelpCircle, Sparkles, Users } from "lucide-react";
import type { DifficultyOverall } from "@/lib/scenario-difficulty";

const TONE: Record<DifficultyOverall["label"], string> = {
  Foundational: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  Routine: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  Stretching: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  Adversarial: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  "Worst-day": "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  Unrated: "bg-surface-2 text-soft",
};

export default function DifficultyBadge({
  difficulty,
  showAxes = false,
}: {
  difficulty: DifficultyOverall;
  showAxes?: boolean;
}) {
  return (
    <div className="space-y-1">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TONE[difficulty.label]}`}
      >
        <Sparkles size={9} />
        {difficulty.overall ? `${difficulty.overall} · ${difficulty.label}` : difficulty.label}
      </span>
      {showAxes && difficulty.overall !== null && (
        <div className="flex flex-wrap gap-1 text-[10px] text-muted">
          <Axis icon={Brain} label="Cognitive" value={difficulty.axes.cognitive} />
          <Axis icon={Clock} label="Time pressure" value={difficulty.axes.timePressure} />
          <Axis icon={HelpCircle} label="Ambiguity" value={difficulty.axes.ambiguity} />
          <Axis icon={Users} label="Stakeholders" value={difficulty.axes.stakeholders} />
        </div>
      )}
    </div>
  );
}

function Axis({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | null;
}) {
  if (value === null) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5">
      <Icon size={9} />
      {label} {value}/5
    </span>
  );
}
