"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAdmin } from "@/components/admin/AdminProvider";
import {
  CURRENT_SCHEMA_VERSION,
  plainTextToTiptap,
  tiptapToPlainText,
  type TiptapNode,
} from "@/lib/content/tiptapJson";
import { useState, lazy, Suspense } from "react";

const EditableTextEditor = lazy(() =>
  import("./EditableTextEditor").then((m) => ({ default: m.EditableTextEditor })),
);

type Props = {
  page: string;
  slot: string;
  /** Fallback content if no row exists yet. */
  fallback: string;
  /** Render the resolved text/JSON. */
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  /** Single-line mode disables paragraph breaks in the editor. */
  singleLine?: boolean;
};

export function EditableText({
  page,
  slot,
  fallback,
  as: Tag = "span",
  className,
  singleLine = false,
}: Props) {
  const row = useQuery(api.siteContent.get, { page, slot });
  const { isEditing } = useAdmin();
  const [active, setActive] = useState(false);

  const json: TiptapNode =
    row?.valueJson != null
      ? (JSON.parse(row.valueJson) as TiptapNode)
      : plainTextToTiptap(fallback);

  if (isEditing && active) {
    return (
      <Suspense fallback={<Tag className={className}>{tiptapToPlainText(json)}</Tag>}>
        <EditableTextEditor
          page={page}
          slot={slot}
          initialJson={json}
          schemaVersion={CURRENT_SCHEMA_VERSION}
          singleLine={singleLine}
          onClose={() => setActive(false)}
          className={className}
        />
      </Suspense>
    );
  }

  return (
    <Tag
      className={[
        className,
        isEditing
          ? "cursor-text outline outline-1 outline-dashed outline-transparent hover:outline-violet-400/60 rounded-sm transition"
          : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={isEditing ? () => setActive(true) : undefined}
    >
      {tiptapToPlainText(json)}
    </Tag>
  );
}
