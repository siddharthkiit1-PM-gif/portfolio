/**
 * ContactBrandIcons — full-color brand marks for the Reach Out section.
 *
 * Distinct from the existing `SocialIcons.tsx` (which is currentColor-driven
 * for the recruiter rail chips) because the contact section renders the
 * marks in their authentic brand colors by default. Each icon ships as a
 * self-contained inline SVG so it stays sharp at any size and never
 * triggers an extra request.
 *
 *   • LinkedInMark   — #0A66C2 single-path glyph (mirrors SocialIcons.LinkedInIcon)
 *   • WhatsAppMark   — #25D366 chat bubble with the canonical phone glyph
 *   • CalendlyMark   — #006BFF rounded calendar-card with date grid + accent dot
 *   • GmailMark      — multicolor envelope-M (Google Gmail brand kit colors)
 *
 * `size` prop scales all marks uniformly. Optional `monoColor` renders the
 * mark in a single color (for the mono-restraint variant of the section).
 */

import * as React from "react";

type Props = {
  size?: number;
  className?: string;
  /** When set, renders the entire mark as a single fill in this color. */
  monoColor?: string;
};

export function LinkedInMark({ size = 40, className, monoColor }: Props) {
  const fill = monoColor ?? "#0A66C2";
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
        fill={fill}
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

export function WhatsAppMark({ size = 40, className, monoColor }: Props) {
  // Two-path: outer bubble shape filled in WhatsApp green, inner phone+swoosh in white.
  // When monoColor is set, the whole mark renders as one fill so it reads as a
  // currentColor-style mark inside the mono-restraint variant.
  const isMono = Boolean(monoColor);
  return (
    <svg
      role="img"
      aria-label="WhatsApp"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {isMono ? (
        <path
          fill={monoColor}
          d="M16.003 0C7.174 0 .02 7.155.02 15.984c0 2.813.737 5.555 2.137 7.974L0 32l8.193-2.117a15.94 15.94 0 0 0 7.81 1.99h.007C24.831 31.873 32 24.718 32 15.89 32 11.62 30.345 7.605 27.337 4.598 24.328 1.59 20.314 0 16.003 0Zm0 29.214h-.005a13.23 13.23 0 0 1-6.738-1.846l-.483-.287-5.018 1.317 1.341-4.892-.314-.502a13.221 13.221 0 0 1-2.027-7.02c.002-7.317 5.954-13.269 13.247-13.269 3.539.001 6.866 1.381 9.367 3.886 2.502 2.504 3.879 5.833 3.877 9.373-.003 7.317-5.954 13.24-13.247 13.24Zm7.265-9.918c-.398-.199-2.354-1.162-2.719-1.294-.365-.133-.63-.199-.895.199-.265.398-1.027 1.294-1.26 1.56-.232.265-.464.298-.862.099-.398-.2-1.682-.62-3.203-1.978-1.183-1.057-1.982-2.361-2.215-2.76-.232-.398-.025-.613.175-.812.179-.179.398-.464.597-.696.199-.232.265-.398.398-.663.133-.265.066-.497-.033-.696-.099-.199-.895-2.158-1.227-2.955-.323-.776-.652-.671-.895-.683l-.762-.014c-.265 0-.696.099-1.061.497-.365.398-1.392 1.36-1.392 3.319 0 1.96 1.425 3.853 1.624 4.118.199.265 2.804 4.282 6.794 6.005.949.41 1.69.654 2.268.837.953.303 1.821.26 2.508.158.765-.114 2.354-.962 2.687-1.891.331-.928.331-1.724.232-1.891-.099-.166-.365-.265-.762-.464Z"
        />
      ) : (
        <>
          <path
            fill="#25D366"
            d="M16.003 0C7.174 0 .02 7.155.02 15.984c0 2.813.737 5.555 2.137 7.974L0 32l8.193-2.117a15.94 15.94 0 0 0 7.81 1.99h.007C24.831 31.873 32 24.718 32 15.89 32 11.62 30.345 7.605 27.337 4.598 24.328 1.59 20.314 0 16.003 0Z"
          />
          <path
            fill="#FFFFFF"
            d="M23.268 19.296c-.398-.199-2.354-1.162-2.719-1.294-.365-.133-.63-.199-.895.199-.265.398-1.027 1.294-1.26 1.56-.232.265-.464.298-.862.099-.398-.2-1.682-.62-3.203-1.978-1.183-1.057-1.982-2.361-2.215-2.76-.232-.398-.025-.613.175-.812.179-.179.398-.464.597-.696.199-.232.265-.398.398-.663.133-.265.066-.497-.033-.696-.099-.199-.895-2.158-1.227-2.955-.323-.776-.652-.671-.895-.683l-.762-.014c-.265 0-.696.099-1.061.497-.365.398-1.392 1.36-1.392 3.319 0 1.96 1.425 3.853 1.624 4.118.199.265 2.804 4.282 6.794 6.005.949.41 1.69.654 2.268.837.953.303 1.821.26 2.508.158.765-.114 2.354-.962 2.687-1.891.331-.928.331-1.724.232-1.891-.099-.166-.365-.265-.762-.464Z"
          />
        </>
      )}
    </svg>
  );
}

export function CalendlyMark({ size = 40, className, monoColor }: Props) {
  // Calendly's brand language is a rounded calendar card in #006BFF with a
  // dot accent. Rendered as a clean geometric mark — calendar header strip
  // + 2x3 day cells + a small accent dot in the lower-right cell — that
  // reads instantly as "scheduling/calendar" while honoring Calendly's
  // primary brand color.
  const blue = monoColor ?? "#006BFF";
  const isMono = Boolean(monoColor);
  return (
    <svg
      role="img"
      aria-label="Calendly"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer rounded card */}
      <rect x="3" y="5" width="26" height="23" rx="4" fill={blue} />
      {/* Top hangers */}
      <rect x="9" y="3" width="3" height="6" rx="1.5" fill={blue} />
      <rect x="20" y="3" width="3" height="6" rx="1.5" fill={blue} />
      {/* Calendar surface */}
      <rect x="6" y="12" width="20" height="13" rx="2" fill="#FFFFFF" />
      {/* Date grid - tinted dots */}
      <circle cx="11" cy="16.5" r="1.1" fill={blue} fillOpacity={isMono ? 0.45 : 0.35} />
      <circle cx="16" cy="16.5" r="1.1" fill={blue} fillOpacity={isMono ? 0.45 : 0.35} />
      <circle cx="21" cy="16.5" r="1.1" fill={blue} fillOpacity={isMono ? 0.45 : 0.35} />
      <circle cx="11" cy="21" r="1.1" fill={blue} fillOpacity={isMono ? 0.45 : 0.35} />
      {/* Accent "selected" day */}
      <circle cx="21" cy="21" r="2.2" fill={blue} />
    </svg>
  );
}

export function GmailMark({ size = 40, className, monoColor }: Props) {
  // Google Gmail brand mark — multicolor envelope-M built from five overlapping
  // panels (blue/red/yellow/green) that compose into the iconic M. When
  // monoColor is set, render as a flat single-color envelope-M for the
  // mono-restraint variant.
  const isMono = Boolean(monoColor);
  if (isMono) {
    return (
      <svg
        role="img"
        aria-label="Gmail"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          fill={monoColor}
          d="M4 9.5C4 7.567 5.567 6 7.5 6h17C26.433 6 28 7.567 28 9.5v13c0 1.933-1.567 3.5-3.5 3.5h-17C5.567 26 4 24.433 4 22.5v-13Zm2.6.4 9.4 6.95L25.4 9.9V9.5c0-.5-.4-.9-.9-.9h-17c-.5 0-.9.4-.9.9v.4Zm18.8 2.85-9.4 6.95-9.4-6.95V22.5c0 .5.4.9.9.9h17c.5 0 .9-.4.9-.9V12.75Z"
        />
      </svg>
    );
  }
  return (
    <svg
      role="img"
      aria-label="Gmail"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left side - blue */}
      <path fill="#4285F4" d="M4 9.5C4 7.85 5.35 6.5 7 6.5h2L16 12 9 17.5v8H7c-1.65 0-3-1.35-3-3v-13Z" />
      {/* Right side - red */}
      <path fill="#EA4335" d="M23 6.5h2c1.65 0 3 1.35 3 3v13c0 1.65-1.35 3-3 3h-2v-8L16 12l7-5.5Z" />
      {/* Top fold - yellow */}
      <path fill="#FBBC04" d="M4 9.5c0-1.65 1.35-3 3-3l9 6.5 9-6.5c1.65 0 3 1.35 3 3l-9 6.5-3 2-9-6.5V9.5Z" />
      {/* Bottom inside left - green */}
      <path fill="#34A853" d="M9 17.5v8h14v-8L16 12l-7 5.5Z" />
      {/* Inner darker green band where panels overlap */}
      <path fill="#188038" d="M9 11.5l7 5 7-5v2L16 18.5 9 13.5v-2Z" />
    </svg>
  );
}
