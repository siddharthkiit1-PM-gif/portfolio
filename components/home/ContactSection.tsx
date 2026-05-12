"use client";

/**
 * ContactSection — "Reach out" editorial vertical stack.
 *
 * Replaces the placeholder ContactCTA. Four full-width rows (LinkedIn,
 * Calendly, WhatsApp, Email) render in editorial typography with HD
 * brand marks. Hover triggers a brand-wash: the row fills with a 6%
 * tint of the channel's brand color, a 1px brand hairline appears on
 * the left edge, and the corner ↗ arrow shifts up-right and recolors
 * to the brand.
 *
 * Data:
 *   • Handles / URLs come from `api.siteContacts.get` so admin edits
 *     in /admin/edit reflect immediately. Hard-coded fallbacks cover
 *     first paint and empty DBs.
 *   • Free copy (eyebrow / headline / blurb / row labels) flows through
 *     EditableText so every string is editable through the admin path.
 *
 * Implementation notes:
 *   • The row is a plain anchor — no client navigation, just a link to
 *     the channel. external href + target="_blank" + rel handles the
 *     security boilerplate (no opener, no referrer leak).
 *   • Hover state is local React state (not pure CSS) so we can drive
 *     three separate transitions (background, border, arrow color) off
 *     a single signal and keep them perfectly synchronized at 300ms.
 *   • The brand color appears in the row background as `<hex>0F`
 *     (12 / 255 ≈ 4.7% alpha) — light enough that the row text stays
 *     legible at every contrast level we care about.
 */

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EditableText } from "@/components/editable/EditableText";
import {
  LinkedInMark,
  WhatsAppMark,
  CalendlyMark,
  GmailMark,
} from "@/components/brand/ContactBrandIcons";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};
const SERIF: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
};
const SERIF_ITALIC: React.CSSProperties = {
  ...SERIF,
  fontStyle: "italic",
};
const TAB_NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };

const HAIRLINE = "rgba(255,255,255,0.10)";
const HAIRLINE_HEADER = "rgba(255,255,255,0.14)";

// Defaults match the literals in HeroRecruiterRail + the seeds so a
// fresh DB renders the section without a flash of empty.
const DEFAULT_LINKEDIN =
  "https://www.linkedin.com/in/siddharthagrawal18/";
const DEFAULT_EMAIL = "siddharth.kiit1@gmail.com";
const DEFAULT_PHONE = "917977522907"; // E.164 digits, no leading +
const DEFAULT_CALENDLY = "https://calendly.com/siddharth-kiit1/30min";

/** "917977522907" → "+91 79775 22907" (India only — single grouping). */
function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  // Fallback: prefix +, leave the rest alone.
  return `+${digits}`;
}

/** Pull "calendly.com/<user>/<event>" from a full URL for display. */
function formatCalendlyHandle(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

/** LinkedIn URL → "@<vanityId>" or the URL itself if we can't parse. */
function formatLinkedinHandle(url: string): string {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/in\/([^/]+)/);
    return match ? `@${match[1]}` : url;
  } catch {
    return url;
  }
}

function ArrowUpRight({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

type ChannelKey = "linkedin" | "calendly" | "whatsapp" | "email";

type Channel = {
  key: ChannelKey;
  slot: string; // siteContent slot for the label
  labelFallback: string;
  handle: string;
  href: string;
  brand: string;
  Icon: React.ComponentType<{ size?: number }>;
};

function ContactRow({ c }: { c: Channel }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={c.href}
      target={c.href.startsWith("mailto:") ? undefined : "_blank"}
      rel={c.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="group relative grid grid-cols-[64px_1fr_auto] items-center gap-6 px-5 py-7 transition-colors duration-300 focus:outline-none"
      style={{
        borderBottom: `1px solid ${HAIRLINE}`,
        background: hover ? `${c.brand}14` : "transparent", // ~8% alpha
        borderLeft: `1px solid ${hover ? c.brand : "transparent"}`,
      }}
    >
      <div className="flex h-10 w-10 items-center justify-center">
        <c.Icon size={40} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[17px] font-medium tracking-tight text-white">
          <EditableText
            page="home"
            slot={c.slot}
            fallback={c.labelFallback}
            as="span"
            singleLine
          />
        </span>
        <span
          className="text-[14px] italic text-white/55"
          style={{ ...SERIF, ...TAB_NUM }}
        >
          {c.handle}
        </span>
      </div>
      <div
        className="transition-all duration-300"
        style={{
          color: hover ? c.brand : "rgba(255,255,255,0.5)",
          transform: hover ? "translate(3px,-3px)" : "translate(0,0)",
        }}
      >
        <ArrowUpRight />
      </div>
    </a>
  );
}

export function ContactSection() {
  const contacts = useQuery(api.siteContacts.get, {});

  const linkedinUrl = contacts?.linkedinUrl ?? DEFAULT_LINKEDIN;
  const email = contacts?.email ?? DEFAULT_EMAIL;
  const phone = contacts?.phone ?? DEFAULT_PHONE;
  const calendlyUrl = contacts?.calendlyUrl ?? DEFAULT_CALENDLY;

  const channels: Channel[] = [
    {
      key: "linkedin",
      slot: "contact.label.linkedin",
      labelFallback: "LinkedIn",
      handle: formatLinkedinHandle(linkedinUrl),
      href: linkedinUrl,
      brand: "#0A66C2",
      Icon: LinkedInMark,
    },
    {
      key: "calendly",
      slot: "contact.label.calendly",
      labelFallback: "Book a meeting",
      handle: formatCalendlyHandle(calendlyUrl),
      href: calendlyUrl,
      brand: "#006BFF",
      Icon: CalendlyMark,
    },
    {
      key: "whatsapp",
      slot: "contact.label.whatsapp",
      labelFallback: "WhatsApp",
      handle: formatPhone(phone),
      href: `https://wa.me/${phone.replace(/\D/g, "")}`,
      brand: "#25D366",
      Icon: WhatsAppMark,
    },
    {
      key: "email",
      slot: "contact.label.email",
      labelFallback: "Email",
      handle: email,
      href: `mailto:${email}`,
      brand: "#EA4335",
      Icon: GmailMark,
    },
  ];

  return (
    <section
      id="contact"
      className="scroll-mt-24 bg-black px-6 py-28 text-white"
      aria-label="Contact"
    >
      <div className="mx-auto max-w-[820px]">
        {/* Eyebrow — unified across all sections: mono caps + hairline rule */}
        <div
          className="flex items-baseline justify-between text-[10px] text-white/45"
          style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
        >
          <EditableText
            page="home"
            slot="contact.eyebrow"
            fallback="REACH OUT"
            as="span"
            singleLine
          />
          <EditableText
            page="home"
            slot="contact.eyebrowRight"
            fallback=""
            as="span"
            singleLine
          />
        </div>
        <div aria-hidden className="mt-4 h-px w-full" style={{ background: HAIRLINE_HEADER }} />

        {/* Headline — unified: SERIF_ITALIC weight 500 at clamp(40,6vw,64) */}
        <h2
          className="mt-8 text-[clamp(40px,6vw,64px)] leading-[1.05] tracking-[-1.5px] text-white"
          style={{ ...SERIF_ITALIC, fontWeight: 500 }}
        >
          <EditableText
            page="home"
            slot="contact.headline"
            fallback="Easiest ways in."
            as="span"
            singleLine
          />
        </h2>
        <p className="mt-4 max-w-[480px] text-[14px] leading-relaxed text-white/55">
          <EditableText
            page="home"
            slot="contact.blurb"
            fallback="Pick whichever channel is fastest for you — I check all four daily."
            as="span"
          />
        </p>

        <div className="mt-12">
          {channels.map((c) => (
            <ContactRow key={c.key} c={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
