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

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Role = Doc<"experienceRoles">;

type Draft = {
  dates: string;
  company: string;
  title: string;
  metric: string;
  outcome: string;
};

function toDraft(r: Role): Draft {
  return {
    dates: r.dates,
    company: r.company,
    title: r.title,
    metric: r.metric,
    outcome: r.outcome ?? "",
  };
}

function isDirty(draft: Draft, role: Role): boolean {
  return (
    draft.dates !== role.dates ||
    draft.company !== role.company ||
    draft.title !== role.title ||
    draft.metric !== role.metric ||
    (draft.outcome ?? "") !== (role.outcome ?? "")
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
    await upsert({
      id: role._id,
      order: role.order,
      dates: draft.dates,
      company: draft.company,
      title: draft.title,
      metric: draft.metric,
      outcome: draft.outcome.trim() ? draft.outcome.trim() : undefined,
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

      <div className="mt-3">
        <RoleField
          label="Outcome (optional)"
          value={draft.outcome}
          onChange={(v) => setDraft({ ...draft, outcome: v })}
          textarea
        />
      </div>

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
