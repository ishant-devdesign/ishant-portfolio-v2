import { getLiveBlogs } from "@/lib/content";

export const revalidate = 3600;

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ishant-devdesign.vercel.app";

export async function GET() {
  const blogs = await getLiveBlogs();
  const publishedBlogs = blogs.filter((blog) => blog.status === "published");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[Ishant Kumar — Frontend Engineering & UI/UX Design]]></title>
    <description><![CDATA[Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences.]]></description>
    <link>${baseUrl}</link>
    <language>en-US</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${publishedBlogs
      .map(
        (blog) => `
    <item>
      <title><![CDATA[${blog.title}]]></title>
      <description><![CDATA[${blog.excerpt}]]></description>
      <link>${baseUrl}/blogs/${blog.slug}</link>
      <guid isPermaLink="false">${baseUrl}/blogs/${blog.slug}</guid>
      <pubDate>${blog.publishedAtIso ? new Date(blog.publishedAtIso).toUTCString() : new Date().toUTCString()}</pubDate>
      <content:encoded><![CDATA[${blog.excerpt}]]></content:encoded>
      ${blog.tags && blog.tags.length > 0 ? `<category><![CDATA[${blog.tags.join("]]></category><category><![CDATA[")}]]></category>` : ""}
    </item>`,
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(rssFeed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
