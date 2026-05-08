"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef, useCallback } from "react";
import type { TiptapNode } from "@/lib/content/tiptapJson";
import { buildExtensions } from "./tiptap-extensions";

const AUTOSAVE_MS = 1500;

export function EditableTextEditor(props: {
  page: string;
  slot: string;
  initialJson: TiptapNode;
  schemaVersion: number;
  singleLine: boolean;
  onClose: () => void;
  className?: string;
}) {
  const upsert = useMutation(api.siteContent.upsert);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestJson = useRef<TiptapNode>(props.initialJson);

  const save = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    await upsert({
      page: props.page,
      slot: props.slot,
      valueJson: JSON.stringify(latestJson.current),
      schemaVersion: props.schemaVersion,
    });
  }, [upsert, props.page, props.slot, props.schemaVersion]);

  const editor = useEditor({
    extensions: buildExtensions({ singleLine: props.singleLine }),
    content: props.initialJson,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: [
          "outline-none focus:outline-none",
          "outline outline-1 outline-violet-400/60 rounded-sm",
          props.className ?? "",
        ]
          .filter(Boolean)
          .join(" "),
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          props.onClose();
          return true;
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          void save().then(() => props.onClose());
          return true;
        }
        if (props.singleLine && event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      latestJson.current = editor.getJSON() as TiptapNode;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void save();
      }, AUTOSAVE_MS);
    },
  });

  useEffect(() => {
    editor?.commands.focus("end");
  }, [editor]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        void save();
      }
    };
  }, [save]);

  return <EditorContent editor={editor} />;
}
