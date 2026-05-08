import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

export function buildExtensions(opts: { singleLine: boolean; placeholder?: string }) {
  return [
    StarterKit.configure({
      heading: opts.singleLine ? false : { levels: [1, 2, 3] },
      hardBreak: false,
    }),
    Link.configure({ openOnClick: false }),
    Placeholder.configure({ placeholder: opts.placeholder ?? "" }),
  ];
}
