import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { CertificationsPageShell } from "@/components/certifications/certifications-page-shell";
import { getLiveCertifications } from "@/lib/content";

export default async function CertificationsPage() {
  const certifications = await getLiveCertifications();

  return (
    <SiteShell>
      <CertificationsPageShell certifications={certifications} />
      <SiteFooter />
    </SiteShell>
  );
}
