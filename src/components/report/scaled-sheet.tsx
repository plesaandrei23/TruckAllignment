"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders a fixed-size sheet (designed at `width`×`height` px, ~A4 landscape)
 * and scales it down to fit the available width on screen. In print, the CSS
 * resets the transform so the sheet prints at its true size on A4.
 */
export function ScaledSheet({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const avail = el.clientWidth;
      setScale(Math.min(1, avail / width));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={wrapRef} className="report-scaler w-full" style={{ height: height * scale }}>
      <div
        className="print-sheet origin-top-left bg-white text-black shadow-sm"
        style={{ width, height, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
