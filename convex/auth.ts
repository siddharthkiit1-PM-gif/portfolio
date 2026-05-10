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
