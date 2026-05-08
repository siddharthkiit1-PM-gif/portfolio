"use client";

import { useAdmin } from "./AdminProvider";

export function AdminBar() {
  const { isEditing, previewing, togglePreview } = useAdmin();

  // Only render when admin (editing OR previewing).
  // Anonymous users and non-admins see nothing.
  if (!isEditing && !previewing) return null;

  return (
    <div className="fixed top-3 left-3 z-50 flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-400 px-3 py-1.5 text-[10px] font-semibold tracking-widest text-black">
        <span className="size-1.5 rounded-full bg-black" />
        {isEditing ? "EDITING · LIVE" : "PREVIEW · VISITOR"}
      </span>
      <button
        type="button"
        onClick={togglePreview}
        className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] text-white/80 backdrop-blur hover:bg-white/10"
      >
        {previewing ? "Resume editing" : "View as visitor"}
      </button>
    </div>
  );
}
