"use client";

/**
 * AdminEditorProjects — Projects tab. CRUD + reorder + hero upload.
 *
 * Mirrors AdminEditorRoles' structure:
 *   • Left rail = list, with ↑/↓ reorder, + New, delete.
 *   • Right panel = form for selected row, save on explicit click.
 *
 * Slug is auto-generated from title and editable behind a toggle.
 * URLs are validated with new URL() before save.
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { slugify } from "@/lib/projects/slugify";
import { HeroImageUploader } from "./HeroImageUploader";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Project = Doc<"projects">;

type Draft = {
  slug: string;
  featured: boolean;
  title: string;
  outcome: string;
  year: string;
  role: string;
  tagline: string;
  liveUrl: string;
  githubUrl: string;
  figmaUrl: string;
  loomUrl: string;
  prdUrl: string;
  techStack: string[];
  heroImageStorageId: Id<"_storage"> | undefined;
  heroImageAlt: string;
  problem: string;
  users: string;
  value: string;
  goal: string;
  approach: string;
  outcomeNarrative: string;
  learnings: string;
  heroMetricValue: string;
  heroMetricLabel: string;
};

function toDraft(p: Project): Draft {
  return {
    slug: p.slug,
    featured: p.featured,
    title: p.title,
    outcome: p.outcome ?? "",
    year: p.year,
    role: p.role ?? "",
    tagline: p.tagline ?? "",
    liveUrl: p.liveUrl ?? "",
    githubUrl: p.githubUrl ?? "",
    figmaUrl: p.figmaUrl ?? "",
    loomUrl: p.loomUrl ?? "",
    prdUrl: p.prdUrl ?? "",
    techStack: [...p.techStack],
    heroImageStorageId: p.heroImageStorageId,
    heroImageAlt: p.heroImageAlt ?? "",
    problem: p.problem,
    users: p.users,
    value: p.value,
    goal: p.goal ?? "",
    approach: p.approach ?? "",
    outcomeNarrative: p.outcomeNarrative ?? "",
    learnings: p.learnings ?? "",
    heroMetricValue: p.heroMetricValue ?? "",
    heroMetricLabel: p.heroMetricLabel ?? "",
  };
}

function isDirty(d: Draft, p: Project): boolean {
  return (
    d.slug !== p.slug ||
    d.featured !== p.featured ||
    d.title !== p.title ||
    d.outcome !== (p.outcome ?? "") ||
    d.year !== p.year ||
    d.role !== (p.role ?? "") ||
    d.tagline !== (p.tagline ?? "") ||
    d.liveUrl !== (p.liveUrl ?? "") ||
    d.githubUrl !== (p.githubUrl ?? "") ||
    d.figmaUrl !== (p.figmaUrl ?? "") ||
    d.loomUrl !== (p.loomUrl ?? "") ||
    d.prdUrl !== (p.prdUrl ?? "") ||
    JSON.stringify(d.techStack) !== JSON.stringify(p.techStack) ||
    d.heroImageStorageId !== p.heroImageStorageId ||
    d.heroImageAlt !== (p.heroImageAlt ?? "") ||
    d.problem !== p.problem ||
    d.users !== p.users ||
    d.value !== p.value ||
    d.goal !== (p.goal ?? "") ||
    d.approach !== (p.approach ?? "") ||
    d.outcomeNarrative !== (p.outcomeNarrative ?? "") ||
    d.learnings !== (p.learnings ?? "") ||
    d.heroMetricValue !== (p.heroMetricValue ?? "") ||
    d.heroMetricLabel !== (p.heroMetricLabel ?? "")
  );
}

function isValidUrl(u: string): boolean {
  if (!u) return true;
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

export function AdminEditorProjects() {
  const projects = useQuery(api.projects.list);
  const upsert = useMutation(api.projects.upsert);
  const remove = useMutation(api.projects.remove);
  const reorder = useMutation(api.projects.reorder);
  const params = useSearchParams();
  const requestedId = params.get("id");

  const [selectedId, setSelectedId] = useState<Id<"projects"> | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingSlug, setEditingSlug] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didApplyDeepLink, setDidApplyDeepLink] = useState(false);

  const selected = useMemo(
    () => projects?.find((p) => p._id === selectedId) ?? null,
    [projects, selectedId],
  );

  // Deep-link: pre-select project from ?id=<projectId> when admin lands here
  // from the homepage "Edit ↗" pencil. Runs once after projects load.
  useEffect(() => {
    if (didApplyDeepLink) return;
    if (!projects || !requestedId) return;
    const hit = projects.find((p) => p._id === (requestedId as Id<"projects">));
    if (hit) {
      setSelectedId(hit._id);
      setDraft(toDraft(hit));
      setEditingSlug(false);
      setError(null);
    }
    setDidApplyDeepLink(true);
  }, [projects, requestedId, didApplyDeepLink]);

  function select(p: Project) {
    setSelectedId(p._id);
    setDraft(toDraft(p));
    setEditingSlug(false);
    setError(null);
  }

  async function handleNew() {
    if (!projects) return;
    const order = projects.length;
    const slug = `untitled-${order}`;
    const id = await upsert({
      slug,
      order,
      featured: false,
      title: "Untitled",
      year: String(new Date().getFullYear()),
      techStack: [],
      problem: "",
      users: "",
      value: "",
    });
    setSelectedId(id);
  }

  async function handleSave() {
    if (!draft || !selected) return;
    setError(null);

    for (const [name, url] of [
      ["liveUrl", draft.liveUrl],
      ["githubUrl", draft.githubUrl],
      ["figmaUrl", draft.figmaUrl],
      ["loomUrl", draft.loomUrl],
      ["prdUrl", draft.prdUrl],
    ] as const) {
      if (!isValidUrl(url)) {
        setError(`${name} is not a valid URL`);
        return;
      }
    }

    setSaving(true);
    try {
      await upsert({
        id: selected._id,
        slug: draft.slug,
        order: selected.order,
        featured: draft.featured,
        title: draft.title,
        outcome: draft.outcome || undefined,
        year: draft.year,
        role: draft.role || undefined,
        tagline: draft.tagline || undefined,
        liveUrl: draft.liveUrl || undefined,
        githubUrl: draft.githubUrl || undefined,
        figmaUrl: draft.figmaUrl || undefined,
        loomUrl: draft.loomUrl || undefined,
        prdUrl: draft.prdUrl || undefined,
        techStack: draft.techStack,
        heroImageStorageId: draft.heroImageStorageId,
        heroImageAlt: draft.heroImageAlt || undefined,
        problem: draft.problem,
        users: draft.users,
        value: draft.value,
        goal: draft.goal || undefined,
        approach: draft.approach || undefined,
        outcomeNarrative: draft.outcomeNarrative || undefined,
        learnings: draft.learnings || undefined,
        heroMetricValue: draft.heroMetricValue || undefined,
        heroMetricLabel: draft.heroMetricLabel || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Project) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    await remove({ id: p._id });
    if (selectedId === p._id) {
      setSelectedId(null);
      setDraft(null);
    }
  }

  async function handleReorder(p: Project, dir: -1 | 1) {
    if (!projects) return;
    const i = projects.findIndex((x) => x._id === p._id);
    const j = i + dir;
    if (j < 0 || j >= projects.length) return;
    const next = [...projects];
    [next[i], next[j]] = [next[j], next[i]];
    await reorder({ orderedIds: next.map((x) => x._id) });
  }

  function addTech() {
    if (!draft) return;
    const t = techInput.trim();
    if (!t) return;
    if (draft.techStack.includes(t)) {
      setTechInput("");
      return;
    }
    if (draft.techStack.length >= 12) return;
    setDraft({ ...draft, techStack: [...draft.techStack, t] });
    setTechInput("");
  }

  if (projects === undefined) return null;

  const dirty = selected && draft ? isDirty(draft, selected) : false;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[320px_1fr]">
      {/* Left rail */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleNew}
          className="w-full rounded-md border border-white/15 px-3 py-2 text-left text-[12px] text-white hover:bg-white/5"
          style={MONO}
        >
          + New project
        </button>
        {projects.map((p, i) => (
          <div
            key={p._id}
            className={`flex items-center gap-2 rounded-md px-2 py-2 ${
              selectedId === p._id ? "bg-white/5" : ""
            }`}
            style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
          >
            <button
              type="button"
              onClick={() => select(p)}
              className="flex-1 text-left text-[12px] text-white"
            >
              <div className="flex items-center gap-2">
                <span>{p.title}</span>
                {p.featured && (
                  <span
                    className="rounded-full px-1.5 py-[1px] text-[9px] text-emerald-300"
                    style={{
                      ...MONO,
                      letterSpacing: "0.12em",
                      border: "1px solid rgba(110,231,183,0.3)",
                    }}
                  >
                    FEATURED
                  </span>
                )}
              </div>
              <div
                className="text-[10px] text-white/45"
                style={{ ...MONO, letterSpacing: "0.18em" }}
              >
                {p.year}
              </div>
            </button>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => handleReorder(p, -1)}
                className="text-[11px] text-white/55 disabled:opacity-30"
              >
                &uarr;
              </button>
              <button
                type="button"
                disabled={i === projects.length - 1}
                onClick={() => handleReorder(p, 1)}
                className="text-[11px] text-white/55 disabled:opacity-30"
              >
                &darr;
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(p)}
              className="text-[11px] text-red-400/70 hover:text-red-400"
              aria-label="Delete"
            >
              &#x2715;
            </button>
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div>
        {!draft || !selected ? (
          <p className="text-[13px] text-white/55">
            Select a project on the left, or create a new one.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Identity */}
            <Section label="Identity">
              <Field label="Slug">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draft.slug}
                    disabled={!editingSlug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                    className="flex-1 rounded-md border border-white/15 bg-transparent px-3 py-2 text-[13px] text-white disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editingSlug) {
                        setEditingSlug(false);
                      } else {
                        setDraft({ ...draft, slug: slugify(draft.title) });
                        setEditingSlug(true);
                      }
                    }}
                    className="rounded-md border border-white/15 px-2.5 py-1 text-[11px] text-white/75"
                  >
                    {editingSlug ? "Lock" : "Edit"}
                  </button>
                </div>
              </Field>
              <label className="flex items-center gap-2 text-[12px] text-white/80">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                />
                Featured on homepage
              </label>
            </Section>

            {/* Header copy */}
            <Section label="Header copy">
              <Field label="Title">
                <Input value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
              </Field>
              <Field label="Outcome (optional)" hint="Leads on cards when set. Leave blank for hobby projects.">
                <Input value={draft.outcome} onChange={(v) => setDraft({ ...draft, outcome: v })} />
              </Field>
              <Field label="Tagline" hint="One-breath pitch — what this is and who it's for. Shows under the title on the homepage and as the standfirst on the case-study page.">
                <Input value={draft.tagline} onChange={(v) => setDraft({ ...draft, tagline: v })} />
              </Field>
              <Field label="Year">
                <Input value={draft.year} onChange={(v) => setDraft({ ...draft, year: v })} />
              </Field>
              <Field label="Role (optional)">
                <Input value={draft.role} onChange={(v) => setDraft({ ...draft, role: v })} />
              </Field>
            </Section>

            {/* Links */}
            <Section label="Links">
              <Field label="Live URL">
                <Input value={draft.liveUrl} onChange={(v) => setDraft({ ...draft, liveUrl: v })} />
              </Field>
              <Field label="GitHub URL">
                <Input value={draft.githubUrl} onChange={(v) => setDraft({ ...draft, githubUrl: v })} />
              </Field>
              <Field label="Figma URL">
                <Input value={draft.figmaUrl} onChange={(v) => setDraft({ ...draft, figmaUrl: v })} />
              </Field>
              <Field label="Loom URL" hint="Walkthrough or demo video">
                <Input value={draft.loomUrl} onChange={(v) => setDraft({ ...draft, loomUrl: v })} />
              </Field>
              <Field label="PRD URL" hint="Spec / PRD doc — Notion, Google Doc, Confluence.">
                <Input value={draft.prdUrl} onChange={(v) => setDraft({ ...draft, prdUrl: v })} />
              </Field>
            </Section>

            {/* Tech stack */}
            <Section label="Tech stack">
              <div className="flex flex-wrap gap-1.5">
                {draft.techStack.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11px] text-white/80"
                    style={{ border: `1px solid ${HAIRLINE_FAINT}`, ...MONO }}
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          techStack: draft.techStack.filter((x) => x !== t),
                        })
                      }
                      className="text-white/45 hover:text-white"
                      aria-label={`Remove ${t}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTech();
                    }
                  }}
                  placeholder="Add chip, press Enter"
                  className="flex-1 rounded-md border border-white/15 bg-transparent px-3 py-2 text-[13px] text-white"
                />
                <button
                  type="button"
                  onClick={addTech}
                  className="rounded-md border border-white/15 px-3 py-2 text-[12px] text-white/80"
                >
                  Add
                </button>
              </div>
            </Section>

            {/* Hero image */}
            <Section label="Hero image">
              <HeroImageUploader
                storageId={draft.heroImageStorageId}
                onUploaded={(id) => setDraft({ ...draft, heroImageStorageId: id })}
              />
              <Field label="Alt text">
                <Input
                  value={draft.heroImageAlt}
                  onChange={(v) => setDraft({ ...draft, heroImageAlt: v })}
                />
              </Field>
            </Section>

            {/* Fact sheet */}
            <Section label="Fact sheet">
              <Field label="Problem">
                <Textarea
                  rows={6}
                  value={draft.problem}
                  onChange={(v) => setDraft({ ...draft, problem: v })}
                />
              </Field>
              <Field label="Goal" hint="What you set out to achieve. Renders alongside the other fact blocks on the detail page.">
                <Textarea
                  rows={4}
                  value={draft.goal}
                  onChange={(v) => setDraft({ ...draft, goal: v })}
                />
              </Field>
              <Field label="How we solve it" hint="The 'value' field — labelled as 'How we solve it' on the case-study page.">
                <Textarea
                  rows={6}
                  value={draft.value}
                  onChange={(v) => setDraft({ ...draft, value: v })}
                />
              </Field>
              <Field label="Who we solve it for" hint="The 'users' field — labelled as 'Who we solve it for' on the case-study page.">
                <Textarea
                  rows={6}
                  value={draft.users}
                  onChange={(v) => setDraft({ ...draft, users: v })}
                />
              </Field>
            </Section>

            {/* Case-study narrative */}
            <Section
              label="Case-study narrative (optional)"
              hint="Leave all four blank for hobby projects — the detail page hides this section automatically."
            >
              <Field label="Approach">
                <Textarea
                  rows={8}
                  value={draft.approach}
                  onChange={(v) => setDraft({ ...draft, approach: v })}
                />
              </Field>
              <Field label="Outcome narrative">
                <Textarea
                  rows={8}
                  value={draft.outcomeNarrative}
                  onChange={(v) => setDraft({ ...draft, outcomeNarrative: v })}
                />
              </Field>
              <Field label="Hero metric value">
                <Input
                  value={draft.heroMetricValue}
                  onChange={(v) => setDraft({ ...draft, heroMetricValue: v })}
                />
              </Field>
              <Field label="Hero metric label">
                <Input
                  value={draft.heroMetricLabel}
                  onChange={(v) => setDraft({ ...draft, heroMetricLabel: v })}
                />
              </Field>
            </Section>

            {/* Reflection */}
            <Section
              label="What I learned"
              hint="A short reflection — surprises, trade-offs, what you'd do differently. Renders as its own block on the case-study page. Leave blank to hide."
            >
              <Field label="Learnings">
                <Textarea
                  rows={6}
                  value={draft.learnings}
                  onChange={(v) => setDraft({ ...draft, learnings: v })}
                />
              </Field>
            </Section>

            {error && (
              <div className="text-[12px] text-red-400">{error}</div>
            )}

            <div className="sticky bottom-4 flex justify-end">
              <button
                type="button"
                disabled={!dirty || saving}
                onClick={handleSave}
                className="rounded-full bg-white px-5 py-2 text-[13px] font-medium text-black disabled:opacity-40"
              >
                {saving ? "Saving\u2026" : dirty ? "Save changes" : "Saved"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <div
          className="text-[10px] text-white/45"
          style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
        >
          {label}
        </div>
        <div aria-hidden className="mt-1 h-px w-full" style={{ background: HAIRLINE_FAINT }} />
        {hint && <p className="mt-2 text-[11px] text-white/55">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[10px] text-white/55"
        style={{ ...MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
      >
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-white/45">{hint}</span>}
    </label>
  );
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-white/15 bg-transparent px-3 py-2 text-[13px] text-white"
    />
  );
}

function Textarea({
  rows,
  value,
  onChange,
}: {
  rows: number;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-white/15 bg-transparent px-3 py-2 text-[13px] leading-relaxed text-white"
    />
  );
}
