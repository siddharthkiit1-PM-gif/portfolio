import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";
import { StickyResumePill } from "./StickyResumePill";

/**
 * SiteNav — single-page anchored nav. The portfolio lives on one document,
 * so "Work" jumps to the Experience section (career narrative), and
 * "Contact" jumps to the Reach Out section at the bottom of the homepage.
 */
export function SiteNav() {
  return (
    <nav className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-5">
      <Link href="/" className="flex items-center gap-3 text-sm" aria-label="Home — Siddharth Agrawal">
        <Monogram size={32} />
        <span className="font-medium">Siddharth Agrawal</span>
      </Link>
      <div className="hidden gap-6 text-[13px] text-white/70 md:flex">
        <a href="/#work" className="transition-colors hover:text-white">Work</a>
        <a href="/#contact" className="transition-colors hover:text-white">Contact</a>
      </div>
      <StickyResumePill />
    </nav>
  );
}
