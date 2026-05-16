# Code style

The opinionated rules this codebase follows. Most are enforceable; some are aesthetic conventions worth keeping consistent.

## Imports

* Absolute imports via `@/` for everything in `src/` — no `../../../`
* Type-only imports use `import type { ... }` — keeps the runtime cleaner
* Prefer named imports; `default` exports reserved for page-level + component-level files

## TypeScript

* `strict: true` everywhere. No `any` in checked-in code.
* Prefer narrow union string types over enums for app-level state (`type Status = "DRAFT" | "APPROVED"`).
* Prisma-generated enums *are* used as enums where they cross the wire — `TechSystemKind`, `VendorTier`, etc. The Prisma client lives at `@/generated/prisma`.
* Zod schemas at the boundary of every server action.

## Components

* Server components by default. `"use client"` only when you genuinely need interactivity, refs, or hooks.
* One component per file when the component is non-trivial. Small sub-components can co-exist in the same file.
* Props as inline-typed object: `{ items, canManage }: { items: Item[]; canManage: boolean }`. Promote to a named type only when shared.
* Avoid prop-drilling beyond two levels. If you're passing the same prop through three components, lift the state or use a small wrapper.

## Hooks

* `useEffect` is the last resort. Prefer derived state, key-based remount, or server-rendered initial state.
* Hooks order is part of the public API. Don't conditionally call hooks.
* `useState` with lazy init for anything that reads from `localStorage` to avoid SSR mismatch.

## File naming

| Kind | Pattern | Example |
|---|---|---|
| Page | `page.tsx` | `src/app/(app)/vendors/page.tsx` |
| Server action file | kebab.ts | `src/app/actions/tech-recovery.ts` |
| Client component | PascalCase.tsx | `VendorAddWizard.tsx` |
| Server-only lib | kebab.ts | `lib/audit.ts`, `lib/notifications.ts` |
| Catalogue / data | kebab.ts | `ibs-library.ts`, `vendor-library.ts` |

## Comments

The default is **no comments**. Add one only when the *why* is non-obvious — a hidden invariant, a workaround, behaviour that would surprise a reader.

Avoid:

* Explaining what the code does — well-named identifiers do that
* Referencing the current task / PR ("added for issue #42") — belongs in the commit message
* Multi-paragraph docstrings on functions — one short line max

## Server-action file shape

Every action file starts with `"use server";`. Helpers (`optStr`, `optInt`, `optDate`) at the top, schemas next, actions last. See `src/app/actions/vendors.ts` for the canonical shape.

## Error handling

* Don't swallow errors silently. Let them throw to the framework — the toast wrapper turns them into user-facing messages.
* The exception is `audit()` — it catches and logs, intentionally, so audit-write failures don't break the user's action.
* Don't add try/catch around Prisma calls unless you have a specific recovery path. Plain throws are fine.

## Comments + the AGENTS.md rule

This codebase has an `AGENTS.md` that explicitly warns: *"This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."*

Take it seriously. Don't write what you remember from Next.js 14 — verify the API in the local docs first.

## See also

* [Semantic tokens](semantic-tokens.md) — colour conventions
* [Forms, actions & toasts](forms-and-actions.md) — the primitives every form should use
