import { Hero } from "@/components/home/Hero";
import { HeroCaseStudiesPlaceholder } from "@/components/home/HeroCaseStudiesPlaceholder";
import { ProjectGridPlaceholder } from "@/components/home/ProjectGridPlaceholder";
import { AboutPreviewPlaceholder } from "@/components/home/AboutPreviewPlaceholder";
import { ContactCTA } from "@/components/home/ContactCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HeroCaseStudiesPlaceholder />
      <ProjectGridPlaceholder />
      <AboutPreviewPlaceholder />
      <ContactCTA />
    </>
  );
}
