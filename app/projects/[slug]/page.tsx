import type { Metadata } from "next";
import Script from "next/script";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ProjectDetail } from "@/components/projects/ProjectDetail";
import { SITE_URL } from "@/lib/site";

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
    return { title: "Project" };
  }
  const titleLine = project.outcome ?? project.title;
  const description = project.tagline ?? project.problem.slice(0, 160);
  const canonical = `/projects/${slug}`;
  return {
    title: titleLine,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: `${SITE_URL}${canonical}`,
      title: titleLine,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: titleLine,
      description,
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const project = await fetchQuery(api.projects.getBySlug, { slug }).catch(() => null);

  const jsonLd = project
    ? {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: project.title,
        headline: project.outcome ?? project.title,
        description: project.tagline ?? project.problem.slice(0, 200),
        dateCreated: project.year,
        url: `${SITE_URL}/projects/${slug}`,
        author: {
          "@type": "Person",
          name: "Siddharth Agrawal",
          url: SITE_URL,
        },
        keywords: project.techStack?.join(", "),
      }
    : null;

  return (
    <>
      <ProjectDetail slug={slug} />
      {jsonLd && (
        <Script
          id={`project-jsonld-${slug}`}
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify(jsonLd)}
        </Script>
      )}
    </>
  );
}
