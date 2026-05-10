"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EditableText } from "@/components/editable/EditableText";
import {
  EXPERIENCE_ROLE_DEFAULTS,
  type RoleDefault,
} from "@/lib/defaults/experienceRoles";
import { MetricStrip } from "./MetricStrip";
import { RoleCard } from "./RoleCard";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SERIF_ITALIC: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  fontStyle: "italic",
};

const HAIRLINE = "rgba(255,255,255,0.14)";

type Props = {
  /** When false, disables counter-up + sticky numerals (Variant B). */
  animate?: boolean;
};

export function ExperienceSection({ animate = true }: Props) {
  const roles = useQuery(api.experienceRoles.list);
  const data: RoleDefault[] =
    roles && roles.length > 0
      ? roles.map((r) => ({
          order: r.order,
          dates: r.dates,
          company: r.company,
          title: r.title,
          location: r.location,
          metric: r.metric,
          outcome: r.outcome,
          pillars: r.pillars,
        }))
      : EXPERIENCE_ROLE_DEFAULTS;

  // Each row falls back to its defaults entry for `pillars` if the live row
  // doesn't have any (so existing production rows still surface bullets).
  const rolesForRender: RoleDefault[] = data.map((live) => {
    if (live.pillars && live.pillars.length > 0) return live;
    const fallback = EXPERIENCE_ROLE_DEFAULTS.find(
      (d) => d.company === live.company && d.dates === live.dates,
    );
    return fallback ? { ...live, pillars: fallback.pillars } : live;
  });

  return (
    <section className="relative overflow-hidden bg-[#05060a] py-[clamp(96px,14vh,160px)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 80px), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 80px)",
        }}
      />
      <div className="relative mx-auto w-full max-w-[1100px] px-6 sm:px-6 lg:px-10">
        <header>
          <div
            className="flex items-baseline justify-between text-[10px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
          >
            <EditableText
              page="home"
              slot="experience.eyebrowLeft"
              fallback="EXPERIENCE"
              as="span"
              singleLine
            />
            <EditableText
              page="home"
              slot="experience.eyebrowRight"
              fallback="2020 — NOW"
              as="span"
              singleLine
            />
          </div>
          <div
            aria-hidden
            className="mt-4 h-px w-full"
            style={{ background: HAIRLINE }}
          />
          <h2
            className="mt-8 text-[clamp(36px,5vw,56px)] leading-[1.05] tracking-[-1px] text-white"
            style={{ ...SERIF_ITALIC, fontWeight: 400 }}
          >
            <EditableText
              page="home"
              slot="experience.headline"
              fallback="Five years. One thesis."
              as="span"
              singleLine
            />
          </h2>
          <p className="mt-4 max-w-[640px] text-[17px] font-light leading-[1.5] text-white/65">
            <EditableText
              page="home"
              slot="experience.standfirst"
              fallback="Engineer → BA → PM. Each role compounded the last."
              as="span"
            />
          </p>
        </header>

        <div className="mt-[clamp(48px,8vh,96px)]">
          <MetricStrip animate={animate} />
        </div>

        <div className="mt-[clamp(64px,10vh,120px)] flex flex-col gap-[clamp(48px,8vh,96px)]">
          {rolesForRender.map((role, i) => (
            <RoleCard
              key={`${role.company}-${role.dates}`}
              role={role}
              index={i}
              stickyNumeral={animate}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
