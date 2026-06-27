"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RevealInView } from "@/components/motion/reveal-in-view";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import { buttonClasses } from "@/components/ui/button";
import type { Blog } from "@/lib/site-config";
import { MockMedia } from "@/components/ui/mock-media";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

export function BlogsArchivePage({ blogs }: { blogs: Blog[] }) {
  const [activeTag, setActiveTag] = useState("all");
  const { isAllowedAdmin, viewMode } = useAdminSession();
  const showAdminCreate = isAllowedAdmin && viewMode === "admin";

  const tags = useMemo(
    () => ["all", ...new Set(blogs.flatMap((blog) => blog.tags))],
    [blogs],
  );

  const visibleBlogs = useMemo(
    () =>
      showAdminCreate
        ? blogs
        : blogs.filter((blog) => blog.status === "published"),
    [blogs, showAdminCreate],
  );

  const filtered = useMemo(() => {
    if (activeTag === "all") return visibleBlogs;
    return visibleBlogs.filter((blog) => blog.tags.includes(activeTag));
  }, [activeTag, visibleBlogs]);

  const featuredBlogs = filtered.filter((blog) => blog.featured);
  const archiveBlogs = filtered.filter((blog) => !blog.featured);

  return (
    <main className="mx-auto w-full max-w-[1300px] px-5 pb-24 sm:px-8 lg:px-10">
      <section
        id="intro"
        className="scroll-mt-28 border-b border-white/8 pb-12 pt-14 sm:pb-16 sm:pt-20"
      >
        <RevealInView className="max-w-4xl">
          <Link
            href="/"
            className="text-sm mb-6 -ml-2 mr-0 text-white/44 hover:text-white/72 bg-transparent flex items-center transition-colors w-fit rounded-full pt-2 pb-2 pl-2 pr-4 hover:bg-white/5"
            data-cursor="Back"
          >
            <ChevronLeft size={24} /> Back to home
          </Link>
          <p className="text-[0.68rem] uppercase tracking-[0.36em] text-white/34">
            00 / Blogs
          </p>

          <h1 className="font-heading mt-5 text-balance text-5xl leading-none text-white sm:text-7xl">
            Writing from inside the work, not around it.
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-base leading-7 text-white/60 sm:text-lg">
            The blog archive is now ready to hydrate from Supabase-backed
            editorial records.
          </p>
        </RevealInView>

        <RevealInView delay={0.08} className="mt-8 flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                className={cn(
                  buttonClasses({
                    tone: isActive ? "selected" : "muted",
                    size: "xs",
                  }),
                )}
              >
                {tag}
              </button>
            );
          })}
        </RevealInView>
      </section>

      <section id="featured" className="scroll-mt-28 py-12 sm:py-16">
        <RevealInView>
          <div className="mb-6">
            <p className="text-[0.66rem] uppercase tracking-[0.36em] text-white/30">
              01 / Featured
            </p>
            <h2 className="font-heading mt-3 text-3xl text-white sm:text-4xl">
              Latest post
            </h2>
          </div>
        </RevealInView>

        <div className="space-y-5">
          {featuredBlogs.map((blog, index) => (
            <RevealInView key={blog.slug} delay={index * 0.06}>
              <Link
                href={`/blogs/${blog.slug}`}
                className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05] lg:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)]"
                data-cursor="Read blog"
                data-cursor-preview="blog"
                data-cursor-title={blog.title}
                data-cursor-image={blog.heroImage}
              >
                {blog.heroImage ? (
                  <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/20">
                    <img
                      src={blog.heroImage}
                      alt={blog.title}
                      className="h-full min-h-[260px] w-full object-cover"
                    />
                  </div>
                ) : (
                  <MockMedia
                    title={blog.title}
                    subtitle={blog.tags.join(" · ")}
                    tone="plum"
                  />
                )}
                <div className="flex flex-col justify-between gap-6 p-2 sm:p-4">
                  <div>
                    <p className="text-[0.66rem] uppercase tracking-[0.36em] text-white/30">
                      {blog.publishedAt} · {blog.readingTime}
                    </p>
                    {showAdminCreate ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={
                            blog.status === "published"
                              ? "rounded-full border border-emerald-400/18 bg-emerald-500/8 px-3 py-1 text-xs text-emerald-200/80"
                              : "rounded-full border border-amber-400/18 bg-amber-500/8 px-3 py-1 text-xs text-amber-200/80"
                          }
                        >
                          {blog.status}
                        </span>
                      </div>
                    ) : null}
                    <p className="mt-4 max-w-2xl text-base leading-7 text-white/58 sm:text-lg sm:leading-8">
                      {blog.excerpt}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/44"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </RevealInView>
          ))}

          {featuredBlogs.length === 0 ? (
            <RevealInView>
              <div className="rounded-[1.6rem] border border-dashed border-white/10 px-5 py-8 text-white/44">
                No featured blogs match the current filter.
              </div>
            </RevealInView>
          ) : null}
        </div>
      </section>

      <section
        id="archive"
        className="scroll-mt-28 border-t border-white/8 py-12 sm:py-16"
      >
        <RevealInView>
          <div className="mb-6">
            <p className="text-[0.66rem] uppercase tracking-[0.36em] text-white/30">
              02 / Archive
            </p>
            <h2 className="font-heading mt-3 text-3xl text-white sm:text-4xl">
              Writing index
            </h2>
          </div>
        </RevealInView>

        <div className="space-y-3">
          {showAdminCreate ? (
            <RevealInView>
              <Link
                href="/blogs/new"
                className="grid gap-4 rounded-[1.6rem] border border-dashed border-white/14 px-4 py-5 transition-colors hover:bg-white/[0.03] sm:grid-cols-[150px_minmax(0,1fr)_120px] sm:px-5"
                data-cursor="New blog"
                data-cursor-position="top"
                data-cursor-no-snap="true"
              >
                <p className="text-sm text-white/34">New</p>
                <div>
                  <h3 className="font-heading text-xl text-white sm:text-2xl">
                    Create a new blog
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/56">
                    Open the blog editor with empty fields and begin drafting a
                    new post.
                  </p>
                </div>
                <div className="flex items-center sm:justify-end">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/42">
                    editor
                  </span>
                </div>
              </Link>
            </RevealInView>
          ) : null}
          {archiveBlogs.map((blog, index) => (
            <RevealInView key={blog.slug} delay={index * 0.04}>
              <Link
                href={`/blogs/${blog.slug}`}
                className="grid gap-4 rounded-[1.6rem] border border-white/8 px-4 py-4 transition-colors hover:bg-white/[0.03] sm:grid-cols-[150px_minmax(0,1fr)_120px] sm:px-5"
                data-cursor="Read"
                data-cursor-preview="blog"
                data-cursor-title={blog.title}
                data-cursor-image={blog.heroImage}
              >
                <p className="text-sm text-white/34">{blog.publishedAt}</p>
                <div>
                  <h3 className="font-heading text-xl text-white sm:text-2xl">
                    {blog.title}
                  </h3>
                  {showAdminCreate ? (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/38">
                      <span
                        className={
                          blog.status === "published"
                            ? "rounded-full border border-emerald-400/18 bg-emerald-500/8 px-3 py-1 text-emerald-200/80"
                            : "rounded-full border border-amber-400/18 bg-amber-500/8 px-3 py-1 text-amber-200/80"
                        }
                      >
                        {blog.status}
                      </span>
                    </div>
                  ) : null}
                  <p className="mt-3 text-sm leading-6 text-white/56">
                    {blog.excerpt}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {blog.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/42"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-start justify-end text-sm text-white/40 sm:text-right">
                  <p>{blog.readingTime}</p>
                </div>
              </Link>
            </RevealInView>
          ))}

          {archiveBlogs.length === 0 ? (
            <RevealInView>
              <div className="rounded-[1.6rem] border border-dashed border-white/10 px-5 py-8 text-white/44">
                No archived posts match the current filter.
              </div>
            </RevealInView>
          ) : null}
        </div>
      </section>
    </main>
  );
}
