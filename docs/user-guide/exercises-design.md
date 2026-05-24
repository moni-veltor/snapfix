# Designing exercises

An exercise is a *run* of a scenario. The 5-step wizard at `/exercises/new` turns a scenario template into a planned exercise — picks the date, the roster, the objectives, the regulator audience, and any chained scenarios. By the time you hit save you have a row in `/exercises` ready to start.

## Pick the right scenario first

`/scenarios` is the catalogue:

* **DB-backed templates** (`/templates`) — ~14 deep CMORG-shaped scenarios with full MSEL (events + injects + IBSs + question banks).
* **TS-backed library** (`/scenarios/library`) — 158+ sector-tagged scenario *shells*. Cloning gives you a stub you flesh out with your own MSEL.

If you don't know which to pick: start with a library shell that matches your sector + the disruption type you want to rehearse. The library has filters for sector, coverage (people / property / tech / data-availability / data-integrity / 3rd party), and difficulty across cognitive / time-pressure / ambiguity / stakeholders axes.

## The 5-step wizard

| Step | What you set |
|---|---|
| **1. Basics** | Title · primary scenario · planned date + duration · timezone · exercise type (TABLETOP / WALKTHROUGH / LIVE) · mode (PRODUCTION / DRY_RUN) · confidentiality · classification |
| **2. Scenario + objectives** | Confirm the primary scenario; add chained scenarios (compound testing); declare 1–5 short outcome objectives that the debrief scores against |
| **3. Roster** | Pick teams + invite participants. Library teams (IMT, IRT-Tech, IRT-Customer, Comms, BRT, Action Committee, Executive Observers) shortcut the typical IMT shape. |
| **4. Comms + briefing** | Pre-read email subject / body. Whether the briefing goes out automatically when you start the exercise. |
| **5. Regulator + closure** | Regulator-evidence mode toggle (locks edits, audit-chain hashes every change). Regulator audience label (e.g. "PRA SS1/21"). Closure approver. |

The wizard saves at each step so you can step away and come back.

## Modes — PRODUCTION vs DRY_RUN

| Mode | When to use it |
|---|---|
| **PRODUCTION** | The exercise generates evidence and counts toward annual regulator obligations. Everything is logged, the evidence pack at closure is regulator-friendly. |
| **DRY_RUN** | Facilitator rehearsal. Purged after 30 days. Doesn't satisfy annual testing. No regulator-audience evidence pack. |

The "drill this runbook" button (on `/runbooks/[id]`) always creates a DRY_RUN exercise — you can drill weekly without polluting your evidence trail.

## Regulator-evidence mode

When `regulatorMode` is on:

* All post-kickoff edits are locked
* Decisions require an approver before they can be marked taken
* Comms require explicit sign-off
* Closure gates are strict (no waivers)
* Audit-log writes are hash-chained (tamper-evident)
* Closure auto-generates an evidence pack URL (Vercel Blob)

Use this for the annual SYSC 15A / PRA SS1/21 test. Switch off for routine practice runs.

## Compound scenarios (chained)

A compound scenario is a primary scenario plus 1+ chained scenarios fired at offset times. E.g. a cyber incident at 09:00 followed by a vendor outage at 09:45. The wizard's step 2 lets you pick chained scenarios with offset minutes + an optional label ("supplier failure").

The live workspace treats chained scenarios as separate timelines that converge — events / injects from each are released against the same D-Day clock.

## Speed multiplier

Exercises can run at real time (1.0) or compressed (e.g. 6.0 = a 9-hour scenario in 90 minutes). You set this when you click **Start** on the exercise overview page. Compressed runs are perfect for tabletop format; real-time is the gold standard for an annual live-fire.

## Programme planning

`/scenarios/programme` is the quarterly grid. Slot scenarios into Q1–Q4 of a year, with optional "satisfies regulatory commitment" labels. Tag a scenario with a `mandatoryUntil` date and it'll surface as a red row until tested.

## Before you start

A short pre-flight checklist:

1. Roster confirmed — every IMT role has a holder + (where required) a deputy
2. Pre-read sent — `/exercises/[id]` shows the `briefingSentAt` stamp
3. Wellbeing check — exec sponsor knows to expect a wellbeing prompt at the end
4. Quiet window booked — the team needs the runtime free of interruptions
5. (Regulator mode only) Evidence-pack reviewer named

Then hit **Start** and move to the live workspace.

## See also

* [During the exercise — live workspace](during-the-exercise.md)
* [Runbooks & drills](runbooks.md) — to make sure the runbooks the scenario auto-fires are ready
* [The vendor register](vendor-register.md) — vendor scenarios depend on it
