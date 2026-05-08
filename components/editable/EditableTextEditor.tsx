"use client";

import type { TiptapNode } from "@/lib/content/tiptapJson";

export function EditableTextEditor(props: {
  page: string;
  slot: string;
  initialJson: TiptapNode;
  schemaVersion: number;
  singleLine: boolean;
  onClose: () => void;
  className?: string;
}) {
  return <span className={props.className}>{/* stub — replaced in Task 1.10 */}</span>;
}
