import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { PetsPageShell } from "@/components/pets/pets-page-shell";
import { StructuredData } from "@/components/seo/structured-data";
import { getLivePets } from "@/lib/content";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pets — Ishant Kumar",
  description: "A collection of pet photos and stories.",
  openGraph: {
    title: "Pets — Ishant Kumar",
    description: "A collection of pet photos and stories.",
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
    title: "Pets — Ishant Kumar",
    description: "A collection of pet photos and stories.",
    images: ["/og-image.png"],
  },
};

export default async function PetsPage() {
  const pets = await getLivePets();

  return (
    <SiteShell>
      <StructuredData
        type="webSite"
        title="Pets — Ishant Kumar"
        description="A collection of pet photos and stories."
        url="/pets"
      />
      <PetsPageShell initialPets={pets} />
      <SiteFooter />
    </SiteShell>
  );
}
