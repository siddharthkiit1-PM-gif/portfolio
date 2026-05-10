"use client";

const SERIF_ITALIC: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  fontStyle: "italic",
  fontWeight: 300,
};

type Props = {
  /** Zero-based index; rendered as a 2-digit string ("01", "02", "03"). */
  index: number;
  /** When true, the numeral is sticky inside its parent (desktop). */
  sticky?: boolean;
};

export function ChapterNumeral({ index, sticky = false }: Props) {
  const label = String(index + 1).padStart(2, "0");
  return (
    <div
      aria-hidden
      className={
        sticky
          ? // Sticky only on md+. On mobile the section flows single-column
            // and viewport is too short for sticky to feel calm — it would
            // scroll-jam. Mobile renders the numeral as a static top-of-card
            // decoration at a smaller size + paler tone.
            "text-[64px] leading-none tracking-[-2px] text-white/[0.12] md:sticky md:top-24 md:text-[clamp(96px,12vw,144px)] md:tracking-[-3px] md:text-white/[0.08]"
          : "text-[64px] leading-none tracking-[-2px] text-white/[0.12]"
      }
      style={SERIF_ITALIC}
    >
      {label}
    </div>
  );
}
