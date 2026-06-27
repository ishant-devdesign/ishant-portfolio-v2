import { getLiveSiteSettings } from "@/lib/content";
import { SiteFooterShell } from "@/components/layout/site-footer-shell";

export async function SiteFooter() {
  const siteSettings = await getLiveSiteSettings();

  return <SiteFooterShell siteSettings={siteSettings} />;
}
