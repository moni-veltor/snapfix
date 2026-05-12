// SnapFix brand mark — an SF monogram.
//
// The mark is a rounded indigo-tinted tile containing two geometric
// letterforms drawn with stroked paths:
//   - "S" on the left (three horizontal bars with rounded corner joins)
//   - "F" on the right (vertical spine + two horizontals)
// Both share the same stroke weight and gradient so the eye reads them as
// one mark.
//
// Variants:
//   <Logo />          mark only (square-ish 36×32; works at favicon scale)
//   <Wordmark />      mark + "SnapFix" wordmark
//   tone="light"      light foreground for use on dark backgrounds (marketing)
//   tone="brand"      brand foreground for use on light backgrounds (app)

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
  // Native viewBox 36x32 (slightly wider than tall — fits "SF" naturally).
  // Pick a render width that preserves the aspect ratio.
  const w = Math.round((size * 36) / 32);
  const h = size;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 36 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="36" y2="32" gradientUnits="userSpaceOnUse">
          {tone === "light" ? (
            <>
              <stop offset="0%" stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#818cf8" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="100%" stopColor="#4338ca" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* Tile background */}
      <rect
        x="1"
        y="1"
        width="34"
        height="30"
        rx="7"
        fill={tone === "light" ? "rgba(129,140,248,0.10)" : "rgba(79,70,229,0.10)"}
        stroke={tone === "light" ? "rgba(165,180,252,0.35)" : "rgba(79,70,229,0.30)"}
        strokeWidth="0.75"
      />

      {/* S — three horizontal bars connected by curved corners.
          Drawn as ONE continuous path: top → curve down on right → middle →
          curve down on left → bottom. */}
      <path
        d="M 14 9.5
           C 14 8 12.7 7 11 7
           H 7
           C 5.3 7 4 8 4 9.5
           C 4 11 5.3 12 7 12
           H 11
           C 12.7 12 14 13 14 14.5
           C 14 16 12.7 17 11 17
           H 7
           C 5.3 17 4 18 4 19.5
           C 4 21 5.3 22 7 22
           H 13"
        stroke={`url(#${id})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* F — vertical spine + top arm + middle arm, drawn as one path */}
      <path
        d="M 20 7
           V 25
           M 20 7
           H 32
           M 20 14.5
           H 29"
        stroke={`url(#${id})`}
        strokeWidth="2.6"
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
