import { blankSiteSettings, type SiteSettings } from "@/lib/site-config";
import { getLiveSiteSettings } from "@/lib/content";

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    return await getLiveSiteSettings();
  } catch {
    return blankSiteSettings;
  }
}
