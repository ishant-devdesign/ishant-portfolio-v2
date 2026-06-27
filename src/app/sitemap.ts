import type { MetadataRoute } from "next";

import { getLiveBlogs, getLiveProjects } from "@/lib/content";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ishant.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogs, projects] = await Promise.all([
    getLiveBlogs(),
    getLiveProjects(),
  ]);

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },

    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },

    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },

    {
      url: `${baseUrl}/pets`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },

    {
      url: `${baseUrl}/api/docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  blogs
    .filter((blog) => blog.status === "published")
    .forEach((blog) => {
      routes.push({
        url: `${baseUrl}/blogs/${blog.slug}`,
        lastModified: blog.updatedAt ?? blog.createdAt ?? new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    });

  projects
    .filter((project) => project.status === "published")
    .forEach((project) => {
      routes.push({
        url: `${baseUrl}/projects/${project.slug}`,
        lastModified: project.updatedAt ?? project.createdAt ?? new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    });

  return routes;
}
