import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { ArchivePageShell } from "@/components/archive/archive-page-shell";
import { getLiveCreativeArchive } from "@/lib/content";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creative Archive — Ishant Kumar",
  description: "A visual record of creative work spanning branding, illustration, motion graphics, 3D, and design experiments.",
  openGraph: {
    title: "Creative Archive — Ishant Kumar",
    description: "A visual record of creative work spanning branding, illustration, motion graphics, 3D, and design experiments.",
    type: "website",
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
    title: "Creative Archive — Ishant Kumar",
    description: "A visual record of creative work spanning branding, illustration, motion graphics, 3D, and design experiments.",
    images: ["/og-image.png"],
  },
};

import { getLiveArchiveBlocks } from "@/lib/content";

export default async function ArchivePage() {
  const items = await getLiveCreativeArchive();
  const blocks = await getLiveArchiveBlocks();

  return (
    <SiteShell>
      <ArchivePageShell initialItems={items} initialBlocks={blocks} />
      <SiteFooter />
    </SiteShell>
  );
}