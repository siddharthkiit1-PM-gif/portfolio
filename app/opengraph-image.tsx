import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Siddharth Agrawal — AI Product Builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Root OG card. Mirrors the homepage's editorial-mono aesthetic: dark plate,
 * a soft cool vignette where the orb used to live, a thin hairline rule, mono
 * eyebrow + serif italic name. Renders at the edge so social-graph previews
 * stay fresh without a build step.
 */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#05060a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          color: "white",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 70% 40%, rgba(64,132,200,0.18) 0%, rgba(64,132,200,0.05) 35%, transparent 65%)",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 18,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          AI PRODUCT BUILDER · PORTFOLIO
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.02,
              fontWeight: 300,
              letterSpacing: "-3px",
              fontStyle: "italic",
              fontFamily: 'ui-serif, "New York", Georgia, serif',
            }}
          >
            Siddharth Agrawal.
          </div>
          <div
            style={{
              fontSize: 36,
              lineHeight: 1.2,
              fontWeight: 300,
              letterSpacing: "-0.5px",
              color: "rgba(255,255,255,0.78)",
              maxWidth: 900,
            }}
          >
            AI products, shipped solo. Spec to ship, end to end.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 18,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
            fontFamily: "ui-monospace, monospace",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 28,
          }}
        >
          <span>siddharthagrawal</span>
          <span>Bengaluru · 2026</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
