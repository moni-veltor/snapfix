import "server-only";

type BriefingInput = {
  title: string;
  description: string | null;
  exerciseType: string;
  plannedDate: Date | null;
  durationMin: number | null;
  timeZone: string | null;
  location: string | null;
  jurisdiction: string;
  classification: string;
  classificationCaveat: string | null;
  regulatorMode: boolean;
  regulatorAudience: string | null;
  facilitatorName: string;
  coFacilitatorName: string | null;
  objectives: string[];
  participantNames: string[];
  ibsNames: string[];
  scenarioTitles: string[];
};

/** Generate a draft pre-exercise briefing email. Returned as plain text so
 *  the user can paste into their email client (real send is Phase 2). */
export function generateBriefingEmail(input: BriefingInput): {
  subject: string;
  body: string;
} {
  const dateStr = input.plannedDate
    ? input.plannedDate.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: input.timeZone ?? "Europe/London",
      })
    : "TBC";
  const durationStr = input.durationMin ? `${formatDuration(input.durationMin)}` : "TBC";
  const tzNote = input.timeZone ? ` (${input.timeZone})` : "";

  const classifTag =
    input.classification === "CONFIDENTIAL" || input.classification === "SECRET"
      ? ` [${input.classification}${input.classificationCaveat ? ` · ${input.classificationCaveat}` : ""}]`
      : "";
  const regTag = input.regulatorMode
    ? ` — REGULATOR EVIDENCE${input.regulatorAudience ? ` (${input.regulatorAudience})` : ""}`
    : "";

  const subject = `[Exercise]${classifTag}${regTag} ${input.title} — ${dateStr}`;

  const objectivesBlock =
    input.objectives.length === 0
      ? "  (none declared — please raise with the facilitator)"
      : input.objectives.map((o) => `  • ${o}`).join("\n");
  const ibsBlock =
    input.ibsNames.length === 0
      ? "  (no Important Business Services linked)"
      : input.ibsNames.map((s) => `  • ${s}`).join("\n");
  const scenarioBlock =
    input.scenarioTitles.length === 0
      ? "  (no scenarios)"
      : input.scenarioTitles.map((s) => `  • ${s}`).join("\n");

  const body = `Hi all,

You're on the roster for an upcoming operational-resilience exercise. Please read this briefing in advance — D-Day is no time to be reading guidance for the first time.

—— EXERCISE
Title:        ${input.title}
${input.description ? `Description:  ${input.description}\n` : ""}Type:         ${input.exerciseType}
When:         ${dateStr}${tzNote}
Duration:     ${durationStr}
Location:     ${input.location ?? "TBC"}
Jurisdiction: ${input.jurisdiction}
Classification: ${input.classification}${input.classificationCaveat ? ` · ${input.classificationCaveat}` : ""}${
    input.regulatorMode
      ? `\n\n⚠ This exercise is being run as regulator evidence${input.regulatorAudience ? ` for ${input.regulatorAudience}` : ""}.\n  Post-kickoff edits will be locked; every decision and comm requires an approver; closure is strict-no-waivers.`
      : ""
  }

—— FACILITATION
Primary facilitator: ${input.facilitatorName}
${input.coFacilitatorName ? `Backup facilitator:  ${input.coFacilitatorName}\n` : ""}
—— OBJECTIVES (what we're testing)
${objectivesBlock}

—— SCENARIOS
${scenarioBlock}

—— IMPORTANT BUSINESS SERVICES TESTED
${ibsBlock}

—— ROSTER (${input.participantNames.length} people)
${input.participantNames.map((n) => `  • ${n}`).join("\n")}

—— ASKS BEFORE D-DAY
  1. Confirm your role briefing in the platform (Dashboard → "Pre-exercise readiness check")
  2. Confirm your primary phone + out-of-hours number on your profile
  3. Read the role briefing for your seat (visible on the exercise overview)
  4. Test you can reach the comms channels for your role
  5. Acknowledge this email so we can track readiness

Questions: reply to ${input.facilitatorName.split(" ")[0]} or the facilitation team.

Thanks,
The exercise team
`;

  return { subject, body };
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
