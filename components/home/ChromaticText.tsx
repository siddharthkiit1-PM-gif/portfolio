"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * ChromaticText — 3-layer text rendered with mix-blend-mode: screen so a
 * cyan and magenta ghost peel apart on either side of a white base, lit up
 * only at impact moments via the `--ka-split` CSS custom property.
 *
 * The layers share the SAME content, so accessibility tooling reads the
 * underlying text once (the cyan/magenta layers are aria-hidden and laid
 * over the base copy in absolute position). The only thing that animates
 * is `--ka-split` which the GSAP scroll timeline drives through the
 * compositor (registered via @property in globals.css).
 *
 * Width: the wrapper is `inline-block` so it occupies the natural text
 * footprint. Layers are absolute, positioned to the wrapper's content box.
 *
 * Multiplier (`amount`) lets specific words pop harder than the surrounding
 * line — e.g. the name dialed up during the dwell while the rest of the
 * copy stays subtle.
 */
type Props = {
  children: ReactNode;
  /** Multiplier on --ka-split for this instance. Default 1. */
  amount?: number;
  className?: string;
  style?: CSSProperties;
};

export function ChromaticText({ children, amount = 1, className, style }: Props) {
  // Each layer reads --ka-split (registered as <number> in globals.css), then
  // multiplies by `amount` to scale the offset, then converts to px via calc.
  // The screen blend collapses to white when split=0 and fans into RGB
  // separation as split rises.
  const offset = `calc(var(--ka-split, 0) * ${amount} * 1px)`;
  const ghostBase: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    mixBlendMode: "screen",
    willChange: "transform",
  };
  return (
    <span
      className={className}
      style={{ position: "relative", display: "inline-block", ...style }}
    >
      <span
        aria-hidden="true"
        style={{ ...ghostBase, color: "#22d3ee", transform: `translate3d(${offset}, 0, 0)` }}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        style={{
          ...ghostBase,
          color: "#f472b6",
          transform: `translate3d(calc(${offset} * -1), 0, 0)`,
        }}
      >
        {children}
      </span>
      <span style={{ position: "relative", display: "inline-block" }}>{children}</span>
    </span>
  );
}
