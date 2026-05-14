// Lightweight SVG illustrations for empty states. Inline, gradient-aware,
// ~3KB each — no PNG dependencies. Each illustration is sized 120x120 by
// default and uses the brand gradient defined in globals.css.

import { type SVGProps } from "react";

const GRADIENT_ID = "snapfix-brand-grad";

function GradientDef() {
  return (
    <defs>
      <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4f46e5" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
  );
}

type Props = SVGProps<SVGSVGElement> & { size?: number };

/** A tabletop with markers — empty scenarios state. */
export function ScenariosIllustration({ size = 120, ...rest }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...rest}>
      <GradientDef />
      {/* Table */}
      <rect x="10" y="40" width="100" height="60" rx="6" fill="currentColor" opacity="0.05" />
      <rect x="10" y="40" width="100" height="60" rx="6" stroke="currentColor" opacity="0.25" />
      {/* Timeline */}
      <line x1="22" y1="70" x2="98" y2="70" stroke="currentColor" opacity="0.3" strokeWidth="1.5" strokeDasharray="2 3" />
      {/* Markers */}
      <circle cx="35" cy="70" r="5" fill={`url(#${GRADIENT_ID})`} />
      <circle cx="55" cy="70" r="6" fill={`url(#${GRADIENT_ID})`} />
      <circle cx="78" cy="70" r="5" fill={`url(#${GRADIENT_ID})`} />
      <line x1="35" y1="70" x2="35" y2="55" stroke={`url(#${GRADIENT_ID})`} strokeWidth="1.5" />
      <line x1="55" y1="70" x2="55" y2="50" stroke={`url(#${GRADIENT_ID})`} strokeWidth="1.5" />
      <line x1="78" y1="70" x2="78" y2="58" stroke={`url(#${GRADIENT_ID})`} strokeWidth="1.5" />
      {/* Header bar */}
      <rect x="20" y="20" width="50" height="6" rx="3" fill="currentColor" opacity="0.2" />
      <rect x="20" y="30" width="30" height="4" rx="2" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

/** A target — empty exercises state (war-room ready). */
export function ExercisesIllustration({ size = 120, ...rest }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...rest}>
      <GradientDef />
      {/* Concentric rings */}
      <circle cx="60" cy="60" r="44" stroke="currentColor" opacity="0.12" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="32" stroke="currentColor" opacity="0.18" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="20" stroke={`url(#${GRADIENT_ID})`} strokeWidth="2" />
      <circle cx="60" cy="60" r="8" fill={`url(#${GRADIENT_ID})`} />
      {/* Crosshair */}
      <line x1="60" y1="6" x2="60" y2="18" stroke="currentColor" opacity="0.25" strokeWidth="1.5" />
      <line x1="60" y1="102" x2="60" y2="114" stroke="currentColor" opacity="0.25" strokeWidth="1.5" />
      <line x1="6" y1="60" x2="18" y2="60" stroke="currentColor" opacity="0.25" strokeWidth="1.5" />
      <line x1="102" y1="60" x2="114" y2="60" stroke="currentColor" opacity="0.25" strokeWidth="1.5" />
    </svg>
  );
}

/** A network of dependencies — empty vendors / IBS state. */
export function NetworkIllustration({ size = 120, ...rest }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...rest}>
      <GradientDef />
      {/* Connections */}
      <line x1="60" y1="60" x2="30" y2="30" stroke="currentColor" opacity="0.2" strokeWidth="1.5" />
      <line x1="60" y1="60" x2="92" y2="28" stroke="currentColor" opacity="0.2" strokeWidth="1.5" />
      <line x1="60" y1="60" x2="22" y2="80" stroke="currentColor" opacity="0.2" strokeWidth="1.5" />
      <line x1="60" y1="60" x2="98" y2="80" stroke="currentColor" opacity="0.2" strokeWidth="1.5" />
      <line x1="60" y1="60" x2="60" y2="100" stroke="currentColor" opacity="0.2" strokeWidth="1.5" />
      {/* Outer nodes */}
      <circle cx="30" cy="30" r="6" fill="currentColor" opacity="0.25" />
      <circle cx="92" cy="28" r="6" fill="currentColor" opacity="0.25" />
      <circle cx="22" cy="80" r="6" fill="currentColor" opacity="0.25" />
      <circle cx="98" cy="80" r="6" fill="currentColor" opacity="0.25" />
      <circle cx="60" cy="100" r="6" fill="currentColor" opacity="0.25" />
      {/* Centre node — gradient */}
      <circle cx="60" cy="60" r="14" fill={`url(#${GRADIENT_ID})`} />
      <circle cx="60" cy="60" r="14" stroke={`url(#${GRADIENT_ID})`} strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

/** A clipboard with checkmarks — empty action items / debrief state. */
export function ChecklistIllustration({ size = 120, ...rest }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...rest}>
      <GradientDef />
      {/* Clipboard */}
      <rect x="30" y="20" width="60" height="80" rx="6" fill="currentColor" opacity="0.05" stroke="currentColor" strokeOpacity="0.25" />
      {/* Clip */}
      <rect x="48" y="14" width="24" height="10" rx="3" fill="currentColor" opacity="0.2" />
      {/* Lines + checks */}
      <circle cx="42" cy="42" r="3" fill={`url(#${GRADIENT_ID})`} />
      <rect x="50" y="40" width="32" height="4" rx="2" fill="currentColor" opacity="0.25" />
      <circle cx="42" cy="58" r="3" fill={`url(#${GRADIENT_ID})`} />
      <rect x="50" y="56" width="28" height="4" rx="2" fill="currentColor" opacity="0.25" />
      <circle cx="42" cy="74" r="3" fill="currentColor" opacity="0.25" />
      <rect x="50" y="72" width="34" height="4" rx="2" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

/** Quiet war room — empty live workspace state. */
export function QuietRoomIllustration({ size = 120, ...rest }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...rest}>
      <GradientDef />
      {/* Screen frame */}
      <rect x="14" y="26" width="92" height="56" rx="4" fill="currentColor" opacity="0.05" stroke="currentColor" strokeOpacity="0.25" />
      {/* Stand */}
      <rect x="48" y="82" width="24" height="3" fill="currentColor" opacity="0.3" />
      <rect x="38" y="86" width="44" height="4" rx="1" fill="currentColor" opacity="0.2" />
      {/* Idle waveform on screen */}
      <line x1="22" y1="54" x2="35" y2="54" stroke={`url(#${GRADIENT_ID})`} strokeWidth="1.5" />
      <path d="M35 54 L40 48 L45 60 L50 54 L98 54" stroke={`url(#${GRADIENT_ID})`} strokeWidth="1.5" fill="none" />
      {/* "All quiet" pulse */}
      <circle cx="60" cy="68" r="2" fill={`url(#${GRADIENT_ID})`} opacity="0.6">
        <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
