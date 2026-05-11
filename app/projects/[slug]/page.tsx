import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ProjectDetail } from "@/components/projects/ProjectDetail";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchQuery(api.projects.getBySlug, { slug }).catch((err) => {
    console.error("generateMetadata: getBySlug failed", { slug, err });
    return null;
  });
  if (!project) {
    return { title: "Project \u2014 Siddharth Agrawal" };
  }
  const titleLine = project.outcome ?? project.title;
  return {
    title: `${titleLine} \u2014 Siddharth Agrawal`,
    description: project.problem.slice(0, 160),
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  return <ProjectDetail slug={slug} />;
}
