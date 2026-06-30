import { HomePage } from "@/components/home/home-page";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
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
import { ClientEffects } from "@/components/layout/client-effects";

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
      types: {
        "application/rss+xml": `${process.env.NEXT_PUBLIC_SITE_URL || "https://ishant.dev"}/rss.xml`,
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

  return (
    <SiteShell>
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
