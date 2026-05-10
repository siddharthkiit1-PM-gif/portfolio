"use client";

/**
 * AdminEditorContacts — Contacts tab.
 *
 * Singleton form bound to siteContacts.upsert. Initial state seeds from
 * the live Convex row; if the row hasn't been created yet, falls back to
 * the same literals used by HeroRecruiterRail so a fresh DB renders the
 * form pre-populated rather than empty.
 *
 * URL fields use HTML `type="url"` for browser-level validation; we don't
 * pull in a schema lib for this single form.
 *
 * Form state is owned by an inner component mounted after the query
 * resolves; that lets `useState`'s lazy initializer seed from the row
 * without an effect (avoids `react-hooks/set-state-in-effect`).
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

// Mirror the fallback literals declared in HeroRecruiterRail so the
// admin form always opens with the live values, even before the
// siteContacts singleton row exists.
const FALLBACK = {
  email: "hello@siddharthagrawal.com",
  linkedinUrl: "https://www.linkedin.com/in/siddharthagrawal18/?skipRedirect=true",
  resumeUrl: "/Siddharth_Agrawal_Resume.pdf",
  phone: "",
};

type FormState = {
  email: string;
  linkedinUrl: string;
  resumeUrl: string;
  phone: string;
};

type ContactsRow = Doc<"siteContacts"> | null;

export function AdminEditorContacts() {
  const row = useQuery(api.siteContacts.get, {});

  if (row === undefined) {
    return (
      <p
        className="text-[11px] text-white/45"
        style={{ ...MONO, letterSpacing: "0.16em", textTransform: "uppercase" }}
      >
        Loading…
      </p>
    );
  }

  // Mounted with a stable initial row; remote updates to the singleton
  // (rare) don't reseed the form mid-edit.
  return <ContactsForm initial={row} />;
}

function ContactsForm({ initial }: { initial: ContactsRow }) {
  const upsert = useMutation(api.siteContacts.upsert);
  const [form, setForm] = useState<FormState>(() => ({
    email: initial?.email ?? FALLBACK.email,
    linkedinUrl: initial?.linkedinUrl ?? FALLBACK.linkedinUrl,
    resumeUrl: initial?.resumeUrl ?? FALLBACK.resumeUrl,
    phone: initial?.phone ?? FALLBACK.phone,
  }));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      await upsert({
        email: form.email.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
        resumeUrl: form.resumeUrl.trim(),
        phone: form.phone.trim() ? form.phone.trim() : undefined,
      });
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex max-w-[640px] flex-col gap-5 rounded-xl p-6"
      style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
    >
      <Field
        label="Email"
        id="contacts-email"
        type="email"
        required
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
      />
      <Field
        label="LinkedIn URL"
        id="contacts-linkedin"
        type="url"
        required
        value={form.linkedinUrl}
        onChange={(v) => setForm({ ...form, linkedinUrl: v })}
      />
      <Field
        label="Résumé URL"
        id="contacts-resume"
        type="text"
        required
        value={form.resumeUrl}
        onChange={(v) => setForm({ ...form, resumeUrl: v })}
        hint="Absolute URL or site-relative path (e.g. /Siddharth_Agrawal_Resume.pdf)"
      />
      <Field
        label="Phone (optional)"
        id="contacts-phone"
        type="tel"
        value={form.phone}
        onChange={(v) => setForm({ ...form, phone: v })}
      />

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-full px-4 py-2 text-[12px] text-black transition disabled:opacity-50"
          style={{
            ...MONO,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            background: "white",
          }}
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {status === "saved" && (
          <span
            className="rounded-full px-3 py-1 text-[10px]"
            style={{
              ...MONO,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgb(110,231,183)",
              background: "rgba(110,231,183,0.08)",
              border: "1px solid rgba(110,231,183,0.35)",
            }}
          >
            Saved
          </span>
        )}
        {status === "error" && error && (
          <span className="text-[12px] text-red-400">{error}</span>
        )}
      </div>
    </form>
  );
}

function Field(props: {
  id: string;
  label: string;
  type: "email" | "url" | "tel" | "text";
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5" htmlFor={props.id}>
      <span
        className="text-[10px] text-white/55"
        style={{
          ...MONO,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        {props.label}
      </span>
      <input
        id={props.id}
        type={props.type}
        required={props.required}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white placeholder-white/35 focus:outline-none"
        style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
      />
      {props.hint && (
        <span className="text-[11px] text-white/40">{props.hint}</span>
      )}
    </label>
  );
}
