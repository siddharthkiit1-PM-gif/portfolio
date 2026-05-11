"use client";

/**
 * ProjectsSection — homepage Projects chapter (editorial index table).
 *
 * Reads `api.projects.list` so every uploaded project appears on the
 * homepage, ordered by `order`. All four artifact links (LIVE · CODE ·
 * FIGMA · LOOM) surface inline on each row so recruiters and hiring
 * managers reach the live URL without a click-through.
 *
 * Each row: numeral · thumbnail · title+year+role · problem one-liner ·
 * tech chips · action chips · "Read case →" link to /projects/[slug].
 * Hover: row lifts 1px, hairline brightens, thumbnail scales 1.02, title
 * gets a faint chromatic split. Reduced-motion drops the lift + scale.
 *
 * Chapter chrome (eyebrows, headline, standfirst, footer link label) is
 * editable via EditableText slots under page="home", slot="projects.*".
 * The footer count is rendered through EditableCountLabel because the
 * {count} substitution needs a per-render transform that EditableText
 * does not provide; admin still edits the label via /admin/edit Copy.
 */

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";
import { EditableText } from "@/components/editable/EditableText";
import { tiptapToPlainText, type TiptapNode } from "@/lib/content/tiptapJson";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SERIF_ITALIC: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  fontStyle: "italic",
  fontWeight: 300,
};

const HAIRLINE = "rgba(255,255,255,0.14)";
const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Project = Doc<"projects">;

function getActions(p: Project): { label: string; url: string }[] {
  const out: { label: string; url: string }[] = [];
  if (p.liveUrl) out.push({ label: "LIVE", url: p.liveUrl });
  if (p.githubUrl) out.push({ label: "CODE", url: p.githubUrl });
  if (p.figmaUrl) out.push({ label: "FIGMA", url: p.figmaUrl });
  if (p.loomUrl) out.push({ label: "LOOM", url: p.loomUrl });
  return out;
}

function ActionChip({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full px-2.5 py-[3px] text-[10px] text-white/70 transition hover:bg-white/5 hover:text-white"
      style={{
        ...MONO,
        letterSpacing: "0.16em",
        border: `1px solid ${HAIRLINE_FAINT}`,
      }}
    >
      {label} ↗
    </a>
  );
}

function TechChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-2 py-[2px] text-[10.5px] text-white/70"
      style={{
        ...MONO,
        letterSpacing: "0.06em",
        border: `1px solid ${HAIRLINE_FAINT}`,
      }}
    >
      {children}
    </span>
  );
}

function Thumbnail({
  storageId,
  alt,
  fallback,
  className,
}: {
  storageId: Id<"_storage"> | undefined;
  alt: string;
  fallback: string;
  className?: string;
}) {
  const url = useQuery(
    api.projects.getStorageUrl,
    storageId ? { storageId } : "skip",
  );
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={className} loading="lazy" />;
  }
  return (
    <div
      className={`${className ?? ""} flex items-center justify-center text-white/15`}
      style={SERIF_ITALIC}
    >
      {fallback}
    </div>
  );
}

function IndexRow({ project: p, index }: { project: Project; index: number }) {
  const actions = getActions(p);
  const titleLine = p.outcome ?? p.title;
  return (
    <div
      className="group grid grid-cols-[36px_88px_minmax(0,1fr)_auto] items-start gap-x-6 gap-y-2 border-t py-7 transition motion-safe:hover:-translate-y-px"
      style={{ borderColor: HAIRLINE_FAINT }}
    >
      <div
        className="pt-[6px] text-[18px] text-white/40 tabular-nums"
        style={SERIF_ITALIC}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      <Link
        href={`/projects/${p.slug}`}
        className="relative aspect-[88/56] w-[88px] overflow-hidden rounded-md"
        style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
      >
        <Thumbnail
          storageId={p.heroImageStorageId}
          alt={p.heroImageAlt ?? p.title}
          fallback={String(index + 1).padStart(2, "0")}
          className="absolute inset-0 size-full object-cover transition-transform motion-safe:group-hover:scale-[1.02]"
        />
      </Link>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <Link
            href={`/projects/${p.slug}`}
            className="text-[clamp(20px,2.4vw,28px)] leading-tight text-white"
            style={{
              fontFamily:
                "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
            }}
          >
            <span className="hidden group-hover:inline">
              <ChromaticText amount={0.15}>{titleLine}</ChromaticText>
            </span>
            <span className="group-hover:hidden">{titleLine}</span>
          </Link>
          <span
            className="text-[11px] tabular-nums text-white/50"
            style={{ ...MONO, letterSpacing: "0.18em" }}
          >
            {p.year}
          </span>
          {p.role && (
            <span
              className="text-[10.5px] text-white/45"
              style={{
                ...MONO,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              · {p.role}
            </span>
          )}
        </div>
        {p.problem && (
          <p className="line-clamp-2 max-w-[680px] text-[14px] leading-[1.5] font-light text-white/70">
            {p.problem}
          </p>
        )}
        {p.techStack.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {p.techStack.slice(0, 5).map((t) => (
              <TechChip key={t}>{t}</TechChip>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-3 pt-[6px]">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {actions.map((a) => (
            <ActionChip key={a.label} {...a} />
          ))}
        </div>
        <Link
          href={`/projects/${p.slug}`}
          className="text-[14px] text-white/55 transition group-hover:text-white"
          aria-label={`Open ${p.title} detail page`}
        >
          Read case →
        </Link>
      </div>
    </div>
  );
}

export function ProjectsSection() {
  const projects = useQuery(api.projects.list);

  return (
    <section className="relative overflow-hidden bg-[#05060a] py-[clamp(96px,14vh,160px)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 80px), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 80px)",
        }}
      />
      <div className="relative mx-auto w-full max-w-[1100px] px-6 sm:px-6 lg:px-10">
        <header>
          <div
            className="flex items-baseline justify-between text-[10px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
          >
            <EditableText
              page="home"
              slot="projects.eyebrowLeft"
              fallback="PROJECTS · 2022 — 2026"
              as="span"
              singleLine
            />
            <EditableText
              page="home"
              slot="projects.eyebrowRight"
              fallback=""
              as="span"
              singleLine
            />
          </div>
          <div aria-hidden className="mt-4 h-px w-full" style={{ background: HAIRLINE }} />
          <h2
            className="mt-8 text-[clamp(40px,6vw,64px)] leading-[1.05] tracking-[-2px] text-white"
            style={{
              fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            <ChromaticText amount={0.35}>
              <FlowingGradientText>
                <EditableText
                  page="home"
                  slot="projects.headline"
                  fallback="Selected work, in detail."
                  as="span"
                  singleLine
                />
              </FlowingGradientText>
            </ChromaticText>
          </h2>
          <p className="mt-4 max-w-[640px] text-[17px] leading-[1.5] font-light text-white/65">
            <EditableText
              page="home"
              slot="projects.standfirst"
              fallback="A small set of products I led, designed, or built — each with the problem, the people, and the result."
              as="span"
            />
          </p>
        </header>

        <div className="mt-[clamp(48px,8vh,96px)]">
          {projects === undefined ? null : projects.length === 0 ? (
            <p className="text-[14px] text-white/55">
              No projects yet — add some at /admin/edit.
            </p>
          ) : (
            <div role="list">
              {projects.map((p, i) => (
                <IndexRow key={p._id} project={p} index={i} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-[clamp(48px,8vh,96px)]">
          <div aria-hidden className="h-px w-full" style={{ background: HAIRLINE }} />
          <div className="mt-6 flex justify-end">
            <a
              href="/projects"
              className="text-[12px] text-white/70 transition hover:text-white"
              style={{ ...MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
            >
              <EditableCountLabel count={projects ? projects.length : null} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function EditableCountLabel({ count }: { count: number | null }) {
  const row = useQuery(api.siteContent.get, {
    page: "home",
    slot: "projects.indexLinkLabel",
  });
  const FALLBACK = "See all {count} projects →";
  let source = FALLBACK;
  if (row?.valueJson != null) {
    try {
      const json = JSON.parse(row.valueJson) as TiptapNode;
      source = tiptapToPlainText(json);
    } catch {
      source = FALLBACK;
    }
  }
  const display = source.replace("{count}", count === null ? "…" : String(count));
  return <span>{display}</span>;
}
