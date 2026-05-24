# Your organisation

The `/org` surface is your IMT roster. It captures every person who could be called on during an incident, what role they hold, their deputy if they're unreachable, and their out-of-hours contact details.

## The hero

The top of `/org` shows your **tier badge** (Tier 1 G-SIB, Tier 2 challenger, Tier 3 neobank / EMI). Tier drives:

* Which library templates are flagged as applicable to your firm
* Which IBS / vendor / role minimums you're expected to meet
* The "tier minimums" panel just below the hero, which scores your register against the bar

## Adding people

Three paths:

1. **Single invite** — `/org → Invite member`. Email + suggested role. The invitee gets an email with a one-click accept link.
2. **Bulk CSV import** — `/org → Bulk import`. Drop a CSV of `email,name,role`. Each row creates a pending invitation; the bulk preview shows which invites are duplicates or already-active members so you can confirm before sending.
3. **Onboarding drawer** — `/org → Onboard`. Step-by-step wizard for adding people *and* matching them against an org role + IBS in one flow. Useful when standing the IMT up for the first time.

## Pending invitations

The roster page lists invitations that haven't been accepted yet. Each row gives you:

* **Re-send** — re-issues the link + sends a fresh email
* **Extend** — adds 14 days to the deadline without emailing again
* **Revoke** — cancels the invite; the accept link stops working

Invitations have an expiry chip (`Expires today`, `Expires in 3d`, `Expired 2d ago`). The first two are amber; expired is rose.

## Roles & seats

Open any member to see their role, deputy chain, IBSs they own, and incident participation count. The org-roles catalogue (`/org/roles`) is where you keep the formal role definitions — title, abbreviation, SMF flag, "is deputy of" pointer.

Two views on the catalogue:

* **By role family** — strategy, ops, tech, comms, risk, etc. Good for "do we have a CRO and a deputy?"
* **By responsibility map** — every role on one matrix with its accountabilities. Good for spotting overlaps or gaps.

## Roster readiness

Below the matrix sits a **roster-readiness band** scoring your roster against:

* Tier minimums (e.g. Tier 1 expects a CRO + deputy, Tier 3 doesn't)
* Number of roles with an active holder
* Number of deputies named
* Off-hours phone numbers captured (so a 2am page is possible)
* Last readiness check (we ask each member to confirm contact details every 90 days)

A red band means the IMT could miss someone in a real incident. Amber means there are gaps you should know about. Green means you're ready to be paged at any hour.

## Departments

`/org/departments` is the optional cut for organisations big enough to need it. Each department gets a name + abbreviation; members join a department; the live workspace can filter sitreps and seat colour-coding by department.

## See also

* [Getting started as an admin](getting-started.md) — bigger-picture setup
* [The vendor register](vendor-register.md) — vendors are the *other* register the IMT leans on
* [Runbooks & drills](runbooks.md) — runbooks need named owner-roles; the roles catalogue is what they bind to
