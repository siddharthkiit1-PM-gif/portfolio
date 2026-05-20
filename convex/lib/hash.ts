"use node";
import { createHash } from "node:crypto";

/**
 * Stable, content-addressable hash for bullet text. Used as the dedupe key
 * for `bulletEmbeddings.sourceHash` so the embedding pipeline can skip work
 * when a bullet's text is unchanged.
 *
 * Marked `"use node"` because `node:crypto` is not available in Convex's V8
 * isolate runtime. Only consumed by the Node action module `embeddings.ts`
 * (and by the vitest suite, which runs in Node natively).
 */
export function sha256OfText(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}
