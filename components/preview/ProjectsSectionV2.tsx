"use client";

/**
 * Preview-only — PM-portfolio rework of the homepage Projects chapter.
 *
 *   A — Editorial index table (dense, scannable rows; every project visible)
 *   B — Two-column bento card grid (visual + summary)
 *   C — Hero showcase + compact index (one big top, rest dense)
 *
 * Reads `api.projects.list` so every uploaded project appears (featured
 * ordering is preserved). All four artifact links (LIVE · CODE · FIGMA ·
 * LOOM) surface inline so a recruiter never has to click through to find
 * the live URL.
 *
 * Throwaway. Deleted at graduation per CLAUDE.md.
 */

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";
import { EditableText } from "@/components/editable/EditableText";

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

function SectionHeader() {
  return (
    <header className="mb-[clamp(48px,8vh,96px)]">
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
  );
}

function EmptyState() {
  return (
    <p className="text-[14px] text-white/55">No projects yet — add some at /admin/edit.</p>
  );
}

/* ───────────────────── VARIANT A · Editorial Index Table ─────────────── */

function VariantA({ projects }: { projects: Project[] }) {
  return (
    <section className="px-6 py-[clamp(64px,10vh,120px)]">
      <div className="mx-auto w-full max-w-[1100px]">
        <SectionHeader />
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div role="list">
            {projects.map((p, i) => (
              <IndexRowA key={p._id} project={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function IndexRowA({ project: p, index }: { project: Project; index: number }) {
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

      <div className="min-w-0 flex flex-col gap-2">
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

/* ───────────────────── VARIANT B · Two-Column Card Grid ──────────────── */

function VariantB({ projects }: { projects: Project[] }) {
  return (
    <section className="px-6 py-[clamp(64px,10vh,120px)]">
      <div className="mx-auto w-full max-w-[1100px]">
        <SectionHeader />
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {projects.map((p) => (
              <CardB key={p._id} project={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CardB({ project: p }: { project: Project }) {
  const actions = getActions(p);
  const titleLine = p.outcome ?? p.title;
  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl bg-white/[0.015] transition motion-safe:hover:-translate-y-1"
      style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
    >
      <Link
        href={`/projects/${p.slug}`}
        className="relative aspect-[16/10] w-full overflow-hidden"
      >
        <Thumbnail
          storageId={p.heroImageStorageId}
          alt={p.heroImageAlt ?? p.title}
          fallback={p.title.slice(0, 1)}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-baseline justify-between gap-3">
          <span
            className="text-[10.5px] tabular-nums text-white/55"
            style={{ ...MONO, letterSpacing: "0.24em" }}
          >
            {p.year}
            {p.role ? ` · ${p.role.toUpperCase()}` : ""}
          </span>
          {p.featured && (
            <span
              className="text-[9.5px] text-amber-200/85"
              style={{ ...MONO, letterSpacing: "0.32em" }}
            >
              FEATURED
            </span>
          )}
        </div>
        <Link href={`/projects/${p.slug}`}>
          <h3
            className="text-[clamp(22px,2.2vw,28px)] leading-[1.15] tracking-tight text-white"
            style={{
              fontFamily:
                "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            <span className="hidden group-hover:inline">
              <ChromaticText amount={0.15}>{titleLine}</ChromaticText>
            </span>
            <span className="group-hover:hidden">{titleLine}</span>
          </h3>
        </Link>
        {p.problem && (
          <p className="line-clamp-3 text-[14px] leading-[1.55] font-light text-white/70">
            {p.problem}
          </p>
        )}
        {p.techStack.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {p.techStack.slice(0, 4).map((t) => (
              <TechChip key={t}>{t}</TechChip>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {actions.map((a) => (
              <ActionChip key={a.label} {...a} />
            ))}
          </div>
          <Link
            href={`/projects/${p.slug}`}
            className="text-[12px] text-white/65 transition group-hover:text-white"
            style={{ ...MONO, letterSpacing: "0.16em" }}
          >
            CASE →
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ──────────────── VARIANT C · Hero Showcase + Compact Index ──────────── */

function VariantC({ projects }: { projects: Project[] }) {
  const [hero, ...rest] = projects;
  return (
    <section className="px-6 py-[clamp(64px,10vh,120px)]">
      <div className="mx-auto w-full max-w-[1100px]">
        <SectionHeader />
        {!hero ? (
          <EmptyState />
        ) : (
          <>
            <HeroCardC project={hero} />
            {rest.length > 0 && (
              <div className="mt-[clamp(48px,8vh,96px)]" role="list">
                {rest.map((p, i) => (
                  <CompactRowC key={p._id} project={p} index={i + 1} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function HeroCardC({ project: p }: { project: Project }) {
  const actions = getActions(p);
  const titleLine = p.outcome ?? p.title;
  return (
    <article className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-12">
      <Link
        href={`/projects/${p.slug}`}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl"
        style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
      >
        <Thumbnail
          storageId={p.heroImageStorageId}
          alt={p.heroImageAlt ?? p.title}
          fallback={p.title.slice(0, 1)}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 hover:scale-[1.02]"
        />
      </Link>
      <div className="flex flex-col gap-5">
        <span
          className="text-[10px] text-white/55"
          style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
        >
          Featured · {p.year}
          {p.role ? ` · ${p.role}` : ""}
        </span>
        <h3
          className="text-[clamp(32px,4vw,48px)] leading-[1.05] tracking-[-1.5px] text-white"
          style={{
            fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 500,
          }}
        >
          <ChromaticText amount={0.25}>
            <FlowingGradientText>{titleLine}</FlowingGradientText>
          </ChromaticText>
        </h3>
        {p.problem && (
          <p className="line-clamp-4 max-w-[560px] text-[15.5px] leading-[1.55] font-light text-white/75">
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {actions.map((a) => (
            <ActionChip key={a.label} {...a} />
          ))}
          <Link
            href={`/projects/${p.slug}`}
            className="ml-auto inline-flex rounded-full bg-white px-4 py-2 text-[12px] font-medium text-black"
          >
            Read case study →
          </Link>
        </div>
      </div>
    </article>
  );
}

function CompactRowC({ project: p, index }: { project: Project; index: number }) {
  const actions = getActions(p);
  return (
    <div
      className="group grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-6 border-t py-5 transition motion-safe:hover:-translate-y-px"
      style={{ borderColor: HAIRLINE_FAINT }}
    >
      <span
        className="text-[15px] text-white/40 tabular-nums"
        style={SERIF_ITALIC}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <Link
          href={`/projects/${p.slug}`}
          className="text-[18px] leading-tight text-white"
          style={{
            fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 400,
          }}
        >
          <span className="hidden group-hover:inline">
            <ChromaticText amount={0.12}>{p.outcome ?? p.title}</ChromaticText>
          </span>
          <span className="group-hover:hidden">{p.outcome ?? p.title}</span>
        </Link>
        <span
          className="text-[10.5px] tabular-nums text-white/50"
          style={{ ...MONO, letterSpacing: "0.18em" }}
        >
          {p.year}
        </span>
        {p.role && (
          <span
            className="text-[10px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            · {p.role}
          </span>
        )}
        {p.techStack.length > 0 && (
          <span
            className="truncate text-[10px] text-white/40"
            style={{ ...MONO, letterSpacing: "0.06em" }}
          >
            {p.techStack.slice(0, 3).join(" · ")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {actions.map((a) => (
          <ActionChip key={a.label} {...a} />
        ))}
        <Link
          href={`/projects/${p.slug}`}
          className="ml-2 text-[16px] text-white/55 transition group-hover:text-white"
          aria-label={`Open ${p.title} detail page`}
        >
          →
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────── Preview frame + entry ───────────────────────── */

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section
      className="mb-16 overflow-hidden rounded-xl"
      style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
    >
      <div
        className="px-6 py-3 text-[11px] text-white/65"
        style={{
          ...MONO,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {label}
      </div>
      {children}
    </section>
  );
}

export function ProjectsSectionV2() {
  const projects = useQuery(api.projects.list);
  const list = projects ?? [];

  return (
    <main className="min-h-[100dvh] bg-[#05060a] py-12 text-white">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <h1
          className="mb-10 text-[28px] text-white/85"
          style={SERIF_ITALIC}
        >
          Projects chapter — PM portfolio rework
        </h1>
        <p className="mb-10 max-w-[640px] text-[13px] leading-[1.55] text-white/55">
          Three takes on a recruiter-friendly Projects section. All three pull
          from <code>api.projects.list</code> so every uploaded project appears
          with its live URL, code, Figma, and Loom links surfaced inline.
        </p>

        <Frame label="VARIANT A · EDITORIAL INDEX TABLE">
          <VariantA projects={list} />
        </Frame>

        <Frame label="VARIANT B · TWO-COLUMN CARD GRID">
          <VariantB projects={list} />
        </Frame>

        <Frame label="VARIANT C · HERO SHOWCASE + COMPACT INDEX">
          <VariantC projects={list} />
        </Frame>
      </div>
    </main>
  );
}
