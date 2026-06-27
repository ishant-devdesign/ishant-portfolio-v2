import { BlogsArchivePage } from "@/components/blogs/blogs-archive-page";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { getLiveBlogs } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Ishant Kumar",
  description: "Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences.",
  openGraph: {
    title: "Blog — Ishant Kumar",
    description: "Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blog — Ishant Kumar",
    description: "Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences.",
  },
};

export default async function BlogsPage() {
  const blogs = await getLiveBlogs();

  return (
    <SiteShell>
      <BlogsArchivePage blogs={blogs} />
      <SiteFooter />
    </SiteShell>
  );
}
