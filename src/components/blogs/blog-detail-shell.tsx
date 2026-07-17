"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  CalendarRange,
  ChevronLeft,
  Sparkles,
  Tags,
  Trash2,
} from "lucide-react";
import { RevealInView } from "@/components/motion/reveal-in-view";
import { MobileSectionNav } from "@/components/nav/mobile-section-nav";
import { SideNavRail } from "@/components/nav/side-nav-rail";
import { HeroMediaPreview } from "@/components/ui/hero-media-preview";
import { NextEntryCard } from "@/components/content/next-entry-card";
import { ArticleAITools } from "@/components/content/article-ai-bar";
import { ArticleReader } from "@/components/reader/article-reader";
import { BlockRenderer } from "@/components/content/block-renderer";
import { BlockEditor } from "@/components/editor/block-editor";
import { MediaAssetField } from "@/components/editor/media-asset-field";
import { TagSelector } from "@/components/editor/tag-selector";
import { PublishedDatePicker } from "@/components/editor/published-date-picker";
import { AutoGrowTextarea } from "@/components/admin/auto-grow-textarea";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import { buttonClasses } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { BLOG_BLOCK_TYPES, createEmptyBlog } from "@/lib/editor";
import type { Blog, HomeSectionItem } from "@/lib/site-config";
import { slugify } from "@/lib/utils";

function toSectionId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function BlogDetailShell({
  blog: initialBlog,
  nextBlog,
  tagSuggestions,
  isNew = false,
}: {
  blog: Blog;
  nextBlog: Pick<
    Blog,
    "slug" | "title" | "heroImage" | "publishedLabel"
  > | null;
  tagSuggestions: string[];
  isNew?: boolean;
}) {
  const { isAllowedAdmin, viewMode } = useAdminSession();
  const isEditing = isAllowedAdmin && viewMode === "admin";
  const articleRef = useRef<HTMLElement | null>(null);
  const [blog, setBlog] = useState<Blog>(initialBlog ?? createEmptyBlog());
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const confirm = useConfirm();

  const sections: HomeSectionItem[] = useMemo(() => {
    const contentSections = blog.contentBlocks
      .filter((block) => block.type === "heading" && block.data?.level === 2)
      .map((block, index) => ({
        id: toSectionId(String(block.data?.text ?? `section-${index + 1}`)),
        index: String(index + 2).padStart(2, "0"),
        label: String(block.data?.text ?? `Section ${index + 1}`),
        title: String(block.data?.text ?? `Section ${index + 1}`),
      }));

    return [
      { id: "intro", index: "00", label: "Blog", title: "Overview" },
      { id: "cover", index: "01", label: "Cover", title: "Cover media" },
      ...contentSections,
    ];
  }, [blog.contentBlocks]);

  async function deleteBlog() {
    if (isNew) return;
    const confirmed = await confirm({
      title: `Delete blog "${blog.title}"?`,
      message: "This cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    setSaveState("saving");

    try {
      const response = await fetch(`/api/admin/blogs/${blog.slug}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "delete-failed");

      window.location.href = "/blogs";
    } catch (error) {
      console.error("[blog-editor] delete failed", error);
      setSaveState("error");
    }
  }

  async function saveBlog(nextStatus?: Blog["status"]) {
    setSaveState("saving");

    try {
      const payload = {
        title: blog.title,
        excerpt: blog.excerpt,
        readingTime: blog.readingTime,
        tags: blog.tags,
        featured: blog.featured,
        status: nextStatus ?? blog.status,
        heroImage: blog.heroImage,
        publishedLabel: blog.publishedLabel,
        contentBlocks: blog.contentBlocks,
      };

      const endpoint = isNew
        ? "/api/admin/blogs"
        : `/api/admin/blogs/${blog.slug}`;
      const method = isNew ? "POST" : "PATCH";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "save-failed");

      if (data.slug && data.slug !== blog.slug) {
        window.location.href = `/blogs/${data.slug}`;
        return;
      }

      setBlog((current) => ({ ...current, status: payload.status }));
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1200);
    } catch (error) {
      console.error("[blog-editor] save failed", error);
      setSaveState("error");
    }
  }

  return (
    <>
      <SideNavRail sections={sections} />
      <main
        ref={articleRef}
        className="mx-auto w-full max-w-[1100px] px-5 pb-24 sm:px-8 lg:px-10 xl:pr-32 2xl:pr-40"
      >
        <MobileSectionNav sections={sections} />

        {isEditing ? (
          <section className="mb-6 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/72 mt-24">
            <div className="flex flex-col items-start justify-between gap-3">
              <p>
                {isNew ? "Creating new blog" : `Editing blog: ${blog.title}`}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-white/44">
                  {saveState === "saving"
                    ? "Saving…"
                    : saveState === "saved"
                      ? "Saved"
                      : saveState === "error"
                        ? "Save error"
                        : "Ready"}
                </span>
                <button
                  type="button"
                  onClick={() => saveBlog("draft")}
                  className={buttonClasses({ tone: "ghost", size: "sm" })}
                >
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={() => saveBlog("published")}
                  className={buttonClasses({ tone: "primary", size: "sm" })}
                >
                  Publish
                </button>
                {!isNew ? (
                  <button
                    type="button"
                    onClick={() => void deleteBlog()}
                    className={buttonClasses({ tone: "danger", size: "sm" })}
                  >
                    <Trash2 className="size-4" /> Delete
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section
          id="intro"
          className="scroll-mt-28 border-b border-white/8 pb-14 pt-14 sm:pb-18 sm:pt-20"
        >
          <Link
            href="/blogs"
            className="text-sm mb-6 -ml-2 mr-0 text-white/44 hover:text-white/72 bg-transparent flex items-center transition-colors w-fit rounded-full pt-2 pb-2 pl-2 pr-4 hover:bg-white/5"
            data-cursor="Back"
          >
            <ChevronLeft size={24} /> Back to blogs
          </Link>
          <div className="mt-8 space-y-8">
            {isEditing ? (
              <div className="space-y-4">
                <AutoGrowTextarea
                  value={blog.title}
                  onChange={(value) =>
                    setBlog((c) => ({
                      ...c,
                      title: value,
                      slug: slugify(value) || c.slug,
                    }))
                  }
                  placeholder="Blog title"
                  className="font-heading min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-5xl leading-none text-white outline-none sm:text-7xl"
                />
                <AutoGrowTextarea
                  value={blog.excerpt}
                  onChange={(value) =>
                    setBlog((c) => ({ ...c, excerpt: value }))
                  }
                  placeholder="Blog excerpt"
                  className="min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-lg leading-8 text-white/58 outline-none"
                />
              </div>
            ) : (
              <>
                <h1
                  data-tts-read
                  className="font-heading max-w-5xl text-balance text-5xl leading-none text-white sm:text-7xl"
                >
                  {blog.title}
                </h1>
                <ArticleAITools blocks={blog.contentBlocks} title={blog.title} />
                <p
                  data-tts-read
                  className="max-w-3xl text-balance text-lg leading-8 text-white/58"
                >
                  {blog.excerpt}
                </p>
                <ArticleReader containerRef={articleRef} />
              </>
            )}

            <div className="max-w-3xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5">
              <div className="flex items-center gap-3 text-white/36">
                <Sparkles className="size-4" />
                <p className="text-[0.65rem] uppercase tracking-[0.34em]">
                  Post metadata
                </p>
              </div>
              <div className="mt-5 divide-y divide-white/8">
                <div className="py-4 first:pt-0">
                  <div className="flex items-center gap-2 text-white/28">
                    <CalendarRange className="size-3.5" />
                    <p className="text-[0.58rem] uppercase tracking-[0.28em]">
                      Published
                    </p>
                  </div>
                  {isEditing ? (
                    <div className="mt-2">
                      <PublishedDatePicker
                        value={blog.publishedLabel}
                        onChange={(value) =>
                          setBlog((c) => ({ ...c, publishedLabel: value }))
                        }
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-white/72">
                      {blog.publishedLabel}
                    </p>
                  )}
                </div>
                <div className="py-4">
                  <div className="flex items-center gap-2 text-white/28">
                    <CalendarRange className="size-3.5" />
                    <p className="text-[0.58rem] uppercase tracking-[0.28em]">
                      Reading time
                    </p>
                  </div>
                  {isEditing ? (
                    <AutoGrowTextarea
                      value={blog.readingTime}
                      onChange={(value) =>
                        setBlog((c) => ({ ...c, readingTime: value }))
                      }
                      placeholder="Reading time (e.g., 5 min read)"
                      className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm leading-6 text-white/72 outline-none"
                    />
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-white/72">
                      {blog.readingTime}
                    </p>
                  )}
                </div>
                <div className="py-4">
                  <div className="flex items-center gap-2 text-white/28">
                    <Tags className="size-3.5" />
                    <p className="text-[0.58rem] uppercase tracking-[0.28em]">
                      Tags
                    </p>
                  </div>
                  {isEditing ? (
                    <div className="mt-3">
                      <TagSelector
                        value={blog.tags}
                        onChange={(tags) => setBlog((c) => ({ ...c, tags }))}
                        suggestions={tagSuggestions}
                      />
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {blog.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/42"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {isEditing ? (
                <div className="mt-5 border-t border-white/8 pt-4">
                  <MediaAssetField
                    label="Cover image"
                    value={blog.heroImage}
                    onChange={(value) =>
                      setBlog((c) => ({ ...c, heroImage: value }))
                    }
                    bucket="blog-media"
                    accept="image/*"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section id="cover" className="scroll-mt-28 py-12 sm:py-16">
          <RevealInView>
            <HeroMediaPreview
              image={blog.heroImage}
              title={blog.title}
              subtitle="Cover image"
            />
          </RevealInView>
        </section>

        <section className="border-t border-white/8 py-12 sm:py-16">
          {isEditing ? (
            <BlockEditor
              blocks={blog.contentBlocks}
              onChange={(blocks) =>
                setBlog((c) => ({ ...c, contentBlocks: blocks }))
              }
              blockTypes={BLOG_BLOCK_TYPES}
              mediaBucket="blog-media"
            />
          ) : (
            <div data-tts-read-root className="space-y-10">
              {blog.contentBlocks.map((block, index) => {
                const isHeading = block.type === "heading";
                const sectionId = isHeading
                  ? toSectionId(
                      String(block.data?.text ?? `section-${index + 1}`),
                    )
                  : undefined;
                return (
                  <RevealInView
                    key={block.id}
                    delay={index * 0.01}
                    className={isHeading ? "scroll-mt-28" : undefined}
                  >
                    <div
                      id={sectionId}
                      className={isHeading ? "scroll-mt-28" : undefined}
                    >
                      <BlockRenderer blocks={[block]} />
                    </div>
                  </RevealInView>
                );
              })}
            </div>
          )}
        </section>

        {nextBlog ? (
          <div className="mt-10 ml-auto max-w-4xl">
            <NextEntryCard
              href={`/blogs/${nextBlog.slug}`}
              eyebrow="Next post"
              title={nextBlog.title}
              meta={nextBlog.publishedLabel}
              image={nextBlog.heroImage}
              cursorLabel="Next blog"
              previewType="blog"
            />
          </div>
        ) : null}
      </main>
    </>
  );
}
