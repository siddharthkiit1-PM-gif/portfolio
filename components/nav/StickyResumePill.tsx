"use client";

export function StickyResumePill({
  resumeHref = "#",
  workHref = "#work",
}: {
  resumeHref?: string;
  workHref?: string;
}) {
  return (
    <div className="flex gap-2">
      <a
        href={workHref}
        className="rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-xs text-white/85 backdrop-blur hover:bg-white/10"
      >
        ↓ Skip to work
      </a>
      <a
        href={resumeHref}
        className="rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-black hover:bg-white/90"
      >
        Résumé
      </a>
    </div>
  );
}
