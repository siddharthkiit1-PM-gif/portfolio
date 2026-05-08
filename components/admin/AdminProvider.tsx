"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { useViewer } from "@/lib/auth/useViewer";

type AdminContextValue = {
  /** True when viewer is admin AND not in visitor-preview mode. */
  isEditing: boolean;
  /** Toggle visitor-preview mode (admins only). */
  togglePreview: () => void;
  previewing: boolean;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const viewer = useViewer();
  const [previewing, setPreviewing] = useState(false);

  const value = useMemo<AdminContextValue>(() => {
    const isAdmin = viewer.state === "authenticated" && viewer.isAdmin;
    return {
      isEditing: isAdmin && !previewing,
      previewing,
      togglePreview: () => setPreviewing((p) => !p),
    };
  }, [viewer, previewing]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}
