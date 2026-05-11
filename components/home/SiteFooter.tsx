/**
 * SiteFooter — closing chord for the homepage.
 *
 * Sits directly below the Contact section and shares its black canvas
 * so the page resolves into one continuous dark plate. Three-column
 * editorial composition:
 *
 *   Monogram     │   Built by Siddharth Agrawal   │   © 2026
 *
 * The center line uses the same italic serif as the Monogram glyph and
 * RoleCard titles — keeps the footer in the same typographic system as
 * the rest of the page so it reads as a signature, not a generic legal
 * strip. The mono caption ("© 2026 · Bengaluru") and the hairline above
 * are the only "site chrome" notes; everything else is intentional.
 */

import { Monogram } from "@/components/brand/Monogram";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};
const SERIF: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
};

const HAIRLINE = "rgba(255,255,255,0.10)";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="bg-black px-6 pb-14 pt-10 text-white"
      aria-label="Site footer"
    >
      <div
        className="mx-auto flex max-w-[820px] flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderTop: `1px solid ${HAIRLINE}`, paddingTop: "2.25rem" }}
      >
        <div className="flex items-center gap-3">
          <Monogram size={36} />
          <span
            className="text-[10px] text-white/45"
            style={{
              ...MONO,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
          >
            Siddharth Agrawal
          </span>
        </div>

        <p
          className="text-[15px] italic leading-none text-white/70"
          style={SERIF}
        >
          Built by{" "}
          <span className="text-white" style={{ fontWeight: 500 }}>
            Siddharth Agrawal
          </span>
          .
        </p>

        <span
          className="text-[10px] text-white/45"
          style={{
            ...MONO,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
          }}
        >
          © {year} · Bengaluru
        </span>
      </div>
    </footer>
  );
}
