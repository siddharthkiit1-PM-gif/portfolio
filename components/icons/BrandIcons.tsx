/**
 * BrandIcons — HD inline SVG marks used by the Projects action cluster
 * (homepage row + case-study header). All glyphs:
 *
 *   • Render at any size via the `size` prop (default 16).
 *   • Use `currentColor` so they inherit text color and chromatic ghosting.
 *   • Are simplified single-path or compact-path versions of the official
 *     marks so they hold up at small sizes.
 *
 * The Vercel and GitHub marks are public, trademark-respecting renders of
 * the canonical wordmarks. PRD is a generic document icon (no brand).
 */

import * as React from "react";

type Props = {
  size?: number;
  className?: string;
};

export function VercelMark({ size = 16, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 2 22 20H2L12 2Z" />
    </svg>
  );
}

export function GithubMark({ size = 16, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.54-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.31-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.31-.54-1.54.12-3.21 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.41 1.02.01 2.04.14 3 .41 2.29-1.55 3.3-1.23 3.3-1.23.66 1.67.24 2.9.12 3.21.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12Z"
      />
    </svg>
  );
}

export function LoomMark({ size = 16, className }: Props) {
  // Loom mark approximated with three concentric petals around a center dot —
  // captures the brand silhouette at small sizes without claiming the exact
  // proprietary geometry.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
      <line x1="18.4" y1="5.6" x2="5.6" y2="18.4" />
    </svg>
  );
}

export function FigmaMark({ size = 16, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      {/* Five-tile Figma mark, recolored to currentColor for tonal consistency. */}
      <path d="M8.5 0a4 4 0 0 0 0 8h3.5V0H8.5Z" opacity="0.95" />
      <path d="M12 0v8h3.5a4 4 0 0 0 0-8H12Z" opacity="0.7" />
      <path d="M8.5 8a4 4 0 0 0 0 8h3.5V8H8.5Z" opacity="0.85" />
      <path d="M12 8v8h3.5a4 4 0 0 0 0-8H12Z" opacity="0.55" />
      <path d="M8.5 16a4 4 0 1 0 3.5 4v-4H8.5Z" opacity="0.95" />
    </svg>
  );
}

export function PrdDocMark({ size = 16, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v4h4" strokeLinecap="round" />
      <line x1="9" y1="12" x2="15" y2="12" strokeLinecap="round" />
      <line x1="9" y1="15.5" x2="15" y2="15.5" strokeLinecap="round" />
      <line x1="9" y1="19" x2="13" y2="19" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowUpRight({ size = 12, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M3 9 9 3" />
      <path d="M4.5 3H9v4.5" />
    </svg>
  );
}
