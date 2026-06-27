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
import { getLiveSiteSettings } from "@/lib/content";
import { getAdminContext } from "@/lib/auth/admin";
import { cn } from "@/lib/utils";
import { ClientEffects } from "@/components/layout/client-effects";

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ishant-devdesign.vercel.app",
  ),

  applicationName: "Ishant Kumar Portfolio",

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
    url: process.env.NEXT_PUBLIC_SITE_URL,
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

    shortcut: "/favicon.svg",

    apple: "/apple-touch-icon.png",
  },

  manifest: "/manifest.json",

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
      <body className="min-h-full bg-[#050505] font-sans text-white antialiased">
        <AdminSessionProvider initialAdmin={adminContext}>
          <ExperienceProvider settings={siteSettings}>
            {children}
          </ExperienceProvider>
          <AdminFloatPill />
        </AdminSessionProvider>
      </body>
    </html>
  );
}
