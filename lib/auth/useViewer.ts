"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type Viewer =
  | { state: "loading" }
  | { state: "anonymous" }
  | { state: "authenticated"; isAdmin: boolean; email: string; name?: string };

function readDevAdminCookie(): string | null {
  if (typeof document === "undefined") return null;
  if (process.env.NODE_ENV === "production") return null;
  const match = document.cookie.match(/(?:^|;\s*)dev_admin_email=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function useViewer(): Viewer {
  const user = useQuery(api.users.currentUser);
  const devAdmin = readDevAdminCookie();

  if (devAdmin) {
    return { state: "authenticated", isAdmin: true, email: devAdmin };
  }
  if (user === undefined) return { state: "loading" };
  if (user === null) return { state: "anonymous" };
  return {
    state: "authenticated",
    isAdmin: user.role === "admin",
    email: user.email,
    name: user.name,
  };
}
