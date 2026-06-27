import { NextResponse } from "next/server";

export function GET() {
  const robotsTxt = `
User-agent: *
Allow: /

Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL || "https://ishant.dev"}/sitemap.xml

Host: ${process.env.NEXT_PUBLIC_SITE_URL || "https://ishant.dev"}
`.trim();

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}