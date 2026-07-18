import { getLiveBlogs } from "@/lib/content";

export const revalidate = 3600;

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ishant-devdesign.vercel.app";

const CHANNEL_TITLE = "Ishant Kumar — Frontend Engineering & UI/UX Design";
const CHANNEL_DESCRIPTION =
  "Thoughts on frontend development, UI/UX design, and building thoughtful digital experiences.";

/** Escape a value used inside an XML attribute (URLs, alt text). */
function escapeXmlAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function imageMimeType(url: string) {
  const clean = url.split(/[?#]/)[0]?.toLowerCase() ?? "";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
}

export async function GET() {
  const blogs = await getLiveBlogs();
  const publishedBlogs = blogs.filter((blog) => blog.status === "published");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:wfw="http://wellformedweb.org/CommentAPI/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${CHANNEL_TITLE}]]></title>
    <description><![CDATA[${CHANNEL_DESCRIPTION}]]></description>
    <link>${baseUrl}</link>
    <language>en-US</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/favicon-96x96.png</url>
      <title><![CDATA[${CHANNEL_TITLE}]]></title>
      <link>${baseUrl}</link>
      <width>96</width>
      <height>96</height>
    </image>
    ${publishedBlogs
      .map((blog) => {
        const heroImage = blog.heroImage
          ? blog.heroImage.startsWith("http")
            ? blog.heroImage
            : `${baseUrl}${blog.heroImage}`
          : `${baseUrl}/og-image.png`;
        const imageUrl = escapeXmlAttribute(heroImage);
        const imageAlt = escapeXmlAttribute(blog.title);
        const contentHtml = `<p><img src="${imageUrl}" alt="${imageAlt}" /></p><p>${blog.excerpt}</p>`;

        return `
    <item>
      <title><![CDATA[${blog.title}]]></title>
      <description><![CDATA[${blog.excerpt}]]></description>
      <link>${baseUrl}/blogs/${blog.slug}</link>
      <guid isPermaLink="false">${baseUrl}/blogs/${blog.slug}</guid>
      <pubDate>${blog.publishedAtIso ? new Date(blog.publishedAtIso).toUTCString() : new Date().toUTCString()}</pubDate>
      <enclosure url="${imageUrl}" type="${imageMimeType(heroImage)}" length="0" />
      <media:content url="${imageUrl}" medium="image" />
      <media:thumbnail url="${imageUrl}" />
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
      ${blog.tags && blog.tags.length > 0 ? `<category><![CDATA[${blog.tags.join("]]></category><category><![CDATA[")}]]></category>` : ""}
    </item>`;
      })
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
