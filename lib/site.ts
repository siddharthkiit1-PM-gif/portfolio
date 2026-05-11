/**
 * Canonical site URL. Reads NEXT_PUBLIC_SITE_URL when set (custom domain later),
 * otherwise falls back to the current Vercel production alias. Used by sitemap,
 * robots, and metadata so OG/canonical URLs resolve correctly.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://portfolio-rose-mu-zuk77ykbjv.vercel.app";
