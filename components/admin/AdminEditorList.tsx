"use client";

/**
 * AdminEditorList — Copy tab.
 *
 * Left pane (320px): search input + page > slot tree built from
 *   useQuery(api.siteContent.listPages) and useQuery(api.siteContent.list).
 * Right pane: the existing EditableTextEditor mounted for the selected
 * (page, slot). It writes through siteContent.upsert exactly the same way
 * the inline editor on the live page does — no separate save flow.
 */

import { useMemo, useState, lazy, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  CURRENT_SCHEMA_VERSION,
  plainTextToTiptap,
  tiptapToPlainText,
  type TiptapNode,
} from "@/lib/content/tiptapJson";

const EditableTextEditor = lazy(() =>
  import("@/components/editable/EditableTextEditor").then((m) => ({
    default: m.EditableTextEditor,
  })),
);

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SERIF: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
};

const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Selection = { page: string; slot: string };

export function AdminEditorList() {
  const pages = useQuery(api.siteContent.listPages);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Selection | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr]">
      <aside
        className="flex flex-col rounded-xl"
        style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
      >
        <div className="p-3" style={{ borderBottom: `1px solid ${HAIRLINE_FAINT}` }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search slots…"
            className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white placeholder-white/35 focus:outline-none"
            style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
          />
        </div>

        <div className="max-h-[60vh] overflow-auto p-2">
          {pages === undefined ? (
            <p
              className="px-2 py-2 text-[11px] text-white/45"
              style={{ ...MONO, letterSpacing: "0.16em", textTransform: "uppercase" }}
            >
              Loading…
            </p>
          ) : pages.length === 0 ? (
            <p
              className="px-2 py-2 text-[11px] text-white/45"
              style={{ ...MONO, letterSpacing: "0.16em", textTransform: "uppercase" }}
            >
              No edited slots yet
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pages.map((page) => (
                <PageGroup
                  key={page}
                  page={page}
                  query={query}
                  selected={selected}
                  onSelect={setSelected}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>

      <section
        className="rounded-xl p-5"
        style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
      >
        {selected ? (
          <SlotEditor key={`${selected.page}::${selected.slot}`} selection={selected} />
        ) : (
          <p className="text-sm text-white/45" style={SERIF}>
            Select a slot on the left to edit.
          </p>
        )}
      </section>
    </div>
  );
}

function PageGroup({
  page,
  query,
  selected,
  onSelect,
}: {
  page: string;
  query: string;
  selected: Selection | null;
  onSelect: (s: Selection) => void;
}) {
  const rowsRaw = useQuery(api.siteContent.list, { page });
  const rows = useMemo(
    () =>
      rowsRaw
        ? [...rowsRaw].sort((a, b) => a.slot.localeCompare(b.slot))
        : rowsRaw,
    [rowsRaw],
  );
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!rows) return rows;
    if (!q) return rows;
    return rows.filter(
      (r) => r.slot.toLowerCase().includes(q) || page.toLowerCase().includes(q),
    );
  }, [rows, q, page]);

  if (rows === undefined) return null;
  if (filtered && filtered.length === 0) return null;

  return (
    <li>
      <div
        className="px-2 py-1 text-[10px] text-white/55"
        style={{
          ...MONO,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        {page}
      </div>
      <ul className="mt-1 flex flex-col">
        {(filtered ?? rows).map((r) => {
          const isActive =
            selected?.page === page && selected?.slot === r.slot;
          return (
            <li key={r._id}>
              <button
                type="button"
                onClick={() => onSelect({ page, slot: r.slot })}
                className="w-full rounded-md px-2 py-1.5 text-left text-[12px] transition"
                style={{
                  color: isActive ? "white" : "rgba(255,255,255,0.7)",
                  background: isActive ? "rgba(167,139,250,0.10)" : "transparent",
                  border: `1px solid ${isActive ? "rgba(167,139,250,0.35)" : "transparent"}`,
                  ...MONO,
                }}
              >
                {r.slot}
              </button>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

function SlotEditor({ selection }: { selection: Selection }) {
  const row = useQuery(api.siteContent.get, {
    page: selection.page,
    slot: selection.slot,
  });

  if (row === undefined) {
    return (
      <p
        className="text-[11px] text-white/45"
        style={{ ...MONO, letterSpacing: "0.16em", textTransform: "uppercase" }}
      >
        Loading…
      </p>
    );
  }

  let json: TiptapNode = plainTextToTiptap("");
  if (row?.valueJson != null) {
    try {
      json = JSON.parse(row.valueJson) as TiptapNode;
    } catch (err) {
      console.warn(
        `[AdminEditorList] malformed JSON for slot ${selection.slot}: ${err instanceof Error ? err.message : String(err)}`,
      );
      json = plainTextToTiptap("");
    }
  }

  const preview = tiptapToPlainText(json);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className="text-[10px] text-white/45"
          style={{
            ...MONO,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          {selection.page}
        </span>
        <span
          className="text-[12px] text-white/85"
          style={{ ...MONO, letterSpacing: "0.04em" }}
        >
          {selection.slot}
        </span>
      </div>

      <div
        className="rounded-md p-4"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: `1px solid ${HAIRLINE_FAINT}`,
        }}
      >
        <Suspense
          fallback={
            <p className="text-sm text-white/60">{preview || "(empty)"}</p>
          }
        >
          <EditableTextEditor
            page={selection.page}
            slot={selection.slot}
            initialJson={json}
            schemaVersion={CURRENT_SCHEMA_VERSION}
            singleLine={false}
            onClose={() => {
              /* keep the editor mounted; closing happens via tab change */
            }}
            className="text-base text-white"
          />
        </Suspense>
      </div>

      <p
        className="text-[10px] text-white/40"
        style={{ ...MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
      >
        Auto-saves to siteContent · Cmd/Ctrl+S to flush
      </p>
    </div>
  );
}
