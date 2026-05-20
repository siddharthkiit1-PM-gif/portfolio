"use node";

export async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured in Convex env");
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}
