export const CURRENT_SCHEMA_VERSION = 1 as const;

/** Minimal Tiptap JSON shape we care about. */
export type TiptapNode = {
  type: string;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
};

export function plainTextToTiptap(text: string): TiptapNode {
  return {
    type: "doc",
    content: text
      ? [{ type: "paragraph", content: [{ type: "text", text }] }]
      : [],
  };
}

export function tiptapToPlainText(node: TiptapNode | null | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (!node.content) return "";
  return node.content.map(tiptapToPlainText).join("");
}
