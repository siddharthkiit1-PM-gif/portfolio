"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAdmin } from "@/components/admin/AdminProvider";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

type Props = {
  /** Current media record id, or null. */
  mediaId: Id<"media"> | null;
  /** Called after a new media record is created. Persist the new id upstream. */
  onChange: (id: Id<"media">) => void;
  /** Fallback element when no media exists. */
  placeholder: React.ReactNode;
  className?: string;
  alt?: string;
};

export function EditableMedia({ mediaId, onChange, placeholder, className, alt = "" }: Props) {
  const { isEditing } = useAdmin();
  const media = useQuery(api.media.get, mediaId ? { id: mediaId } : "skip");
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const createRecord = useMutation(api.media.createRecord);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
      });
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      const id = await createRecord({
        storageId,
        type: file.type.startsWith("video/") ? "video" : "image",
        alt,
      });
      onChange(id);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!isEditing) return;
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  return (
    <div
      onDragOver={isEditing ? (e) => e.preventDefault() : undefined}
      onDrop={onDrop}
      className={[
        className,
        isEditing ? "outline outline-1 outline-dashed outline-violet-400/60 relative" : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isEditing && (
        <div className="absolute right-2 top-2 z-10 rounded bg-violet-400 px-2 py-0.5 text-[9px] font-semibold text-black">
          {uploading ? "UPLOADING…" : "↑ Drop file to replace"}
        </div>
      )}
      {media?.url ? (
        media.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={media.alt} className="block w-full h-full object-cover" />
        ) : (
          <video
            src={media.url}
            muted
            autoPlay
            loop
            playsInline
            className="block w-full h-full object-cover"
          />
        )
      ) : (
        placeholder
      )}
    </div>
  );
}
