import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { ProjectDetailShell } from "@/components/projects/project-detail-shell";
import { getLiveProjectBySlug, getLiveProjects, getLiveTagSuggestions } from "@/lib/content";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ishant-devdesign.vercel.app";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getLiveProjectBySlug(slug);

  if (!project) return {};

  const ogImage = project.heroImage
    ? project.heroImage.startsWith("http")
      ? project.heroImage
      : `${baseUrl}${project.heroImage}`
    : `${baseUrl}/og-image.png`;

  return {
    title: `${project.title} — Ishant Kumar`,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      images: [{ url: ogImage }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.summary,
      images: [ogImage],
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, projects, tagSuggestions] = await Promise.all([
    getLiveProjectBySlug(slug),
    getLiveProjects(),
    getLiveTagSuggestions(),
  ]);

  if (!project) notFound();

  const publishedProjects = projects.filter((item) => item.status === "published");
  const currentIndex = publishedProjects.findIndex((item) => item.slug === project.slug);
  const nextProject =
    currentIndex >= 0 && currentIndex < publishedProjects.length - 1
      ? {
          slug: publishedProjects[currentIndex + 1].slug,
          title: publishedProjects[currentIndex + 1].title,
          heroImage: publishedProjects[currentIndex + 1].heroImage,
          sector: publishedProjects[currentIndex + 1].sector,
        }
      : null;

  return (
    <SiteShell>
      <ProjectDetailShell project={project} nextProject={nextProject} tagSuggestions={tagSuggestions} />
      <SiteFooter />
    </SiteShell>
  );
}