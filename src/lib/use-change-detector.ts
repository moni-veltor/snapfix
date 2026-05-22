"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Compare incoming list against the previous render's snapshot and report
 * which items are new (id absent before) and which changed (id present
 * but signature different). Returns the live "recently-changed" set so
 * the caller can flash a pill on those items, and invokes `onChange`
 * once per change with the rich diff so the caller can fire toasts.
 *
 * The first render seeds the baseline silently — we don't want to fire
 * "new item" toasts for items that were already there when the
 * participant opened the page.
 *
 * `signatureOf` is the canonical "did this item change in a way the
 * participant cares about" key. Typically status / priority / approver,
 * NOT every field — otherwise routine timestamp churn would fire toasts.
 */
export type ChangeEvent<T> = {
  kind: "added" | "updated";
  item: T;
  previousSignature?: string;
};

export function useChangeDetector<T extends { id: string }>(
  items: ReadonlyArray<T>,
  signatureOf: (item: T) => string,
  onChange: (event: ChangeEvent<T>) => void,
  /** ms an item stays "recently changed" before its pill fades. */
  flashMs: number = 8_000,
): Set<string> {
  const snapshotRef = useRef<Map<string, string> | null>(null);
  const onChangeRef = useRef(onChange);
  const sigRef = useRef(signatureOf);

  useEffect(() => {
    onChangeRef.current = onChange;
    sigRef.current = signatureOf;
  });

  const [flashing, setFlashing] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const next = new Map<string, string>();
    for (const item of items) next.set(item.id, sigRef.current(item));

    if (snapshotRef.current === null) {
      snapshotRef.current = next;
      return;
    }

    const prev = snapshotRef.current;
    const changedIds: string[] = [];
    for (const item of items) {
      const sig = next.get(item.id)!;
      const old = prev.get(item.id);
      if (old === undefined) {
        onChangeRef.current({ kind: "added", item });
        changedIds.push(item.id);
      } else if (old !== sig) {
        onChangeRef.current({ kind: "updated", item, previousSignature: old });
        changedIds.push(item.id);
      }
    }
    snapshotRef.current = next;

    if (changedIds.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlashing((curr) => {
      const merged = new Set(curr);
      for (const id of changedIds) merged.add(id);
      return merged;
    });
    const timer = setTimeout(() => {
      setFlashing((curr) => {
        const next2 = new Set(curr);
        for (const id of changedIds) next2.delete(id);
        return next2;
      });
    }, flashMs);
    return () => clearTimeout(timer);
  }, [items, flashMs]);

  return flashing;
}
