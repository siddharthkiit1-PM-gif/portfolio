"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * FlowingGradientText — text with an animated linear-gradient sweeping
 * through it via `background-position-x` driven by --ka-grad.
 *
 * The gradient is sized to 300% so the visible window only sees a third
 * of it at any moment; sliding the position between 0% and 200% gives the
 * impression of color flowing through the letterforms.
 *
 * `gradient` is overridable for variants (the headline uses purple→cyan→
 * pink; the kinetic line emphasizes single colors). Default mirrors the
 * existing static gradient already used in the hero.
 */
type Props = {
  children: ReactNode;
  /** CSS gradient value. Default = brand violet→cyan→pink. */
  gradient?: string;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_GRADIENT =
  "linear-gradient(90deg, #a78bfa 0%, #22d3ee 25%, #f472b6 50%, #22d3ee 75%, #a78bfa 100%)";

export function FlowingGradientText({
  children,
  gradient = DEFAULT_GRADIENT,
  className,
  style,
}: Props) {
  return (
    <span
      className={className}
      style={{
        backgroundImage: gradient,
        backgroundSize: "300% 100%",
        backgroundPositionX: "var(--ka-grad, 0%)",
        backgroundPositionY: "center",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        display: "inline-block",
        willChange: "background-position",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
