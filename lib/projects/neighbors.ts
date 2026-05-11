/**
 * Given an ordered list and a slug, return the previous and next rows
 * with wrap-around at both ends. Used by `/projects/[slug]` footer nav.
 *
 * Returns `{ prev: null, next: null }` when:
 *   • the slug is not found,
 *   • the list is empty, or
 *   • the list has exactly one row (wrap-to-self would render
 *     "← <current title>" / "<current title> →", which reads as a bug).
 */
export function neighbors<T extends { slug: string }>(
  rows: T[],
  slug: string,
): { prev: T | null; next: T | null } {
  if (rows.length < 2) return { prev: null, next: null };
  const i = rows.findIndex((r) => r.slug === slug);
  if (i === -1) return { prev: null, next: null };
  const prev = rows[(i - 1 + rows.length) % rows.length];
  const next = rows[(i + 1) % rows.length];
  return { prev, next };
}
