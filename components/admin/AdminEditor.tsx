"use client";

/**
 * AdminEditor — three-tab editor surface for `/admin/edit`.
 *
 * Tabs:
 *   • Copy       → list every siteContent slot, mount the existing
 *                  EditableTextEditor on selection (AdminEditorList).
 *   • Contacts   → singleton siteContacts row (AdminEditorContacts).
 *   • Experience → ordered experienceRoles list (AdminEditorRoles).
 *
 * The "Copy" tab uses a 320px left pane (search + tree) plus a flexible
 * right pane (selected editor). The other two tabs collapse to a single
 * column since they don't need a tree.
 *
 * The sticky save indicator at the top reflects `useAdmin().isEditing` —
 * it's the same cue the inline editor uses on the live page.
 */

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "./AdminProvider";
import { AdminEditorList } from "./AdminEditorList";
import { AdminEditorContacts } from "./AdminEditorContacts";
import { AdminEditorRoles } from "./AdminEditorRoles";
import { AdminEditorProjects } from "./AdminEditorProjects";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE = "rgba(255,255,255,0.14)";
const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type TabKey = "copy" | "contacts" | "experience" | "projects";

const TABS: { key: TabKey; label: string }[] = [
  { key: "copy", label: "Copy" },
  { key: "contacts", label: "Contacts" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
];

function isTabKey(s: string | null | undefined): s is TabKey {
  return s === "copy" || s === "contacts" || s === "experience" || s === "projects";
}

export function AdminEditor() {
  return (
    <Suspense fallback={null}>
      <AdminEditorInner />
    </Suspense>
  );
}

function AdminEditorInner() {
  const params = useSearchParams();
  const initialTab = isTabKey(params.get("tab")) ? (params.get("tab") as TabKey) : "copy";
  const [active, setActive] = useState<TabKey>(initialTab);
  const { isEditing } = useAdmin();

  return (
    <div>
      <div
        className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-between gap-4 px-6 py-3 backdrop-blur"
        style={{
          background: "rgba(0,0,0,0.7)",
          borderBottom: `1px solid ${HAIRLINE_FAINT}`,
        }}
      >
        <nav className="flex items-center gap-1" role="tablist">
          {TABS.map((t) => {
            const isActive = active === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(t.key)}
                className="rounded-full px-3.5 py-1.5 text-[12px] transition"
                style={{
                  ...MONO,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: isActive ? "white" : "rgba(255,255,255,0.55)",
                  background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                  border: `1px solid ${isActive ? HAIRLINE : "transparent"}`,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        <SaveIndicator isEditing={isEditing} />
      </div>

      <div role="tabpanel" aria-label={active}>
        {active === "copy" && <AdminEditorList />}
        {active === "contacts" && <AdminEditorContacts />}
        {active === "experience" && <AdminEditorRoles />}
        {active === "projects" && <AdminEditorProjects />}
      </div>
    </div>
  );
}

function SaveIndicator({ isEditing }: { isEditing: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px]"
      style={{
        ...MONO,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: isEditing ? "rgba(167,139,250,1)" : "rgba(255,255,255,0.45)",
        background: isEditing ? "rgba(167,139,250,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${isEditing ? "rgba(167,139,250,0.35)" : HAIRLINE_FAINT}`,
      }}
      aria-live="polite"
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{
          background: isEditing ? "rgb(167,139,250)" : "rgba(255,255,255,0.4)",
        }}
      />
      {isEditing ? "Editing · live" : "Read only"}
    </span>
  );
}
