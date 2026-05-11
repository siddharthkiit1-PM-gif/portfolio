/**
 * Convert a human title into an admin-editable slug.
 *
 * Rules:
 *   • Lowercase, ASCII-only.
 *   • Non-alphanumeric runs collapse into a single hyphen.
 *   • Leading/trailing hyphens are trimmed.
 *   • Empty input (or input that yields an empty slug) returns "untitled"
 *     so the admin form always has a valid initial value.
 */
export function slugify(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^\x00-\x7f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned.length > 0 ? cleaned : "untitled";
}
