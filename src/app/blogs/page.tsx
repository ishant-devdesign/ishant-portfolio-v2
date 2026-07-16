import { BlogsArchivePage } from "@/components/blogs/blogs-archive-page";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { StructuredData } from "@/components/seo/structured-data";
import { getLiveBlogs } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Ishant Kumar",
  description: "Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences.",
  openGraph: {
    title: "Blog — Ishant Kumar",
    description: "Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences.",
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
    title: "Blog — Ishant Kumar",
    description: "Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences.",
    images: ["/og-image.png"],
  },
};

export default async function BlogsPage() {
  const blogs = await getLiveBlogs();

  return (
    <SiteShell>
      <StructuredData
        type="webSite"
        title="Blog — Ishant Kumar"
        description="Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences."
        url="/blogs"
      />
      <BlogsArchivePage blogs={blogs} />
      <SiteFooter />
    </SiteShell>
  );
}
