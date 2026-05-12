// SnapFix brand logo. Two variants:
// - <Logo />        Mark only (used as favicon-equivalent inline)
// - <Wordmark />    Mark + "SnapFix" wordmark for header
//
// The mark is a stylised "S" rendered as a continuous stroked path with
// rounded caps and an indigo-violet gradient. Reads well at 16px and scales
// cleanly to a hero. The gradient ID is randomised per-render to avoid
// collisions when multiple instances appear on a page.

let counter = 0;
function nextId() {
  counter += 1;
  return `sfx-${counter}`;
}

export function Logo({
  size = 28,
  className = "",
  tone = "brand",
}: {
  size?: number;
  className?: string;
  tone?: "brand" | "light";
}) {
  const id = nextId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          {tone === "light" ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="100%" stopColor="#4338ca" />
            </>
          )}
        </linearGradient>
      </defs>
      {/* Background tile */}
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="7"
        fill={tone === "light" ? "rgba(255,255,255,0.06)" : "rgba(79,70,229,0.08)"}
        stroke={tone === "light" ? "rgba(255,255,255,0.18)" : "rgba(79,70,229,0.25)"}
        strokeWidth="0.75"
      />
      {/* Stylised S — three connected strokes */}
      <path
        d="M 23 10.5
           C 23 8.5, 21 7, 19 7
           H 12.5
           C 9.5 7, 7.5 9, 7.5 11.5
           C 7.5 14, 9.5 15.5, 12.5 15.5
           H 19.5
           C 22.5 15.5, 24.5 17, 24.5 19.5
           C 24.5 22, 22.5 24, 19.5 24
           H 12
           C 10 24, 8 22.5, 8 20.5"
        stroke={`url(#${id})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Wordmark({
  size = 28,
  tone = "brand",
  className = "",
}: {
  size?: number;
  tone?: "brand" | "light";
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo size={size} tone={tone} />
      <span
        className={`font-semibold tracking-tight ${
          tone === "light" ? "text-white" : "text-slate-900"
        }`}
        style={{ fontSize: size * 0.7 }}
      >
        SnapFix
      </span>
    </span>
  );
}
