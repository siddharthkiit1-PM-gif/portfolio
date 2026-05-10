/**
 * Brand glyphs — sharp, geometric, currentColor-driven so they match the
 * surrounding type weight and inherit hover transitions cleanly. Used in
 * the hero recruiter rail (LinkedIn / Resume / Email).
 *
 * Conventions:
 *   - 18px default, scaled via `size`
 *   - stroke-width 1.5 to read as drawn icons rather than glyphs
 *   - currentColor for stroke + fill so a parent's hover state cascades
 */

type IconProps = {
  size?: number;
  className?: string;
};

export function LinkedInIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      role="img"
      aria-label="LinkedIn"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8h4.56v15H.22V8zm7.78 0h4.37v2.05h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 7v8.31h-4.56v-7.37c0-1.76-.03-4.03-2.46-4.03-2.46 0-2.84 1.92-2.84 3.9V23H8V8z" />
    </svg>
  );
}

export function ResumeIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      role="img"
      aria-label="Resume"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Document with corner fold + three text lines + portrait dot */}
      <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z" />
      <path d="M14 3v4.5A1.5 1.5 0 0 0 15.5 9H19" />
      <circle cx="9.5" cy="12" r="1.25" />
      <path d="M12 12h4.5" />
      <path d="M8 16h8.5" />
      <path d="M8 18.5h6" />
    </svg>
  );
}

export function EmailIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      role="img"
      aria-label="Email"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 7 8.5-7" />
    </svg>
  );
}
