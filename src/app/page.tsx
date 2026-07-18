import { HomePage } from "@/components/home/home-page";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { StructuredData } from "@/components/seo/structured-data";
import {
  getLiveBlogs,
  getLiveCertifications,
  getLiveCreativeArchive,
  getLiveEducationItems,
  getLiveHomeToolsContent,
  getLivePets,
  getLiveProjects,
  getLiveSiteSettings,
  getLiveWorkExperience,
} from "@/lib/content";
import { homeSections } from "@/lib/site-config";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getLiveSiteSettings();

  return {
    title: `${siteSettings.siteName} — ${siteSettings.roleLabel}`,
    description: siteSettings.heroSubheading,
    openGraph: {
      title: siteSettings.siteName,
      description: siteSettings.heroSubheading,
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
      title: siteSettings.siteName,
      description: siteSettings.heroSubheading,
      images: ["/og-image.png"],
    },
    alternates: {
      canonical: "/",
      types: {
        "application/rss+xml": `${process.env.NEXT_PUBLIC_SITE_URL || "https://ishant-devdesign.vercel.app"}/rss.xml`,
      },
    },
  };
}

export default async function Page() {
  const [
    siteSettings,
    projects,
    blogs,
    certifications,
    pets,
    creativeArchive,
    workExperience,
    educationItems,
    toolsContent,
  ] = await Promise.all([
    getLiveSiteSettings(),
    getLiveProjects(),
    getLiveBlogs(),
    getLiveCertifications(),
    getLivePets(),
    getLiveCreativeArchive(),
    getLiveWorkExperience(),
    getLiveEducationItems(),
    getLiveHomeToolsContent(),
  ]);

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ishant-devdesign.vercel.app";

  return (
    <SiteShell>
      <StructuredData
        type="webSite"
        title="Ishant Kumar — Frontend Engineer & UI Designer"
        description="Frontend Engineer specializing in React, Next.js, TypeScript, and modern UI systems. Explore projects, case studies, blogs, certifications, and the design process behind every interface."
        url={baseUrl}
      />
      <HomePage
        siteSettings={siteSettings}
        projects={projects}
        blogs={blogs}
        certifications={certifications}
        pets={pets}
        creativeArchive={creativeArchive}
        homeSections={homeSections}
        toolsGroups={toolsContent.groups}
        workExperience={workExperience}
        educationItems={educationItems}
      />
      <SiteFooter />
    </SiteShell>
  );
}
