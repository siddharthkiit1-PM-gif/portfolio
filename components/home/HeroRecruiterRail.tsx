"use client";

/**
 * HeroRecruiterRail — STATIC right column of the pinned hero (Variant A).
 *
 * Lives in the silhouette slot of HeroResponsiveLayout. Does NOT animate
 * with the scroll timeline — by design. The cinematic motion happens on
 * the left; the rail is the calm scan target a recruiter can read from
 * frame 0 through the dwell without their eyes ever leaving it.
 *
 * Composition:
 *   monogram (Sa)  →  recruiter pitch  →  CTA  →  contact icon row
 *
 * Editorial copy (`hero.recruiter.*`) flows through EditableText so the
 * existing in-place admin edit path (AdminProvider + AdminBar + Convex
 * `siteContent`) can update them without touching code. A standalone
 * admin GUI to list/edit every slot is on the next-phase plan in
 * docs/superpowers/plans/2026-05-09-admin-edit-page.md.
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EditableText } from "@/components/editable/EditableText";
import { Monogram } from "@/components/brand/Monogram";
import { LinkedInIcon, ResumeIcon, EmailIcon, GitHubIcon } from "@/components/brand/SocialIcons";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SERIF: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
};

const HAIRLINE = "rgba(255,255,255,0.14)";
const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

// Contact endpoints. Used as fallbacks while the Convex query is loading
// or when no `siteContacts` row exists yet (fresh DB). Edits in `/admin/edit`
// upsert a singleton row keyed `"primary"`, after which these literals are
// shadowed.
const EMAIL = "hello@siddharthagrawal.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/siddharthagrawal18/?skipRedirect=true";
const RESUME_URL = "/Siddharth_Agrawal_Resume.pdf";
const GITHUB_URL = "https://github.com/siddharthkiit1-PM-gif";

export function HeroRecruiterRail() {
  const contacts = useQuery(api.siteContacts.get, {});
  const email = contacts?.email ?? EMAIL;
  const linkedinUrl = contacts?.linkedinUrl ?? LINKEDIN_URL;
  const resumeUrl = contacts?.resumeUrl ?? RESUME_URL;
  const githubUrl = contacts?.githubUrl ?? GITHUB_URL;

  return (
    <aside
      className="relative w-full max-w-[360px] rounded-2xl px-7 py-8"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.005) 100%)",
        border: `1px solid ${HAIRLINE_FAINT}`,
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="flex flex-col items-start gap-6">
        <Monogram size={68} />

        <div aria-hidden className="h-px w-12" style={{ background: HAIRLINE }} />

        <div>
          <div
            className="text-[10px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
          >
            <EditableText
              page="home"
              slot="hero.recruiter.eyebrow"
              fallback="For hiring teams"
              as="span"
              singleLine
            />
          </div>
          <p
            className="mt-3 text-[24px] leading-[1.15] tracking-tight text-white"
            style={{ ...SERIF, fontWeight: 400 }}
          >
            <EditableText
              page="home"
              slot="hero.recruiter.headline"
              fallback="Looking for product manager?"
              as="span"
              singleLine
            />
          </p>
          <p className="mt-3 text-[13px] leading-snug text-white/65">
            <EditableText
              page="home"
              slot="hero.recruiter.body"
              fallback="I lead 0 → 1 product work at the data, AI and customer intersection. Currently scoping senior PM roles."
              as="span"
            />
          </p>
        </div>

        <a
          href="/contact"
          className="inline-flex items-center gap-2 text-sm font-medium"
          style={{
            background: "white",
            color: "black",
            borderRadius: "999px",
            padding: "10px 18px",
          }}
        >
          <EditableText
            page="home"
            slot="hero.recruiter.cta"
            fallback="Reach out"
            as="span"
            singleLine
          />
          <span aria-hidden>→</span>
        </a>

        <div
          aria-hidden
          className="h-px w-full"
          style={{ background: HAIRLINE_FAINT }}
        />

        {/* Contact links — icon-only chips on the top row (LinkedIn brand
            mark, GitHub Octocat, résumé glyph) keep the social row scannable
            at one glance. Email gets its own pill row below so the address
            can stay readable without truncation. */}
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center gap-2">
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="LinkedIn"
              className="inline-flex size-9 items-center justify-center rounded-full text-white/80 transition hover:text-white"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${HAIRLINE_FAINT}`,
              }}
            >
              <LinkedInIcon />
            </a>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub"
              className="inline-flex size-9 items-center justify-center rounded-full text-white/80 transition hover:text-white"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${HAIRLINE_FAINT}`,
              }}
            >
              <GitHubIcon />
            </a>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Résumé (PDF)"
              className="inline-flex size-9 items-center justify-center rounded-full text-white/80 transition hover:text-white"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${HAIRLINE_FAINT}`,
              }}
            >
              <ResumeIcon />
            </a>
          </div>
          <a
            href={`mailto:${email}`}
            aria-label={`Email ${email}`}
            className="inline-flex w-full items-center gap-2 rounded-full px-3 text-[12px] text-white/75 transition hover:text-white"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${HAIRLINE_FAINT}`,
              height: 36,
              ...MONO,
              letterSpacing: "0.02em",
            }}
          >
            <EmailIcon size={14} />
            <span className="truncate">{email}</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
