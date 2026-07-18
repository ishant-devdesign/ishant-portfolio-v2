type Crumb = { name: string; url: string };
type ListEntry = { name: string; url: string; image?: string };

type StructuredDataType =
  | "blogPosting"
  | "creativeWork"
  | "person"
  | "webSite"
  | "breadcrumb"
  | "collectionPage";

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
  personId,
  crumbs,
  items,
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
  personId?: string;
  crumbs?: Crumb[];
  items?: ListEntry[];
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ishant-devdesign.vercel.app";
  const absolute = (u: string) => (u.startsWith("http") ? u : `${baseUrl}${u}`);
  const fullUrl = absolute(url);

  const siteName = "Ishant Kumar";
  const websiteRef = { "@id": `${baseUrl}#website` };

  let structuredData: Record<string, unknown>;

  if (type === "breadcrumb") {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: (crumbs ?? []).map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: absolute(crumb.url),
      })),
    };
  } else if (type === "collectionPage") {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${fullUrl}#collection`,
      name: title,
      description: description,
      url: fullUrl,
      inLanguage: "en-US",
      isPartOf: websiteRef,
      ...(items &&
        items.length > 0 && {
          mainEntity: {
            "@type": "ItemList",
            itemListElement: items.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absolute(item.url),
              name: item.name,
              ...(item.image ? { image: absolute(item.image) } : {}),
            })),
          },
        }),
    };
  } else if (type === "webSite") {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${fullUrl}#website`,
      name: "Ishant Kumar Portfolio",
      url: fullUrl,
      description: description,
      inLanguage: "en-US",
      ...(image && { image: image }),
    };
  } else if (type === "person") {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: authorName,
      url: fullUrl,
      description: description,
      ...(image && { image: image }),
      sameAs: [],
    };
  } else if (type === "blogPosting") {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": fullUrl,
      },
      headline: title,
      description: description,
      inLanguage: "en-US",
      isPartOf: websiteRef,
      ...(image && { image: image }),
      ...(datePublished && { datePublished: datePublished }),
      ...(dateModified && { dateModified: dateModified }),
      author: personId
        ? { "@id": personId }
        : {
            "@type": "Person",
            name: authorName,
            url: baseUrl,
          },
      publisher: {
        "@type": "Organization",
        name: siteName,
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
        },
      },
      ...(tags && tags.length > 0 && { keywords: tags.join(", ") }),
    };
  } else {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": fullUrl,
      },
      name: title,
      description: description,
      inLanguage: "en-US",
      isPartOf: websiteRef,
      ...(image && { image: image }),
      ...(datePublished && { datePublished: datePublished }),
      ...(dateModified && { dateModified: dateModified }),
      creator: personId
        ? { "@id": personId }
        : {
            "@type": "Person",
            name: authorName,
            url: baseUrl,
          },
      ...(tags && tags.length > 0 && { keywords: tags.join(", ") }),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
