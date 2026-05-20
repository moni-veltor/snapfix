"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  HelpCircle,
  Keyboard,
  LifeBuoy,
  Sparkles,
  X,
} from "lucide-react";
import Hoot from "@/components/fun/Hoot";

type Props = {
  /** Optional support contact email. */
  supportEmail?: string;
};

/**
 * Right-rail help drawer triggered by a "?" button. Three sections:
 *  - Keyboard shortcuts (with platform-aware ⌘ / Ctrl rendering)
 *  - Resources (links into our docs / library / onboarding wizard)
 *  - Contact support
 */
export default function HelpDrawer({
  supportEmail = "support@snapfix.example",
}: Props) {
  const [open, setOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const cmd = isMac ? "⌘" : "Ctrl";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Help"
        className="flex h-8 w-8 items-center justify-center rounded-md text-soft hover:bg-surface-2 hover:text-ink"
      >
        <HelpCircle size={15} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Help"
          className="fixed inset-0 z-50 flex"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="flex-1 bg-black/40 backdrop-blur-sm" />
          <aside className="flex h-full w-full max-w-md flex-col overflow-hidden border-l border-line bg-surface-elev shadow-2xl">
            <header className="flex items-start justify-between gap-3 border-b border-line p-4">
              <div className="flex items-center gap-3">
                <Hoot mood="happy" size={48} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft">
                    Help & shortcuts
                  </p>
                  <h2 className="mt-0.5 text-base font-semibold text-ink">
                    What can Hoot do for you?
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close help"
                className="rounded-md p-1 text-soft hover:bg-surface-2 hover:text-ink"
              >
                <X size={16} />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <Section title="Keyboard shortcuts" icon={Keyboard}>
                <ul className="space-y-1.5 text-xs">
                  <Shortcut keys={[cmd, "K"]} label="Open global search" />
                  <Shortcut keys={["Esc"]} label="Close modal / panel" />
                  <Shortcut keys={["Enter"]} label="Confirm dialog action" />
                </ul>
                <p className="mt-2 text-[10px] text-soft">
                  More keyboard surfaces coming with the next release.
                </p>
              </Section>

              <Section title="Get started" icon={Sparkles}>
                <Resource
                  href="/onboarding/wizard"
                  title="Onboarding wizard"
                  subtitle="Five-step setup with Hoot"
                />
                <Resource
                  href="/settings/presets"
                  title="Industry presets"
                  subtitle="One-click starter packs by firm tier"
                />
                <Resource
                  href="/ibs"
                  title="IBS library"
                  subtitle="Pre-built Important Business Services"
                />
                <Resource
                  href="/templates"
                  title="Scenario library"
                  subtitle="48 ready-to-clone exercise scenarios"
                />
              </Section>

              <Section title="Read up" icon={BookOpen}>
                <Resource
                  href="/resources"
                  title="Resources hub"
                  subtitle="Guides, glossary, regulator references"
                  external
                />
                <Resource
                  href="/resources/guides/cmorg"
                  title="CMORG framework guide"
                  external
                />
                <Resource
                  href="/resources/guides/ibs"
                  title="What is an IBS?"
                  external
                />
                <Resource
                  href="/resources/regulators"
                  title="Regulator references"
                  subtitle="FCA · PRA · ICO · EU DORA"
                  external
                />
              </Section>

              <Section title="Talk to a human" icon={LifeBuoy}>
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface-1 px-3 py-2 text-xs text-ink hover:border-line-strong hover:bg-surface-2"
                >
                  <span>Email support</span>
                  <span className="font-mono text-[10px] text-muted">
                    {supportEmail}
                  </span>
                </a>
                <p className="mt-2 text-[10px] text-soft">
                  Average response time: under 4 working hours on weekdays.
                </p>
              </Section>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-soft">
        <Icon size={11} />
        {title}
      </header>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="rounded-md border border-line bg-surface-1 px-1.5 py-0.5 font-mono text-[10px] text-ink"
          >
            {k}
          </kbd>
        ))}
      </span>
    </li>
  );
}

function Resource({
  href,
  title,
  subtitle,
  external,
}: {
  href: string;
  title: string;
  subtitle?: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="flex items-start justify-between gap-2 rounded-md border border-line bg-surface-1 px-3 py-2 text-xs hover:border-line-strong hover:bg-surface-2"
    >
      <span className="min-w-0">
        <span className="block text-ink">{title}</span>
        {subtitle && <span className="block text-[10px] text-soft">{subtitle}</span>}
      </span>
      {external && <ArrowUpRight size={11} className="mt-0.5 shrink-0 text-soft" />}
    </Link>
  );
}
