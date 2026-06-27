import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { BlogDetailShell } from "@/components/blogs/blog-detail-shell";
import { createEmptyBlog } from "@/lib/editor";
import { getLiveTagSuggestions } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function NewBlogPage() {
  const tagSuggestions = await getLiveTagSuggestions();

  return (
    <SiteShell>
      <BlogDetailShell blog={createEmptyBlog()} nextBlog={null} tagSuggestions={tagSuggestions} isNew />
      <SiteFooter />
    </SiteShell>
  );
}
