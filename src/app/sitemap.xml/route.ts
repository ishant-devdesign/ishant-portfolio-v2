import { NextResponse } from "next/server";
import { getLiveBlogs } from "@/lib/content";
import { getLiveProjects } from "@/lib/content";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ishant.dev";

export async function GET() {
  const [blogs, projects] = await Promise.all([
    getLiveBlogs(),
    getLiveProjects(),
  ]);

  const publishedBlogs = blogs.filter((blog) => blog.status === "published");
  const publishedProjects = projects.filter((project) => project.status === "published");

  const urls = [
    "",
    "/blogs",
    "/projects",
    "/pets",
    "/api/docs",
    ...publishedBlogs.map((blog) => `/blogs/${blog.slug}`),
    ...publishedProjects.map((project) => `/projects/${project.slug}`),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${url ? "monthly" : "weekly"}</changefreq>
    <priority>${url ? "0.8" : "1.0"}</priority>
  </url>`,
    )
    .join("")}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}