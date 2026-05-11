"use client";

/**
 * HeroImageUploader — admin-only file picker that posts to a Convex
 * generateUploadUrl, then returns the resulting Id<"_storage"> via
 * onUploaded. The parent (AdminEditorProjects) is responsible for
 * patching the row with the new storage id.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Props = {
  storageId: Id<"_storage"> | undefined;
  onUploaded: (id: Id<"_storage">) => void;
};

export function HeroImageUploader({ storageId, onUploaded }: Props) {
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const currentUrl = useQuery(
    api.projects.getStorageUrl,
    storageId ? { storageId } : "skip",
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const { storageId: newId } = (await res.json()) as {
        storageId: Id<"_storage">;
      };
      onUploaded(newId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt="Current hero"
          className="aspect-[3/2] w-[240px] rounded-md object-cover"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        />
      )}
      <label className="inline-flex w-fit cursor-pointer items-center rounded-full border border-white/20 px-3 py-1.5 text-[11px] text-white/80 hover:bg-white/5">
        {uploading ? "Uploading\u2026" : currentUrl ? "Replace image" : "Upload image"}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </label>
      {error && <div className="text-[11px] text-red-400">{error}</div>}
    </div>
  );
}
