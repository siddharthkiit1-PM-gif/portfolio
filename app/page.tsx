import { Hero } from "@/components/home/Hero";
import { ExperienceSection } from "@/components/experience/ExperienceSection";
import { ProjectsSection } from "@/components/projects/ProjectsSection";
import { AboutPreviewPlaceholder } from "@/components/home/AboutPreviewPlaceholder";
import { ContactSection } from "@/components/home/ContactSection";
import { Reveal } from "@/components/scroll/Reveal";
import { CinematicIntro } from "@/components/cinematic/CinematicIntro";

export default function HomePage() {
  return (
    <>
      <CinematicIntro />
      <Hero />
      <Reveal>
        <ExperienceSection animate={true} />
      </Reveal>
      <Reveal>
        <ProjectsSection />
      </Reveal>
      <Reveal>
        <AboutPreviewPlaceholder />
      </Reveal>
      <Reveal>
        <ContactSection />
      </Reveal>
    </>
  );
}
