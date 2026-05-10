/**
 * Monogram — shared brand mark used in the SiteNav and the hero
 * recruiter rail. Italic serif "Sa" inside a thin ring with a faint
 * inner ring; the same accent gradient as the hero headline tints the
 * background so the mark reads as part of the same typographic system.
 *
 * When `photoSrc` is provided (recruiter rail), the glyph is replaced
 * with a centered cover-fit photo. The gradient ring + faint inner
 * ring stay so the mark still reads as part of the brand chrome rather
 * than a bare avatar.
 */

import type { CSSProperties } from "react";

const SERIF: CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
};

type Props = {
  size?: number;
  /** Optional className for layout positioning. */
  className?: string;
  /**
   * If set, renders the image at this URL instead of the "Sa" glyph.
   * Should be a square portrait — it's clipped to the circle and
   * `object-fit: cover`-ed so off-center subjects stay framed.
   */
  photoSrc?: string;
  /** Alt text used when `photoSrc` is set. */
  photoAlt?: string;
};

export function Monogram({ size = 72, className, photoSrc, photoAlt }: Props) {
  const innerInset = Math.max(4, size * 0.08);
  return (
    <span
      aria-label="Siddharth Agrawal"
      className={`relative inline-flex items-center justify-center overflow-hidden ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.16)",
        background:
          "radial-gradient(ellipse at 30% 30%, rgba(167,139,250,0.20) 0%, transparent 60%), radial-gradient(ellipse at 75% 80%, rgba(34,211,238,0.10) 0%, transparent 65%)",
      }}
    >
      {photoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- the codebase
        // already serves portrait assets as plain CSS backgrounds; keeping
        // <img> here matches that pattern and avoids next/image's wrapper
        // boxing inside the circular clip.
        <img
          src={photoSrc}
          alt={photoAlt ?? "Siddharth Agrawal"}
          width={size}
          height={size}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center 28%" }}
        />
      ) : (
        <span
          style={{
            ...SERIF,
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: size * 0.42,
            letterSpacing: "-0.02em",
            color: "white",
            lineHeight: 1,
          }}
        >
          Sa
        </span>
      )}
      <span
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: innerInset,
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      />
    </span>
  );
}
