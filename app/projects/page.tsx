import type { Metadata } from "next";
import { ProjectsIndex } from "@/components/projects/ProjectsIndex";

export const metadata: Metadata = {
  title: "Projects \u2014 Siddharth Agrawal",
  description: "Projects and case studies by Siddharth Agrawal.",
};

export default function ProjectsPage() {
  return <ProjectsIndex />;
}
