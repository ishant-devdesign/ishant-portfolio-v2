import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { CertificationsPageShell } from "@/components/certifications/certifications-page-shell";
import { StructuredData } from "@/components/seo/structured-data";
import { getLiveCertifications } from "@/lib/content";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certifications — Ishant Kumar",
  description: "Professional certifications and credentials in frontend development and UI/UX design.",
  openGraph: {
    title: "Certifications — Ishant Kumar",
    description: "Professional certifications and credentials in frontend development and UI/UX design.",
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
    title: "Certifications — Ishant Kumar",
    description: "Professional certifications and credentials in frontend development and UI/UX design.",
    images: ["/og-image.png"],
  },
};

export default async function CertificationsPage() {
  const certifications = await getLiveCertifications();

  return (
    <SiteShell>
      <StructuredData
        type="webSite"
        title="Certifications — Ishant Kumar"
        description="Professional certifications and credentials in frontend development and UI/UX design."
        url="/certifications"
      />
      <CertificationsPageShell certifications={certifications} />
      <SiteFooter />
    </SiteShell>
  );
}
