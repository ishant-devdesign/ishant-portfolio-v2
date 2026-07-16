import { ProjectsArchivePage } from "@/components/projects/projects-archive-page";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { StructuredData } from "@/components/seo/structured-data";
import { getLiveProjects } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects — Ishant Kumar",
  description: "Selected frontend projects showcasing React, Next.js, and UI/UX design work.",
  openGraph: {
    title: "Projects — Ishant Kumar",
    description: "Selected frontend projects showcasing React, Next.js, and UI/UX design work.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ishant Kumar Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects — Ishant Kumar",
    description: "Selected frontend projects showcasing React, Next.js, and UI/UX design work.",
    images: ["/og-image.png"],
  },
};

export default async function ProjectsPage() {
  const projects = await getLiveProjects();

  return (
    <SiteShell>
      <StructuredData
        type="webSite"
        title="Projects — Ishant Kumar"
        description="Selected frontend projects showcasing React, Next.js, and UI/UX design work."
        url="/projects"
      />
      <ProjectsArchivePage projects={projects} />
      <SiteFooter />
    </SiteShell>
  );
}
