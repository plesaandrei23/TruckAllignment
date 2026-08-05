import type { SVGProps } from "react";

/**
 * Steering-wheel icon in the lucide line style (24×24, currentColor, round caps).
 * Used to mark steering axles and the steering-geometry section.
 */
export function SteeringWheel({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 14.2V21" />
      <path d="M10.1 10.8 4.3 7.5" />
      <path d="M13.9 10.8 19.7 7.5" />
    </svg>
  );
}
