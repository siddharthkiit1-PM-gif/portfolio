import { convexAuth } from "@convex-dev/auth/server";
import Resend from "@auth/core/providers/resend";
import { isAdminEmail } from "./users";

function getAllowlist(): string[] {
  const raw = process.env.ADMIN_ALLOWLIST ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Resend({
      from: process.env.AUTH_EMAIL_FROM ?? "onboarding@resend.dev",
      // Gate magic-link delivery on the admin allowlist. Any email not on the
      // list silently no-ops here — the UI still shows the generic "check
      // your email" success state, so we don't leak who is allowlisted, but
      // no message is ever sent to a non-admin address. Belt-and-braces
      // alongside the role check in `requireAdmin`, which already prevents
      // non-admins from doing anything even if they did sign in.
      async sendVerificationRequest({ identifier: email, url, provider }) {
        if (!isAdminEmail(email, getAllowlist())) {
          return;
        }
        const apiKey = provider.apiKey ?? process.env.AUTH_RESEND_KEY;
        const from = provider.from ?? process.env.AUTH_EMAIL_FROM ?? "onboarding@resend.dev";
        const { host } = new URL(url);
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: email,
            subject: `Sign in to ${host}`,
            html: `<p>Click <a href="${url}">here</a> to sign in to ${host}.</p><p>This link expires shortly. If you didn't request it, ignore this email.</p>`,
            text: `Sign in to ${host}: ${url}`,
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Resend send failed (${res.status}): ${body}`);
        }
      },
    }),
  ],
  callbacks: {
    // Runs immediately after Convex Auth's default upsert into `users`. We
    // patch our app-level fields (role, createdAt) here so admin status is
    // assigned in the same atomic flow as sign-in — no separate frontend
    // mutation required, no transient "user without role" window.
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      const row = await ctx.db.get(userId);
      if (!row) return;
      const email = (row as { email?: string }).email;
      if (!email) return;
      const role = isAdminEmail(email, getAllowlist()) ? "admin" : "viewer";
      const patch: Record<string, unknown> = { role };
      if (!(row as { createdAt?: number }).createdAt) {
        patch.createdAt = Date.now();
      }
      await ctx.db.patch(userId, patch);
    },
  },
});
