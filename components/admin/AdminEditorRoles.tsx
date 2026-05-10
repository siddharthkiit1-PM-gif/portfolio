"use client";

/**
 * AdminEditorRoles — Experience tab.
 *
 * Edit-in-place rows for the experienceRoles collection. Each row holds
 * its own draft state so an admin can edit several fields and then save
 * with one explicit click — auto-save-on-blur fires too eagerly when
 * tabbing between fields and produces noisy mutation traffic.
 *
 * Reorder calls experienceRoles.reorder({ orderedIds }) with the entire
 * new list rather than swapping one pair, matching the mutation shape
 * already in convex/experienceRoles.ts.
 *
 * "Add role" inserts a blank row at the end (order = current length).
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { RolePillar } from "@/lib/defaults/experienceRoles";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Role = Doc<"experienceRoles">;

type Draft = {
  dates: string;
  company: string;
  title: string;
  location: string;
  metric: string;
  outcome: string;
  pillars: RolePillar[];
};

function toDraft(r: Role): Draft {
  return {
    dates: r.dates,
    company: r.company,
    title: r.title,
    location: r.location ?? "",
    metric: r.metric,
    outcome: r.outcome ?? "",
    pillars: (r.pillars ?? []).map((p) => ({
      label: p.label,
      bullets: p.bullets.map((b) => ({
        text: b.text,
        metric: b.metric,
      })),
    })),
  };
}

function isDirty(draft: Draft, role: Role): boolean {
  return (
    draft.dates !== role.dates ||
    draft.company !== role.company ||
    draft.title !== role.title ||
    (draft.location ?? "") !== (role.location ?? "") ||
    draft.metric !== role.metric ||
    (draft.outcome ?? "") !== (role.outcome ?? "") ||
    JSON.stringify(draft.pillars) !== JSON.stringify(role.pillars ?? [])
  );
}

export function AdminEditorRoles() {
  const rows = useQuery(api.experienceRoles.list, {});
  const upsert = useMutation(api.experienceRoles.upsert);
  const remove = useMutation(api.experienceRoles.remove);
  const reorder = useMutation(api.experienceRoles.reorder);

  const [actionError, setActionError] = useState<string | null>(null);
  const [reordering, setReordering] = useState<boolean>(false);

  if (rows === undefined) {
    return (
      <p
        className="text-[11px] text-white/45"
        style={{ ...MONO, letterSpacing: "0.16em", textTransform: "uppercase" }}
      >
        Loading…
      </p>
    );
  }

  async function onAdd() {
    if (!rows) return;
    try {
      await upsert({
        order: rows.length,
        dates: "",
        company: "",
        title: "",
        metric: "",
      });
      setActionError(null);
    } catch (err) {
      setActionError(
        `Action failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async function onMove(index: number, direction: -1 | 1) {
    if (!rows) return;
    const next = rows.slice();
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setReordering(true);
    try {
      await reorder({ orderedIds: next.map((r) => r._id) });
      setActionError(null);
    } catch (err) {
      setActionError(
        `Action failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setReordering(false);
    }
  }

  async function onDelete(id: Id<"experienceRoles">) {
    if (!window.confirm("Delete this role? This cannot be undone.")) return;
    try {
      await remove({ id });
      setActionError(null);
    } catch (err) {
      setActionError(
        `Action failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async function onSave(role: Role, draft: Draft) {
    const trimmedLocation = draft.location.trim();
    await upsert({
      id: role._id,
      order: role.order,
      dates: draft.dates,
      company: draft.company,
      title: draft.title,
      metric: draft.metric,
      outcome: draft.outcome.trim() ? draft.outcome.trim() : undefined,
      location: trimmedLocation ? trimmedLocation : undefined,
      pillars: draft.pillars.length > 0 ? draft.pillars : undefined,
    });
  }

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-3">
      {actionError && (
        <p className="text-[12px] text-red-400" role="alert">
          {actionError}
        </p>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-white/45">No roles yet — add the first one.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((role, i) => (
            <RoleRow
              key={role._id}
              role={role}
              isFirst={i === 0}
              isLast={i === rows.length - 1}
              reordering={reordering}
              onSave={(draft) => onSave(role, draft)}
              onDelete={() => onDelete(role._id)}
              onMoveUp={() => onMove(i, -1)}
              onMoveDown={() => onMove(i, 1)}
            />
          ))}
        </ul>
      )}

      <div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full px-4 py-2 text-[12px] text-white transition hover:bg-white/10"
          style={{
            ...MONO,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${HAIRLINE_FAINT}`,
          }}
        >
          + Add role
        </button>
      </div>
    </div>
  );
}

function RoleRow(props: {
  role: Role;
  isFirst: boolean;
  isLast: boolean;
  reordering: boolean;
  onSave: (draft: Draft) => Promise<void>;
  onDelete: () => Promise<void>;
  onMoveUp: () => Promise<void>;
  onMoveDown: () => Promise<void>;
}) {
  const { role } = props;
  // The parent re-keys this component whenever the underlying row's
  // editable identity changes (see RoleRow's `key` prop), so the lazy
  // initializer re-runs and we don't need an effect to resync the draft
  // — that pattern would also fire on every reorder, which is noise.
  const [draft, setDraft] = useState<Draft>(() => toDraft(role));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const dirty = isDirty(draft, role);

  async function save() {
    setStatus("saving");
    try {
      await props.onSave(draft);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <li
      className="rounded-xl p-4"
      style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[120px_1fr_1fr_1fr]">
        <RoleField
          label="Dates"
          value={draft.dates}
          onChange={(v) => setDraft({ ...draft, dates: v })}
        />
        <RoleField
          label="Company"
          value={draft.company}
          onChange={(v) => setDraft({ ...draft, company: v })}
        />
        <RoleField
          label="Title"
          value={draft.title}
          onChange={(v) => setDraft({ ...draft, title: v })}
        />
        <RoleField
          label="Metric"
          value={draft.metric}
          onChange={(v) => setDraft({ ...draft, metric: v })}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
        <RoleField
          label="Location (optional)"
          value={draft.location}
          onChange={(v) => setDraft({ ...draft, location: v })}
        />
        <RoleField
          label="Outcome (optional)"
          value={draft.outcome}
          onChange={(v) => setDraft({ ...draft, outcome: v })}
          textarea
        />
      </div>

      <PillarEditor
        pillars={draft.pillars}
        onChange={(next) => setDraft({ ...draft, pillars: next })}
      />


      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={props.onMoveUp}
          disabled={props.isFirst || props.reordering}
          aria-label="Move up"
          className="rounded-full px-2.5 py-1 text-[12px] text-white/80 transition hover:bg-white/10 disabled:opacity-30"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${HAIRLINE_FAINT}`,
          }}
        >
          ↑
        </button>
        <button
          type="button"
          onClick={props.onMoveDown}
          disabled={props.isLast || props.reordering}
          aria-label="Move down"
          className="rounded-full px-2.5 py-1 text-[12px] text-white/80 transition hover:bg-white/10 disabled:opacity-30"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${HAIRLINE_FAINT}`,
          }}
        >
          ↓
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || status === "saving"}
          className="rounded-full px-3 py-1 text-[11px] text-black transition disabled:opacity-40"
          style={{
            ...MONO,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            background: "white",
          }}
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {status === "saved" && (
          <span
            className="text-[10px]"
            style={{
              ...MONO,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgb(110,231,183)",
            }}
          >
            Saved
          </span>
        )}
        {status === "error" && (
          <span className="text-[12px] text-red-400">Save failed</span>
        )}
        <span className="flex-1" />
        <button
          type="button"
          onClick={props.onDelete}
          aria-label="Delete role"
          className="rounded-full px-2.5 py-1 text-[12px] text-red-300 transition hover:bg-red-500/10"
          style={{
            background: "rgba(248,113,113,0.06)",
            border: "1px solid rgba(248,113,113,0.24)",
          }}
        >
          ✕
        </button>
      </div>
    </li>
  );
}

function PillarEditor(props: {
  pillars: RolePillar[];
  onChange: (next: RolePillar[]) => void;
}) {
  const { pillars, onChange } = props;

  function addPillar() {
    onChange([...pillars, { label: "", bullets: [] }]);
  }

  function removePillar(pi: number) {
    onChange(pillars.filter((_, i) => i !== pi));
  }

  function movePillar(pi: number, direction: -1 | 1) {
    const target = pi + direction;
    if (target < 0 || target >= pillars.length) return;
    const next = pillars.slice();
    [next[pi], next[target]] = [next[target], next[pi]];
    onChange(next);
  }

  function updatePillarLabel(pi: number, label: string) {
    onChange(
      pillars.map((p, i) => (i === pi ? { ...p, label } : p)),
    );
  }

  function addBullet(pi: number) {
    onChange(
      pillars.map((p, i) =>
        i === pi ? { ...p, bullets: [...p.bullets, { text: "" }] } : p,
      ),
    );
  }

  function removeBullet(pi: number, bi: number) {
    onChange(
      pillars.map((p, i) =>
        i === pi
          ? { ...p, bullets: p.bullets.filter((_, j) => j !== bi) }
          : p,
      ),
    );
  }

  function moveBullet(pi: number, bi: number, direction: -1 | 1) {
    const pillar = pillars[pi];
    if (!pillar) return;
    const target = bi + direction;
    if (target < 0 || target >= pillar.bullets.length) return;
    const nextBullets = pillar.bullets.slice();
    [nextBullets[bi], nextBullets[target]] = [
      nextBullets[target],
      nextBullets[bi],
    ];
    onChange(
      pillars.map((p, i) => (i === pi ? { ...p, bullets: nextBullets } : p)),
    );
  }

  function updateBulletText(pi: number, bi: number, text: string) {
    onChange(
      pillars.map((p, i) =>
        i === pi
          ? {
              ...p,
              bullets: p.bullets.map((b, j) =>
                j === bi ? { ...b, text } : b,
              ),
            }
          : p,
      ),
    );
  }

  function updateBulletMetric(pi: number, bi: number, metric: string) {
    const normalized = metric === "" ? undefined : metric;
    onChange(
      pillars.map((p, i) =>
        i === pi
          ? {
              ...p,
              bullets: p.bullets.map((b, j) =>
                j === bi ? { ...b, metric: normalized } : b,
              ),
            }
          : p,
      ),
    );
  }

  const pillButton: React.CSSProperties = {
    ...MONO,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${HAIRLINE_FAINT}`,
  };

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${HAIRLINE_FAINT}`,
  };

  return (
    <details className="mt-4">
      <summary
        className="cursor-pointer text-[11px] text-white/70"
        style={{
          ...MONO,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        Pillars ({pillars.length})
      </summary>
      <div className="mt-3 flex flex-col gap-4">
        {pillars.map((p, pi) => (
          <div
            key={pi}
            className="rounded-lg p-3"
            style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
          >
            <input
              type="text"
              value={p.label}
              onChange={(e) => updatePillarLabel(pi, e.target.value)}
              className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white placeholder-white/35 focus:outline-none"
              style={inputStyle}
              placeholder="Pillar label, e.g. Revenue & Growth"
            />
            <ul className="mt-3 flex flex-col gap-3">
              {p.bullets.map((b, bi) => (
                <li key={bi} className="flex flex-col gap-1.5">
                  <textarea
                    value={b.text}
                    onChange={(e) =>
                      updateBulletText(pi, bi, e.target.value)
                    }
                    rows={2}
                    className="w-full resize-y rounded-md bg-white/5 px-3 py-2 text-sm text-white placeholder-white/35 focus:outline-none"
                    style={inputStyle}
                    placeholder="Bullet text"
                  />
                  <input
                    type="text"
                    value={b.metric ?? ""}
                    onChange={(e) =>
                      updateBulletMetric(pi, bi, e.target.value)
                    }
                    className="w-1/2 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white placeholder-white/35 focus:outline-none"
                    style={inputStyle}
                    placeholder="Inline metric (optional, e.g. +18%)"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveBullet(pi, bi, -1)}
                      disabled={bi === 0}
                      aria-label="Move bullet up"
                      className="rounded-full px-2 py-0.5 text-[11px] text-white/80 transition hover:bg-white/10 disabled:opacity-30"
                      style={pillButton}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBullet(pi, bi, +1)}
                      disabled={bi === p.bullets.length - 1}
                      aria-label="Move bullet down"
                      className="rounded-full px-2 py-0.5 text-[11px] text-white/80 transition hover:bg-white/10 disabled:opacity-30"
                      style={pillButton}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBullet(pi, bi)}
                      className="rounded-full px-2 py-0.5 text-[11px] text-red-300 transition hover:bg-red-500/10"
                      style={{
                        ...MONO,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        background: "rgba(248,113,113,0.06)",
                        border: "1px solid rgba(248,113,113,0.24)",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => addBullet(pi)}
                className="rounded-full px-2.5 py-1 text-[11px] text-white/80 transition hover:bg-white/10"
                style={pillButton}
              >
                + Add bullet
              </button>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => movePillar(pi, -1)}
                disabled={pi === 0}
                aria-label="Move pillar up"
                className="rounded-full px-2 py-1 text-[11px] text-white/80 transition hover:bg-white/10 disabled:opacity-30"
                style={pillButton}
              >
                ↑ Pillar
              </button>
              <button
                type="button"
                onClick={() => movePillar(pi, +1)}
                disabled={pi === pillars.length - 1}
                aria-label="Move pillar down"
                className="rounded-full px-2 py-1 text-[11px] text-white/80 transition hover:bg-white/10 disabled:opacity-30"
                style={pillButton}
              >
                ↓ Pillar
              </button>
              <button
                type="button"
                onClick={() => removePillar(pi)}
                className="rounded-full px-2.5 py-1 text-[11px] text-red-300 transition hover:bg-red-500/10"
                style={{
                  ...MONO,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  background: "rgba(248,113,113,0.06)",
                  border: "1px solid rgba(248,113,113,0.24)",
                }}
              >
                Delete pillar
              </button>
            </div>
          </div>
        ))}
        <div>
          <button
            type="button"
            onClick={addPillar}
            className="rounded-full px-3 py-1.5 text-[11px] text-white/80 transition hover:bg-white/10"
            style={pillButton}
          >
            + Add pillar
          </button>
        </div>
      </div>
    </details>
  );
}

function RoleField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-[10px] text-white/55"
        style={{
          ...MONO,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        {props.label}
      </span>
      {props.textarea ? (
        <textarea
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          rows={2}
          className="w-full resize-y rounded-md bg-white/5 px-3 py-2 text-sm text-white placeholder-white/35 focus:outline-none"
          style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
        />
      ) : (
        <input
          type="text"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white placeholder-white/35 focus:outline-none"
          style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
        />
      )}
    </label>
  );
}
