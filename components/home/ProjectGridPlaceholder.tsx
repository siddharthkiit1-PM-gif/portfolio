export function ProjectGridPlaceholder() {
  return (
    <section className="bg-black px-10 py-24 text-white">
      <p className="text-[10px] tracking-[0.3em] text-white/40">MORE WORK</p>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] rounded-lg bg-white/5" />
        ))}
      </div>
    </section>
  );
}
