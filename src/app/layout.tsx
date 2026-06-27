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
  title: "Ishant Kumar — Frontend Developer & UI/UX Designer",
  description:
    "A dark editorial portfolio for Ishant Kumar, blending UI/UX sensitivity, frontend craft, blogs, certifications, and a personal pet gallery.",
  keywords: [
    "frontend developer",
    "UI/UX designer",
    "React",
    "Next.js",
    "TypeScript",
    "portfolio",
  ],
  authors: [{ name: "Ishant Kumar" }],
  creator: "Ishant Kumar",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://ishant.dev",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Ishant Kumar",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@ishantkumar",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
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
