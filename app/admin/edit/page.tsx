"use client";

/**
 * /admin/edit — unified content editor.
 *
 * Auth gate matches the existing client-side Convex pattern (see
 * `lib/auth/useViewer.ts` + `app/admin/login/page.tsx`):
 *   • viewer state === "loading"      → render a quiet placeholder
 *   • viewer state === "anonymous"    → router.replace("/admin/login")
 *   • authenticated but not admin     → router.replace("/")
 *   • authenticated admin             → render <AdminEditor />
 *
 * The page-level chrome (dark bg, max-width container, title) lives here so
 * <AdminEditor /> stays focused on the tab UI itself.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useViewer } from "@/lib/auth/useViewer";
import { AdminEditor } from "@/components/admin/AdminEditor";

export default function AdminEditPage() {
  const viewer = useViewer();
  const router = useRouter();

  useEffect(() => {
    if (viewer.state === "anonymous") {
      router.replace("/admin/login");
    }
  }, [viewer, router]);

  let body: React.ReactNode;
  switch (viewer.state) {
    case "loading":
      body = <p className="text-sm text-white/50">Checking access…</p>;
      break;
    case "anonymous":
      body = <p className="text-sm text-white/50">Checking access…</p>;
      break;
    case "authenticated":
      body = viewer.isAdmin ? (
        <AdminEditor />
      ) : (
        <p className="text-sm text-white/50">Not authorized</p>
      );
      break;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <header className="mb-8">
          <p
            className="text-[10px] text-white/45"
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
            }}
          >
            admin
          </p>
          <h1
            className="mt-2 text-3xl tracking-tight text-white"
            style={{
              fontFamily:
                'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
              fontWeight: 400,
            }}
          >
            Edit content
          </h1>
        </header>

        {body}
      </div>
    </main>
  );
}
