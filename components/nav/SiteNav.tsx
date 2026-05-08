import Link from "next/link";
import { StickyResumePill } from "./StickyResumePill";

export function SiteNav() {
  return (
    <nav className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-5">
      <Link href="/" className="flex items-center gap-2.5 text-sm">
        <span
          aria-hidden
          className="inline-block size-5 rounded-md bg-gradient-to-br from-violet-400 to-cyan-400"
        />
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
