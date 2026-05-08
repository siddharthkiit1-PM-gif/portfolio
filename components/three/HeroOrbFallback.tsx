export function HeroOrbFallback() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-[55%] top-[35%] -z-10 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[60px]"
      style={{
        background:
          "conic-gradient(from 120deg, #7c3aed, #06b6d4, #f472b6, #7c3aed)",
      }}
    />
  );
}
