"use client";

/**
 * Rapido — interactive prototype for the 5 features from the product breakdown:
 * 1. Lite Mode UI (3-step booking)
 * 2. Trusted Captain Badge
 * 3. Regional Language Auto-Detect
 * 4. Captain Cancellation Penalty System
 * 5. Ride Streak Rewards
 *
 * Single-page, client-side, no backend. The phone frame is the canvas; the
 * left rail is the feature switcher with a one-line "what this proves".
 */

import { useMemo, useState } from "react";

type FeatureKey = "lite" | "badge" | "lang" | "penalty" | "streak";

const RAPIDO_YELLOW = "#FFD93D";

const FEATURES: { key: FeatureKey; n: string; title: string; tagline: string; metric: string }[] = [
  {
    key: "lite",
    n: "01",
    title: "Lite Mode UI",
    tagline: "Three taps. Pick, confirm, pay.",
    metric: "↑ First Ride Conversion · ↓ 1-Day Uninstall",
  },
  {
    key: "badge",
    n: "02",
    title: "Trusted Captain Badge",
    tagline: "Safety surfaced before the rider commits.",
    metric: "↑ NPS · ↓ Ride Cancellation",
  },
  {
    key: "lang",
    n: "03",
    title: "Regional Language Auto-Detect",
    tagline: "App opens in the rider's language on first launch.",
    metric: "↓ Time-to-Booking · ↑ Regional NPS",
  },
  {
    key: "penalty",
    n: "04",
    title: "Captain Cancellation Penalty",
    tagline: "Cancellation rate decides match priority.",
    metric: "↓ Cancellation · ↑ Rides per DAU",
  },
  {
    key: "streak",
    n: "05",
    title: "Ride Streak Rewards",
    tagline: "Daily ride builds a streak, unlocks payouts.",
    metric: "↑ Rides per DAU · ↑ % DAUs completing a ride",
  },
];

export default function RapidoPrototypePage() {
  const [active, setActive] = useState<FeatureKey>("lite");

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[1280px] px-6 py-16 sm:py-24">
        <Header />

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(360px,420px)] lg:gap-16">
          <FeatureRail active={active} onChange={setActive} />
          <PhoneStage active={active} />
        </div>

        <Footer />
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Header                                                              */
/* ─────────────────────────────────────────────────────────────────── */

function Header() {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div
          className="text-[10px] uppercase tracking-[0.32em] text-white/45"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
        >
          Prototype · Product Breakdown
        </div>
        <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
          Rapido — five features,{" "}
          <span style={{ color: RAPIDO_YELLOW }}>live and clickable.</span>
        </h1>
        <p className="mt-4 max-w-[640px] text-[15px] leading-[1.6] text-white/65">
          Took the five proposals from my product breakdown and built each one inside the same
          phone frame. Click a feature on the left, play with the version on the right. The
          metric line under each title is the number I expect to move.
        </p>
      </div>
      <a
        href="https://mousy-aries-c7e.notion.site/Product-Breakdown-Rapido-Bike-20c2d882650e80ecbd80d75bc738ae18"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[12px] text-white/80 transition hover:border-white/35 hover:text-white"
        style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: "0.16em", textTransform: "uppercase" }}
      >
        Full breakdown →
      </a>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Feature rail                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function FeatureRail({
  active,
  onChange,
}: {
  active: FeatureKey;
  onChange: (k: FeatureKey) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {FEATURES.map((f) => {
        const isActive = f.key === active;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange(f.key)}
            className="group relative w-full rounded-2xl border px-5 py-5 text-left transition"
            style={{
              borderColor: isActive ? RAPIDO_YELLOW : "rgba(255,255,255,0.10)",
              background: isActive
                ? "linear-gradient(180deg, rgba(255,217,61,0.10), rgba(255,217,61,0.02))"
                : "rgba(255,255,255,0.02)",
            }}
          >
            <div className="flex items-baseline gap-4">
              <span
                className="text-[11px] text-white/45"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: "0.2em" }}
              >
                {f.n}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-[16px] font-medium tracking-[-0.01em]" style={{ color: isActive ? RAPIDO_YELLOW : "white" }}>
                    {f.title}
                  </h3>
                </div>
                <p className="mt-1 text-[13.5px] leading-[1.55] text-white/65">{f.tagline}</p>
                <div
                  className="mt-2.5 text-[10.5px] text-white/40"
                  style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  {f.metric}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Phone stage                                                         */
/* ─────────────────────────────────────────────────────────────────── */

function PhoneStage({ active }: { active: FeatureKey }) {
  return (
    <div className="sticky top-8 self-start">
      <div
        className="relative mx-auto w-full max-w-[380px] rounded-[44px] border border-white/10 p-2 shadow-[0_30px_80px_-20px_rgba(255,217,61,0.18)]"
        style={{ background: "linear-gradient(180deg, #0d0d0d, #050505)" }}
      >
        {/* phone screen */}
        <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[36px] bg-white text-black">
          {/* status bar */}
          <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-medium text-black/70">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span>5G</span>
              <span>●●●●</span>
            </span>
          </div>

          {active === "lite" && <LiteModeDemo />}
          {active === "badge" && <BadgeDemo />}
          {active === "lang" && <LangDemo />}
          {active === "penalty" && <PenaltyDemo />}
          {active === "streak" && <StreakDemo />}
        </div>
      </div>
      <p
        className="mt-4 text-center text-[10.5px] text-white/45"
        style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: "0.18em", textTransform: "uppercase" }}
      >
        Interactive — tap inside the phone
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 1. Lite Mode                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function LiteModeDemo() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [liteOn, setLiteOn] = useState(true);

  if (!liteOn) {
    return (
      <div className="flex h-full flex-col px-4 pt-4">
        <FullHomeMock />
        <button
          onClick={() => setLiteOn(true)}
          className="absolute bottom-5 left-4 right-4 rounded-xl py-3 text-[13px] font-medium text-black shadow-lg"
          style={{ background: RAPIDO_YELLOW }}
        >
          ↺ Switch to Lite Mode
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-5 pt-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-black/45">Lite Mode · ON</div>
          <div className="mt-0.5 text-[20px] font-semibold leading-tight">Book in 3 taps</div>
        </div>
        <button
          onClick={() => setLiteOn(false)}
          className="rounded-full border border-black/15 px-3 py-1 text-[10px] text-black/60"
        >
          Full UI
        </button>
      </div>

      {/* Step indicator */}
      <div className="mt-5 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{ background: step > i ? RAPIDO_YELLOW : "rgba(0,0,0,0.10)" }}
          />
        ))}
      </div>

      <div className="mt-6 flex-1">
        {step === 0 && (
          <div className="space-y-3">
            <div className="text-[13px] font-medium text-black/60">Step 1 — Pick destination</div>
            {["🏠  Home", "🏢  Office", "🛒  Big Bazaar", "📍  Pick on map"].map((label, i) => (
              <button
                key={i}
                onClick={() => setStep(1)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 text-left text-[15px] font-medium shadow-sm active:scale-[0.99]"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="text-[13px] font-medium text-black/60">Step 2 — Confirm ride</div>
            <div className="rounded-2xl border border-black/10 p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-xl" style={{ background: "#FFF4C2" }}>🛵</div>
                <div>
                  <div className="text-[15px] font-semibold">Bike</div>
                  <div className="text-[12px] text-black/55">8 min · 2.4 km</div>
                </div>
                <div className="ml-auto text-[18px] font-semibold">₹46</div>
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full rounded-2xl py-4 text-[15px] font-semibold text-black"
              style={{ background: RAPIDO_YELLOW }}
            >
              Confirm
            </button>
            <button onClick={() => setStep(0)} className="w-full text-center text-[12px] text-black/45">
              ← back
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-[13px] font-medium text-black/60">Step 3 — Pay</div>
            {[
              { label: "UPI · GPay", sub: "siddharth@okhdfc" },
              { label: "Cash", sub: "Pay rider directly" },
              { label: "Wallet", sub: "₹120 balance" },
            ].map((m) => (
              <button
                key={m.label}
                onClick={() => setStep(3)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-left"
              >
                <div className="text-[14px] font-semibold">{m.label}</div>
                <div className="text-[11px] text-black/50">{m.sub}</div>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="grid size-16 place-items-center rounded-full" style={{ background: RAPIDO_YELLOW }}>
              <span className="text-[28px]">✓</span>
            </div>
            <div className="mt-4 text-[18px] font-semibold">Ride booked</div>
            <div className="mt-1 text-[12px] text-black/55">Captain Suresh · 3 min away</div>
            <button onClick={() => setStep(0)} className="mt-6 rounded-full border border-black/15 px-4 py-2 text-[11px] text-black/60">
              ↺ start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FullHomeMock() {
  // Intentionally cluttered — proves the "Bad: cluttered home" finding.
  return (
    <div className="space-y-3 pt-1">
      <div className="rounded-xl border border-black/10 p-2.5">
        <div className="text-[10px] uppercase tracking-wider text-black/40">where to?</div>
        <div className="mt-1 h-7 rounded-md bg-black/[0.04]" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {["🛵", "🚗", "🛺", "📦"].map((e, i) => (
          <div key={i} className="grid aspect-square place-items-center rounded-lg bg-black/[0.04] text-xl">
            {e}
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-black/[0.04] p-3">
        <div className="text-[10px] text-black/45">RAPIDO REWARDS · BANNER · MYNTRA AD</div>
        <div className="mt-1.5 h-12 rounded bg-gradient-to-r from-pink-200/60 via-yellow-200/60 to-emerald-200/60" />
      </div>
      <div className="rounded-xl bg-black/[0.04] p-3">
        <div className="text-[10px] text-black/45">REFER · WALLET · RENTALS · DOCS</div>
        <div className="mt-1.5 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-md bg-black/[0.06]" />
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-black/[0.04] p-3">
        <div className="text-[10px] text-black/45">SAFETY · OFFERS · GROUP RIDE</div>
        <div className="mt-1.5 h-10 rounded bg-black/[0.04]" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 2. Trusted Captain Badge                                            */
/* ─────────────────────────────────────────────────────────────────── */

function BadgeDemo() {
  const [trusted, setTrusted] = useState(true);

  return (
    <div className="flex h-full flex-col px-5 pt-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-black/45">Confirming your ride</div>
      <div className="mt-1 text-[20px] font-semibold">Your Captain</div>

      <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: trusted ? RAPIDO_YELLOW : "rgba(0,0,0,0.12)" }}>
        <div className="flex items-start gap-3">
          <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-yellow-200 to-orange-200 text-[22px]">
            👨🏽
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-[16px] font-semibold">Suresh K.</div>
              {trusted && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold"
                  style={{ background: "#FFF4C2", color: "#7a5b00" }}
                >
                  ✓ TRUSTED
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[12px] text-black/55">★ 4.91 · 2,418 rides · KA 05 HM 1234</div>
          </div>
        </div>

        {trusted && (
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-black/5 pt-3">
            <Stat label="Verified docs" value="✓" />
            <Stat label="Cancel rate" value="0.8%" />
            <Stat label="Background" value="✓" />
          </div>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-black/[0.04] p-3 text-[11.5px] leading-[1.55] text-black/65">
        Solves Riya&apos;s safety hesitation. Trusted badge shows{" "}
        <span className="font-medium">before</span> the rider commits — based on verified docs, ride
        history, and cancellation behaviour.
      </div>

      <button
        onClick={() => setTrusted(!trusted)}
        className="mt-auto mb-5 w-full rounded-xl border border-black/15 py-2.5 text-[12px] text-black/70"
      >
        {trusted ? "Hide trusted state" : "Show trusted state"}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[14px] font-semibold text-black/80">{value}</div>
      <div className="mt-0.5 text-[9.5px] uppercase tracking-wider text-black/45">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 3. Regional Language Auto-Detect                                    */
/* ─────────────────────────────────────────────────────────────────── */

type Lang = "en" | "hi" | "bn" | "kn";

const STRINGS: Record<Lang, { detected: string; greeting: string; where: string; book: string; saved: string; locations: string[] }> = {
  en: {
    detected: "Detected: English",
    greeting: "Hi, where to?",
    where: "Search destination",
    book: "Book Bike — ₹46",
    saved: "Saved places",
    locations: ["Home · Indiranagar", "Office · Koramangala", "Mom · Jayanagar"],
  },
  hi: {
    detected: "पहचाना गया: हिंदी",
    greeting: "नमस्ते, कहाँ जाना है?",
    where: "गंतव्य खोजें",
    book: "बाइक बुक करें — ₹46",
    saved: "सेव की गई जगहें",
    locations: ["घर · इंदिरानगर", "ऑफिस · कोरमंगला", "माँ · जयनगर"],
  },
  bn: {
    detected: "শনাক্ত: বাংলা",
    greeting: "হাই, কোথায় যাবেন?",
    where: "গন্তব্য খুঁজুন",
    book: "বাইক বুক করুন — ₹46",
    saved: "সেভ করা জায়গা",
    locations: ["বাড়ি · ইন্দিরানগর", "অফিস · কোরমঙ্গলা", "মা · জয়নগর"],
  },
  kn: {
    detected: "ಪತ್ತೆ: ಕನ್ನಡ",
    greeting: "ಹಾಯ್, ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?",
    where: "ಗಮ್ಯಸ್ಥಾನ ಹುಡುಕಿ",
    book: "ಬೈಕ್ ಬುಕ್ ಮಾಡಿ — ₹46",
    saved: "ಉಳಿಸಿದ ಸ್ಥಳಗಳು",
    locations: ["ಮನೆ · ಇಂದಿರಾನಗರ", "ಕಚೇರಿ · ಕೋರಮಂಗಲ", "ಅಮ್ಮ · ಜಯನಗರ"],
  },
};

function LangDemo() {
  const [lang, setLang] = useState<Lang>("hi");
  const s = STRINGS[lang];

  return (
    <div className="flex h-full flex-col px-5 pt-5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-black/45">First open</div>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{ background: "#FFF4C2", color: "#7a5b00" }}
        >
          {s.detected}
        </span>
      </div>
      <div className="mt-1.5 text-[20px] font-semibold">{s.greeting}</div>

      <div className="mt-5 rounded-2xl border border-black/10 px-4 py-3 text-[13px] text-black/55">
        🔍 {s.where}
      </div>

      <div className="mt-5 text-[11px] uppercase tracking-[0.18em] text-black/45">{s.saved}</div>
      <div className="mt-2 space-y-2">
        {s.locations.map((loc, i) => (
          <div key={i} className="rounded-xl border border-black/10 px-4 py-3 text-[13.5px]">
            {loc}
          </div>
        ))}
      </div>

      <button
        className="mt-auto mb-3 rounded-xl py-3 text-[14px] font-semibold text-black"
        style={{ background: RAPIDO_YELLOW }}
      >
        {s.book}
      </button>

      <div className="mb-4 flex gap-1.5">
        {(["en", "hi", "bn", "kn"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className="flex-1 rounded-lg border py-1.5 text-[10.5px] font-medium"
            style={{
              borderColor: lang === l ? "black" : "rgba(0,0,0,0.12)",
              background: lang === l ? "black" : "white",
              color: lang === l ? "white" : "rgba(0,0,0,0.6)",
            }}
          >
            {l === "en" ? "EN" : l === "hi" ? "हिं" : l === "bn" ? "বাং" : "ಕನ್"}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 4. Cancellation Penalty                                             */
/* ─────────────────────────────────────────────────────────────────── */

function PenaltyDemo() {
  const [cancelRate, setCancelRate] = useState(12); // %

  const tier = useMemo(() => {
    if (cancelRate <= 5) return { name: "Gold Captain", color: "#FFD93D", priority: "1st in queue", bonus: "+25% incentive" };
    if (cancelRate <= 10) return { name: "Silver", color: "#C7C7C7", priority: "2nd in queue", bonus: "+10% incentive" };
    if (cancelRate <= 20) return { name: "Standard", color: "#888", priority: "Normal queue", bonus: "No bonus" };
    return { name: "Restricted", color: "#E04848", priority: "Last in queue", bonus: "−20% incentive · 24h cooldown" };
  }, [cancelRate]);

  return (
    <div className="flex h-full flex-col px-5 pt-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-black/45">Captain side · Dashboard</div>
      <div className="mt-1 text-[18px] font-semibold">Cancellation impact</div>

      <div className="mt-5 rounded-2xl p-4" style={{ background: tier.color + "20", border: `1px solid ${tier.color}` }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-black/50">Current tier</div>
            <div className="mt-1 text-[20px] font-bold" style={{ color: tier.name === "Restricted" ? "#a02020" : "black" }}>
              {tier.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-black/50">Cancel rate</div>
            <div className="mt-1 text-[20px] font-bold">{cancelRate}%</div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Row label="Match priority" value={tier.priority} />
        <Row label="Incentive" value={tier.bonus} />
        <Row label="Rider trust" value={cancelRate <= 5 ? "Highest" : cancelRate <= 10 ? "High" : cancelRate <= 20 ? "Neutral" : "Low"} />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-[10.5px] text-black/55">
          <span>Drag to simulate cancel rate</span>
          <span>{cancelRate}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={35}
          value={cancelRate}
          onChange={(e) => setCancelRate(Number(e.target.value))}
          className="w-full accent-yellow-400"
        />
      </div>

      <div className="mt-4 rounded-xl bg-black/[0.04] p-3 text-[11px] leading-[1.55] text-black/65">
        Match algorithm reads tier in real-time. Reliable Captains get first pick of rides —
        unreliable ones get throttled until behaviour improves.
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2.5">
      <span className="text-[11.5px] text-black/55">{label}</span>
      <span className="text-[12.5px] font-semibold">{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 5. Streak Rewards                                                   */
/* ─────────────────────────────────────────────────────────────────── */

function StreakDemo() {
  const [streak, setStreak] = useState(4);

  const rewards = [
    { day: 3, label: "₹20 off next ride", unlocked: streak >= 3 },
    { day: 5, label: "₹50 off + priority match", unlocked: streak >= 5 },
    { day: 7, label: "Free Premier upgrade", unlocked: streak >= 7 },
  ];

  return (
    <div className="flex h-full flex-col px-5 pt-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-black/45">Profile · Rewards</div>
      <div className="mt-1 text-[20px] font-semibold">
        🔥 {streak}-day streak
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => {
          const done = i < streak;
          return (
            <div
              key={i}
              className="flex aspect-square flex-col items-center justify-center rounded-lg border text-[10px]"
              style={{
                background: done ? RAPIDO_YELLOW : "white",
                borderColor: done ? RAPIDO_YELLOW : "rgba(0,0,0,0.12)",
                color: done ? "black" : "rgba(0,0,0,0.45)",
              }}
            >
              <span className="text-[14px]">{done ? "✓" : i + 1}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-2">
        {rewards.map((r) => (
          <div
            key={r.day}
            className="flex items-center justify-between rounded-xl border px-3 py-3"
            style={{
              borderColor: r.unlocked ? RAPIDO_YELLOW : "rgba(0,0,0,0.10)",
              background: r.unlocked ? "#FFFBE0" : "white",
              opacity: r.unlocked ? 1 : 0.55,
            }}
          >
            <div>
              <div className="text-[12.5px] font-semibold">Day {r.day}</div>
              <div className="text-[11px] text-black/55">{r.label}</div>
            </div>
            <div className="text-[16px]">{r.unlocked ? "🎁" : "🔒"}</div>
          </div>
        ))}
      </div>

      <div className="mt-auto mb-4 flex gap-2">
        <button
          onClick={() => setStreak(Math.max(0, streak - 1))}
          className="flex-1 rounded-xl border border-black/15 py-2.5 text-[12px]"
        >
          − Skip a day
        </button>
        <button
          onClick={() => setStreak(Math.min(7, streak + 1))}
          className="flex-1 rounded-xl py-2.5 text-[12px] font-semibold text-black"
          style={{ background: RAPIDO_YELLOW }}
        >
          + Take a ride
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Footer                                                              */
/* ─────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="mt-20 grid grid-cols-1 gap-8 border-t border-white/10 pt-10 sm:grid-cols-3">
      <FooterBlock
        label="Why these five"
        body="Each one targets a specific journey-map drop-off — onboarding clutter, captain match anxiety, English-only Tier-2 friction, cancel-rate trust loss, and casual-user retention."
      />
      <FooterBlock
        label="What I'd ship first"
        body="Trusted Captain Badge → Cancellation Penalty → Lite Mode. The first two move trust and cancellation together; Lite Mode pays off only once supply is reliable."
      />
      <FooterBlock
        label="What I'd measure"
        body="First Ride Conversion, Ride Cancellation Rate, NPS by language cohort, Captain match P95. Streak engagement is a vanity metric until rides-per-DAU moves with it."
      />
    </footer>
  );
}

function FooterBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div
        className="text-[10px] uppercase tracking-[0.22em] text-white/45"
        style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
      >
        {label}
      </div>
      <p className="mt-3 text-[13.5px] leading-[1.6] text-white/70">{body}</p>
    </div>
  );
}
