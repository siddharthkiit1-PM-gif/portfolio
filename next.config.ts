import type { NextConfig } from "next";

/**
 * Baseline security headers applied to every route.
 *
 * - `X-Content-Type-Options: nosniff` blocks MIME-sniffing attacks.
 * - `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` block clickjacking.
 *   We send both because some older browsers / proxies only honor one.
 * - `Referrer-Policy: strict-origin-when-cross-origin` keeps full URLs from
 *   leaking to third-party origins.
 * - `Permissions-Policy` disables sensors we never use, so a future XSS can't
 *   silently turn them on.
 * - CSP is intentionally narrow: it locks down the dangerous primitives
 *   (`frame-ancestors`, `object-src`, `base-uri`) without restricting
 *   `script-src` / `style-src`, which would break Next.js's inline runtime
 *   chunks, Convex's websocket client, and Vercel analytics. Tighten later
 *   with nonces if a hard CSP is needed.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'"].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
