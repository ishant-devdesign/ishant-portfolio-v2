type StructuredDataType = "blogPosting" | "creativeWork" | "person" | "webSite";

export function StructuredData({
  type,
  title,
  description,
  image,
  datePublished,
  dateModified,
  tags,
  authorName = "Ishant Kumar",
  url,
}: {
  type: StructuredDataType;
  title: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  tags?: string[];
  authorName?: string;
  url: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ishant-devdesign.vercel.app";
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  const siteName = "Ishant Kumar";

  const structuredData = type === "webSite"
    ? {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Ishant Kumar Portfolio",
        "url": fullUrl,
        "description": description,
        ...(image && { "image": image }),
      }
    : type === "person"
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": fullUrl,
        },
        "headline": title,
        "description": description,
        ...(image && { "image": image }),
        ...(datePublished && { "datePublished": datePublished }),
        ...(dateModified && { "dateModified": dateModified }),
        "author": {
          "@type": "Person",
          "name": authorName,
          "url": baseUrl,
        },
        "publisher": {
          "@type": "Organization",
          "name": siteName,
          "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/og-image.png`,
            "width": 1200,
            "height": 630,
          },
        },
        ...(tags && tags.length > 0 && { "keywords": tags.join(", ") }),
      }
    : {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": fullUrl,
        },
        "name": title,
        "description": description,
        ...(image && { "image": image }),
        ...(datePublished && { "datePublished": datePublished }),
        ...(dateModified && { "dateModified": dateModified }),
        "creator": {
          "@type": "Person",
          "name": authorName,
          "url": baseUrl,
        },
        ...(tags && tags.length > 0 && { "keywords": tags.join(", ") }),
      };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}