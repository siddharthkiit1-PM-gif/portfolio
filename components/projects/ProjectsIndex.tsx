"use client";

/**
 * ProjectsIndex — body of /projects. Reads api.projects.list and renders
 * a single-column editorial table. No filter / search at v1.
 *
 * The indexStandfirst slot embeds {count}; resolved via EditableCountStandfirst
 * because EditableText does not provide a transform prop. Admin still edits
 * the source string via /admin/edit Copy tab.
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EditableText } from "@/components/editable/EditableText";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";
import { tiptapToPlainText, type TiptapNode } from "@/lib/content/tiptapJson";
import { ProjectIndexRow } from "./ProjectIndexRow";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE = "rgba(255,255,255,0.14)";

export function ProjectsIndex() {
  const rows = useQuery(api.projects.list);

  return (
    <main className="relative min-h-[100dvh] bg-[#05060a] py-[clamp(64px,10vh,120px)] text-white">
      <div className="mx-auto w-full max-w-[1100px] px-6 sm:px-6 lg:px-10">
        <a
          href="/"
          className="text-[11px] text-white/55 transition hover:text-white"
          style={{ ...MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
        >
          &larr; Back to home
        </a>

        <header className="mt-10">
          <div
            className="text-[10px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
          >
            <EditableText
              page="home"
              slot="projects.indexEyebrow"
              fallback="PROJECTS"
              as="span"
              singleLine
            />
          </div>
          <div aria-hidden className="mt-4 h-px w-full" style={{ background: HAIRLINE }} />
          <h1
            className="mt-8 text-[clamp(40px,5.5vw,64px)] leading-[1.05] tracking-[-1px] text-white"
            style={{
              fontFamily:
                'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            <ChromaticText amount={0.2}>
              <FlowingGradientText>
                <EditableText
                  page="home"
                  slot="projects.indexHeadline"
                  fallback="Everything I\u2019ve shipped."
                  as="span"
                  singleLine
                />
              </FlowingGradientText>
            </ChromaticText>
          </h1>
          <p
            className="mt-4 text-[12px] text-white/55"
            style={{ ...MONO, letterSpacing: "0.18em" }}
          >
            <EditableCountStandfirst count={rows ? rows.length : null} />
          </p>
        </header>

        <div className="mt-[clamp(48px,8vh,96px)]">
          {rows === undefined ? null : rows.length === 0 ? (
            <p className="text-[14px] text-white/55">No projects yet.</p>
          ) : (
            <div className="flex flex-col">
              {rows.map((p, i) => (
                <ProjectIndexRow key={p._id} project={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function EditableCountStandfirst({ count }: { count: number | null }) {
  const row = useQuery(api.siteContent.get, {
    page: "home",
    slot: "projects.indexStandfirst",
  });
  const FALLBACK = "{count} projects, 2018 \u2192 now.";
  let source = FALLBACK;
  if (row?.valueJson != null) {
    try {
      const json = JSON.parse(row.valueJson) as TiptapNode;
      source = tiptapToPlainText(json);
    } catch {
      source = FALLBACK;
    }
  }
  const display = source.replace("{count}", count === null ? "\u2026" : String(count));
  return <span>{display}</span>;
}
