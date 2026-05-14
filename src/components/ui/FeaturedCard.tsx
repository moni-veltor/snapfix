import { type ReactNode } from "react";

type Props = {
  className?: string;
  padded?: boolean;
  glow?: boolean;
  children: ReactNode;
};

/**
 * Hero-tier card variant — gradient border (rendered as outer ring via
 * indigo→cyan), soft tinted background, optional glow shadow. Reserved for
 * the one card on a page that deserves the eye: today's headline on the
 * dashboard, suggested seat, featured exercise. Don't overuse — overuse
 * kills the signal.
 */
export default function FeaturedCard({
  className = "",
  padded = true,
  glow = true,
  children,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl ${
        glow ? "shadow-[var(--shadow-card-glow)]" : "shadow-[var(--shadow-card-md)]"
      } ${className}`}
      style={{
        background:
          "linear-gradient(135deg, #4f46e5, #06b6d4) border-box",
      }}
    >
      <div
        className={`relative rounded-[11px] bg-surface-1 bg-gradient-brand-soft ${
          padded ? "p-6" : ""
        }`}
        style={{ margin: 1 }}
      >
        {children}
      </div>
    </div>
  );
}
