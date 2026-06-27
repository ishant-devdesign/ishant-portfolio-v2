"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Blocks,
  BriefcaseBusiness,
  CalendarRange,
  Cpu,
  Gauge,
  GraduationCap,
  Layers3,
  MapPin,
  Music4,
  Sparkles,
  SwatchBook,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ArrowUpRight,
  PawPrint,
} from "lucide-react";
import { AutoGrowTextarea } from "@/components/admin/auto-grow-textarea";
import { useHomeHeroEditor } from "@/components/admin/home-hero-editor";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import { buttonClasses } from "@/components/ui/button";
import { MobileSectionNav } from "@/components/nav/mobile-section-nav";
import { SideNavRail } from "@/components/nav/side-nav-rail";
import { MockMedia } from "@/components/ui/mock-media";
import { RevealInView } from "@/components/motion/reveal-in-view";
import { useExperience } from "@/components/motion/experience-provider";
import type {
  Blog,
  HomeSectionItem,
  Pet,
  Project,
  SiteSettings,
} from "@/lib/site-config";
import GradualBlur from "../GradualBlur";

type WorkExperienceItem = {
  company: string;
  role: string;
  period: string;
  note: string;
};

type EducationItem = {
  institution: string;
  degree: string;
  period: string;
  note: string;
};

interface Paw {
  id: string;
  left: number;
  drift: number;
  rotate: number;
  duration: number;
  size: number;
}

function isRealExternalLink(value: string) {
  return Boolean(value && value.trim() && value.trim() !== "#");
}

export function PetArchiveCard({
  hiddenPetsCount,
}: {
  hiddenPetsCount: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [paws, setPaws] = useState<Paw[]>([]);

  useEffect(() => {
    if (!hovered) {
      setPaws([]);
      return;
    }

    const interval = setInterval(() => {
      const paw: Paw = {
        id: crypto.randomUUID(),
        left: Math.random() * 90,
        drift: (Math.random() - 0.5) * 120,
        rotate: (Math.random() - 0.5) * 60,
        duration: 2.5 + Math.random() * 2,
        size: 14 + Math.random() * 12,
      };

      setPaws((prev) => [...prev, paw]);
    }, 220);

    return () => clearInterval(interval);
  }, [hovered]);

  return (
    <Link
      href="/pets"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="
        group
        relative
        flex
        min-h-[420px]
        flex-col
        justify-between
        overflow-hidden
        rounded-[2rem]
        border
        border-white/10
        bg-white/[0.03]
        p-5
        transition-all
        duration-500
        hover:border-amber-700/30
        hover:bg-[rgba(55,35,18,0.22)]
      "
    >
      {/* Brown ambient glow */}
      <motion.div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_30%_20%,rgba(180,120,70,0.18),transparent_55%)]
        "
        animate={{
          opacity: hovered ? 1 : 0,
        }}
        transition={{
          duration: 0.4,
        }}
      />

      {/* Secondary glow */}
      <motion.div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-64
          w-64
          rounded-full
          bg-amber-600/10
          blur-3xl
        "
        animate={{
          opacity: hovered ? 1 : 0,
          scale: hovered ? 1 : 0.8,
        }}
        transition={{
          duration: 0.5,
        }}
      />

      {/* Paw rain */}
      <AnimatePresence>
        {paws.map((paw) => (
          <motion.div
            key={paw.id}
            className="pointer-events-none absolute -top-12 z-[1]"
            style={{
              left: `${paw.left}%`,
            }}
            initial={{
              y: -50,
              x: 0,
              opacity: 0,
              rotate: paw.rotate,
              scale: 0.8,
            }}
            animate={{
              y: 520,
              x: paw.drift,
              opacity: [0, 0.3, 0.12, 0],
              rotate: paw.rotate + 35,
              scale: [0.8, 1, 0.95],
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: paw.duration,
              ease: "linear",
            }}
            onAnimationComplete={() => {
              setPaws((prev) => prev.filter((p) => p.id !== paw.id));
            }}
          >
            <PawPrint
              size={paw.size}
              className="
                text-amber-200/20
                drop-shadow-[0_0_8px_rgba(255,190,120,0.15)]
              "
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-[0.62rem] uppercase tracking-[0.3em] text-white/30">
          Archive
        </p>

        <motion.h3
          className="mt-4 text-3xl tracking-[-0.04em] text-white"
          transition={{
            duration: 0.3,
          }}
        >
          See the full pets archive.
        </motion.h3>

        <p className="mt-4 text-sm leading-6 text-white/56">
          Every companion has a story. Explore the full archive to meet the rest
          of the crew.
        </p>
      </div>

      {/* Footer CTA */}
      <motion.div className="relative z-10 flex items-center justify-between">
        <motion.span className="text-sm text-white/74">
          Open companions archive
        </motion.span>

        <motion.div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            border
            border-white/10
            bg-white/[0.02]
          "
          animate={{
            rotate: hovered ? 45 : 0,
            backgroundColor: hovered
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.02)",
          }}
          transition={{
            duration: 0.3,
          }}
        >
          <ArrowUpRight size={16} />
        </motion.div>
      </motion.div>
    </Link>
  );
}

function getHomeEditorErrorMessage(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "save-failed";
    }
  }
  return "save-failed";
}

function HomeSectionFrame({
  id,
  index,
  label,
  title,
  children,
}: {
  id: string;
  index: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-t border-white/8 py-16 sm:py-20"
    >
      <div className="grid gap-8 lg:grid-cols-[120px_minmax(0,1fr)] lg:gap-12">
        <RevealInView className="pt-2 text-[0.62rem] uppercase tracking-[0.36em] text-white/28">
          <p>
            {index} / {label}
          </p>
        </RevealInView>
        <RevealInView>
          <h2 className="font-heading max-w-4xl text-4xl leading-none text-white sm:text-5xl">
            {title}
          </h2>
          <div className="mt-3">{children}</div>
        </RevealInView>
      </div>
    </section>
  );
}

export function HomePage({
  siteSettings,
  projects,
  blogs,
  pets,
  homeSections,
  toolsGroups,
  workExperience,
  educationItems,
  certifications,
}: {
  siteSettings: SiteSettings;
  projects: Project[];
  blogs: Blog[];
  pets: Pet[];
  homeSections: HomeSectionItem[];
  toolsGroups: Array<{ title: string; text: string }>;
  workExperience: WorkExperienceItem[];
  educationItems: EducationItem[];
  certifications: Array<{
    slug: string;
    title: string;
    issuer: string;
    issueDate: string;
    note: string;
    credentialUrl?: string;
  }>;
}) {
  const { introComplete, loaderWasVisible } = useExperience();
  const { isAllowedAdmin, viewMode } = useAdminSession();
  const adminMode = isAllowedAdmin && viewMode === "admin";
  const { draft, setDraft, isEditable, saveState } = useHomeHeroEditor({
    siteSettings,
  });
  const toolsGroupsValue =
    toolsGroups.length > 0
      ? toolsGroups
      : [
          {
            title: "Frontend",
            text: "React.js, Next.js, TypeScript, JavaScript, HTML, CSS, Tailwind",
          },
          {
            title: "Design",
            text: "Figma, Adobe XD, visual systems, interaction thinking",
          },
          {
            title: "Backend / Data",
            text: "Node.js, Supabase, MySQL, REST APIs",
          },
          {
            title: "Infra / Quality",
            text: "AWS, Docker, Git, Lighthouse, performance tuning",
          },
        ];
  const contactCta =
    siteSettings.contactCtaText ??
    "If you are building something that needs stronger interface clarity, sharper frontend execution, or a more thoughtful bridge between design and implementation, I would be glad to talk.";
  const [workDraft, setWorkDraft] = useState(workExperience);
  const [educationDraft, setEducationDraft] = useState(educationItems);
  const [trajectoryState, setTrajectoryState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [toolsGroupsDraft, setToolsGroupsDraft] = useState(toolsGroupsValue);
  const [toolsState, setToolsState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [contactDraft, setContactDraft] = useState({
    cta: contactCta,
    phone: siteSettings.phone,
    email: siteSettings.email,
    whatsappUrl: siteSettings.whatsappUrl,
    gmailComposeUrl: siteSettings.gmailComposeUrl,
    resumeUrl: siteSettings.resumeUrl,
    linkedinUrl: siteSettings.linkedinUrl,
    githubUrl: siteSettings.githubUrl,
    twitterUrl: siteSettings.twitterUrl,
    instagramUrl: siteSettings.instagramUrl,
    dribbbleUrl: siteSettings.dribbbleUrl,
    behanceUrl: siteSettings.behanceUrl,
  });
  const [contactState, setContactState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const trajectoryTimeoutRef = useRef<number | null>(null);
  const toolsTimeoutRef = useRef<number | null>(null);
  const contactTimeoutRef = useRef<number | null>(null);
  const trajectorySavedRef = useRef(
    JSON.stringify({ workExperience, educationItems }),
  );
  const toolsSavedRef = useRef(JSON.stringify({ groups: toolsGroupsValue }));
  const contactSavedRef = useRef(JSON.stringify(contactDraft));

  const socialLinks = [
    { label: "LinkedIn", href: contactDraft.linkedinUrl },
    { label: "GitHub", href: contactDraft.githubUrl },
    { label: "Instagram", href: contactDraft.instagramUrl },
    { label: "X", href: contactDraft.twitterUrl },
    { label: "Dribbble", href: contactDraft.dribbbleUrl },
    { label: "Behance", href: contactDraft.behanceUrl },
  ].filter((item) => isRealExternalLink(item.href));

  const saveTrajectory = useCallback(
    async (nextWork = workDraft, nextEducation = educationDraft) => {
      const serialized = JSON.stringify({
        workExperience: nextWork,
        educationItems: nextEducation,
      });
      setTrajectoryState("saving");
      try {
        const response = await fetch("/api/admin/home-trajectory", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: serialized,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            getHomeEditorErrorMessage(data.error ?? data.details),
          );
        trajectorySavedRef.current = serialized;
        setTrajectoryState("saved");
        window.setTimeout(() => setTrajectoryState("idle"), 1200);
      } catch (error) {
        console.error("[home-section:trajectory] save failed", error);
        setTrajectoryState("error");
      }
    },
    [educationDraft, workDraft],
  );

  const saveTools = useCallback(
    async (nextGroups = toolsGroupsDraft) => {
      const serialized = JSON.stringify({ groups: nextGroups });
      setToolsState("saving");
      try {
        const response = await fetch("/api/admin/home-tools", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: serialized,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            getHomeEditorErrorMessage(data.error ?? data.details),
          );
        toolsSavedRef.current = serialized;
        setToolsState("saved");
        window.setTimeout(() => setToolsState("idle"), 1200);
      } catch (error) {
        console.error("[home-section:tools] save failed", error);
        setToolsState("error");
      }
    },
    [toolsGroupsDraft],
  );

  const saveContact = useCallback(
    async (nextContact = contactDraft) => {
      const serialized = JSON.stringify(nextContact);
      setContactState("saving");
      try {
        const response = await fetch("/api/admin/home-contact", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: serialized,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            getHomeEditorErrorMessage(data.error ?? data.details),
          );
        contactSavedRef.current = serialized;
        setContactState("saved");
        window.setTimeout(() => setContactState("idle"), 1200);
      } catch (error) {
        console.error("[home-section:contact] save failed", error);
        setContactState("error");
      }
    },
    [contactDraft],
  );

  useEffect(() => {
    if (!adminMode) return;
    const serialized = JSON.stringify({
      workExperience: workDraft,
      educationItems: educationDraft,
    });
    if (serialized === trajectorySavedRef.current) return;
    if (trajectoryTimeoutRef.current)
      window.clearTimeout(trajectoryTimeoutRef.current);
    trajectoryTimeoutRef.current = window.setTimeout(() => {
      void saveTrajectory(workDraft, educationDraft);
    }, 700);
    return () => {
      if (trajectoryTimeoutRef.current)
        window.clearTimeout(trajectoryTimeoutRef.current);
    };
  }, [adminMode, workDraft, educationDraft, saveTrajectory]);

  useEffect(() => {
    if (!adminMode) return;
    const serialized = JSON.stringify({ groups: toolsGroupsDraft });
    if (serialized === toolsSavedRef.current) return;
    if (toolsTimeoutRef.current) window.clearTimeout(toolsTimeoutRef.current);
    toolsTimeoutRef.current = window.setTimeout(() => {
      void saveTools(toolsGroupsDraft);
    }, 700);
    return () => {
      if (toolsTimeoutRef.current) window.clearTimeout(toolsTimeoutRef.current);
    };
  }, [adminMode, toolsGroupsDraft, saveTools]);

  useEffect(() => {
    if (!adminMode) return;
    const serialized = JSON.stringify(contactDraft);
    if (serialized === contactSavedRef.current) return;
    if (contactTimeoutRef.current)
      window.clearTimeout(contactTimeoutRef.current);
    contactTimeoutRef.current = window.setTimeout(() => {
      void saveContact(contactDraft);
    }, 700);
    return () => {
      if (contactTimeoutRef.current)
        window.clearTimeout(contactTimeoutRef.current);
    };
  }, [adminMode, contactDraft, saveContact]);

  const visibleProjects = adminMode
    ? projects
    : projects.filter((project) => project.status === "published");
  const visibleBlogs = adminMode
    ? blogs
    : blogs.filter((blog) => blog.status === "published");

  const featuredProjects = visibleProjects.filter(
    (project) => project.featured,
  );
  const recentBlogs = visibleBlogs.slice(0, 4);
  const featuredCertifications = certifications.slice(0, 3);
  const homePets = pets.slice(0, 2);
  const hiddenPetsCount = Math.max(pets.length - 2, 0);

  return (
    <main className="mx-auto w-full max-w-[1600px] px-5 pt-6 sm:px-8 lg:px-10 xl:pr-32 2xl:pr-40">
      <SideNavRail sections={homeSections} />

      <div className="min-w-0">
        <MobileSectionNav sections={homeSections} />

        <section
          id="intro"
          className="scroll-mt-28 border-b border-white/8 pb-18 pt-10 sm:pb-24 sm:pt-14"
        >
          <RevealInView className="max-w-5xl">
            <div className="max-w-5xl">
              <motion.div
                className="flex items-center gap-4"
                initial={{
                  opacity: loaderWasVisible ? 0 : 1,
                  y: loaderWasVisible ? 18 : 0,
                  filter: loaderWasVisible ? "blur(8px)" : "blur(0px)",
                }}
                animate={
                  introComplete ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}
                }
                transition={{
                  duration: 0.6,
                  delay: 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <p className="text-[0.66rem] uppercase tracking-[0.36em] text-white/34">
                  {siteSettings.heroEyebrow}
                </p>
                {isEditable ? (
                  <span className="text-[0.58rem] uppercase tracking-[0.28em] text-white/34">
                    {saveState === "saving"
                      ? "Autosaving"
                      : saveState === "saved"
                        ? "Saved"
                        : saveState === "error"
                          ? "Save error"
                          : "Edit mode"}
                  </span>
                ) : null}
              </motion.div>

              <motion.div
                className="mt-4"
                initial={{
                  opacity: loaderWasVisible ? 0 : 1,
                  y: loaderWasVisible ? 34 : 0,
                  filter: loaderWasVisible ? "blur(18px)" : "blur(0px)",
                  scale: loaderWasVisible ? 1.02 : 1,
                }}
                animate={
                  introComplete
                    ? { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }
                    : {}
                }
                transition={{
                  duration: 0.9,
                  delay: 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {isEditable ? (
                  <AutoGrowTextarea
                    value={draft.heroHeading}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        heroHeading: value,
                      }))
                    }
                    className="font-heading min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-[3rem] leading-[0.92] text-white outline-none sm:text-[5.2rem] xl:text-[6.2rem]"
                    style={{
                      fontVariationSettings:
                        '"wght" 180, "wdth" 116, "slnt" -5',
                    }}
                  />
                ) : (
                  <h1
                    className="font-heading max-w-5xl text-balance text-[3rem] leading-[0.92] text-white sm:text-[5.2rem] xl:text-[6.2rem]"
                    style={{
                      fontVariationSettings:
                        '"wght" 180, "wdth" 116, "slnt" -5',
                    }}
                  >
                    {draft.heroHeading}
                  </h1>
                )}
              </motion.div>

              <motion.div
                className="mt-10 max-w-2xl"
                initial={{
                  opacity: loaderWasVisible ? 0 : 1,
                  y: loaderWasVisible ? 24 : 0,
                  filter: loaderWasVisible ? "blur(12px)" : "blur(0px)",
                }}
                animate={
                  introComplete ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}
                }
                transition={{
                  duration: 0.7,
                  delay: 0.34,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {isEditable ? (
                  <AutoGrowTextarea
                    value={draft.heroSubheading}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        heroSubheading: value,
                      }))
                    }
                    className="min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-balance text-2xl leading-8 text-white/62 outline-none"
                  />
                ) : (
                  <p className="text-balance text-2xl leading-8 text-white/62 w-full">
                    {draft.heroSubheading}
                  </p>
                )}
              </motion.div>

              <motion.div
                className="mt-6 max-w-2xl"
                initial={{
                  opacity: loaderWasVisible ? 0 : 1,
                  y: loaderWasVisible ? 24 : 0,
                  filter: loaderWasVisible ? "blur(12px)" : "blur(0px)",
                }}
                animate={
                  introComplete ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}
                }
                transition={{
                  duration: 0.74,
                  delay: 0.42,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {isEditable ? (
                  <AutoGrowTextarea
                    value={draft.heroIntro}
                    onChange={(value) =>
                      setDraft((current) => ({ ...current, heroIntro: value }))
                    }
                    className="min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-balance text-base leading-7 text-white/48 outline-none sm:text-lg"
                  />
                ) : (
                  <p className="text-balance text-base leading-7 text-white/48 sm:text-lg">
                    {draft.heroIntro}
                  </p>
                )}
              </motion.div>

              <motion.div
                className="mt-3 flex flex-wrap"
                initial={{
                  opacity: loaderWasVisible ? 0 : 1,
                  y: loaderWasVisible ? 18 : 0,
                  filter: loaderWasVisible ? "blur(8px)" : "blur(0px)",
                }}
                animate={
                  introComplete ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}
                }
                transition={{
                  duration: 0.68,
                  delay: 0.52,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  href="/projects"
                  className={buttonClasses({
                    tone: "primary",
                    size: "md",
                    className: "transition-transform hover:-translate-y-0.5",
                  })}
                  data-cursor="View project"
                  data-cursor-position="top"
                >
                  View Projects
                </Link>
                <Link
                  href="/blogs"
                  className={buttonClasses({
                    tone: "secondary",
                    size: "md",
                    className: "transition-transform hover:-translate-y-0.5",
                  })}
                  data-cursor="Read blog"
                  data-cursor-position="top"
                >
                  Read Blogs
                </Link>
                <a
                  href={contactDraft.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClasses({
                    tone: "secondary",
                    size: "md",
                    className: "transition-transform hover:-translate-y-0.5",
                  })}
                  data-cursor="Download"
                  data-cursor-position="top"
                >
                  Download Resume
                </a>
              </motion.div>

              <div className="mt-5 grid items-stretch gap-4 md:grid-cols-2">
                <motion.div
                  initial={{
                    opacity: loaderWasVisible ? 0 : 1,
                    y: loaderWasVisible ? 26 : 0,
                    filter: loaderWasVisible ? "blur(14px)" : "blur(0px)",
                  }}
                  animate={
                    introComplete
                      ? { opacity: 1, y: 0, filter: "blur(0px)" }
                      : {}
                  }
                  transition={{
                    duration: 0.76,
                    delay: 0.42,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex h-full min-h-[420px] flex-col rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5"
                >
                  <div className="flex items-center gap-3 text-white/36">
                    <Sparkles className="size-4" />
                    <p className="text-[0.65rem] uppercase tracking-[0.34em]">
                      Snapshot
                    </p>
                  </div>
                  <div className="mt-5 divide-y divide-white/8">
                    <div className="py-4 first:pt-0">
                      <div className="flex items-center gap-2 text-white/28">
                        <BriefcaseBusiness className="size-3.5" />
                        <p className="text-[0.58rem] uppercase tracking-[0.28em]">
                          Who
                        </p>
                      </div>
                      {isEditable ? (
                        <input
                          value={draft.roleLabel}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              roleLabel: event.target.value,
                            }))
                          }
                          className="mt-2 w-full bg-transparent text-sm leading-6 text-white/72 outline-none"
                        />
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-white/72">
                          {draft.roleLabel}
                        </p>
                      )}
                    </div>
                    <div className="py-4">
                      <div className="flex items-center gap-2 text-white/28">
                        <MapPin className="size-3.5" />
                        <p className="text-[0.58rem] uppercase tracking-[0.28em]">
                          Where
                        </p>
                      </div>
                      {isEditable ? (
                        <input
                          value={draft.location}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              location: event.target.value,
                            }))
                          }
                          className="mt-2 w-full bg-transparent text-sm leading-6 text-white/72 outline-none"
                        />
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-white/72">
                          {draft.location}
                        </p>
                      )}
                    </div>
                    <div className="py-4">
                      <div className="flex items-center gap-2 text-white/28">
                        <BriefcaseBusiness className="size-3.5" />
                        <p className="text-[0.58rem] uppercase tracking-[0.28em]">
                          How
                        </p>
                      </div>
                      {isEditable ? (
                        <AutoGrowTextarea
                          value={draft.howText}
                          onChange={(value) =>
                            setDraft((current) => ({
                              ...current,
                              howText: value,
                            }))
                          }
                          className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm leading-6 text-white/72 outline-none"
                        />
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-white/72">
                          {draft.howText}
                        </p>
                      )}
                    </div>
                    <div className="py-4 last:pb-0">
                      <div className="flex items-center gap-2 text-white/28">
                        <CalendarRange className="size-3.5" />
                        <p className="text-[0.58rem] uppercase tracking-[0.28em]">
                          When
                        </p>
                      </div>
                      {isEditable ? (
                        <input
                          value={draft.availability}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              availability: event.target.value,
                            }))
                          }
                          className="mt-2 w-full bg-transparent text-sm leading-6 text-white/72 outline-none"
                        />
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-white/72">
                          {draft.availability}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{
                    opacity: loaderWasVisible ? 0 : 1,
                    y: loaderWasVisible ? 26 : 0,
                    filter: loaderWasVisible ? "blur(14px)" : "blur(0px)",
                  }}
                  animate={
                    introComplete
                      ? { opacity: 1, y: 0, filter: "blur(0px)" }
                      : {}
                  }
                  transition={{
                    duration: 0.8,
                    delay: 0.54,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-3"
                >
                  <div className="flex items-center gap-2 px-2 pb-3 pt-1 text-white/30">
                    <Music4 className="size-3.5" />
                    <p className="text-[0.62rem] uppercase tracking-[0.34em]">
                      Listen with me
                    </p>
                  </div>
                  {isEditable ? (
                    <AutoGrowTextarea
                      value={draft.spotifyEmbedUrl}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          spotifyEmbedUrl: value,
                        }))
                      }
                      className="mb-3 min-h-[1lh] w-full resize-none overflow-hidden rounded-[1.2rem] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/72 outline-none"
                    />
                  ) : null}
                  <iframe
                    className="spotify-iframe h-full w-full flex-1 rounded-2xl"
                    data-cursor-hide="true"
                    src={draft.spotifyEmbedUrl}
                    width="100%"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="eager"
                    title={draft.spotifyTitle}
                  />
                </motion.div>
              </div>
            </div>
          </RevealInView>
        </section>
        <HomeSectionFrame
          id="work"
          index="01"
          label="Selected work"
          title="Selected work."
        >
          <div className="space-y-5">
            <p className="max-w-3xl text-base leading-7 text-white/56 sm:text-lg">
              Projects shaped by real users, real requirements, and real
              business goals.
            </p>
            <div className="space-y-3">
              {featuredProjects.map((project, index) => (
                <Link
                  key={project.slug}
                  href={`/projects/${project.slug}`}
                  className="group block rounded-[2rem] border border-white/8 px-5 py-5 transition-colors bg-white/[0.03]  hover:bg-white/[0.05] sm:px-6"
                  data-cursor="View project"
                  data-cursor-preview="project"
                  data-cursor-title={project.title}
                  data-cursor-image={project.heroImage}
                >
                  <div className="grid gap-4 md:grid-cols-[110px_minmax(0,1fr)_220px] md:items-start">
                    <p className="text-[0.68rem] uppercase tracking-[0.34em] text-white/30">
                      0{index + 1}
                    </p>
                    <div>
                      <h3 className="font-heading text-2xl text-white transition-colors group-hover:text-white/86 sm:text-[2rem]">
                        {project.title}
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58 sm:text-base sm:leading-7">
                        {project.summary}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-white/40 md:text-right">
                      <p>{project.sector}</p>
                      <p>{project.yearLabel}</p>
                      <p>{project.role}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Link
              href="/projects"
              data-cursor="All projects"
              data-cursor-position="top"
              className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-black px-2 py-2 text-white"
            >
              <span className="pl-4 pr-2 text-sm">All projects</span>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight size={20} />
              </div>
            </Link>
          </div>
        </HomeSectionFrame>

        <HomeSectionFrame
          id="achievements"
          index="02"
          label="Highlights"
          title="Beyond the work."
        >
          <div className="space-y-5">
            <p className="max-w-3xl text-base leading-7 text-white/56 sm:text-lg">
              Recognition, leadership, and continuous learning have shaped how I
              approach product development and frontend engineering.
            </p>
            <div className="grid gap-4 xl:grid-cols-3">
              {[
                {
                  kicker: "Award",
                  title: "1st Place — NiceHash Worldwide Design Competition",
                  text: "Recognized internationally for a winning merchandise design created for the NiceHash community.",
                },
                {
                  kicker: "Leadership",
                  title: "Co-led Damncon, CyHunt, and Aadhav'23",
                  text: "Helped shape event experiences and collaborative delivery across student-led technical initiatives.",
                },
                {
                  kicker: "Impact",
                  title: "Frontend Engineering & Product Delivery",
                  text: "Work across product teams included measurable frontend optimization, refactoring, and reusable interface systems.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5"
                >
                  <p className="text-[0.6rem] uppercase tracking-[0.3em] text-white/28">
                    {item.kicker}
                  </p>
                  <h3 className="font-heading mt-4 text-xl text-white">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-white/58">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </HomeSectionFrame>

        <HomeSectionFrame
          id="background"
          index="03"
          label="Background"
          title="Beginnings."
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:gap-12">
            <div className="space-y-3 text-base leading-7 text-white/60 sm:text-lg mt-2">
              <p>My journey into technology started through design.</p>
              <p>
                I was drawn to how layouts, visual hierarchy, and interactions
                could shape the way people experience a product. Over time, that
                curiosity expanded beyond visuals into frontend development,
                where I discovered the challenge of turning ideas into working
                interfaces.
              </p>
              <p>
                Today I work at the intersection of design and engineering,
                building products that balance usability, performance, and
                maintainability.
              </p>
            </div>
            <MockMedia
              title="Designer at heart. Engineer by craft."
              subtitle="A visual study standing in for the quieter story of how interface thinking and frontend craft came to meet in one practice."
            />
          </div>
        </HomeSectionFrame>

        <HomeSectionFrame
          id="trajectory"
          index="04"
          label="Career"
          title="Trajectory."
        >
          <div className="space-y-5">
            <div className="space-y-3 text-base leading-7 text-white/58 sm:text-lg mt-2">
              <p>
                My career started with smaller client projects where the focus
                was simply delivering working features and responsive
                interfaces.
              </p>
              <p>
                Over time, those projects evolved into larger products with more
                demanding requirements, introducing challenges around
                scalability, maintainability, performance, and user experience.
                Moving into cybersecurity products pushed that growth further,
                requiring me to work with dense information, complex workflows,
                and interfaces designed for users making important decisions
                under pressure.
              </p>
              <p>
                Through each role, one lesson has stayed consistent: good
                frontend development is about more than implementation. It's
                about understanding the problem, simplifying complexity, and
                creating experiences that feel intuitive despite everything
                happening behind the scenes.
              </p>
              <p>
                That perspective continues to shape how I approach product
                development today.
              </p>
            </div>

            {adminMode ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[2rem] border border-white/10 p-5 bg-white/[0.03]">
                  <div className="flex items-center gap-3 text-white/36">
                    <BriefcaseBusiness className="size-4" />
                    <p className="text-[0.65rem] uppercase tracking-[0.34em]">
                      Professional work
                    </p>
                  </div>
                  <div className="mt-5 space-y-4">
                    {workDraft.map((item, index) => (
                      <div
                        key={`${item.company}-${index}`}
                        className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5"
                      >
                        <div className="space-y-4">
                          <div>
                            <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                              Role
                            </p>
                            <AutoGrowTextarea
                              value={item.role}
                              onChange={(value) =>
                                setWorkDraft((current) =>
                                  current.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, role: value }
                                      : entry,
                                  ),
                                )
                              }
                              className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-lg text-white outline-none"
                            />
                          </div>
                          <div>
                            <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                              Company
                            </p>
                            <AutoGrowTextarea
                              value={item.company}
                              onChange={(value) =>
                                setWorkDraft((current) =>
                                  current.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, company: value }
                                      : entry,
                                  ),
                                )
                              }
                              className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm text-white/72 outline-none"
                            />
                          </div>
                          <div>
                            <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                              Period
                            </p>
                            <AutoGrowTextarea
                              value={item.period}
                              onChange={(value) =>
                                setWorkDraft((current) =>
                                  current.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, period: value }
                                      : entry,
                                  ),
                                )
                              }
                              className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm text-white/68 outline-none"
                            />
                          </div>
                          <div>
                            <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                              Note
                            </p>
                            <AutoGrowTextarea
                              value={item.note}
                              onChange={(value) =>
                                setWorkDraft((current) =>
                                  current.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, note: value }
                                      : entry,
                                  ),
                                )
                              }
                              className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm leading-6 text-white/62 outline-none"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setWorkDraft((current) =>
                                  current.filter(
                                    (_, entryIndex) => entryIndex !== index,
                                  ),
                                )
                              }
                              className={buttonClasses({
                                tone: "muted",
                                size: "sm",
                              })}
                            >
                              <Trash2 className="size-3.5" /> Remove work
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() =>
                        setWorkDraft((current) => [
                          ...current,
                          {
                            company: "New company",
                            role: "New role",
                            period: "Month YYYY — Month YYYY",
                            note: "Describe the work here.",
                          },
                        ])
                      }
                      className={buttonClasses({ tone: "ghost", size: "sm" })}
                    >
                      <Plus className="size-4" /> Add work block
                    </button>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3 text-white/36">
                    <GraduationCap className="size-4" />
                    <p className="text-[0.65rem] uppercase tracking-[0.34em]">
                      Education
                    </p>
                  </div>
                  <div className="mt-5 space-y-4">
                    {educationDraft.map((item, index) => (
                      <div
                        key={`${item.institution}-${index}`}
                        className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-4"
                      >
                        <div className="space-y-4">
                          <div>
                            <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                              Degree
                            </p>
                            <AutoGrowTextarea
                              value={item.degree}
                              onChange={(value) =>
                                setEducationDraft((current) =>
                                  current.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, degree: value }
                                      : entry,
                                  ),
                                )
                              }
                              className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-lg text-white outline-none"
                            />
                          </div>
                          <div>
                            <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                              Institution
                            </p>
                            <AutoGrowTextarea
                              value={item.institution}
                              onChange={(value) =>
                                setEducationDraft((current) =>
                                  current.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, institution: value }
                                      : entry,
                                  ),
                                )
                              }
                              className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm text-white/72 outline-none"
                            />
                          </div>
                          <div>
                            <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                              Period
                            </p>
                            <AutoGrowTextarea
                              value={item.period}
                              onChange={(value) =>
                                setEducationDraft((current) =>
                                  current.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, period: value }
                                      : entry,
                                  ),
                                )
                              }
                              className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm text-white/68 outline-none"
                            />
                          </div>
                          <div>
                            <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                              Note
                            </p>
                            <AutoGrowTextarea
                              value={item.note}
                              onChange={(value) =>
                                setEducationDraft((current) =>
                                  current.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, note: value }
                                      : entry,
                                  ),
                                )
                              }
                              className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm leading-6 text-white/62 outline-none"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setEducationDraft((current) =>
                                  current.filter(
                                    (_, entryIndex) => entryIndex !== index,
                                  ),
                                )
                              }
                              className={buttonClasses({
                                tone: "muted",
                                size: "sm",
                              })}
                            >
                              <Trash2 className="size-3.5" /> Remove education
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() =>
                        setEducationDraft((current) => [
                          ...current,
                          {
                            institution: "New institution",
                            degree: "New degree",
                            period: "Year — Year",
                            note: "Describe the education context here.",
                          },
                        ])
                      }
                      className={buttonClasses({ tone: "ghost", size: "sm" })}
                    >
                      <Plus className="size-4" /> Add education block
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid xl:grid-cols-2 gap-4">
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3 text-white/36">
                    <BriefcaseBusiness className="size-4" />
                    <p className="text-[0.65rem] uppercase tracking-[0.34em]">
                      Professional work
                    </p>
                  </div>
                  <div className="mt-6 divide-y divide-white/8">
                    {workDraft.map((item, index) => (
                      <div
                        key={`${item.company}-${index}`}
                        className="py-5 first:pt-0 last:pb-0 sm:py-6"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-heading text-lg text-white sm:text-xl">
                              {item.role}
                            </h3>
                            <p className="mt-1 text-sm text-white/42">
                              {item.company}
                            </p>
                          </div>
                          <p className="text-sm text-white/38">{item.period}</p>
                        </div>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3 text-white/36">
                    <GraduationCap className="size-4" />
                    <p className="text-[0.65rem] uppercase tracking-[0.34em]">
                      Education
                    </p>
                  </div>
                  <div className="mt-6 divide-y divide-white/8">
                    {educationDraft.map((item, index) => (
                      <div
                        key={`${item.institution}-${index}`}
                        className="py-5 first:pt-0 last:pb-0 sm:py-6"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-heading text-lg text-white sm:text-xl">
                              {item.degree}
                            </h3>
                            <p className="mt-1 text-sm text-white/42">
                              {item.institution}
                            </p>
                          </div>
                          <p className="text-sm text-white/38">{item.period}</p>
                        </div>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </HomeSectionFrame>

        <HomeSectionFrame
          id="approach"
          index="05"
          label="Method"
          title="Approach."
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] text-lg leading-8 text-white/58">
            <div className="space-y-3 mt-2">
              <p>I enjoy simplifying complexity.</p>
              <p>
                Whether it's a cybersecurity dashboard, a booking flow, or a
                component system, my focus is on creating interfaces that feel
                clear, responsive, and easy to use. Good frontend work isn't
                just about how something looks—it's about how well it works as
                products grow and evolve.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: "Interface systems",
                  text: "Reusable patterns that keep design intent consistent as products scale.",
                },
                {
                  title: "Performance attention",
                  text: "Fast-loading, responsive interfaces shaped for real conditions and repeat use.",
                },
                {
                  title: "Visual restraint",
                  text: "Typography, spacing, and hierarchy used to reduce friction instead of adding noise.",
                },
                {
                  title: "Implementation craft",
                  text: "Design translated into production-ready UI with maintainable component thinking.",
                },
              ].map((item, index) => {
                const Icon = [Layers3, Gauge, SwatchBook, Blocks][index % 4];
                return (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center gap-3 text-white/36">
                      <Icon className="size-4" />
                      <p className="text-[0.62rem] uppercase tracking-[0.28em]">
                        {item.title}
                      </p>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-white/62">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </HomeSectionFrame>

        <HomeSectionFrame id="stack" index="06" label="Tools" title="Tools.">
          <div className="grid gap-4 xl:grid-cols-2">
            <p className="mt-1 max-w-3xl text-base leading-7 text-white/58 sm:text-lg">
              The toolkit matters less as a badge list and more as a set of
              instruments for shipping better interface systems, stronger
              frontend foundations, and cleaner collaboration between design and
              engineering.
            </p>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex items-center gap-3 text-white/36 mb-6">
                <Cpu className="size-4" />
                <p className="text-[0.65rem] uppercase tracking-[0.34em]">
                  Current toolkit
                </p>
              </div>
              {adminMode ? (
                <div className="space-y-4">
                  {toolsGroupsDraft.map((group, index) => (
                    <div
                      key={`${group.title}-${index}`}
                      className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div>
                        <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                          Category
                        </p>
                        <AutoGrowTextarea
                          value={group.title}
                          onChange={(value) =>
                            setToolsGroupsDraft((current) =>
                              current.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, title: value }
                                  : entry,
                              ),
                            )
                          }
                          className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-white outline-none"
                        />
                      </div>
                      <div className="mt-4">
                        <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                          Tools / text
                        </p>
                        <AutoGrowTextarea
                          value={group.text}
                          onChange={(value) =>
                            setToolsGroupsDraft((current) =>
                              current.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, text: value }
                                  : entry,
                              ),
                            )
                          }
                          className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm leading-7 text-white/70 outline-none"
                        />
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setToolsGroupsDraft((current) =>
                              current.filter(
                                (_, entryIndex) => entryIndex !== index,
                              ),
                            )
                          }
                          className={buttonClasses({
                            tone: "muted",
                            size: "sm",
                          })}
                        >
                          <Trash2 className="size-3.5" /> Remove category
                        </button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setToolsGroupsDraft((current) => [
                          ...current,
                          {
                            title: "New category",
                            text: "Add tools or capability text here.",
                          },
                        ])
                      }
                      className={buttonClasses({ tone: "ghost", size: "sm" })}
                    >
                      <Plus className="size-4" /> Add category
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {toolsGroupsDraft.map((group, index) => (
                    <div key={`${group.title}-${index}`}>
                      <p className="text-[0.62rem] uppercase tracking-[0.28em] text-white/30">
                        {group.title}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-white/70">
                        {group.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </HomeSectionFrame>

        <HomeSectionFrame
          id="certifications"
          index="07"
          label="Certifications"
          title="Credentials."
        >
          <div className="space-y-3">
            <p className="max-w-3xl text-base leading-7 text-white/56 sm:text-lg">
              Learning never stopped after graduation. These certifications
              document the technologies, disciplines, and ideas I've
              intentionally explored.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mt-5">
              {featuredCertifications.map((certification) => (
                <div
                  key={certification.slug}
                  className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="text-[0.6rem] uppercase tracking-[0.28em] text-white/28">
                    {certification.issueDate}
                  </p>
                  <h3 className="mt-3 text-xl tracking-[-0.03em] text-white">
                    {certification.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/42">
                    {certification.issuer}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-white/56">
                    {certification.note}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Link
                href="/certifications"
                data-cursor="All certifications"
                data-cursor-position="top"
                className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-black px-2 py-2 text-white"
              >
                <span className="pl-4 pr-2 text-sm">All certifications</span>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight size={20} />
                </div>
              </Link>
            </div>
          </div>
        </HomeSectionFrame>

        <HomeSectionFrame
          id="blogs"
          index="08"
          label="Blogs"
          title="Latest writing."
        >
          <div className="space-y-3">
            <p className="max-w-3xl text-base leading-7 text-white/56 sm:text-lg">
              Thoughts collected between commits, prototypes, and production
              releases.
            </p>
            <div className="space-y-3">
              {recentBlogs.map((blog) => (
                <Link
                  key={blog.slug}
                  href={`/blogs/${blog.slug}`}
                  className="group grid gap-4 rounded-[1.7rem] border border-white/8 px-4 py-4 transition-colors bg-white/[0.03]  hover:bg-white/[0.05] sm:grid-cols-[150px_minmax(0,1fr)_120px] sm:px-5"
                  data-cursor="Read blog"
                  data-cursor-preview="blog"
                  data-cursor-title={blog.title}
                  data-cursor-image={blog.heroImage}
                >
                  <p className="text-sm text-white/34">{blog.publishedAt}</p>
                  <div>
                    <h3 className="text-xl leading-tight tracking-[-0.03em] text-white sm:text-2xl">
                      {blog.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/54">
                      {blog.excerpt}
                    </p>
                    {blog.tags.length ? (
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
                    ) : null}
                  </div>
                  <div className="flex items-start justify-between gap-4 text-sm text-white/36 sm:block sm:text-right">
                    <p>{blog.readingTime}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex justify-end">
              <Link
                href="/blogs"
                data-cursor="All blogs"
                data-cursor-position="top"
                className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-black px-2 py-2 text-white"
              >
                <span className="pl-4 pr-2 text-sm">All blogs</span>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight size={20} />
                </div>
              </Link>
            </div>
          </div>
        </HomeSectionFrame>

        <HomeSectionFrame id="pets" index="09" label="Pets" title="Companions.">
          <div className="space-y-5">
            <p className="max-w-3xl text-base leading-7 text-white/56 sm:text-lg">
              Not every meaningful thing belongs on a resume. These are the
              companions that have been part of my daily life beyond the work.
            </p>
            <div className="grid gap-5 xl:grid-cols-3">
              {homePets.map((pet, index) => (
                <div
                  key={pet.slug}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  {pet.homeImage ? (
                    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/20">
                      <img
                        src={pet.homeImage}
                        alt={pet.name}
                        className="aspect-[4/5] w-full object-cover"
                      />
                    </div>
                  ) : (
                    <MockMedia
                      title={pet.name}
                      subtitle="Selected home image will appear here"
                      tone={index === 0 ? "plum" : "blue"}
                      aspect="portrait"
                    />
                  )}
                  <div className="mt-4">
                    <p className="font-heading text-lg text-white">
                      {pet.name}
                    </p>
                    <p className="mt-1 text-sm uppercase tracking-[0.24em] text-white/32">
                      {pet.species}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-white/54">
                      {pet.description}
                    </p>
                  </div>
                </div>
              ))}

              <PetArchiveCard hiddenPetsCount={hiddenPetsCount} />
            </div>
          </div>
        </HomeSectionFrame>

        <HomeSectionFrame
          id="contact"
          index="10"
          label="Reach"
          title="Contact."
        >
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div>
              {adminMode ? (
                <AutoGrowTextarea
                  value={contactDraft.cta}
                  onChange={(value) =>
                    setContactDraft((current) => ({ ...current, cta: value }))
                  }
                  className="min-h-[1lh] max-w-2xl w-full resize-none overflow-hidden bg-transparent text-balance text-lg leading-8 text-white/58 outline-none"
                />
              ) : (
                <p className="max-w-2xl text-balance text-2xl leading-8 text-white/58">
                  {contactDraft.cta}
                </p>
              )}

              <div className="mt-4 flex flex-wrap -mb-20">
                {adminMode ? (
                  <div className="grid w-full gap-3 sm:grid-cols-3">
                    <input
                      value={contactDraft.whatsappUrl}
                      onChange={(event) =>
                        setContactDraft((current) => ({
                          ...current,
                          whatsappUrl: event.target.value,
                        }))
                      }
                      className="rounded-full border border-white/10 bg-transparent px-4 py-3 text-sm text-white/78 outline-none"
                      placeholder="WhatsApp URL"
                    />
                    <input
                      value={contactDraft.gmailComposeUrl}
                      onChange={(event) =>
                        setContactDraft((current) => ({
                          ...current,
                          gmailComposeUrl: event.target.value,
                        }))
                      }
                      className="rounded-full border border-white/10 bg-transparent px-4 py-3 text-sm text-white/78 outline-none"
                      placeholder="Gmail compose URL"
                    />
                    <input
                      value={contactDraft.resumeUrl}
                      onChange={(event) =>
                        setContactDraft((current) => ({
                          ...current,
                          resumeUrl: event.target.value,
                        }))
                      }
                      className="rounded-full border border-white/10 bg-transparent px-4 py-3 text-sm text-white/78 outline-none"
                      placeholder="Resume URL"
                    />
                  </div>
                ) : (
                  <>
                    <a
                      href={contactDraft.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClasses({
                        tone: "primary",
                        size: "md",
                        className:
                          "transition-transform hover:-translate-y-0.5",
                      })}
                      data-cursor="WhatsApp"
                      data-cursor-position="top"
                    >
                      WhatsApp chat
                    </a>
                    <a
                      href={contactDraft.gmailComposeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClasses({
                        tone: "secondary",
                        size: "md",
                        className:
                          "transition-transform hover:-translate-y-0.5",
                      })}
                      data-cursor="Email"
                      data-cursor-position="top"
                    >
                      Gmail compose
                    </a>
                    <a
                      href={contactDraft.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClasses({
                        tone: "secondary",
                        size: "md",
                        className:
                          "transition-transform hover:-translate-y-0.5",
                      })}
                      data-cursor="Download"
                      data-cursor-position="top"
                    >
                      Download resume
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </HomeSectionFrame>
      </div>
    </main>
  );
}
