import type { ReactNode } from "react";

/**
 * Typed filter primitive system for the unified library browser. Each filter
 * declares how it renders, how it computes counts, and how it matches against
 * its current state. The shell composes any combination of these and
 * computes the filtered item list off the per-key state.
 *
 * Adding a new filter kind = add a new variant of LibraryFilter + a case to
 * the renderer + a case to the matching engine in LibraryBrowser.
 */

/** Free-text search across a per-item haystack string. */
export type SearchFilter<T> = {
  kind: "search";
  key: string;
  placeholder?: string;
  /** Lowercase haystack the search query is matched against. */
  getHaystack: (item: T) => string;
};

/** Multi-select chip row (e.g. sectors). State is a Set<string>. */
export type MultiChipFilter<T> = {
  kind: "multi-chip";
  key: string;
  /** Section header, e.g. "Sector". */
  label: string;
  options: ReadonlyArray<{
    value: string;
    label: string;
    /** Optional Tailwind class string for the selected pill background. */
    tone?: string;
  }>;
  /** Per-item values; the item matches when any one is in the selected set. */
  getValues: (item: T) => readonly string[];
  /** Optional quick-pick group buttons that pre-select a bundle of values. */
  groups?: ReadonlyArray<{ id: string; label: string; values: readonly string[] }>;
  /** "All" pill label override. Default "All". */
  allLabel?: string;
};

/** Single-select chip row (e.g. category). State is a string ("all" or value). */
export type SingleChipFilter<T> = {
  kind: "single-chip";
  key: string;
  label: string;
  /** When omitted, options are derived dynamically from the catalogue. */
  options?: ReadonlyArray<{ value: string; label: string; tone?: string }>;
  getValue: (item: T) => string | null | undefined;
  allLabel?: string;
};

/** Boolean toggle (e.g. DORA-critical only). State is a boolean. */
export type ToggleFilter<T> = {
  kind: "toggle";
  key: string;
  label: string;
  helpText?: string;
  /** Returns true when the item passes the filter while toggled ON. */
  predicate: (item: T) => boolean;
};

export type LibraryFilter<T> =
  | SearchFilter<T>
  | MultiChipFilter<T>
  | SingleChipFilter<T>
  | ToggleFilter<T>;

/**
 * Domain configuration for the unified browser. Pass to <LibraryBrowser>
 * via the configs/<domain>.tsx factories so the call sites stay one-liners.
 */
export type LibraryBrowserConfig<T> = {
  /** Stable per-item key — used for "already added" dedupe + React keys. */
  itemKey: (item: T) => string;
  /**
   * Key used to determine whether the item is already in the org's registry.
   * Defaults to the same as itemKey when omitted. Configurable because some
   * domains (IBS, runbooks) dedupe by name rather than slug.
   */
  existingKey?: (item: T) => string;
  /** Title shown in the drawer header. */
  title: string;
  /** Optional one-line subtitle. */
  subtitle?: string;
  /** Filter list rendered in the left rail, in order. */
  filters: ReadonlyArray<LibraryFilter<T>>;
  /** Per-card renderer. Receives the helpers needed to render the Add form. */
  card: (item: T, ctx: LibraryCardContext) => ReactNode;
};

export type LibraryCardContext = {
  /** True when the item already exists in the caller's org registry. */
  already: boolean;
  /** True when the current user has permission to add to the registry. */
  canAdd: boolean;
};

/** Initial value for a filter's piece of state. */
export type FilterStateValue =
  | { kind: "search"; value: string }
  | { kind: "multi-chip"; value: Set<string> }
  | { kind: "single-chip"; value: string }
  | { kind: "toggle"; value: boolean };
