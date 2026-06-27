import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { ProjectDetailShell } from "@/components/projects/project-detail-shell";
import { createEmptyProject } from "@/lib/editor";
import { getLiveTagSuggestions } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const tagSuggestions = await getLiveTagSuggestions();

  return (
    <SiteShell>
      <ProjectDetailShell project={createEmptyProject()} nextProject={null} tagSuggestions={tagSuggestions} isNew />
      <SiteFooter />
    </SiteShell>
  );
}
