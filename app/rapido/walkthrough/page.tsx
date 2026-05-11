"use client";

/**
 * Rapido — full-screen interactive walkthrough.
 *
 * This is the "Figma prototype" alternative — built in code instead of Figma.
 * One centered phone, 13 distinct screens grouped into 5 features, with
 * clickable hotspots that navigate between screens (smart-animate style
 * cross-fade). A bottom thumbnail rail shows where you are.
 *
 * Architecture: pure client component, screens are a discriminated union
 * indexed by id, each screen defines its hotspots inline. Transition is
 * a CSS opacity+translate on the screen container.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const YELLOW = "#FFD93D";
const YELLOW_DEEP = "#7a5b00";

type ScreenId =
  | "cover"
  | "lite-1" | "lite-2" | "lite-3" | "lite-done"
  | "badge-1" | "badge-2"
  | "lang-hi" | "lang-en"
  | "penalty-gold" | "penalty-restricted"
  | "streak-4" | "streak-5";

type Hotspot = {
  // Percentages of the phone screen area
  top: string; left: string; width: string; height: string;
  to: ScreenId;
  label?: string;
};

type Screen = {
  id: ScreenId;
  featureKey: "cover" | "lite" | "badge" | "lang" | "penalty" | "streak";
  render: () => React.ReactNode;
  hotspots: Hotspot[];
};

const FEATURE_GROUPS = [
  { key: "cover" as const, label: "Start", screens: ["cover"] as ScreenId[] },
  { key: "lite" as const, label: "01 · Lite Mode", screens: ["lite-1", "lite-2", "lite-3", "lite-done"] as ScreenId[] },
  { key: "badge" as const, label: "02 · Trusted Badge", screens: ["badge-1", "badge-2"] as ScreenId[] },
  { key: "lang" as const, label: "03 · Language", screens: ["lang-hi", "lang-en"] as ScreenId[] },
  { key: "penalty" as const, label: "04 · Penalty", screens: ["penalty-gold", "penalty-restricted"] as ScreenId[] },
  { key: "streak" as const, label: "05 · Streak", screens: ["streak-4", "streak-5"] as ScreenId[] },
];

export default function WalkthroughPage() {
  const [current, setCurrent] = useState<ScreenId>("cover");
  const [transitioning, setTransitioning] = useState(false);

  const screens = useMemo(() => buildScreens(), []);
  const screen = screens.find((s) => s.id === current)!;

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCurrent("cover");
      if (e.key === "ArrowRight") {
        const idx = screens.findIndex((s) => s.id === current);
        if (idx < screens.length - 1) goTo(screens[idx + 1].id);
      }
      if (e.key === "ArrowLeft") {
        const idx = screens.findIndex((s) => s.id === current);
        if (idx > 0) goTo(screens[idx - 1].id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, screens]);

  function goTo(next: ScreenId) {
    if (next === current) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(next);
      setTransitioning(false);
    }, 150);
  }

  const featureKey = screen.featureKey;
  const groupLabel = FEATURE_GROUPS.find((g) => g.key === featureKey)?.label ?? "";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 30%, rgba(255,217,61,0.10), transparent 70%), radial-gradient(40% 40% at 80% 80%, rgba(255,217,61,0.05), transparent 70%)",
        }}
      />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link
          href="/rapido"
          className="inline-flex items-center gap-2 text-[12px] text-white/70 transition hover:text-white"
          style={{ fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.16em", textTransform: "uppercase" }}
        >
          ← Back to project
        </Link>
        <div
          className="text-[11px] text-white/45"
          style={{ fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.22em", textTransform: "uppercase" }}
        >
          Rapido · Interactive walkthrough
        </div>
        <button
          onClick={() => goTo("cover")}
          className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-white/70 transition hover:border-white/40 hover:text-white"
          style={{ fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          ↺ Restart
        </button>
      </header>

      {/* stage */}
      <section className="relative z-10 flex flex-col items-center px-6 pb-40 pt-4">
        <div
          className="mb-5 text-[10px] text-white/50"
          style={{ fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.28em", textTransform: "uppercase" }}
        >
          {groupLabel}
        </div>

        {/* phone */}
        <div className="relative">
          <div
            className="relative rounded-[50px] border border-white/10 p-2 shadow-[0_50px_120px_-30px_rgba(255,217,61,0.25)]"
            style={{ background: "linear-gradient(180deg, #0d0d0d, #050505)" }}
          >
            <div
              className="relative h-[760px] w-[380px] overflow-hidden rounded-[42px] bg-white text-black transition-all duration-150"
              style={{
                opacity: transitioning ? 0 : 1,
                transform: transitioning ? "translateY(6px) scale(0.998)" : "translateY(0) scale(1)",
              }}
            >
              {/* status bar */}
              <div className="flex items-center justify-between px-6 pt-4 text-[11px] font-medium text-black/70">
                <span>9:41</span>
                <span className="flex items-center gap-1.5">
                  <span>5G</span>
                  <span className="text-[9px]">●●●●</span>
                </span>
              </div>

              {/* screen body */}
              {screen.render()}

              {/* hotspots overlay */}
              {screen.hotspots.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(h.to)}
                  className="group absolute z-10 rounded-xl outline-none"
                  style={{
                    top: h.top, left: h.left, width: h.width, height: h.height,
                  }}
                  aria-label={h.label ?? `Go to ${h.to}`}
                >
                  <span className="absolute inset-0 rounded-xl ring-2 ring-transparent transition group-hover:ring-yellow-400/70" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <p
          className="mt-6 text-[11px] text-white/45"
          style={{ fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.18em", textTransform: "uppercase" }}
        >
          Tap highlighted areas · ← / → keys · Esc to restart
        </p>
      </section>

      {/* thumbnail rail */}
      <ThumbnailRail screens={screens} current={current} goTo={goTo} />
    </main>
  );
}

/* ───────────────────────────────────────────────────────────────── */
/* Thumbnail rail                                                    */
/* ───────────────────────────────────────────────────────────────── */

function ThumbnailRail({
  screens,
  current,
  goTo,
}: {
  screens: Screen[];
  current: ScreenId;
  goTo: (id: ScreenId) => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/85 backdrop-blur">
      <div className="mx-auto max-w-[1240px] overflow-x-auto px-4 py-3">
        <div className="flex items-center gap-2">
          {FEATURE_GROUPS.map((group) => (
            <div key={group.key} className="flex items-center gap-2">
              <div
                className="text-[9px] text-white/45"
                style={{ fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.18em", textTransform: "uppercase" }}
              >
                {group.label}
              </div>
              <div className="flex gap-1.5">
                {group.screens.map((sid) => {
                  const active = sid === current;
                  return (
                    <button
                      key={sid}
                      onClick={() => goTo(sid)}
                      className="h-9 w-[22px] flex-shrink-0 rounded-md border transition"
                      style={{
                        borderColor: active ? YELLOW : "rgba(255,255,255,0.15)",
                        background: active ? "rgba(255,217,61,0.18)" : "rgba(255,255,255,0.04)",
                      }}
                      aria-label={`Jump to ${sid}`}
                    />
                  );
                })}
              </div>
              <div className="mx-1 h-4 w-px bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────── */
/* Screens                                                           */
/* ───────────────────────────────────────────────────────────────── */

function buildScreens(): Screen[] {
  return [
    /* COVER */
    {
      id: "cover",
      featureKey: "cover",
      render: () => (
        <div className="flex h-full flex-col px-5 pt-6">
          <div
            className="text-[10px] uppercase tracking-[0.28em] text-black/45"
            style={{ fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            Product · Breakdown · Prototype
          </div>
          <div className="mt-4 text-[34px] font-bold leading-[1.02] tracking-[-0.02em]">
            Rapido
          </div>
          <div className="mt-1 text-[13px] text-black/55">
            Five features, prototyped end-to-end. Tap any card to walk through it.
          </div>

          <div className="mt-5 grid place-items-center">
            <div
              className="grid size-[120px] place-items-center rounded-full"
              style={{ background: YELLOW, boxShadow: "0 20px 50px -10px rgba(255,217,61,0.45)" }}
            >
              <span className="text-[58px]">🛵</span>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {[
              { n: "01", label: "Lite Mode UI", tag: "Three taps. Pick → Confirm → Pay." },
              { n: "02", label: "Trusted Captain Badge", tag: "Safety surfaced before commit." },
              { n: "03", label: "Regional Language Detect", tag: "EN · हिं · বাং · ಕನ್" },
              { n: "04", label: "Cancellation Penalty", tag: "Cancel rate → match priority." },
              { n: "05", label: "Streak Rewards", tag: "Day 3 / 5 / 7 unlocks." },
            ].map((c) => (
              <div
                key={c.n}
                className="rounded-xl border border-black/10 bg-white px-3 py-2.5"
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-[10px] text-black/45"
                    style={{ fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.18em" }}
                  >
                    {c.n}
                  </span>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{c.label}</div>
                    <div className="text-[10.5px] text-black/55">{c.tag}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      hotspots: [
        // 5 cards starting after the bike disc — approximate y positions
        { top: "44%", left: "5%", width: "90%", height: "8%", to: "lite-1", label: "Lite Mode" },
        { top: "53%", left: "5%", width: "90%", height: "8%", to: "badge-1", label: "Badge" },
        { top: "62%", left: "5%", width: "90%", height: "8%", to: "lang-hi", label: "Language" },
        { top: "71%", left: "5%", width: "90%", height: "8%", to: "penalty-gold", label: "Penalty" },
        { top: "80%", left: "5%", width: "90%", height: "8%", to: "streak-4", label: "Streak" },
      ],
    },

    /* LITE 1 — pick destination */
    {
      id: "lite-1",
      featureKey: "lite",
      render: () => (
        <div className="flex h-full flex-col px-5 pt-5">
          <BackHeader label="Lite Mode · ON" />
          <div className="mt-1 text-[22px] font-semibold leading-tight">Book in 3 taps</div>
          <StepBar step={0} />
          <div className="mt-5 text-[13px] font-medium text-black/60">Step 1 — Pick destination</div>
          <div className="mt-3 space-y-2.5">
            {["🏠   Home", "🏢   Office", "🛒   Big Bazaar", "📍   Pick on map"].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[14.5px] font-medium shadow-sm"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      ),
      hotspots: [
        { top: "38%", left: "5%", width: "90%", height: "10%", to: "lite-2" },
        { top: "48%", left: "5%", width: "90%", height: "10%", to: "lite-2" },
        { top: "58%", left: "5%", width: "90%", height: "10%", to: "lite-2" },
        { top: "68%", left: "5%", width: "90%", height: "10%", to: "lite-2" },
      ],
    },

    /* LITE 2 — confirm */
    {
      id: "lite-2",
      featureKey: "lite",
      render: () => (
        <div className="flex h-full flex-col px-5 pt-5">
          <BackHeader label="Lite Mode · ON" />
          <div className="mt-1 text-[22px] font-semibold leading-tight">Book in 3 taps</div>
          <StepBar step={1} />
          <div className="mt-5 text-[13px] font-medium text-black/60">Step 2 — Confirm ride</div>
          <div className="mt-4 rounded-2xl border border-black/10 p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-xl" style={{ background: "#FFF4C2" }}>🛵</div>
              <div>
                <div className="text-[15px] font-semibold">Bike</div>
                <div className="text-[12px] text-black/55">8 min · 2.4 km</div>
              </div>
              <div className="ml-auto text-[19px] font-semibold">₹46</div>
            </div>
          </div>
          <div className="mt-5 rounded-2xl py-4 text-center text-[15px] font-semibold text-black" style={{ background: YELLOW }}>
            Confirm
          </div>
        </div>
      ),
      hotspots: [
        { top: "57%", left: "5%", width: "90%", height: "9%", to: "lite-3" },
      ],
    },

    /* LITE 3 — pay */
    {
      id: "lite-3",
      featureKey: "lite",
      render: () => (
        <div className="flex h-full flex-col px-5 pt-5">
          <BackHeader label="Lite Mode · ON" />
          <div className="mt-1 text-[22px] font-semibold leading-tight">Book in 3 taps</div>
          <StepBar step={2} />
          <div className="mt-5 text-[13px] font-medium text-black/60">Step 3 — Pay</div>
          <div className="mt-3 space-y-2.5">
            {[
              { label: "UPI · GPay", sub: "siddharth@okhdfc" },
              { label: "Cash", sub: "Pay rider directly" },
              { label: "Wallet", sub: "₹120 balance" },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                <div className="text-[14px] font-semibold">{m.label}</div>
                <div className="text-[11px] text-black/50">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      hotspots: [
        { top: "38%", left: "5%", width: "90%", height: "9%", to: "lite-done" },
        { top: "47%", left: "5%", width: "90%", height: "9%", to: "lite-done" },
        { top: "56%", left: "5%", width: "90%", height: "9%", to: "lite-done" },
      ],
    },

    /* LITE DONE */
    {
      id: "lite-done",
      featureKey: "lite",
      render: () => (
        <div className="flex h-full flex-col items-center justify-center px-5 text-center">
          <div className="grid size-20 place-items-center rounded-full" style={{ background: YELLOW }}>
            <span className="text-[36px]">✓</span>
          </div>
          <div className="mt-5 text-[22px] font-bold">Ride booked</div>
          <div className="mt-2 text-[13px] text-black/55">Captain Suresh · 3 min away</div>
          <div className="mt-10 rounded-full border border-black/15 px-5 py-2 text-[11px] text-black/60">
            ↺ Restart walkthrough
          </div>
        </div>
      ),
      hotspots: [
        { top: "72%", left: "20%", width: "60%", height: "8%", to: "cover" },
      ],
    },

    /* BADGE 1 — captain card with badge */
    {
      id: "badge-1",
      featureKey: "badge",
      render: () => (
        <div className="flex h-full flex-col px-5 pt-5">
          <BackHeader label="Confirming your ride" />
          <div className="mt-1 text-[22px] font-semibold leading-tight">Your Captain</div>

          <div className="mt-5 rounded-2xl border-2 p-4" style={{ borderColor: YELLOW }}>
            <div className="flex items-start gap-3">
              <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-yellow-200 to-orange-200 text-[22px]">👨🏽</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-[16px] font-semibold">Suresh K.</div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                    style={{ background: "#FFF4C2", color: YELLOW_DEEP }}
                  >
                    ✓ TRUSTED
                  </span>
                </div>
                <div className="mt-0.5 text-[12px] text-black/55">★ 4.91 · 2,418 rides · KA 05 HM 1234</div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-black/[0.04] p-4 text-[12px] leading-[1.55] text-black/65">
            Tap the <span className="font-semibold">TRUSTED</span> badge to see what backs it.
          </div>
        </div>
      ),
      hotspots: [
        { top: "30%", left: "55%", width: "30%", height: "6%", to: "badge-2", label: "Open badge details" },
      ],
    },

    /* BADGE 2 — expanded */
    {
      id: "badge-2",
      featureKey: "badge",
      render: () => (
        <div className="flex h-full flex-col px-5 pt-5">
          <BackHeader label="Trusted Captain · Details" />
          <div className="mt-1 text-[22px] font-semibold leading-tight">Suresh K.</div>
          <div className="text-[12px] text-black/55">★ 4.91 · 2,418 rides</div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { v: "✓", l: "Verified docs" },
              { v: "0.8%", l: "Cancel rate" },
              { v: "✓", l: "Background" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-black/10 p-3 text-center">
                <div className="text-[18px] font-bold">{s.v}</div>
                <div className="mt-1 text-[9.5px] uppercase tracking-wider text-black/45">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2">
            {[
              "Aadhaar + DL verified · 2024-08",
              "Police background check · 2024-09",
              "0 safety complaints · 18 months",
              "Highest-rated 5% of Captains in BLR",
            ].map((line) => (
              <div key={line} className="flex items-center gap-2 rounded-xl border border-black/8 px-3 py-2.5 text-[12px] text-black/70">
                <span style={{ color: YELLOW_DEEP }}>✓</span>
                {line}
              </div>
            ))}
          </div>

          <div
            className="mt-auto mb-3 rounded-xl py-3 text-center text-[14px] font-semibold text-black"
            style={{ background: YELLOW }}
          >
            Continue with Suresh
          </div>
        </div>
      ),
      hotspots: [
        { top: "85%", left: "5%", width: "90%", height: "8%", to: "cover" },
      ],
    },

    /* LANG HI */
    {
      id: "lang-hi",
      featureKey: "lang",
      render: () => (
        <div className="flex h-full flex-col px-5 pt-5">
          <div className="flex items-center justify-between">
            <BackHeader label="First open" inline />
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: "#FFF4C2", color: YELLOW_DEEP }}>
              पहचाना गया: हिंदी
            </span>
          </div>
          <div className="mt-1.5 text-[22px] font-semibold">नमस्ते, कहाँ जाना है?</div>

          <div className="mt-5 rounded-2xl border border-black/10 px-4 py-3 text-[13px] text-black/55">
            🔍 गंतव्य खोजें
          </div>

          <div className="mt-5 text-[10px] uppercase tracking-[0.2em] text-black/45">
            सेव की गई जगहें
          </div>
          <div className="mt-2 space-y-2">
            {["घर · इंदिरानगर", "ऑफिस · कोरमंगला", "माँ · जयनगर"].map((p) => (
              <div key={p} className="rounded-xl border border-black/10 px-4 py-3 text-[13.5px]">{p}</div>
            ))}
          </div>

          <div className="mt-auto mb-3 rounded-xl py-3 text-center text-[14px] font-semibold text-black" style={{ background: YELLOW }}>
            बाइक बुक करें — ₹46
          </div>

          <div className="mb-3 rounded-xl border border-black/15 py-2.5 text-center text-[11px] text-black/60">
            Switch to English
          </div>
        </div>
      ),
      hotspots: [
        { top: "92%", left: "5%", width: "90%", height: "5%", to: "lang-en", label: "Switch to English" },
      ],
    },

    /* LANG EN */
    {
      id: "lang-en",
      featureKey: "lang",
      render: () => (
        <div className="flex h-full flex-col px-5 pt-5">
          <div className="flex items-center justify-between">
            <BackHeader label="First open" inline />
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: "#FFF4C2", color: YELLOW_DEEP }}>
              Detected: English
            </span>
          </div>
          <div className="mt-1.5 text-[22px] font-semibold">Hi, where to?</div>

          <div className="mt-5 rounded-2xl border border-black/10 px-4 py-3 text-[13px] text-black/55">
            🔍 Search destination
          </div>

          <div className="mt-5 text-[10px] uppercase tracking-[0.2em] text-black/45">Saved places</div>
          <div className="mt-2 space-y-2">
            {["Home · Indiranagar", "Office · Koramangala", "Mom · Jayanagar"].map((p) => (
              <div key={p} className="rounded-xl border border-black/10 px-4 py-3 text-[13.5px]">{p}</div>
            ))}
          </div>

          <div className="mt-auto mb-3 rounded-xl py-3 text-center text-[14px] font-semibold text-black" style={{ background: YELLOW }}>
            Book Bike — ₹46
          </div>

          <div className="mb-3 rounded-xl border border-black/15 py-2.5 text-center text-[11px] text-black/60">
            Back to walkthrough
          </div>
        </div>
      ),
      hotspots: [
        { top: "92%", left: "5%", width: "90%", height: "5%", to: "cover" },
      ],
    },

    /* PENALTY GOLD */
    {
      id: "penalty-gold",
      featureKey: "penalty",
      render: () => (
        <div className="flex h-full flex-col px-5 pt-5">
          <BackHeader label="Captain · Dashboard" />
          <div className="mt-1 text-[20px] font-semibold">Cancellation impact</div>

          <div className="mt-5 rounded-2xl p-4 border" style={{ background: "rgba(255,217,61,0.18)", borderColor: YELLOW }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9.5px] uppercase tracking-wider text-black/55">Current tier</div>
                <div className="mt-0.5 text-[22px] font-bold">Gold Captain</div>
              </div>
              <div className="text-right">
                <div className="text-[9.5px] uppercase tracking-wider text-black/55">Cancel rate</div>
                <div className="mt-0.5 text-[22px] font-bold">4%</div>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {[
              { l: "Match priority", v: "1st in queue" },
              { l: "Incentive", v: "+25% bonus" },
              { l: "Rider trust", v: "Highest" },
            ].map((r) => (
              <div key={r.l} className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2.5">
                <span className="text-[12px] text-black/55">{r.l}</span>
                <span className="text-[12.5px] font-semibold">{r.v}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-black/15 py-3 text-center text-[12px] text-black/65">
            What if I cancel 6 more rides? →
          </div>
        </div>
      ),
      hotspots: [
        { top: "70%", left: "5%", width: "90%", height: "7%", to: "penalty-restricted" },
      ],
    },

    /* PENALTY RESTRICTED */
    {
      id: "penalty-restricted",
      featureKey: "penalty",
      render: () => (
        <div className="flex h-full flex-col px-5 pt-5">
          <BackHeader label="Captain · Dashboard" />
          <div className="mt-1 text-[20px] font-semibold">Cancellation impact</div>

          <div className="mt-5 rounded-2xl p-4 border" style={{ background: "rgba(224,72,72,0.10)", borderColor: "#E04848" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9.5px] uppercase tracking-wider text-black/55">Current tier</div>
                <div className="mt-0.5 text-[22px] font-bold" style={{ color: "#a02020" }}>Restricted</div>
              </div>
              <div className="text-right">
                <div className="text-[9.5px] uppercase tracking-wider text-black/55">Cancel rate</div>
                <div className="mt-0.5 text-[22px] font-bold">22%</div>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {[
              { l: "Match priority", v: "Last in queue" },
              { l: "Incentive", v: "−20% · 24h cooldown" },
              { l: "Rider trust", v: "Low" },
            ].map((r) => (
              <div key={r.l} className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2.5">
                <span className="text-[12px] text-black/55">{r.l}</span>
                <span className="text-[12.5px] font-semibold" style={{ color: "#a02020" }}>{r.v}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-black/[0.04] p-3 text-[11.5px] leading-[1.55] text-black/65">
            Match algorithm reads tier in real-time. Reliable Captains get first pick — unreliable ones get throttled until behaviour improves.
          </div>

          <div className="mt-auto mb-4 rounded-xl border border-black/15 py-3 text-center text-[12px] text-black/60">
            ← Back to walkthrough
          </div>
        </div>
      ),
      hotspots: [
        { top: "90%", left: "5%", width: "90%", height: "6%", to: "cover" },
      ],
    },

    /* STREAK 4 */
    {
      id: "streak-4",
      featureKey: "streak",
      render: () => (
        <div className="flex h-full flex-col px-5 pt-5">
          <BackHeader label="Profile · Rewards" />
          <div className="mt-1 text-[22px] font-semibold">🔥 4-day streak</div>

          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => {
              const done = i < 4;
              return (
                <div
                  key={i}
                  className="flex aspect-square flex-col items-center justify-center rounded-lg border text-[14px] font-semibold"
                  style={{
                    background: done ? YELLOW : "white",
                    borderColor: done ? YELLOW : "rgba(0,0,0,0.12)",
                    color: done ? "black" : "rgba(0,0,0,0.45)",
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
              );
            })}
          </div>

          <div className="mt-5 space-y-2">
            {[
              { day: 3, label: "₹20 off next ride", unlocked: true },
              { day: 5, label: "₹50 off + priority match", unlocked: false },
              { day: 7, label: "Free Premier upgrade", unlocked: false },
            ].map((r) => (
              <div
                key={r.day}
                className="flex items-center justify-between rounded-xl border px-3 py-3"
                style={{
                  borderColor: r.unlocked ? YELLOW : "rgba(0,0,0,0.10)",
                  background: r.unlocked ? "#FFFBE0" : "white",
                  opacity: r.unlocked ? 1 : 0.55,
                }}
              >
                <div>
                  <div className="text-[12.5px] font-semibold">Day {r.day}</div>
                  <div className="text-[11px] text-black/55">{r.label}</div>
                </div>
                <div className="text-[18px]">{r.unlocked ? "🎁" : "🔒"}</div>
              </div>
            ))}
          </div>

          <div className="mt-auto mb-4 rounded-xl py-3 text-center text-[13px] font-semibold text-black" style={{ background: YELLOW }}>
            + Take today's ride
          </div>
        </div>
      ),
      hotspots: [
        { top: "90%", left: "5%", width: "90%", height: "6%", to: "streak-5" },
      ],
    },

    /* STREAK 5 */
    {
      id: "streak-5",
      featureKey: "streak",
      render: () => (
        <div className="flex h-full flex-col px-5 pt-5">
          <BackHeader label="Profile · Rewards" />
          <div className="mt-1 text-[22px] font-semibold">🔥 5-day streak — unlocked!</div>

          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => {
              const done = i < 5;
              return (
                <div
                  key={i}
                  className="flex aspect-square flex-col items-center justify-center rounded-lg border text-[14px] font-semibold"
                  style={{
                    background: done ? YELLOW : "white",
                    borderColor: done ? YELLOW : "rgba(0,0,0,0.12)",
                    color: done ? "black" : "rgba(0,0,0,0.45)",
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border-2 p-4" style={{ borderColor: YELLOW, background: "#FFFBE0" }}>
            <div className="flex items-center gap-3">
              <div className="text-[28px]">🎁</div>
              <div>
                <div className="text-[14px] font-bold">Day 5 reward unlocked</div>
                <div className="text-[12px] text-black/65">₹50 off your next ride + priority match for 24h</div>
              </div>
            </div>
            <div className="mt-4 rounded-xl py-2.5 text-center text-[13px] font-semibold text-black" style={{ background: YELLOW }}>
              Claim reward
            </div>
          </div>

          <div className="mt-auto mb-4 rounded-xl border border-black/15 py-2.5 text-center text-[11px] text-black/60">
            ← Back to walkthrough
          </div>
        </div>
      ),
      hotspots: [
        { top: "92%", left: "5%", width: "90%", height: "5%", to: "cover" },
      ],
    },
  ];
}

/* ───────────────────────────────────────────────────────────────── */
/* Small helpers                                                     */
/* ───────────────────────────────────────────────────────────────── */

function BackHeader({ label, inline }: { label: string; inline?: boolean }) {
  return (
    <div
      className={`text-[10px] uppercase ${inline ? "" : "block"} tracking-[0.22em] text-black/45`}
      style={{ fontFamily: "ui-monospace, Menlo, monospace" }}
    >
      {label}
    </div>
  );
}

function StepBar({ step }: { step: 0 | 1 | 2 }) {
  return (
    <div className="mt-4 flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-colors"
          style={{ background: step >= i ? YELLOW : "rgba(0,0,0,0.10)" }}
        />
      ))}
    </div>
  );
}
