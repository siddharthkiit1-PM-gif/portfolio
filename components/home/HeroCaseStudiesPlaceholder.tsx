export function HeroCaseStudiesPlaceholder() {
  return (
    <section id="work" className="bg-[#0a0c12] px-10 py-24 text-white">
      <p className="text-[10px] tracking-[0.3em] text-white/40">SELECTED WORK · 03</p>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative h-32 overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900"
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  i === 1
                    ? "radial-gradient(circle at 30% 40%, rgba(167,139,250,.5), transparent 60%)"
                    : i === 2
                      ? "radial-gradient(circle at 70% 60%, rgba(34,211,238,.5), transparent 60%)"
                      : "radial-gradient(circle at 50% 50%, rgba(244,114,182,.5), transparent 60%)",
              }}
            />
            <div className="absolute bottom-3 left-3 text-xs">Project {i} →</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-white/40">
        Real case studies land in Phase 4. This grid is structural.
      </p>
    </section>
  );
}
