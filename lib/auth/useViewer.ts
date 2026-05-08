"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type Viewer =
  | { state: "loading" }
  | { state: "anonymous" }
  | { state: "authenticated"; isAdmin: boolean; email: string; name?: string };

export function useViewer(): Viewer {
  const user = useQuery(api.users.currentUser);
  if (user === undefined) return { state: "loading" };
  if (user === null) return { state: "anonymous" };
  return {
    state: "authenticated",
    isAdmin: user.role === "admin",
    email: user.email,
    name: user.name,
  };
}
