import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { BlogDetailShell } from "@/components/blogs/blog-detail-shell";
import { getLiveBlogBySlug, getLiveBlogs, getLiveTagSuggestions } from "@/lib/content";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ishant-devdesign.vercel.app";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getLiveBlogBySlug(slug);

  if (!blog) return {};

  const ogImage = blog.heroImage
    ? blog.heroImage.startsWith("http")
      ? blog.heroImage
      : `${baseUrl}${blog.heroImage}`
    : `${baseUrl}/og-image.png`;

  return {
    title: `${blog.title} — Ishant Kumar`,
    description: blog.excerpt,
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: [{ url: ogImage }],
      type: "article",
      publishedTime: blog.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.excerpt,
      images: [ogImage],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [blog, blogs, tagSuggestions] = await Promise.all([
    getLiveBlogBySlug(slug),
    getLiveBlogs(),
    getLiveTagSuggestions(),
  ]);

  if (!blog) notFound();

  const publishedBlogs = blogs.filter((item) => item.status === "published");
  const currentIndex = publishedBlogs.findIndex((item) => item.slug === blog.slug);
  const nextBlog =
    currentIndex >= 0 && currentIndex < publishedBlogs.length - 1
      ? {
          slug: publishedBlogs[currentIndex + 1].slug,
          title: publishedBlogs[currentIndex + 1].title,
          heroImage: publishedBlogs[currentIndex + 1].heroImage,
          publishedLabel: publishedBlogs[currentIndex + 1].publishedLabel,
        }
      : null;

  return (
    <SiteShell>
      <BlogDetailShell blog={blog} nextBlog={nextBlog} tagSuggestions={tagSuggestions} />
      <SiteFooter />
    </SiteShell>
  );
}