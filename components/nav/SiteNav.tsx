import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";
import { StickyResumePill } from "./StickyResumePill";

export function SiteNav() {
  return (
    <nav className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-5">
      <Link href="/" className="flex items-center gap-3 text-sm" aria-label="Home — Siddharth Agrawal">
        <Monogram size={32} />
        <span className="font-medium">Siddharth Agrawal</span>
      </Link>
      <div className="hidden gap-6 text-[13px] text-white/70 md:flex">
        <Link href="/work">Work</Link>
        <Link href="/notes">Writing</Link>
        <Link href="/talks">Talks</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </div>
      <StickyResumePill />
    </nav>
  );
}
