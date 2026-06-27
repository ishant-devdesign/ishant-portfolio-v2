import { HomePage } from "@/components/home/home-page";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  getLiveBlogs,
  getLiveCertifications,
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
    },
    twitter: {
      card: "summary",
      title: siteSettings.siteName,
      description: siteSettings.heroSubheading,
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
    workExperience,
    educationItems,
    toolsContent,
  ] = await Promise.all([
    getLiveSiteSettings(),
    getLiveProjects(),
    getLiveBlogs(),
    getLiveCertifications(),
    getLivePets(),
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
        homeSections={homeSections}
        toolsGroups={toolsContent.groups}
        workExperience={workExperience}
        educationItems={educationItems}
      />
      <SiteFooter />
    </SiteShell>
  );
}
