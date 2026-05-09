import { Hero } from "@/components/home/Hero";
import { HeroCaseStudiesPlaceholder } from "@/components/home/HeroCaseStudiesPlaceholder";
import { ProjectGridPlaceholder } from "@/components/home/ProjectGridPlaceholder";
import { AboutPreviewPlaceholder } from "@/components/home/AboutPreviewPlaceholder";
import { ContactCTA } from "@/components/home/ContactCTA";
import { Reveal } from "@/components/scroll/Reveal";
import { CinematicIntro } from "@/components/cinematic/CinematicIntro";

export default function HomePage() {
  return (
    <>
      <CinematicIntro />
      <Hero />
      <Reveal>
        <HeroCaseStudiesPlaceholder />
      </Reveal>
      <Reveal>
        <ProjectGridPlaceholder />
      </Reveal>
      <Reveal>
        <AboutPreviewPlaceholder />
      </Reveal>
      <Reveal>
        <ContactCTA />
      </Reveal>
    </>
  );
}
