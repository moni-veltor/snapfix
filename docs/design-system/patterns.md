# Patterns

The recurring layouts that compose primitives into recognisable surfaces. Use these as-is; don't invent variants.

## Pattern 1 — Page hero + actions

The top of every major destination. PageHero owns the title; the `actions` slot owns top-right CTAs.

```tsx
<div className="space-y-6">
  <PageHero
    eyebrow="Register"
    icon={Building2}
    title="Important Business Services"
    pitch="The spine of your operational-resilience programme. 24 services captured."
    actions={
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/ibs/library">Browse library</Link>
        <IBSAddButton {...} />
      </div>
    }
  />
  {/* …rest of page… */}
</div>
```

Rules:

* Always wrap pages in `<div className="space-y-6">`.
* The hero is always the first element.
* Buttons inside `actions` order: tertiary links first, primary button last (right-most).
* Two- and three-button hero is fine; four feels crowded — overflow into a menu.

## Pattern 2 — Drawer-launching Add button

The canonical "+ Add X" entry point. Lives in the page hero's `actions` slot, opens a wizard inside a right-edge `Drawer`. Auto-opens when `?new=1` is in the URL (so the global Compose menu can deep-link).

```tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import VendorAddWizard from "./VendorAddWizard";

export default function VendorAddButton() {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (searchParams.get("new") === "1") setOpen(true);
  }, [searchParams]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2
          text-sm font-medium text-on-accent shadow-[var(--shadow-card)] transition-all
          hover:-translate-y-px hover:shadow-[var(--shadow-card-md)]
          focus-visible:ring-2 focus-visible:ring-brand"
        aria-label="Add a vendor"
      >
        <Plus size={14} strokeWidth={2.4} />
        Add vendor
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Add a vendor" size="lg">
        <VendorAddWizard onDone={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
```

Five canonical instances exist: `ScenarioAddButton`, `ExerciseAddButton`, `IBSAddButton`, `VendorAddButton`, `SystemAddButton`. Plus `OrgInviteButton` and `OrgBulkImportButton` follow the same shape.

## Pattern 3 — Drawer wizard

Multi-step wizard inside a `Drawer`. All fields render in the DOM (visually hidden for inactive steps) so a single form submission carries every value.

```tsx
"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { withToast } from "@/lib/toast-action";
import { upsertVendorAction } from "@/app/actions/vendors";

const STEPS = [
  { id: "basics", label: "Basics", blurb: "..." },
  { id: "dora", label: "DORA", blurb: "..." },
  // ...
];

export default function VendorAddWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const action = withToast(upsertVendorAction, { success: "Vendor saved", error: "..." });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
          {STEPS[step].label} · step {step + 1} of {STEPS.length}
        </p>
        <p className="mt-1 text-xs text-muted">{STEPS[step].blurb}</p>
      </div>

      <StepRail step={step} setStep={setStep} />

      <form action={async (fd) => { onDone(); await action(fd); }} className="space-y-4 text-sm">
        <div className={step === 0 ? "" : "hidden"}><BasicsStep /></div>
        <div className={step === 1 ? "" : "hidden"}><DoraStep /></div>
        {/* …more steps… */}

        <footer className="flex items-center justify-between gap-2 border-t border-line pt-4">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))}>
            <ArrowLeft size={12} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              Next <ArrowRight size={12} />
            </button>
          ) : (
            <button type="submit"><Check size={12} /> Save</button>
          )}
        </footer>
      </form>
    </div>
  );
}
```

Key rules:

* Back / Next are `type="button"`. Only Save is `type="submit"`.
* Step content is wrapped in `<div className={active ? "" : "hidden"}>` not unmounted, so all field values reach the form on submit.
* `onDone()` is called *before* `await action(fd)` so the modal closes immediately.
* `StepRail` renders 3–5 clickable step pills with check/done state.

See [`src/components/vendors/VendorAddWizard.tsx`](https://github.com/moni-veltor/snapfix/blob/main/src/components/vendors/VendorAddWizard.tsx) for the canonical shape.

## Pattern 4 — Library grid with sticky filter bar

Used on `/scenarios/library`, `/ibs/library`, `/vendors/library`.

```tsx
<section className="space-y-5">
  {/* Sticky filter bar — stays visible while scrolling cards */}
  <div className="sticky top-0 z-10 -mx-2 space-y-3 bg-surface-0/95 px-2 py-2 backdrop-blur
    supports-[backdrop-filter]:bg-surface-0/80">
    <div className="flex flex-wrap items-center gap-2">
      <input type="search" {...} />
      <div role="tablist" className="flex flex-wrap gap-1">
        {/* Tier chip row */}
      </div>
      {hasActiveFilter && <ClearAllButton />}
    </div>

    {/* Quick-pick group buttons */}
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-soft">Quick picks</span>
      {SECTOR_GROUPS.map((g) => <GroupChip {...} />)}
    </div>

    {/* Multi-select sector chip row */}
    <div className="flex flex-wrap items-center gap-1.5">
      {SECTORS.map((s) => <SectorChip selected={selected.has(s)} {...} />)}
    </div>
  </div>

  {/* Result count + filter summary */}
  <p className="text-[11px] text-soft">
    {filtered.length} of {total} shown
    {selected.size > 0 && <> · filtered to {Array.from(selected).join(", ")}</>}
  </p>

  {/* Card grid */}
  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {filtered.map((item) => <li key={item.slug}><LibraryCard {...} /></li>)}
  </ul>
</section>
```

Behaviour:

* Sector filter is multi-select (`Set<Sector>`). Empty set = "all sectors".
* Quick-pick groups (Financial services / CNI / Public sector / Consumer / Industrial / Tech & professional) one-click apply a sector cluster.
* "Clear all" button surfaces whenever any filter is active.
* Status line at the top of the result count tells the user what's active.

## Pattern 5 — Sticky transition bar

Lifecycle buttons that need to stay visible while the user scrolls through a long detail page. Used on `/exercises/[id]` (Mark Ready / Start exercise).

```tsx
<div className="sticky top-0 z-20 -mx-2 flex flex-wrap items-center justify-between gap-3
  rounded-xl border border-line bg-surface-elev/95 p-3 shadow-[var(--shadow-card)]
  backdrop-blur supports-[backdrop-filter]:bg-surface-elev/85">
  <div className="text-xs">
    <span className="rounded-full bg-surface-2 px-2 py-0.5 uppercase tracking-wider text-muted">
      {status}
    </span>
    {status === "PLANNING" && (
      <span className="text-muted">
        {complete} of {total} readiness checks complete
      </span>
    )}
  </div>
  <form action={transitionAction}>
    <button className="...">Mark as Ready</button>
  </form>
</div>
```

Only renders when there *is* an action available — bar disappears when the page reaches a steady state.

## Pattern 6 — Stat-tile row

Above any board / register / list, a row of compact stat tiles. Used on Dashboard, IBS register, Action items, Tech recovery, Departments.

```tsx
<section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
  <Stat label="Open" value={32} icon={<ListChecks size={12} />} />
  <Stat label="Overdue" value={5} tone="critical" icon={<Flame size={12} />} />
  <Stat label="Closed (7d)" value={12} tone="ok" icon={<CheckCircle2 size={12} />} />
  <Stat label="In progress" value={8} icon={<Clock size={12} />} />
</section>
```

Tone variants: `neutral` (default — `border-line bg-surface-1`), `ok` (emerald-tinted), `warn` (amber-tinted), `critical` (rose-tinted).

## Pattern 7 — Confirm-then-act dangerous action

Use `ConfirmButton` (in `src/components/`) for any destructive operation. Inline modal confirm with body text + destructive-tone confirm button.

```tsx
<ConfirmButton
  action={deleteDepartmentAction}
  hidden={{ id: dept.id }}
  label="Delete"
  title={`Delete ${dept.name}?`}
  body="Members get unassigned. IBS ownership links cleared. Audit-logged."
  confirmLabel="Delete"
  successMessage="Department deleted"
/>
```

Never use raw `confirm()` window dialogs. They look broken on Mac, and they can't be styled.

## Pattern 8 — Bucketed time-based view

Used on `/vendors/contracts`, `/tech-recovery/schedule`, `/calendar`. Four time-buckets: overdue/critical, 30 days, 90 days, later. Each bucket is a section with its own dot + count.

```tsx
const BUCKETS = [
  { id: "expired", label: "Expired or this week", tone: "critical", fromDay: -∞, toDay: 8 },
  { id: "30d", label: "In 30 days", tone: "warn", fromDay: 8, toDay: 31 },
  { id: "90d", label: "In 90 days", tone: "info", fromDay: 31, toDay: 91 },
  { id: "later", label: "Later than 90 days", tone: "ok", fromDay: 91, toDay: null },
];
```

The tone gradient (rose → amber → cyan → emerald) is consistent across every bucketed view.

## Pattern 9 — Tabbed detail page

Long detail surfaces split into 3–5 tabs to avoid long-scroll. Used on `/ibs/[id]`, `/vendors/[id]`, `/runbooks/[id]`, `/exercises/[id]` (PLANNING), `/exercises/[id]/debrief`, `/settings`.

**Variant — health-tile tabs.** On `/exercises/[id]` (PLANNING) the tab triggers double as per-stage health tiles: each tab shows a pass/total count, a coloured progress bar, the top 2 failing required checks, and a tone border (emerald / amber / rose). Active tile gets a ring + shadow; inactive tiles dim to 80% opacity. The tile-as-tab pattern works when the tab list is genuinely informational at a glance — otherwise prefer the plainer `<TabsList>` from the snippet below.

```tsx
<TabsRoot defaultValue={initial} value={active} onValueChange={setActive}>
  <TabsList aria-label="Vendor sections">
    <TabsTrigger value="basics">Basics</TabsTrigger>
    <TabsTrigger value="mtp">MTP register</TabsTrigger>
    <TabsTrigger value="assessments">Assessments</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
  </TabsList>
  <TabsContent value="basics"><VendorBasicsTab /></TabsContent>
  {/* ... */}
</TabsRoot>
```

Initial-state precedence:
1. `?tab=<key>` from the URL (so deep-links from next-action panels land on the right tab)
2. `localStorage` (sticky across visits)
3. component default

`useSearchParams` re-syncs the active tab when the URL changes — clicking a suggestion that links to `?tab=mtp` while on `?tab=basics` jumps the tab without a full reload.

## Pattern 10 — StatusBadge with icon

Status pills never communicate state by colour alone. Use `<StatusBadge>` instead of hand-rolling chips.

```tsx
<StatusBadge tone="warning" icon="alert">3 overdue</StatusBadge>
<StatusBadge tone="ok" icon="check">Ready</StatusBadge>
<StatusBadge tone="critical" icon="flame">Tolerance breached</StatusBadge>
```

Tones: `ok | info | warning | critical | neutral`. Icons are paired so the meaning survives colour-blindness or monochrome printing of the audit log CSV.

## Pattern 11 — ListUrlControls + Pagination

Register pages share a URL-driven control bar: search, filter chips, sort, page. The server reads the same params, so deep-links, refreshes, and history-back all preserve state.

```tsx
<ListUrlControls
  searchKey="q"
  filterKey="filter"
  filters={[
    { value: "", label: "All" },
    { value: "action-required", label: "Action required" },
    { value: "mtp", label: "MTP only" },
  ]}
/>
{/* list */}
<Pagination
  currentPage={page}
  totalPages={totalPages}
  pageSize={25}
  totalItems={total}
/>
```

Used on `/vendors`, `/vendors/notifications`, `/vendors/register`, `/runbooks`, `/audit`, `/action-items`.

## Pattern 12 — Approvals dock

A sticky dock on the live workspace that surfaces `ApprovalRequest` rows pending the current viewer's sign-off. Acts as both a queue (browse all pending) and a CTA (approve / reject inline).

```tsx
<ApprovalsDock
  pending={pendingForMe}
  onApprove={(id) => approveAction({ id })}
  onReject={(id, reason) => rejectAction({ id, reason })}
/>
```

The header chip mirrors the dock's count so an IMT chair away from the dock still sees pressure. Dual-control requests render a "requires 2 approvers" sub-line; once your sign-off is recorded the row stays in the dock for the next approver but flips to a different visual state.

