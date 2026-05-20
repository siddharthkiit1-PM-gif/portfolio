"use node";

/**
 * Gemini embedding client. Uses `gemini-embedding-001` with
 * `outputDimensionality: 1536` (Matryoshka truncation) to match the 1536-dim
 * `bulletEmbeddings.by_embedding` vector index.
 *
 * Asymmetric task types are passed by callers:
 *   - `RETRIEVAL_DOCUMENT` for indexed bullets (in `convex/embeddings.ts`)
 *   - `RETRIEVAL_QUERY` for search inputs (in `convex/mcp.ts`)
 * Using the matching task type meaningfully improves retrieval quality over
 * a single-mode embedding.
 *
 * Truncated outputs are not L2-normalised by the API, so we normalise here.
 * The vector index uses cosine-equivalent similarity; with unit-length
 * vectors, dot-product (the underlying op) equals cosine similarity.
 */

const EMBED_DIM = 1536;
const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

export type EmbedTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export async function embed(
  text: string,
  taskType: EmbedTaskType,
): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured in Convex env");

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: EMBED_DIM,
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as { embedding: { values: number[] } };
  const values = json.embedding.values;
  if (!Array.isArray(values) || values.length !== EMBED_DIM) {
    throw new Error(
      `Gemini returned ${values?.length ?? "no"} dims; expected ${EMBED_DIM}`,
    );
  }
  return l2Normalize(values);
}

function l2Normalize(vec: number[]): number[] {
  let sumSq = 0;
  for (const x of vec) sumSq += x * x;
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vec;
  const inv = 1 / norm;
  const out = new Array<number>(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] * inv;
  return out;
}
