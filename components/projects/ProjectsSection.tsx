"use client";

/**
 * ProjectsSection — homepage Projects chapter (editorial index table).
 *
 * Visual rhythm intentionally mirrors the Experience chapter so the page
 * reads as one continuous editorial spread:
 *
 *   • Decorative serif-italic numeral (matches ChapterNumeral)
 *   • Larger thumbnail with subtle hover scale
 *   • Serif-italic title (same family as RoleCard's company line)
 *   • Tagline line (italic, white/75) — the one-breath pitch
 *   • Problem one-liner (smaller, white/55) — secondary context
 *   • Tech chips
 *   • Primary "View live" CTA + secondary brand-logo cluster
 *     (Vercel · GitHub · Figma · Loom · PRD)
 *   • "Read case →" link to /projects/[slug]
 *
 * When `useAdmin().isEditing` is true, each row swaps to EditableProjectRow
 * which surfaces inline edit affordances and a per-row admin toolbar.
 *
 * Chapter chrome (eyebrows, headline, standfirst, footer link label) is
 * editable via EditableText slots under page="home", slot="projects.*".
 */

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";
import { EditableText } from "@/components/editable/EditableText";
import { tiptapToPlainText, type TiptapNode } from "@/lib/content/tiptapJson";
import { useAdmin } from "@/components/admin/AdminProvider";
import { EditableProjectRow } from "./EditableProjectRow";
import { ProjectActionCluster } from "./ProjectActionCluster";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SERIF_ITALIC: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  fontStyle: "italic",
  fontWeight: 400,
};

const HAIRLINE = "rgba(255,255,255,0.14)";
const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Project = Doc<"projects">;

function AddProjectButton({ existingCount }: { existingCount: number }) {
  const upsert = useMutation(api.projects.upsert);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (saving) return;
    setSaving(true);
    try {
      // Mirror AdminEditorProjects.handleNew defaults so a fresh project lands
      // with the three fact-block slots ready to fill inline.
      await upsert({
        slug: `untitled-${existingCount}-${Date.now()}`,
        order: existingCount,
        featured: false,
        title: "Untitled project",
        year: String(new Date().getFullYear()),
        techStack: [],
        problem: "",
        users: "",
        value: "",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={saving}
      className="mt-6 w-full rounded-xl border border-dashed px-6 py-6 text-left text-[13px] text-white/55 transition hover:border-white/30 hover:text-white disabled:opacity-50"
      style={{
        ...MONO,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        borderColor: HAIRLINE_FAINT,
      }}
    >
      {saving ? "Adding…" : "+ Add project"}
    </button>
  );
}

function MiniFact({ label, body }: { label: string; body: string }) {
  return (
    <div className="min-w-0">
      <div
        className="text-[9.5px] text-white/45"
        style={{ ...MONO, letterSpacing: "0.28em", textTransform: "uppercase" }}
      >
        {label}
      </div>
      <div aria-hidden className="mt-1.5 h-px w-full" style={{ background: HAIRLINE_FAINT }} />
      <p className="mt-2 line-clamp-3 text-[13px] leading-[1.5] font-light text-white/70">
        {body}
      </p>
    </div>
  );
}

function MiniFactStrip({
  problem,
  howWeSolveIt,
  whoFor,
}: {
  problem: string;
  howWeSolveIt: string;
  whoFor: string;
}) {
  if (!problem && !howWeSolveIt && !whoFor) return null;
  return (
    <div className="grid max-w-[760px] grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
      {problem && <MiniFact label="PROBLEM" body={problem} />}
      {howWeSolveIt && <MiniFact label="HOW WE SOLVE IT" body={howWeSolveIt} />}
      {whoFor && <MiniFact label="WHO WE SOLVE IT FOR" body={whoFor} />}
    </div>
  );
}

function TechChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-2 py-[2px] text-[10.5px] text-white/65"
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
  const titleLine = p.outcome ?? p.title;
  const numeralLabel = String(index + 1).padStart(2, "0");
  return (
    <div
      className="group grid grid-cols-1 gap-x-8 gap-y-5 border-t py-9 transition md:grid-cols-[64px_140px_minmax(0,1fr)] motion-safe:hover:-translate-y-px"
      style={{ borderColor: HAIRLINE_FAINT }}
    >
      <div
        className="text-[clamp(28px,3.2vw,40px)] leading-none text-white/40 tabular-nums"
        style={SERIF_ITALIC}
        aria-hidden
      >
        {numeralLabel}
      </div>

      <Link
        href={`/projects/${p.slug}`}
        className="relative block aspect-[140/88] w-full overflow-hidden rounded-lg md:w-[140px]"
        style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
        aria-label={`Open ${p.title} case study`}
      >
        <Thumbnail
          storageId={p.heroImageStorageId}
          alt={p.heroImageAlt ?? p.title}
          fallback={numeralLabel}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
        />
      </Link>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div
            className="flex flex-wrap items-baseline gap-x-3 text-[10.5px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            <span className="tabular-nums">{p.year}</span>
            {p.role && (
              <>
                <span aria-hidden>·</span>
                <span>{p.role}</span>
              </>
            )}
          </div>
          <Link
            href={`/projects/${p.slug}`}
            className="text-[clamp(26px,3.4vw,40px)] leading-[1.05] tracking-[-0.5px] text-white"
            style={{ ...SERIF_ITALIC, fontWeight: 500 }}
          >
            <span className="hidden group-hover:inline">
              <ChromaticText amount={0.18}>{titleLine}</ChromaticText>
            </span>
            <span className="group-hover:hidden">{titleLine}</span>
          </Link>
          {p.tagline && (
            <p
              className="max-w-[640px] text-[17px] leading-[1.45] text-white/80"
              style={{ ...SERIF_ITALIC, fontWeight: 300 }}
            >
              {p.tagline}
            </p>
          )}
        </div>

        <MiniFactStrip
          problem={p.problem}
          howWeSolveIt={p.value}
          whoFor={p.users}
        />

        {p.techStack.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {p.techStack.slice(0, 6).map((t) => (
              <TechChip key={t}>{t}</TechChip>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <ProjectActionCluster project={p} align="start" />
          <Link
            href={`/projects/${p.slug}`}
            className="text-[13px] text-white/55 transition group-hover:text-white"
            aria-label={`Open ${p.title} case study`}
          >
            Read case →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ProjectsSection() {
  const projects = useQuery(api.projects.list);
  const { isEditing } = useAdmin();

  return (
    <section id="work" className="relative overflow-hidden bg-[#05060a] py-[clamp(96px,14vh,160px)] text-white scroll-mt-24">
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
            className="mt-8 text-[clamp(40px,6vw,64px)] leading-[1.05] tracking-[-1.5px] text-white"
            style={{ ...SERIF_ITALIC, fontWeight: 500 }}
          >
            <ChromaticText amount={0.3}>
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
              {isEditing
                ? "No projects yet — use \u201C+ Add project\u201D below to create one."
                : "No projects yet — add some at /admin/edit."}
            </p>
          ) : (
            <div role="list">
              {projects.map((p, i) =>
                isEditing ? (
                  <EditableProjectRow key={p._id} project={p} index={i} all={projects} />
                ) : (
                  <IndexRow key={p._id} project={p} index={i} />
                ),
              )}
            </div>
          )}
          {isEditing && <AddProjectButton existingCount={projects?.length ?? 0} />}
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
