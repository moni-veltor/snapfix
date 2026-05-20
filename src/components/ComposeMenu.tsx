"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarPlus,
  ChevronDown,
  FileText,
  Library,
  Plus,
  Server,
  Target,
  UserPlus,
  Users,
} from "lucide-react";

type Props = {
  canManage: boolean;
};

/**
 * Global "+ New" entry-point in the app shell. Power-user shortcut to
 * the most-used create surfaces from any page. Closes on outside-click
 * and Escape. Items are filtered by canManage so members see a quieter
 * menu.
 */
export default function ComposeMenu({ canManage }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-md bg-gradient-brand px-2.5 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)]"
      >
        <Plus size={12} strokeWidth={2.5} />
        New
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          // Anchor to the button's LEFT edge so the dropdown opens out into
          // the main content area instead of getting clipped against the
          // sidebar's right border.
          className="absolute left-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-line bg-surface-elev shadow-[var(--shadow-card-lg)]"
        >
          <Group label="Plan & run">
            <Item href="/exercises/new" icon={Target} label="Plan an exercise" />
            <Item href="/scenarios?new=1" icon={FileText} label="New scenario" />
            <Item href="/scenarios" icon={Library} label="Sector scenario library" />
            <Item href="/templates" icon={Library} label="CMORG templates" />
          </Group>

          {canManage && (
            <Group label="Resilience">
              <Item href="/ibs" icon={Building2} label="Add IBS" />
              <Item href="/ibs" icon={Library} label="Browse IBS library" />
              <Item href="/vendors" icon={Building2} label="Add vendor" />
              <Item href="/tech-recovery" icon={Server} label="Add tech system" />
            </Group>
          )}

          {canManage && (
            <Group label="People">
              <Item href="/org/roles" icon={Users} label="Add role" />
              <Item href="/org?invite=1" icon={UserPlus} label="Invite teammate" />
              <Item href="/exercises/new" icon={CalendarPlus} label="Schedule exercise" />
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line py-1.5 last:border-b-0">
      <div className="px-3 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-soft">
        {label}
      </div>
      {children}
    </div>
  );
}

function Item({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-ink hover:bg-accent-soft hover:text-indigo-700 dark:hover:text-indigo-200"
    >
      <Icon size={13} />
      {label}
    </Link>
  );
}
