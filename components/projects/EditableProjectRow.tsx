"use client";

/**
 * EditableProjectRow — admin-only variant of IndexRow rendered inside
 * ProjectsSection when `useAdmin().isEditing` is true. Mirrors the
 * read-only row's serif-italic editorial rhythm exactly so the page does
 * not jump between modes, then layers inline-edit affordances on top:
 *
 *   • Title / tagline / problem / year / role — InlineEditable (click)
 *   • Tech chips — chip ×, plus a "+ tech" inline input
 *   • Action cluster — primary "View live" with inline URL editor; the
 *     four secondary links (Code · Figma · Loom · PRD) live in a logo
 *     row beneath with a per-icon URL editor
 *   • Thumbnail — hover reveals "REPLACE" → hits api.projects.generateUploadUrl
 *   • Right-column toolbar — ↑ ↓ · ★ Featured · 🗑 Delete · ↗ deep-link
 *
 * Every commit dispatches api.projects.upsert with the full row (slug/
 * order/required fields included) because the mutation is upsert-shaped,
 * not patch-shaped. Convex reactively refreshes the list so optimistic
 * state isn't needed.
 *
 * All structural mutations (reorder, delete, featured-toggle, image-upload)
 * are guarded by `requireAdmin` server-side. The component trusts that the
 * parent only renders it for admins.
 */

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { InlineEditable } from "@/components/admin/InlineEditable";
import {
  ArrowUpRight,
  FigmaMark,
  GithubMark,
  LoomMark,
  PrdDocMark,
  VercelMark,
} from "@/components/icons/BrandIcons";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SERIF_ITALIC: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  fontStyle: "italic",
  fontWeight: 400,
};

const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Project = Doc<"projects">;
type LinkKey = "liveUrl" | "githubUrl" | "figmaUrl" | "loomUrl" | "prdUrl";

const LINK_LABELS: Record<LinkKey, string> = {
  liveUrl: "Live site",
  githubUrl: "Source · GitHub",
  figmaUrl: "Design · Figma",
  loomUrl: "Walkthrough · Loom",
  prdUrl: "Spec · PRD",
};

/** Build the full upsert args from a project + patch. */
function buildArgs(p: Project, patch: Partial<Project>) {
  const merged = { ...p, ...patch };
  return {
    id: p._id,
    slug: merged.slug,
    order: merged.order,
    featured: merged.featured,
    title: merged.title,
    outcome: merged.outcome || undefined,
    year: merged.year,
    role: merged.role || undefined,
    tagline: merged.tagline || undefined,
    liveUrl: merged.liveUrl || undefined,
    githubUrl: merged.githubUrl || undefined,
    figmaUrl: merged.figmaUrl || undefined,
    loomUrl: merged.loomUrl || undefined,
    prdUrl: merged.prdUrl || undefined,
    techStack: merged.techStack,
    heroImageStorageId: merged.heroImageStorageId,
    heroImageAlt: merged.heroImageAlt || undefined,
    problem: merged.problem,
    users: merged.users,
    value: merged.value,
    goal: merged.goal || undefined,
    approach: merged.approach || undefined,
    outcomeNarrative: merged.outcomeNarrative || undefined,
    learnings: merged.learnings || undefined,
    heroMetricValue: merged.heroMetricValue || undefined,
    heroMetricLabel: merged.heroMetricLabel || undefined,
  };
}

function isValidUrl(u: string): boolean {
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

function EditableThumbnail({ project }: { project: Project }) {
  const url = useQuery(
    api.projects.getStorageUrl,
    project.heroImageStorageId ? { storageId: project.heroImageStorageId } : "skip",
  );
  const upsert = useMutation(api.projects.upsert);
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      await upsert(buildArgs(project, { heroImageStorageId: storageId }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="group/thumb relative aspect-[140/88] w-full overflow-hidden rounded-lg md:w-[140px]"
      style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={project.heroImageAlt ?? project.title}
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/20" style={SERIF_ITALIC}>
          ?
        </div>
      )}
      <label
        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 text-[10px] text-white opacity-0 transition group-hover/thumb:opacity-100"
        style={{ ...MONO, letterSpacing: "0.22em" }}
      >
        {uploading ? "…" : "REPLACE"}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

/**
 * Inline URL editor used by both the primary "View live" button and the
 * secondary logo cluster. When the URL is empty it shows an "add" affordance;
 * when populated it shows the live link with an edit ✎ overlay on hover.
 *
 * Two visual variants:
 *   • primary — white-filled pill with Vercel mark + "View live" label
 *   • icon — round 32px icon button with brand glyph
 */
function LinkButton({
  project,
  linkKey,
  variant,
}: {
  project: Project;
  linkKey: LinkKey;
  variant: "primary" | "icon";
}) {
  const upsert = useMutation(api.projects.upsert);
  const url = project[linkKey] ?? "";
  const label = LINK_LABELS[linkKey];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function commit() {
    setError(null);
    const trimmed = draft.trim();
    if (trimmed && !isValidUrl(trimmed)) {
      setError("Invalid URL");
      return;
    }
    if (trimmed === url) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await upsert(
        buildArgs(project, { [linkKey]: trimmed || undefined } as Partial<Project>),
      );
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {variant === "icon" ? (
          <IconForLink linkKey={linkKey} className="text-white/65" />
        ) : (
          <VercelMark size={12} className="text-white/65" />
        )}
        <input
          autoFocus
          type="url"
          value={draft}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setDraft(url);
              setEditing(false);
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              void commit();
            }
          }}
          placeholder="https://…"
          className="w-[220px] rounded-full border border-violet-400/40 bg-black/40 px-3 py-1 text-[12px] text-white outline-none"
        />
        {error && <span className="text-[10.5px] text-red-400">{error}</span>}
      </span>
    );
  }

  if (variant === "primary") {
    if (!url) {
      return (
        <button
          type="button"
          onClick={() => {
            setDraft("");
            setEditing(true);
          }}
          className="inline-flex h-8 items-center gap-2 rounded-full border border-dashed border-white/25 px-4 text-[12.5px] text-white/55 hover:text-white"
          aria-label="Add live URL"
        >
          <VercelMark size={12} />
          <span>Add live link</span>
        </button>
      );
    }
    return (
      <div className="inline-flex items-center gap-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-2 rounded-full bg-white px-4 text-[12.5px] font-medium tracking-tight text-black transition hover:bg-white/90"
          aria-label="Open live deployment"
        >
          <VercelMark size={12} />
          <span>View live</span>
          <ArrowUpRight size={11} />
        </a>
        <button
          type="button"
          onClick={() => {
            setDraft(url);
            setEditing(true);
          }}
          className="rounded-full px-2 py-0.5 text-[11px] text-white/45 hover:text-white"
          aria-label="Edit live URL"
          title="Edit URL"
        >
          ✎
        </button>
      </div>
    );
  }

  // icon variant
  if (!url) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft("");
          setEditing(true);
        }}
        title={`Add ${label}`}
        aria-label={`Add ${label}`}
        className="inline-flex size-8 items-center justify-center rounded-full border border-dashed border-white/15 text-white/35 hover:border-white/35 hover:text-white/75"
      >
        <IconForLink linkKey={linkKey} />
      </button>
    );
  }
  return (
    <span className="group/lnk relative inline-flex">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        aria-label={label}
        className="inline-flex size-8 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
      >
        <IconForLink linkKey={linkKey} />
      </a>
      <button
        type="button"
        onClick={() => {
          setDraft(url);
          setEditing(true);
        }}
        aria-label={`Edit ${label}`}
        title="Edit URL"
        className="absolute -right-1 -top-1 hidden size-4 items-center justify-center rounded-full border border-white/20 bg-black text-[8px] text-white/65 hover:text-white group-hover/lnk:inline-flex"
      >
        ✎
      </button>
    </span>
  );
}

function IconForLink({
  linkKey,
  className,
}: {
  linkKey: LinkKey;
  className?: string;
}) {
  switch (linkKey) {
    case "liveUrl":
      return <VercelMark className={className} />;
    case "githubUrl":
      return <GithubMark className={className} />;
    case "figmaUrl":
      return <FigmaMark className={className} />;
    case "loomUrl":
      return <LoomMark className={className} />;
    case "prdUrl":
      return <PrdDocMark className={className} />;
  }
}

function EditableMiniFact({
  label,
  value,
  placeholder,
  onCommit,
  ariaLabel,
}: {
  label: string;
  value: string;
  placeholder: string;
  onCommit: (v: string) => Promise<void> | void;
  ariaLabel: string;
}) {
  return (
    <div className="min-w-0">
      <div
        className="text-[9.5px] text-white/45"
        style={{ ...MONO, letterSpacing: "0.28em", textTransform: "uppercase" }}
      >
        {label}
      </div>
      <div aria-hidden className="mt-1.5 h-px w-full" style={{ background: HAIRLINE_FAINT }} />
      <InlineEditable
        value={value}
        onCommit={onCommit}
        multiline
        placeholder={placeholder}
        className="mt-2 block text-[13px] leading-[1.5] font-light text-white/70"
        ariaLabel={ariaLabel}
      />
    </div>
  );
}

function TechChipEditable({ project, tech }: { project: Project; tech: string }) {
  const upsert = useMutation(api.projects.upsert);
  async function remove() {
    await upsert(
      buildArgs(project, { techStack: project.techStack.filter((t) => t !== tech) }),
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10.5px] text-white/70"
      style={{
        ...MONO,
        letterSpacing: "0.06em",
        border: `1px solid ${HAIRLINE_FAINT}`,
      }}
    >
      {tech}
      <button
        type="button"
        onClick={() => void remove()}
        className="text-white/40 hover:text-white"
        aria-label={`Remove ${tech}`}
      >
        ×
      </button>
    </span>
  );
}

function TechChipAdd({ project }: { project: Project }) {
  const upsert = useMutation(api.projects.upsert);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function commit() {
    const t = draft.trim();
    if (!t) {
      setAdding(false);
      return;
    }
    if (project.techStack.includes(t)) {
      setDraft("");
      setAdding(false);
      return;
    }
    setSaving(true);
    try {
      await upsert(buildArgs(project, { techStack: [...project.techStack, t] }));
      setDraft("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="rounded-full px-2 py-[2px] text-[10.5px] text-white/45 hover:text-white"
        style={{ ...MONO, letterSpacing: "0.06em", border: `1px dashed ${HAIRLINE_FAINT}` }}
      >
        + tech
      </button>
    );
  }
  return (
    <input
      autoFocus
      type="text"
      value={draft}
      disabled={saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setDraft("");
          setAdding(false);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          void commit();
        }
      }}
      placeholder="React"
      className="w-[100px] rounded-full border border-violet-400/40 bg-black/40 px-2 py-[2px] text-[10.5px] text-white outline-none"
      style={{ ...MONO }}
    />
  );
}

export function EditableProjectRow({
  project: p,
  index,
  all,
}: {
  project: Project;
  index: number;
  all: Project[];
}) {
  const upsert = useMutation(api.projects.upsert);
  const remove = useMutation(api.projects.remove);
  const reorder = useMutation(api.projects.reorder);

  const isFirst = index === 0;
  const isLast = index === all.length - 1;
  const titleLine = p.outcome ?? p.title;
  const numeralLabel = String(index + 1).padStart(2, "0");

  async function commitField(patch: Partial<Project>) {
    await upsert(buildArgs(p, patch));
  }

  async function move(dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= all.length) return;
    const next = [...all];
    [next[index], next[j]] = [next[j], next[index]];
    await reorder({ orderedIds: next.map((x) => x._id) });
  }

  async function toggleFeatured() {
    await upsert(buildArgs(p, { featured: !p.featured }));
  }

  async function handleDelete() {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    await remove({ id: p._id });
  }

  return (
    <div
      className="grid grid-cols-1 gap-x-8 gap-y-5 border-t py-9 md:grid-cols-[64px_140px_minmax(0,1fr)]"
      style={{ borderColor: HAIRLINE_FAINT }}
    >
      <div
        className="text-[clamp(28px,3.2vw,40px)] leading-none text-white/40 tabular-nums"
        style={SERIF_ITALIC}
        aria-hidden
      >
        {numeralLabel}
      </div>

      <EditableThumbnail project={p} />

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div
            className="flex flex-wrap items-baseline gap-x-3 text-[10.5px] text-white/55"
            style={{ ...MONO, letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            <InlineEditable
              value={p.year}
              onCommit={(v) => commitField({ year: v })}
              className="tabular-nums"
              ariaLabel="Edit year"
            />
            <span aria-hidden>·</span>
            <InlineEditable
              value={p.role ?? ""}
              onCommit={(v) => commitField({ role: v })}
              placeholder="role"
              ariaLabel="Edit role"
            />
          </div>
          <InlineEditable
            value={titleLine}
            onCommit={(v) =>
              // The visible headline is "outcome ?? title". When outcome is
              // already set, commit edits there so the public headline tracks
              // what admin sees; otherwise patch title so the base name moves.
              commitField(p.outcome ? { outcome: v } : { title: v })
            }
            className="text-[clamp(26px,3.4vw,40px)] leading-[1.05] tracking-[-0.5px] text-white"
            style={{ ...SERIF_ITALIC, fontWeight: 500 }}
            ariaLabel="Edit project headline"
          />
          <InlineEditable
            value={p.tagline ?? ""}
            onCommit={(v) => commitField({ tagline: v })}
            placeholder="What this is, in one breath — who it's for, what it does."
            className="block max-w-[640px] text-[17px] leading-[1.45] text-white/80"
            style={{ ...SERIF_ITALIC, fontWeight: 300 }}
            ariaLabel="Edit tagline"
          />
        </div>

        <div className="grid max-w-[760px] grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
          <EditableMiniFact
            label="PROBLEM"
            value={p.problem ?? ""}
            placeholder="What was broken before — in your voice, one or two lines."
            onCommit={(v) => commitField({ problem: v })}
            ariaLabel="Edit problem"
          />
          <EditableMiniFact
            label="HOW WE SOLVE IT"
            value={p.value ?? ""}
            placeholder="What this product actually does, plainly."
            onCommit={(v) => commitField({ value: v })}
            ariaLabel="Edit how we solve it"
          />
          <EditableMiniFact
            label="WHO WE SOLVE IT FOR"
            value={p.users ?? ""}
            placeholder="Who this is for — one sentence."
            onCommit={(v) => commitField({ users: v })}
            ariaLabel="Edit who we solve it for"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {p.techStack.map((t) => (
            <TechChipEditable key={t} project={p} tech={t} />
          ))}
          <TechChipAdd project={p} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <LinkButton project={p} linkKey="liveUrl" variant="primary" />
            <div
              className="inline-flex items-center gap-1 rounded-full px-1 py-1"
              style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
            >
              <LinkButton project={p} linkKey="githubUrl" variant="icon" />
              <LinkButton project={p} linkKey="figmaUrl" variant="icon" />
              <LinkButton project={p} linkKey="loomUrl" variant="icon" />
              <LinkButton project={p} linkKey="prdUrl" variant="icon" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex items-center gap-1 rounded-full px-1.5 py-1"
              style={{
                border: `1px solid ${HAIRLINE_FAINT}`,
                background: "rgba(167,139,250,0.04)",
              }}
              aria-label="Admin row controls"
            >
              <button
                type="button"
                onClick={() => void move(-1)}
                disabled={isFirst}
                className="rounded-full px-2 py-0.5 text-[11px] text-white/65 disabled:opacity-30 hover:text-white"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => void move(1)}
                disabled={isLast}
                className="rounded-full px-2 py-0.5 text-[11px] text-white/65 disabled:opacity-30 hover:text-white"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => void toggleFeatured()}
                className={`rounded-full px-2 py-0.5 text-[11px] ${p.featured ? "text-amber-300" : "text-white/45 hover:text-white"}`}
                aria-label={p.featured ? "Unfeature" : "Feature"}
                aria-pressed={p.featured}
                title={p.featured ? "Featured" : "Not featured"}
              >
                ★
              </button>
              <Link
                href={`/admin/edit?tab=projects&id=${p._id}`}
                className="rounded-full px-2 py-0.5 text-[11px] text-white/65 hover:text-white"
                aria-label="Open full editor"
                title="Open full editor"
              >
                ↗
              </Link>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="rounded-full px-2 py-0.5 text-[11px] text-red-400/75 hover:text-red-400"
                aria-label="Delete project"
                title="Delete"
              >
                🗑
              </button>
            </div>

            <Link
              href={`/projects/${p.slug}`}
              className="text-[13px] text-white/55 hover:text-white"
              aria-label={`Open ${p.title} case study`}
            >
              Read case →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
