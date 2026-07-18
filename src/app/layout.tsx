import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Geist_Mono,
  Roboto_Flex,
  Space_Grotesk,
  Geist,
} from "next/font/google";
import "./globals.css";
import { AdminSessionProvider } from "@/components/admin/admin-session-provider";
import { AdminFloatPill } from "@/components/admin/admin-float-pill";
import { ExperienceProvider } from "@/components/motion/experience-provider";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import { getLiveSiteSettings } from "@/lib/content";
import { getAdminContext } from "@/lib/auth/admin";
import { cn } from "@/lib/utils";
import { SpeedInsights } from "@vercel/speed-insights/next";

/** Canonical production origin — the single source for every SEO URL. */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ishant-devdesign.vercel.app";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const robotoFlex = Roboto_Flex({
  variable: "--font-editorial",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-quote",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  applicationName: "Ishant Kumar",

  title: {
    default: "Ishant Kumar — Frontend Engineer & UI Designer",
    template: "%s • Ishant Kumar",
  },

  description:
    "Frontend Engineer specializing in React, Next.js, TypeScript, and modern UI systems. Explore projects, case studies, blogs, certifications, and the design process behind every interface.",

  keywords: [
    "Ishant Kumar",
    "Frontend Engineer",
    "Frontend Developer",
    "React Developer",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "React",
    "Tailwind CSS",
    "UI Design",
    "UX Design",
    "Portfolio",
    "Web Development",
    "Frontend Portfolio",
  ],

  authors: [
    {
      name: "Ishant Kumar",
      url: process.env.NEXT_PUBLIC_SITE_URL,
    },
  ],

  creator: "Ishant Kumar",

  publisher: "Ishant Kumar",

  category: "Technology",

  alternates: {
    canonical: "/",
  },

  referrer: "origin-when-cross-origin",

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "Ishant Kumar — Frontend Engineer & UI Designer",
    description:
      "Frontend Engineer specializing in React, Next.js, TypeScript, and modern UI systems.",

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
    title: "Ishant Kumar — Frontend Engineer & UI Designer",
    description:
      "Frontend Engineer specializing in React, Next.js, TypeScript, and modern UI systems.",

    images: ["/og-image.png"],
  },

  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        url: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    shortcut: "/favicon.ico",

    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",

  appleWebApp: {
    capable: true,
    title: "Ishant Kumar",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteSettings, adminContext] = await Promise.all([
    getLiveSiteSettings(),
    getAdminContext(),
  ]);

  const baseUrl = SITE_URL;

  // Build social profile URLs array for Person schema
  const socialUrls = [
    siteSettings.linkedinUrl,
    siteSettings.githubUrl,
    siteSettings.twitterUrl,
    siteSettings.instagramUrl,
    siteSettings.dribbbleUrl,
    siteSettings.behanceUrl,
  ].filter((url): url is string =>
    Boolean(url && url.trim() && url.trim() !== "#"),
  );

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${baseUrl}#person`,
    name: siteSettings.siteName,
    url: baseUrl,
    description: siteSettings.heroSubheading,
    jobTitle: siteSettings.roleLabel,
    image: `${baseUrl}/og-image.png`,
    knowsAbout: [
      "Frontend Development",
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "UI Design",
      "UX Design",
      "Tailwind CSS",
      "Web Performance",
      "Accessibility",
    ],
    sameAs: socialUrls,
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}#website`,
    name: siteSettings.siteName,
    alternateName: "Ishant",
    url: baseUrl,
    description: siteSettings.heroSubheading,
    inLanguage: "en-US",
    publisher: { "@id": `${baseUrl}#person` },
  };

  const twitterHandle = (() => {
    const url = siteSettings.twitterUrl?.trim();
    if (!url) return undefined;
    const match = url.match(/(?:twitter\.com|x\.com)\/(@?[\w]+)/i);
    if (!match) return undefined;
    const handle = match[1].replace(/^@/, "");
    return handle ? `@${handle}` : undefined;
  })();

  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "scroll-smooth",
        robotoFlex.variable,
        spaceGrotesk.variable,
        cormorantGaramond.variable,
        geistMono.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <head>
        <meta
          name="google-site-verification"
          content="yb5Bk1bP-DkPPiMJKJ5nsJl8I8uZgaKm5RzmZlZcFiY"
        />
        {twitterHandle ? (
          <>
            <meta name="twitter:site" content={twitterHandle} />
            <meta name="twitter:creator" content={twitterHandle} />
          </>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-full bg-[#050505] font-sans text-white antialiased">
        <AdminSessionProvider initialAdmin={adminContext}>
          <ExperienceProvider settings={siteSettings}>
            <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
          </ExperienceProvider>
          <AdminFloatPill />
        </AdminSessionProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
