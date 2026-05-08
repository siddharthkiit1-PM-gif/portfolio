export function ContactCTA() {
  return (
    <section className="bg-black px-10 py-24 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[10px] tracking-[0.3em] text-white/40">CONTACT</p>
        <h2 className="mt-4 text-4xl font-light tracking-tight">
          The fastest way to reach me is the calendar.
        </h2>
        <a
          href="/contact"
          className="mt-8 inline-block rounded-full bg-white px-6 py-3 text-sm font-medium text-black"
        >
          Book a call
        </a>
      </div>
    </section>
  );
}
