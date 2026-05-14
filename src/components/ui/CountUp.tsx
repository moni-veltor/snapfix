"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Target value to ramp up to. */
  value: number;
  /** Animation duration in milliseconds. Default 900ms. */
  durationMs?: number;
  /** Render the value (e.g. add a suffix). Default `String(v)`. */
  format?: (v: number) => string;
  className?: string;
};

/**
 * Animated number ticker — ramps from 0 → target with an ease-out curve.
 * Use on headline numbers (performance score, severity result, mobilisation
 * percent) so the value lands with a sense of arrival.
 */
export default function CountUp({ value, durationMs = 900, format, className = "" }: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const startValue = display;
    const delta = value - startValue;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(startValue + delta * eased);
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return <span className={`tabular-nums ${className}`}>{format ? format(display) : display}</span>;
}
