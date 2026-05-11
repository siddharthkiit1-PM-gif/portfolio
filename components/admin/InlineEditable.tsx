"use client";

/**
 * InlineEditable — click-to-edit text used by admin row controls on the live
 * site. Renders `children` styled as ordinary text; on click, swaps in an
 * <input> (single-line) or <textarea> (multi-line) seeded with `value`.
 * Commits on blur OR Enter (single-line) / Cmd+Enter (multi-line). Esc cancels.
 *
 * Only the editor swaps — outer typography stays put so the row layout
 * doesn't jump. Caller passes `onCommit` that returns a Promise; the editor
 * stays mounted (disabled) until the promise resolves so saves feel sturdy.
 *
 * Admin-only by contract — callers gate with `useAdmin().isEditing`.
 */

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onCommit: (next: string) => void | Promise<void>;
  /** Multi-line uses <textarea>. Default false. */
  multiline?: boolean;
  /** Visible when there is no value to edit. Default "Click to edit". */
  placeholder?: string;
  /** Optional class applied to BOTH the display span and the editor. */
  className?: string;
  /** Optional inline styles applied to BOTH the display span and the editor. */
  style?: React.CSSProperties;
  /** Optional aria-label for screen readers. */
  ariaLabel?: string;
};

export function InlineEditable({
  value,
  onCommit,
  multiline = false,
  placeholder = "Click to edit",
  className,
  style,
  ariaLabel,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Keep local draft in sync when the server value changes from elsewhere.
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editing]);

  async function commit() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onCommit(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (!editing) {
    const display = value || placeholder;
    const isPlaceholder = !value;
    return (
      <span
        role="button"
        tabIndex={0}
        aria-label={ariaLabel ?? `Edit ${display}`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setEditing(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setEditing(true);
          }
        }}
        className={`cursor-text rounded-sm outline-none ring-violet-400/40 hover:ring-1 focus-visible:ring-1 ${
          isPlaceholder ? "text-white/35 italic" : ""
        } ${className ?? ""}`}
        style={style}
      >
        {display}
      </span>
    );
  }

  const editorClass = `w-full min-w-0 rounded-sm border border-violet-400/40 bg-black/40 px-1 py-0.5 outline-none ring-2 ring-violet-400/20 ${className ?? ""}`;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      return;
    }
    if (e.key === "Enter") {
      if (multiline && !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      void commit();
    }
  }

  return multiline ? (
    <textarea
      ref={(node) => {
        inputRef.current = node;
      }}
      value={draft}
      disabled={saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={handleKeyDown}
      className={editorClass}
      style={style}
      aria-label={ariaLabel}
      rows={3}
    />
  ) : (
    <input
      ref={(node) => {
        inputRef.current = node;
      }}
      type="text"
      value={draft}
      disabled={saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={handleKeyDown}
      className={editorClass}
      style={style}
      aria-label={ariaLabel}
    />
  );
}
