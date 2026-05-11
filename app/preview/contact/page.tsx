/**
 * PREVIEW ROUTE — disposable.
 *
 * Compares three sub-variants of the editorial "Reach out" section before
 * graduating one into `components/home/ContactSection.tsx`. Open at
 * `/preview/contact` and pick a winner; the loser variants and this file
 * are deleted in the same commit as the graduation.
 *
 *   • Variant A — Mono-restraint: marks render in white-on-dark by default;
 *     brand color appears as a 2px left-edge bar on hover.
 *   • Variant B — Always-on color: marks in full brand color; hover lifts
 *     opacity and slides the arrow.
 *   • Variant C — Brand-wash on hover: marks in full color; hover fills the
 *     row with a 5% wash of the brand color and adds a 1px brand-color
 *     left-edge hairline.
 *
 * Real contact values are hard-coded here so the rows render at full fidelity.
 * The graduation pass will surface these through `siteContacts` so they're
 * editable from /admin/edit.
 */

"use client";

import * as React from "react";
import {
  LinkedInMark,
  WhatsAppMark,
  CalendlyMark,
  GmailMark,
} from "@/components/brand/ContactBrandIcons";

type Channel = {
  key: "linkedin" | "calendly" | "whatsapp" | "email";
  label: string;
  handle: string;
  href: string;
  brand: string; // hex
  Icon: React.ComponentType<{ size?: number; monoColor?: string }>;
};

const CHANNELS: Channel[] = [
  {
    key: "linkedin",
    label: "LinkedIn",
    handle: "@siddharthagrawal18",
    href: "https://www.linkedin.com/in/siddharthagrawal18/?skipRedirect=true",
    brand: "#0A66C2",
    Icon: LinkedInMark,
  },
  {
    key: "calendly",
    label: "Book a meeting",
    handle: "calendly.com/siddharth-kiit1/30min",
    href: "https://calendly.com/siddharth-kiit1/30min",
    brand: "#006BFF",
    Icon: CalendlyMark,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    handle: "+91 79775 22907",
    href: "https://wa.me/917977522907",
    brand: "#25D366",
    Icon: WhatsAppMark,
  },
  {
    key: "email",
    label: "Email",
    handle: "siddharth.kiit1@gmail.com",
    href: "mailto:siddharth.kiit1@gmail.com",
    brand: "#EA4335",
    Icon: GmailMark,
  },
];

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};
const SERIF: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
};
const TAB_NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };

const HAIRLINE = "rgba(255,255,255,0.10)";
const HAIRLINE_FAINT = "rgba(255,255,255,0.06)";

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

function SectionFrame({
  variant,
  title,
  blurb,
  children,
}: {
  variant: string;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="relative mx-auto w-full max-w-[820px] px-6 py-20"
      style={{ borderTop: `1px solid ${HAIRLINE_FAINT}` }}
    >
      <div className="mb-12 flex items-end justify-between gap-6">
        <div>
          <p
            className="text-[10px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.34em", textTransform: "uppercase" }}
          >
            {variant} · Reach out
          </p>
          <h2
            className="mt-3 text-[clamp(32px,4vw,44px)] font-light leading-[1.05] tracking-tight text-white"
            style={SERIF}
          >
            {title}
          </h2>
          <p className="mt-3 max-w-[420px] text-[14px] leading-relaxed text-white/55">
            {blurb}
          </p>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

/* ----------------------------- Variant A (Mono-restraint) ----------------------------- */

function RowA({ c }: { c: Channel }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={c.href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative grid grid-cols-[64px_1fr_auto] items-center gap-6 py-7 transition-colors"
      style={{ borderBottom: `1px solid ${HAIRLINE}` }}
    >
      {/* Left-edge brand bar (appears on hover) */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[2px] origin-top transition-transform duration-300"
        style={{
          background: c.brand,
          transform: hover ? "scaleY(1)" : "scaleY(0)",
        }}
      />
      <div className="flex h-10 w-10 items-center justify-center">
        <c.Icon size={40} monoColor={hover ? c.brand : "#FFFFFF"} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[17px] font-medium tracking-tight text-white">
          {c.label}
        </span>
        <span
          className="text-[14px] italic text-white/55"
          style={{ ...SERIF, ...TAB_NUM }}
        >
          {c.handle}
        </span>
      </div>
      <div
        className="text-white/45 transition-all duration-300 group-hover:text-white"
        style={{
          transform: hover ? "translate(2px,-2px)" : "translate(0,0)",
        }}
      >
        <ArrowUpRight />
      </div>
    </a>
  );
}

/* ----------------------------- Variant B (Always-on color) ----------------------------- */

function RowB({ c }: { c: Channel }) {
  return (
    <a
      href={c.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative grid grid-cols-[64px_1fr_auto] items-center gap-6 py-7 opacity-[0.92] transition-opacity hover:opacity-100"
      style={{ borderBottom: `1px solid ${HAIRLINE}` }}
    >
      <div className="flex h-10 w-10 items-center justify-center">
        <c.Icon size={40} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[17px] font-medium tracking-tight text-white">
          {c.label}
        </span>
        <span
          className="text-[14px] italic text-white/55"
          style={{ ...SERIF, ...TAB_NUM }}
        >
          {c.handle}
        </span>
      </div>
      <div className="text-white/50 transition-all duration-300 group-hover:translate-x-[2px] group-hover:-translate-y-[2px] group-hover:text-white">
        <ArrowUpRight />
      </div>
    </a>
  );
}

/* ----------------------------- Variant C (Brand-wash on hover) ----------------------------- */

function RowC({ c }: { c: Channel }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={c.href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative grid grid-cols-[64px_1fr_auto] items-center gap-6 px-5 py-7 transition-colors"
      style={{
        borderBottom: `1px solid ${HAIRLINE}`,
        background: hover ? `${c.brand}0F` : "transparent", // 0F ≈ 6% alpha
        borderLeft: hover ? `1px solid ${c.brand}` : "1px solid transparent",
      }}
    >
      <div className="flex h-10 w-10 items-center justify-center">
        <c.Icon size={40} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[17px] font-medium tracking-tight text-white">
          {c.label}
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

/* ----------------------------- Page ----------------------------- */

export default function ContactPreviewPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="px-6 pt-16 pb-8 text-center">
        <p
          className="text-[10px] text-white/40"
          style={{ ...MONO, letterSpacing: "0.34em", textTransform: "uppercase" }}
        >
          Preview · Contact section
        </p>
        <h1 className="mt-3 text-2xl font-light tracking-tight" style={SERIF}>
          Three takes on the same editorial vertical stack.
        </h1>
        <p className="mt-2 text-[13px] text-white/50">
          Hover each row to see the chromatic behavior. Pick a winner — losers
          + this preview file are deleted on graduation.
        </p>
      </header>

      <SectionFrame
        variant="Variant A"
        title="Easiest ways in."
        blurb="Mono-restraint. Marks render in white. Brand color only appears as a 2px left-edge bar on hover. Type leads."
      >
        {CHANNELS.map((c) => (
          <RowA key={c.key} c={c} />
        ))}
      </SectionFrame>

      <SectionFrame
        variant="Variant B"
        title="Easiest ways in."
        blurb="Always-on color. Marks stay in full brand color. Hover lifts opacity and slides the arrow."
      >
        {CHANNELS.map((c) => (
          <RowB key={c.key} c={c} />
        ))}
      </SectionFrame>

      <SectionFrame
        variant="Variant C"
        title="Easiest ways in."
        blurb="Brand-wash on hover. Marks in full color. Hover fills the row with a 6% wash of the brand color and lights a 1px hairline on the left edge."
      >
        {CHANNELS.map((c) => (
          <RowC key={c.key} c={c} />
        ))}
      </SectionFrame>

      <footer className="px-6 pb-20 pt-12 text-center">
        <p className="text-[12px] text-white/40">
          Once you pick: I&apos;ll graduate the winner into{" "}
          <code className="rounded bg-white/5 px-1 text-white/60">
            components/home/ContactSection.tsx
          </code>{" "}
          and wire it through Convex <code>siteContacts</code>.
        </p>
      </footer>
    </main>
  );
}
