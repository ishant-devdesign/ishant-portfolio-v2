import { ProjectsArchivePage } from "@/components/projects/projects-archive-page";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { getLiveProjects } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects — Ishant Kumar",
  description: "Selected frontend projects showcasing React, Next.js, and UI/UX design work.",
  openGraph: {
    title: "Projects — Ishant Kumar",
    description: "Selected frontend projects showcasing React, Next.js, and UI/UX design work.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Projects — Ishant Kumar",
    description: "Selected frontend projects showcasing React, Next.js, and UI/UX design work.",
  },
};

export default async function ProjectsPage() {
  const projects = await getLiveProjects();

  return (
    <SiteShell>
      <ProjectsArchivePage projects={projects} />
      <SiteFooter />
    </SiteShell>
  );
}
