import { BlogsArchivePage } from "@/components/blogs/blogs-archive-page";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { StructuredData } from "@/components/seo/structured-data";
import { getLiveBlogs } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences.",
  openGraph: {
    title: "Blog — Ishant Kumar",
    description:
      "Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences.",
    type: "website",
    url: "/blogs",
    siteName: "Ishant Kumar",
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
    description:
      "Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/blogs",
    types: {
      "application/rss+xml": `${process.env.NEXT_PUBLIC_SITE_URL || "https://ishant-devdesign.vercel.app"}/rss.xml`,
    },
  },
};

export default async function BlogsPage() {
  const blogs = await getLiveBlogs();
  const published = blogs.filter((blog) => blog.status === "published");

  return (
    <SiteShell>
      <StructuredData
        type="collectionPage"
        title="Blog — Ishant Kumar"
        description="Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences."
        url="/blogs"
        items={published.map((blog) => ({
          name: blog.title,
          url: `/blogs/${blog.slug}`,
          ...(blog.heroImage ? { image: blog.heroImage } : {}),
        }))}
      />
      <BlogsArchivePage blogs={blogs} />
      <SiteFooter />
    </SiteShell>
  );
}
