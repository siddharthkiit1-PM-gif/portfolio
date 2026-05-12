import { Hero } from "@/components/home/Hero";
import { ExperienceSection } from "@/components/experience/ExperienceSection";
import { ProjectsSection } from "@/components/projects/ProjectsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { SiteFooter } from "@/components/home/SiteFooter";
import { Reveal } from "@/components/scroll/Reveal";
import { HashAnchorFix } from "@/components/scroll/HashAnchorFix";
import { CinematicIntro } from "@/components/cinematic/CinematicIntro";

export default function HomePage() {
  return (
    <>
      <CinematicIntro />
      <HashAnchorFix />
      <Hero />
      <Reveal>
        <ExperienceSection animate={true} />
      </Reveal>
      <Reveal>
        <ProjectsSection />
      </Reveal>
      <Reveal>
        <ContactSection />
      </Reveal>
      <SiteFooter />
    </>
  );
}
