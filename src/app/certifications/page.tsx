import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { CertificationsPageShell } from "@/components/certifications/certifications-page-shell";
import { getLiveCertifications } from "@/lib/content";

import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ishant.dev";

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
      <CertificationsPageShell certifications={certifications} />
      <SiteFooter />
    </SiteShell>
  );
}
