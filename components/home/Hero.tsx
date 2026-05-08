import { EditableText } from "@/components/editable/EditableText";
import { HeroBackground } from "@/components/three/HeroBackground";

export function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#05060a] text-white">
      <HeroBackground />

      <div className="relative max-w-[880px] px-10 pt-32">
        <EditableText
          page="home"
          slot="hero.eyebrow"
          fallback="PRODUCT MANAGER · BUILDER · 2018 — NOW"
          as="div"
          singleLine
          className="text-[11px] tracking-[0.3em] text-white/50"
        />

        <h1 className="mt-6 text-[62px] font-light leading-none tracking-[-2.5px]">
          <EditableText
            page="home"
            slot="hero.headlineTop"
            fallback="I build products"
            as="span"
            singleLine
          />
          <br />
          <em
            className="not-italic font-normal bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #a78bfa 20%, #22d3ee 60%, #f472b6)",
            }}
          >
            <EditableText
              page="home"
              slot="hero.headlineBottom"
              fallback="people actually use."
              as="span"
              singleLine
            />
          </em>
        </h1>

        <EditableText
          page="home"
          slot="hero.subtext"
          fallback="PM at the intersection of AI, health, and consumer."
          as="p"
          className="mt-6 max-w-[560px] text-base font-light leading-[1.55] text-white/75"
        />

        <div className="mt-9 flex items-center gap-3">
          <a
            href="#work"
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black"
          >
            <EditableText
              page="home"
              slot="hero.ctaPrimary"
              fallback="View selected work →"
              as="span"
              singleLine
            />
          </a>
          <a
            href="/contact"
            className="rounded-full border border-white/20 px-5 py-3 text-sm text-white"
          >
            <EditableText
              page="home"
              slot="hero.ctaSecondary"
              fallback="Book a call"
              as="span"
              singleLine
            />
          </a>
          <span className="ml-3 inline-flex items-center gap-2 text-xs text-white/50">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <EditableText
              page="home"
              slot="hero.statusPill"
              fallback="Open to senior PM roles"
              as="span"
              singleLine
            />
          </span>
        </div>
      </div>

      <div className="absolute bottom-6 left-10 text-[10px] tracking-[0.25em] text-white/45">
        SCROLL ↓ TO ENTER
      </div>
    </section>
  );
}
