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

/**
 * Official LinkedIn brand mark — the canonical integrated glyph (rounded
 * square frame with the "in" wordmark cut from the same fill). This is the
 * exact path LinkedIn ships in its brand kit and the one Simple Icons /
 * every premium icon set uses. Vector-sharp at any size, geometrically
 * correct kerning on the "in", proper LinkedIn brand blue (#0A66C2).
 *
 * Rendered as a single fill path so antialiasing is uniform — no seams
 * between background rect and wordmark like the earlier two-shape version.
 */
export function LinkedInIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      role="img"
      aria-label="LinkedIn"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fill="#0A66C2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
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

/**
 * Official GitHub Octocat mark, monochrome via `currentColor` so it inherits
 * the chip's text color (white/80 → white on hover) and reads as a peer of
 * the Résumé / Email glyphs rather than competing with LinkedIn's full-color
 * brand square. Path is the canonical GitHub logo simplified to a single fill.
 */
export function GitHubIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      role="img"
      aria-label="GitHub"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12.02c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.13 0 .3.21.66.79.55C20.21 21.4 23.5 17.1 23.5 12.02 23.5 5.73 18.27.5 12 .5z" />
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
