"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RevealInView } from "@/components/motion/reveal-in-view";
import { MockMedia } from "@/components/ui/mock-media";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import { buttonClasses } from "@/components/ui/button";
import type { Project } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

export function ProjectsArchivePage({ projects }: { projects: Project[] }) {
  const [activeTag, setActiveTag] = useState("all");
  const { isAllowedAdmin, viewMode } = useAdminSession();
  const showAdminCreate = isAllowedAdmin && viewMode === "admin";

  const tags = useMemo(
    () => ["all", ...new Set(projects.flatMap((project) => project.tags))],
    [projects],
  );

  const visibleProjects = useMemo(
    () =>
      showAdminCreate
        ? projects
        : projects.filter((project) => project.status === "published"),
    [projects, showAdminCreate],
  );

  const filtered = useMemo(() => {
    if (activeTag === "all") return visibleProjects;
    return visibleProjects.filter((project) =>
      project.tags.includes(activeTag),
    );
  }, [activeTag, visibleProjects]);

  const featuredProjects = filtered.filter((project) => project.featured);
  const archiveProjects = filtered.filter((project) => !project.featured);

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
            00 / Projects
          </p>
          <h1 className="font-heading mt-5 text-balance text-5xl leading-none text-white sm:text-7xl">
            From ideas to interfaces that people actually use.
          </h1>
          <p className="mt-6 text-balance text-base leading-7 text-white/60 sm:text-xl">
            Every project here began with a real problem to solve. Some focused
            on simplifying complex workflows, others on improving performance,
            accessibility, or design systems. Together, they reflect how I think
            through products—not just how I build them.
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
                    tone: isActive ? "inverted" : "secondary",
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
              Selected cases
            </h2>
          </div>
        </RevealInView>

        <div className="space-y-5">
          {featuredProjects.map((project, index) => (
            <RevealInView key={project.slug} delay={index * 0.06}>
              <Link
                href={`/projects/${project.slug}`}
                className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05] lg:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)]"
                data-cursor="View project"
                data-cursor-preview="project"
                data-cursor-title={project.title}
                data-cursor-image={project.heroImage}
              >
                {project.heroImage ? (
                  <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/20">
                    <img
                      src={project.heroImage}
                      alt={project.title}
                      className="h-full min-h-[260px] w-full object-cover"
                    />
                  </div>
                ) : (
                  <MockMedia
                    title={project.title}
                    subtitle={project.sector}
                    tone={index % 2 === 0 ? "blue" : "gold"}
                  />
                )}
                <div className="flex flex-col justify-between gap-6 p-2 sm:p-4">
                  <div className="space-y-2">
                    <p className="text-[0.66rem] uppercase tracking-[0.36em] text-white/30">
                      {project.yearLabel}
                    </p>
                    <h3 className="font-heading text-2xl text-white sm:text-3xl">
                      {project.title}
                    </h3>
                    {showAdminCreate ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={
                            project.status === "published"
                              ? "rounded-full border border-emerald-400/18 bg-emerald-500/8 px-3 py-1 text-xs text-emerald-200/80"
                              : "rounded-full border border-amber-400/18 bg-amber-500/8 px-3 py-1 text-xs text-amber-200/80"
                          }
                        >
                          {project.status}
                        </span>
                      </div>
                    ) : null}
                    <p className="mt-4 max-w-2xl text-base leading-7 text-white/58 sm:text-lg sm:leading-8">
                      {project.summary}
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/42">
                      <span>{project.role}</span>
                      <span>·</span>
                      <span>{project.sector}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/44"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </RevealInView>
          ))}

          {featuredProjects.length === 0 ? (
            <RevealInView>
              <div className="rounded-[1.6rem] border border-dashed border-white/10 px-5 py-8 text-white/44">
                No featured projects match the current filter.
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
              Project index
            </h2>
          </div>
        </RevealInView>

        <div className="space-y-3">
          {showAdminCreate ? (
            <RevealInView>
              <Link
                href="/projects/new"
                className="grid gap-4 rounded-[1.6rem] border border-dashed border-white/14 px-4 py-5 transition-colors hover:bg-white/[0.03] sm:grid-cols-[150px_minmax(0,1fr)_160px] sm:px-5"
                data-cursor="New project"
                data-cursor-position="top"
                data-cursor-no-snap="true"
              >
                <p className="text-sm text-white/34">New</p>
                <div>
                  <h3 className="font-heading text-xl text-white sm:text-2xl">
                    Create a new project
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/56">
                    Open the project editor with empty fields and start building
                    a new case study.
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
          {archiveProjects.map((project, index) => (
            <RevealInView key={project.slug} delay={index * 0.04}>
              <Link
                href={`/projects/${project.slug}`}
                className="grid gap-4 rounded-[1.6rem] border border-white/8 px-4 py-4 transition-colors hover:bg-white/[0.03] sm:grid-cols-[150px_minmax(0,1fr)_160px] sm:px-5"
                data-cursor="Open"
                data-cursor-preview="project"
                data-cursor-title={project.title}
                data-cursor-image={project.heroImage}
              >
                <p className="text-sm text-white/34">{project.yearLabel}</p>
                <div>
                  <h3 className="font-heading text-xl text-white sm:text-2xl">
                    {project.title}
                  </h3>
                  {showAdminCreate ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/38">
                      <span
                        className={
                          project.status === "published"
                            ? "rounded-full border border-emerald-400/18 bg-emerald-500/8 px-3 py-1 text-emerald-200/80"
                            : "rounded-full border border-amber-400/18 bg-amber-500/8 px-3 py-1 text-amber-200/80"
                        }
                      >
                        {project.status}
                      </span>
                    </div>
                  ) : null}
                  <p className="mt-3 text-sm leading-6 text-white/56">
                    {project.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/42"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-start justify-end text-sm text-white/34 sm:text-right">
                  <p>{project.role}</p>
                </div>
              </Link>
            </RevealInView>
          ))}

          {archiveProjects.length === 0 ? (
            <RevealInView>
              <div className="rounded-[1.6rem] border border-dashed border-white/10 px-5 py-8 text-white/44">
                No archived items match the current filter.
              </div>
            </RevealInView>
          ) : null}
        </div>
      </section>
    </main>
  );
}
