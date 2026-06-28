"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarRange,
  ChevronLeft,
  FolderKanban,
  Sparkles,
  Tags,
  Trash2,
} from "lucide-react";
import { RevealInView } from "@/components/motion/reveal-in-view";
import { MobileSectionNav } from "@/components/nav/mobile-section-nav";
import { SideNavRail } from "@/components/nav/side-nav-rail";
import { HeroMediaPreview } from "@/components/ui/hero-media-preview";
import { NextEntryCard } from "@/components/content/next-entry-card";
import { BlockRenderer } from "@/components/content/block-renderer";
import { BlockEditor, syncDiagramBlocks } from "@/components/editor/block-editor";
import { MediaAssetField } from "@/components/editor/media-asset-field";
import { TagSelector } from "@/components/editor/tag-selector";
import { PublishMonthYearField } from "@/components/editor/publish-month-year-field";
import { AutoGrowTextarea } from "@/components/admin/auto-grow-textarea";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import { buttonClasses } from "@/components/ui/button";
import { createEmptyProject, PROJECT_BLOCK_TYPES } from "@/lib/editor";
import type { HomeSectionItem, Project } from "@/lib/site-config";
import { slugify } from "@/lib/utils";

function toSectionId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProjectDetailShell({
  project: initialProject,
  nextProject,
  tagSuggestions,
  isNew = false,
}: {
  project: Project;
  nextProject: Pick<Project, "slug" | "title" | "heroImage" | "sector"> | null;
  tagSuggestions: string[];
  isNew?: boolean;
}) {
  const { isAllowedAdmin, viewMode } = useAdminSession();
  const isEditing = isAllowedAdmin && viewMode === "admin";
  const [project, setProject] = useState<Project>(
    initialProject ?? createEmptyProject(),
  );
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const sections: HomeSectionItem[] = useMemo(() => {
    const contentSections = project.contentBlocks
      .filter((block) => block.type === "heading")
      .map((block, index) => ({
        id: toSectionId(String(block.data?.text ?? `section-${index + 1}`)),
        index: String(index + 2).padStart(2, "0"),
        label: String(block.data?.text ?? `Section ${index + 1}`),
        title: String(block.data?.text ?? `Section ${index + 1}`),
      }));

    return [
      { id: "intro", index: "00", label: "Project", title: "Overview" },
      { id: "media", index: "01", label: "Visuals", title: "Hero media" },
      ...contentSections,
    ];
  }, [project.contentBlocks]);

  async function deleteProject() {
    if (isNew) return;
    const confirmed = window.confirm(
      `Delete project “${project.title}”? This cannot be undone.`,
    );
    if (!confirmed) return;

    setSaveState("saving");

    try {
      const response = await fetch(`/api/admin/projects/${project.slug}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "delete-failed");

      window.location.href = "/projects";
    } catch (error) {
      console.error("[project-editor] delete failed", error);
      setSaveState("error");
    }
  }

  async function saveProject(nextStatus?: Project["status"]) {
    setSaveState("saving");

    try {
      // Sync diagram editor snapshots to block data before saving
      const syncedBlocks = syncDiagramBlocks(project.contentBlocks);
      const payload = {
        title: project.title,
        summary: project.summary,
        sector: project.sector,
        yearLabel: project.yearLabel,
        role: project.role,
        stack: project.stack,
        tags: project.tags,
        featured: project.featured,
        status: nextStatus ?? project.status,
        heroImage: project.heroImage,
        publishedLabel: project.publishedLabel,
        contentBlocks: syncedBlocks,
      };

      const endpoint = isNew
        ? "/api/admin/projects"
        : `/api/admin/projects/${project.slug}`;
      const method = isNew ? "POST" : "PATCH";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "save-failed");

      if (data.slug && data.slug !== project.slug) {
        window.location.href = `/projects/${data.slug}`;
        return;
      }

      setProject((current) => ({ ...current, status: payload.status, contentBlocks: syncedBlocks }));
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1200);
    } catch (error) {
      console.error("[project-editor] save failed", error);
      setSaveState("error");
    }
  }

  return (
    <>
      <SideNavRail sections={sections} />
      <main className="mx-auto w-full max-w-[1300px] px-5 pb-24 sm:px-8 lg:px-10 xl:pr-32 2xl:pr-40">
        <MobileSectionNav sections={sections} />

        {isEditing ? (
          <section className="mb-6 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/72 mt-24">
            <div className="flex flex-col items-start justify-between gap-3">
              <p>
                {isNew
                  ? "Creating new project"
                  : `Editing project: ${project.title}`}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
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
                  onClick={() => saveProject("draft")}
                  className={buttonClasses({ tone: "ghost", size: "sm" })}
                >
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={() => saveProject("published")}
                  className={buttonClasses({ tone: "primary", size: "sm" })}
                >
                  Publish
                </button>
                {!isNew ? (
                  <button
                    type="button"
                    onClick={() => void deleteProject()}
                    className={buttonClasses({ tone: "danger", size: "sm" })}
                  >
                    <Trash2 className="size-4" />
                    Delete
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
            href="/projects"
            className="text-sm mb-6 -ml-2 mr-0 text-white/44 hover:text-white/72 bg-transparent flex items-center transition-colors w-fit rounded-full pt-2 pb-2 pl-2 pr-4 hover:bg-white/5"
            data-cursor="Back"
          >
            <ChevronLeft size={24} /> Back to projects
          </Link>
          <div className="mt-8 space-y-8">
            <RevealInView>
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    value={project.yearLabel}
                    onChange={(event) =>
                      setProject((current) => ({
                        ...current,
                        yearLabel: event.target.value,
                      }))
                    }
                    className="w-full bg-transparent text-[0.66rem] uppercase tracking-[0.36em] text-white/30 outline-none"
                  />
                  <AutoGrowTextarea
                    value={project.title}
                    onChange={(value) =>
                      setProject((current) => ({
                        ...current,
                        title: value,
                        slug: slugify(value) || current.slug,
                      }))
                    }
                    className="font-heading min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-5xl leading-none text-white outline-none sm:text-7xl"
                  />
                  <AutoGrowTextarea
                    value={project.summary}
                    onChange={(value) =>
                      setProject((current) => ({ ...current, summary: value }))
                    }
                    className="min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-lg leading-8 text-white/58 outline-none"
                  />
                </div>
              ) : (
                <>
                  <p className="text-[0.66rem] uppercase tracking-[0.36em] text-white/30">
                    {project.yearLabel}
                  </p>
                  <h1 className="font-heading mt-4 max-w-5xl text-balance text-5xl leading-none text-white sm:text-7xl">
                    {project.title}
                  </h1>
                  <p className="mt-6 max-w-3xl text-balance text-lg leading-8 text-white/58">
                    {project.summary}
                  </p>
                </>
              )}
            </RevealInView>

            <RevealInView delay={0.08}>
              <div className="max-w-3xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5">
                <div className="flex items-center gap-3 text-white/36">
                  <Sparkles className="size-4" />
                  <p className="text-[0.65rem] uppercase tracking-[0.34em]">
                    Project metadata
                  </p>
                </div>
                <div className="mt-5 divide-y divide-white/8">
                  <div className="py-4 first:pt-0">
                    <div className="flex items-center gap-2 text-white/28">
                      <BriefcaseBusiness className="size-3.5" />
                      <p className="text-[0.58rem] uppercase tracking-[0.28em]">
                        Role
                      </p>
                    </div>
                    {isEditing ? (
                      <AutoGrowTextarea
                        value={project.role}
                        onChange={(value) =>
                          setProject((c) => ({ ...c, role: value }))
                        }
                        className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm leading-6 text-white/72 outline-none"
                      />
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-white/72">
                        {project.role}
                      </p>
                    )}
                  </div>
                  <div className="py-4">
                    <div className="flex items-center gap-2 text-white/28">
                      <FolderKanban className="size-3.5" />
                      <p className="text-[0.58rem] uppercase tracking-[0.28em]">
                        Sector
                      </p>
                    </div>
                    {isEditing ? (
                      <AutoGrowTextarea
                        value={project.sector}
                        onChange={(value) =>
                          setProject((c) => ({ ...c, sector: value }))
                        }
                        className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm leading-6 text-white/72 outline-none"
                      />
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-white/72">
                        {project.sector}
                      </p>
                    )}
                  </div>
                  <div className="py-4">
                    <div className="flex items-center gap-2 text-white/28">
                      <CalendarRange className="size-3.5" />
                      <p className="text-[0.58rem] uppercase tracking-[0.28em]">
                        Published
                      </p>
                    </div>
                    {isEditing ? (
                      <div className="mt-2">
                        <PublishMonthYearField
                          value={project.publishedLabel}
                          onChange={(value) =>
                            setProject((c) => ({ ...c, publishedLabel: value }))
                          }
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-white/72">
                        {project.publishedLabel}
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
                          value={project.tags}
                          onChange={(tags) =>
                            setProject((c) => ({ ...c, tags }))
                          }
                          suggestions={tagSuggestions}
                        />
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
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
                  <div className="mt-5 space-y-4 border-t border-white/8 pt-4">
                    <MediaAssetField
                      label="Hero image"
                      value={project.heroImage}
                      onChange={(value) =>
                        setProject((c) => ({ ...c, heroImage: value }))
                      }
                      bucket="project-media"
                      accept="image/*"
                    />
                    <AutoGrowTextarea
                      value={project.stack.join(", ")}
                      onChange={(value) =>
                        setProject((c) => ({
                          ...c,
                          stack: value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }))
                      }
                      className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-white/72 outline-none"
                    />
                    <label className="inline-flex items-center gap-3 text-white/78">
                      <input
                        type="checkbox"
                        checked={project.featured}
                        onChange={(e) =>
                          setProject((c) => ({
                            ...c,
                            featured: e.target.checked,
                          }))
                        }
                        className="peer sr-only"
                      />
                      <span className="relative h-5 w-9 rounded-full border border-white/10 bg-white/[0.04] transition-colors peer-checked:bg-zinc-700 after:absolute after:left-0.5 after:top-0.5 after:h-3.5 after:w-3.5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                      Featured
                    </label>
                  </div>
                ) : null}
              </div>
            </RevealInView>
          </div>
        </section>

        <section id="media" className="scroll-mt-28 py-12 sm:py-16">
          <RevealInView>
            <HeroMediaPreview
              image={project.heroImage}
              title={project.title}
              subtitle={project.sector}
            />
          </RevealInView>
        </section>

        <section className="border-t border-white/8 py-12 sm:py-16">
          {isEditing ? (
            <BlockEditor
              blocks={project.contentBlocks}
              onChange={(blocks) =>
                setProject((current) => ({ ...current, contentBlocks: blocks }))
              }
              blockTypes={PROJECT_BLOCK_TYPES}
              mediaBucket="project-media"
            />
          ) : (
            <div className="space-y-10">
              {project.contentBlocks.map((block, index) => {
                const isHeading = block.type === "heading";
                const sectionId = isHeading
                  ? toSectionId(
                      String(block.data?.text ?? `section-${index + 1}`),
                    )
                  : undefined;
                return (
                  <RevealInView
                    key={block.id}
                    delay={index * 0.03}
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

        {nextProject ? (
          <div className="mt-10 ml-auto max-w-4xl">
            <NextEntryCard
              href={`/projects/${nextProject.slug}`}
              eyebrow="Next project"
              title={nextProject.title}
              meta={nextProject.sector}
              image={nextProject.heroImage}
              cursorLabel="Next project"
              previewType="project"
            />
          </div>
        ) : null}
      </main>
    </>
  );
}
