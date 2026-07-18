import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { ProjectDetailShell } from "@/components/projects/project-detail-shell";
import { StructuredData } from "@/components/seo/structured-data";
import {
  getLiveProjectBySlug,
  getLiveProjects,
  getLiveTagSuggestions,
} from "@/lib/content";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ishant-devdesign.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getLiveProjectBySlug(slug);

  if (!project) return {};

  const ogImage = project.heroImage
    ? project.heroImage.startsWith("http")
      ? project.heroImage
      : `${baseUrl}${project.heroImage}`
    : `${baseUrl}/og-image.png`;

  return {
    title: project.title,
    description: project.summary,
    keywords: project.tags,
    openGraph: {
      title: project.title,
      description: project.summary,
      images: [{ url: ogImage, alt: project.title }],
      type: "article",
      url: `/projects/${slug}`,
      siteName: "Ishant Kumar",
      ...(project.publishedAtIso && { publishedTime: project.publishedAtIso }),
      ...(project.updatedAt && {
        modifiedTime: project.updatedAt.toISOString(),
      }),
      authors: [baseUrl],
      section: "Projects",
      tags: project.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.summary,
      images: [ogImage],
    },
    alternates: {
      canonical: `/projects/${slug}`,
      types: {
        "application/rss+xml": `${baseUrl}/rss.xml`,
      },
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

  const publishedProjects = projects.filter(
    (item) => item.status === "published",
  );
  const currentIndex = publishedProjects.findIndex(
    (item) => item.slug === project.slug,
  );
  const nextProject =
    currentIndex >= 0 && currentIndex < publishedProjects.length - 1
      ? {
          slug: publishedProjects[currentIndex + 1].slug,
          title: publishedProjects[currentIndex + 1].title,
          heroImage: publishedProjects[currentIndex + 1].heroImage,
          sector: publishedProjects[currentIndex + 1].sector,
        }
      : null;

  const ogImage = project.heroImage
    ? project.heroImage.startsWith("http")
      ? project.heroImage
      : `${baseUrl}${project.heroImage}`
    : `${baseUrl}/og-image.png`;

  return (
    <SiteShell>
      <StructuredData
        type="breadcrumb"
        title={project.title}
        description={project.summary}
        url={`/projects/${slug}`}
        crumbs={[
          { name: "Home", url: "/" },
          { name: "Projects", url: "/projects" },
          { name: project.title, url: `/projects/${slug}` },
        ]}
      />
      <StructuredData
        type="creativeWork"
        title={project.title}
        description={project.summary}
        image={ogImage}
        datePublished={project.publishedAtIso || undefined}
        dateModified={project.updatedAt?.toISOString()}
        tags={project.tags}
        url={`/projects/${slug}`}
        personId={`${baseUrl}#person`}
      />
      <ProjectDetailShell
        project={project}
        nextProject={nextProject}
        tagSuggestions={tagSuggestions}
      />
      <SiteFooter />
    </SiteShell>
  );
}
