"use client";

/**
 * EditableProjectRow — admin-only variant of IndexRow rendered inside
 * ProjectsSection when `useAdmin().isEditing` is true. Mirrors the read-only
 * row's visual rhythm so the page does not jump between modes, then layers
 * inline-edit affordances on top:
 *
 *   • Title / outcome / year / role / problem — InlineEditable (click to edit)
 *   • Tech chips — chip ×, plus a "+ Add" inline input
 *   • Action chips (LIVE/CODE/FIGMA/LOOM) — click to edit URL; blank clears it
 *   • Thumbnail — hover reveals "Replace" → hits api.projects.generateUploadUrl
 *   • Right-column toolbar — ↑ ↓ · ★ Featured · 🗑 Delete · Edit ↗ deep-link
 *
 * Every commit dispatches api.projects.upsert with the full row (slug/order/
 * required fields included) because the mutation is upsert-shaped, not patch-
 * shaped. Convex reactively refreshes the list so optimistic state is not
 * needed.
 *
 * All structural mutations (reorder, delete, featured-toggle, image-upload)
 * are guarded by `requireAdmin` server-side. The component itself trusts that
 * the parent only renders it for admins, so it does not double-gate.
 */

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { InlineEditable } from "@/components/admin/InlineEditable";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SERIF_ITALIC: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  fontStyle: "italic",
  fontWeight: 300,
};

const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Project = Doc<"projects">;
type ActionKey = "liveUrl" | "githubUrl" | "figmaUrl" | "loomUrl";

const ACTION_LABELS: Record<ActionKey, string> = {
  liveUrl: "LIVE",
  githubUrl: "CODE",
  figmaUrl: "FIGMA",
  loomUrl: "LOOM",
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
    liveUrl: merged.liveUrl || undefined,
    githubUrl: merged.githubUrl || undefined,
    figmaUrl: merged.figmaUrl || undefined,
    loomUrl: merged.loomUrl || undefined,
    techStack: merged.techStack,
    heroImageStorageId: merged.heroImageStorageId,
    heroImageAlt: merged.heroImageAlt || undefined,
    problem: merged.problem,
    users: merged.users,
    value: merged.value,
    goal: merged.goal || undefined,
    approach: merged.approach || undefined,
    outcomeNarrative: merged.outcomeNarrative || undefined,
    heroMetricValue: merged.heroMetricValue || undefined,
    heroMetricLabel: merged.heroMetricLabel || undefined,
  };
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
      className="group/thumb relative aspect-[88/56] w-[88px] overflow-hidden rounded-md"
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
        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 text-[9px] text-white opacity-0 transition group-hover/thumb:opacity-100"
        style={{ ...MONO, letterSpacing: "0.18em" }}
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

function ActionChipEditable({
  project,
  actionKey,
}: {
  project: Project;
  actionKey: ActionKey;
}) {
  const upsert = useMutation(api.projects.upsert);
  const url = project[actionKey] ?? "";
  const label = ACTION_LABELS[actionKey];
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
      await upsert(buildArgs(project, { [actionKey]: trimmed || undefined } as Partial<Project>));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-[10px] text-white/55" style={{ ...MONO, letterSpacing: "0.16em" }}>
          {label}
        </span>
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
          className="w-[180px] rounded-full border border-violet-400/40 bg-black/40 px-2 py-[2px] text-[10px] text-white outline-none"
        />
        {error && <span className="text-[10px] text-red-400">{error}</span>}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(url);
        setEditing(true);
      }}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[10px] transition hover:bg-white/5 ${url ? "text-white/75" : "text-white/35 italic"}`}
      style={{ ...MONO, letterSpacing: "0.16em", border: `1px solid ${HAIRLINE_FAINT}` }}
      aria-label={`Edit ${label} URL`}
    >
      {url ? `${label} ✎` : `+ ${label}`}
    </button>
  );
}

function isValidUrl(u: string): boolean {
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

function TechChipEditable({
  project,
  tech,
}: {
  project: Project;
  tech: string;
}) {
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
      className="grid grid-cols-[36px_88px_minmax(0,1fr)_auto] items-start gap-x-6 gap-y-2 border-t py-7"
      style={{ borderColor: HAIRLINE_FAINT }}
    >
      <div className="pt-[6px] text-[18px] text-white/40 tabular-nums" style={SERIF_ITALIC}>
        {String(index + 1).padStart(2, "0")}
      </div>

      <EditableThumbnail project={p} />

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <InlineEditable
            value={titleLine}
            onCommit={(v) =>
              // The visible title line is "outcome ?? title". Edits here patch
              // outcome when one already exists; otherwise patch title so the
              // base name updates. Matches what admins expect when clicking
              // the headline.
              commitField(p.outcome ? { outcome: v } : { title: v })
            }
            className="text-[clamp(20px,2.4vw,28px)] leading-tight text-white"
            style={{
              fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
            }}
            ariaLabel="Edit project headline"
          />
          <InlineEditable
            value={p.year}
            onCommit={(v) => commitField({ year: v })}
            className="text-[11px] tabular-nums text-white/55"
            style={{ ...MONO, letterSpacing: "0.18em" }}
            ariaLabel="Edit year"
          />
          <span className="text-[10.5px] text-white/40" style={{ ...MONO }}>·</span>
          <InlineEditable
            value={p.role ?? ""}
            onCommit={(v) => commitField({ role: v })}
            placeholder="role"
            className="text-[10.5px] text-white/55"
            style={{ ...MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
            ariaLabel="Edit role"
          />
        </div>
        <InlineEditable
          value={p.problem ?? ""}
          onCommit={(v) => commitField({ problem: v })}
          multiline
          placeholder="One-liner problem statement"
          className="block max-w-[680px] text-[14px] leading-[1.5] font-light text-white/75"
          ariaLabel="Edit problem one-liner"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {p.techStack.map((t) => (
            <TechChipEditable key={t} project={p} tech={t} />
          ))}
          <TechChipAdd project={p} />
        </div>
      </div>

      <div className="flex flex-col items-end gap-3 pt-[6px]">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <ActionChipEditable project={p} actionKey="liveUrl" />
          <ActionChipEditable project={p} actionKey="githubUrl" />
          <ActionChipEditable project={p} actionKey="figmaUrl" />
          <ActionChipEditable project={p} actionKey="loomUrl" />
        </div>

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
          className="text-[14px] text-white/55 hover:text-white"
          aria-label={`Open ${p.title} detail page`}
        >
          Read case →
        </Link>
      </div>
    </div>
  );
}
