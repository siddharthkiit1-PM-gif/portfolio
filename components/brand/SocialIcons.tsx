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
 * Official LinkedIn brand mark — #0A66C2 rounded square with the white "in"
 * wordmark. Pulled directly from LinkedIn's brand guidelines so the silhouette
 * is unmistakable inside the recruiter rail's hover chip.
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
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        fill="#ffffff"
        d="M7.06 9.5h-2.6v8.5h2.6V9.5zm.18-2.5a1.51 1.51 0 1 1-3.02 0 1.51 1.51 0 0 1 3.02 0zm10.96 5.34c0-2.18-.47-3.84-3.04-3.84-1.23 0-2.06.65-2.4 1.27h-.04V9.5h-2.5v8.5h2.6v-4.2c0-1.1.21-2.16 1.57-2.16 1.34 0 1.36 1.25 1.36 2.23v4.13h2.45v-4.66z"
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
