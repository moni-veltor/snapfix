# Getting started as an admin

The 30-minute setup that gets your organisation from empty to "ready to run a first exercise".

## What SnapFix is

SnapFix is an **operational-resilience simulator** for banks and financial-services firms. You design scenarios, populate a register of your important business services (IBSs), vendors and runbooks, then run **exercises** that put your IMT through a paced tabletop or live-fire drill. After the run, the platform produces a debrief and an audit-ready evidence pack.

It is **not** an incident-management ticket system. The unit of work is an *exercise*, not a *task*.

## The four registers that feed every exercise

Every realistic exercise leans on four registers you'll build up over time:

| Register | What it captures | Where to start |
|---|---|---|
| **Org & roles** | Who's on the IMT, what role they play, deputy chain | [Your organisation](your-organisation.md) |
| **IBS register** | Your Important Business Services + impact tolerances | [IBS register](../domain-model/ibs-register.md) |
| **Vendor register** | Third parties (with MTP flag, DORA tier, assurance, exit plan) | [The vendor register](vendor-register.md) |
| **Runbooks** | Playbooks the IMT walks during a scenario | [Runbooks & drills](runbooks.md) |

You don't need them all perfect day-one. The library shortcuts get you 80% of the way fast.

## 30-minute first-run path

1. **Set your firm tier** — open **Settings → Profile**, pick Tier 1 (G-SIB), Tier 2 (challenger) or Tier 3 (neobank / EMI / fintech). Tier drives every library filter and "is this template relevant for us?" badge downstream.
2. **Seed the registers from the library** — go to the org page (**Settings → Presets**) and apply the tier starter pack. One click seeds tier-appropriate roles, IBSs, vendors and tech systems.
3. **Add the runbook starter library** — open **Runbooks** and click **Add from library**. The 50 templates are tier-tagged; the picker hides bank-only ones for tier-3 firms automatically.
4. **Invite the people who'll play** — **Org → Invite member**. Each invite carries a role suggestion you can edit on accept.
5. **Plan a first exercise** — **Exercises → New exercise** opens the 5-step wizard. Start with a 90-minute walkthrough on a low-stakes scenario (e.g. "SaaS critical outage") to get the team comfortable with the live workspace.

## What gets built as you go

Each exercise generates artefacts that age into the audit log:

* **Decisions** with rationale, approver and timestamps
* **Sitreps** per business unit, on a cadence the IMT declares
* **Comms drafts** (approved before sending; cascade order enforced)
* **Regulator-notification clocks** (FCA 4h, PRA 4h, ICO 72h, BoE settlement-1h, DORA major 4h)
* **Runbook executions** — a version-stamped snapshot of which steps ran, who completed them, when
* **An evidence pack** at closure — the full incident trail in regulator-friendly format

Every mutation lands in the [audit log](audit-and-evidence.md), exportable as CSV at any time.

## Who can do what

| Role | What they can do |
|---|---|
| **OWNER** | Everything an admin can, plus seat permissions / delete the org. One per org. |
| **ADMIN** | Manage registers, plan + run exercises, approve invites, view audit log. |
| **MEMBER** | Join exercises as a participant, file decisions / sitreps / comms drafts, approve where their role matches. |

In a live exercise, an admin acts as the **facilitator** (sees the run-sheet, releases injects, can scrub the clock). Members are **participants** holding a role seat (CRO, CEO, Head of Comms, etc.).

## Next steps

* [Your organisation](your-organisation.md) — invite people, assign roles, build the deputy chain
* [Runbooks & drills](runbooks.md) — clone the library, walk through a drill before you do it for real
* [Planning an exercise](planning-an-exercise.md) — the 5-step wizard explained
