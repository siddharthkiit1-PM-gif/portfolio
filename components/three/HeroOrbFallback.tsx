export function HeroOrbFallback() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 65% 45%, rgba(167,139,250,0.4) 0%, rgba(34,211,238,0.18) 35%, rgba(244,114,182,0.12) 60%, transparent 80%)",
        }}
      />
      <div
        className="absolute right-[6%] top-1/2 h-[70%] w-[36%] -translate-y-1/2 bg-cover bg-center md:right-[10%] md:w-[28%]"
        style={{
          backgroundImage: "url(/portrait/portrait-1024.png)",
          filter: "grayscale(0.6) contrast(1.05) brightness(0.9)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
