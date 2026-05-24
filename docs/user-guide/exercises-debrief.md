# After the run — debrief

When you complete (or abort) an exercise, the platform redirects to `/exercises/[id]/debrief`. This is where the team converts the live capture into lessons + action items + a regulator-ready evidence pack.

## Five tabs

The debrief replaces the old 10-section scroll wall:

| Tab | What lives there |
|---|---|
| **Overview** | Closure celebration · performance card (overall + per-dimension score) · highlight reel · runbook timeline · IBS tolerance breaches |
| **Findings** | Debrief questions with answer-comparison across the team; "add your own answer" expander |
| **Actions** | After-Action Report (summary · strengths · gaps · actions); action-items list + create form; promote-a-debrief-answer-to-action helper |
| **Report** | Post-Incident Report form (10-day clock) · Hot-wash form for the immediate facilitator notes |
| **Retro** | Wellbeing check (anonymous or attributed) · Team retrospective (went-well · didn't · improvements) |

The selected tab persists per exercise in localStorage so a facilitator coming back to finish the PIR re-opens on Report rather than scrolling.

## Performance score

The performance card scores the run across five dimensions:

* **Coverage** — proportion of MSEL events + injects released, addressed by the right roles
* **Cadence** — sitrep + IMT-meeting cadence vs the cadence the IMT declared
* **Decision quality** — every decision had rationale, approver, and was made within reasonable time of the trigger inject
* **Communications** — comms cascade followed (employees before customers, etc.), drafts approved before sent
* **Closure** — five closure criteria met before stand-down

Each dimension renders as a 0–100 score with coaching notes ("Last sitrep was 87 min after the previous — IMT cadence drifts after the first hour"). The card has a `level: critical | warn | ok` per finding.

## Highlight reel

The highlight reel surfaces the 3–5 moments that defined the run — first decision, first regulator notification, the cadence-recovery moment, the closure call. Useful for the exec-summary slide deck.

## Runbook timeline

Every runbook execution that fired during the incident gets a row on the timeline: when it activated, who took which step, what got skipped, the linked decision / notification / comms-draft. Click in to see the frozen runbook snapshot (the runbook version-of-record at activation time, regardless of edits since).

## Action items

The action-items tab is where the post-incident-review converts findings into tracked work. Each item has owner, priority, due date, status. They sync to `/action-items` (the org-wide kanban) so the IMT can drive them to closure between exercises.

The "Promote a debrief answer to an action item" helper turns a participant's answer into a tracked action with one click — closes the loop the regulator looks for ("you said X — what did you do about it?").

## Post-Incident Report

For exercises run against a closed real incident, the PIR form lives on the Report tab. Eight sections (incident summary · timeline · root cause · customer impact · regulatory impact · control failures · what worked well · remediation commitments) on a 10-day clock. Submission stamps the audit log.

## Hot-wash

The hot-wash form is for the facilitator's immediate end-of-exercise notes. Captures summary · immediate gaps · immediate wins · next actions. 15-minute capture window after stand-down.

## Retrospective

The team retrospective (R+5 days by best practice) is the slower, blameless lessons-learned: what went well, what didn't, improvements. Tick "Mark retrospective as held" once you've actually held the session.

## Wellbeing

The wellbeing check captures anonymous or attributed stress-level on a 1–5 scale + a free-text note. The aggregate shows on `/exercises/[id]/exec`. We run this because a 5-hour incident exercise is genuinely tiring; tracking it surfaces patterns over time.

## Evidence pack

For PRODUCTION exercises in regulator-evidence mode, `/exercises/[id]/evidence-pack` generates the full incident trail — every decision, sitrep, notification, comms draft, runbook execution, and the audit-hash chain — as a regulator-shaped bundle. The URL appears at the top of the debrief once closure is signed off.

## See also

* [Audit log & regulator evidence](audit-and-evidence.md)
* [During the exercise — live workspace](during-the-exercise.md)
