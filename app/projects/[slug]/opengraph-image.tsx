import { ImageResponse } from "next/og";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const runtime = "edge";
export const alt = "Project — Siddharth Agrawal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Per-project OG card. Pulls live data from Convex so a freshly-published
 * project gets a correct social card on the next request without a redeploy.
 */
export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolved = await Promise.resolve(params);
  const project = await fetchQuery(api.projects.getBySlug, { slug: resolved.slug }).catch(
    () => null,
  );

  const title = project?.outcome ?? project?.title ?? "Project";
  const eyebrow = project
    ? `${project.year}${project.role ? ` · ${project.role}` : ""}`
    : "PROJECT";
  const standfirst =
    project?.tagline ?? project?.problem?.slice(0, 180) ?? "Spec to ship, end to end.";

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
          {eyebrow}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: 80,
              lineHeight: 1.04,
              fontWeight: 400,
              letterSpacing: "-2px",
              fontStyle: "italic",
              fontFamily: 'ui-serif, "New York", Georgia, serif',
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.3,
              fontWeight: 300,
              color: "rgba(255,255,255,0.72)",
              maxWidth: 980,
            }}
          >
            {standfirst}
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
          <span>Siddharth Agrawal</span>
          <span>AI Product Builder</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
